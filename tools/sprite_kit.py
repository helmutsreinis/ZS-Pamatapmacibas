"""Helpers shared by the part-sprite pipelines: matting on a light background, rendering
small hidden parts, writing sprites with their world placement, shadows and glows.

The G36C pipeline (build_part_images.py) predates this module and keeps its own copy."""
from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np


def smoothstep(e0: float, e1: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


class Sheet:
    """A source photo, the sprites cut from it and the manifest that places them in the world."""

    def __init__(self, source: Path, out: Path):
        self.src = cv2.imread(str(source), cv2.IMREAD_COLOR).astype(np.float32)
        self.H, self.W = self.src.shape[:2]
        self.out = out
        out.mkdir(parents=True, exist_ok=True)
        self.manifest: dict[str, dict] = {}

    # ----------------------------------------------------------------- masks
    def rect(self, x0: int, y0: int, x1: int, y1: int) -> np.ndarray:
        mask = np.zeros((self.H, self.W), np.uint8)
        mask[y0:y1, x0:x1] = 1
        return mask

    def poly(self, points: list[tuple[float, float]]) -> np.ndarray:
        mask = np.zeros((self.H, self.W), np.uint8)
        cv2.fillPoly(mask, [np.round(np.array(points)).astype(np.int32)], 1)
        return mask

    def grabcut(self, box: tuple[int, int, int, int], *, hint: np.ndarray | None = None, band: int = 3,
                dark: float = 120, light: float = 200, iterations: int = 6) -> np.ndarray:
        """Foreground inside `box` on a white background with soft drop shadows.

        Without a hint, dark pixels seed the foreground. With a hint polygon the result stays
        within `band` pixels of it (bright metal parts, whose colour is close to the shadows)."""
        x0, y0, x1, y1 = box
        roi = np.clip(self.src[y0:y1, x0:x1], 0, 255).astype(np.uint8)
        mn = self.src[y0:y1, x0:x1].min(axis=2)
        gc = np.full(mn.shape, cv2.GC_PR_BGD, np.uint8)
        if hint is None:
            gc[mn < light] = cv2.GC_PR_FGD
            gc[mn < dark] = cv2.GC_FGD
            gc[mn > 250] = cv2.GC_BGD
        else:
            h = hint[y0:y1, x0:x1].astype(np.uint8)
            kernel = np.ones((2 * band + 1, 2 * band + 1), np.uint8)
            gc[:] = cv2.GC_BGD
            gc[cv2.dilate(h, kernel) > 0] = cv2.GC_PR_BGD
            gc[h > 0] = cv2.GC_PR_FGD
            gc[cv2.erode(h, kernel) > 0] = cv2.GC_FGD
            gc[(mn > 251) & (gc != cv2.GC_FGD)] = cv2.GC_BGD
        gc[:2, :] = gc[-2:, :] = cv2.GC_BGD
        gc[:, :2] = gc[:, -2:] = cv2.GC_BGD
        bgd = np.zeros((1, 65), np.float64)
        fgd = np.zeros((1, 65), np.float64)
        cv2.grabCut(roi, gc, None, bgd, fgd, iterations, cv2.GC_INIT_WITH_MASK)
        fg = ((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)).astype(np.uint8)
        out = np.zeros((self.H, self.W), np.uint8)
        out[y0:y1, x0:x1] = fg
        return out

    @staticmethod
    def largest(mask: np.ndarray) -> np.ndarray:
        count, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
        if count <= 2:
            return mask
        big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        return (labels == big).astype(np.uint8)

    @staticmethod
    def fill_small_holes(mask: np.ndarray, area: int) -> np.ndarray:
        padded = np.pad(mask, 2)
        flood = padded.copy()
        cv2.floodFill(flood, None, (0, 0), 1)
        holes = (flood == 0).astype(np.uint8)[2:-2, 2:-2]
        count, labels, stats, _ = cv2.connectedComponentsWithStats(holes, connectivity=4)
        out = mask.copy()
        for i in range(1, count):
            if stats[i, cv2.CC_STAT_AREA] < area:
                out[labels == i] = 1
        return out

    # ----------------------------------------------------------------- matting
    def matte(self, mask: np.ndarray, *, shrink: int = 1, soft: float = 0.65) -> np.ndarray:
        """RGBA cut-out with a clean, slightly soft edge.

        The outermost pixel ring is dropped (white fringe on one side, drop shadow on the
        other) and every edge pixel takes the colour of the solid part next to it."""
        m = mask.astype(np.uint8)
        if shrink:
            m = cv2.erode(m, np.ones((2 * shrink + 1, 2 * shrink + 1), np.uint8))
        alpha = cv2.GaussianBlur(m.astype(np.float32), (0, 0), soft)
        alpha = np.clip((alpha - 0.08) / 0.84, 0, 1) * (cv2.dilate(m, np.ones((3, 3), np.uint8)) > 0)
        solid = cv2.erode(m, np.ones((3, 3), np.uint8))
        edge = ((alpha > 0) & (solid == 0)).astype(np.uint8)
        bgr = np.clip(self.src, 0, 255).astype(np.uint8)
        filled = cv2.inpaint(bgr, cv2.dilate(edge, np.ones((3, 3), np.uint8)) & (1 - solid), 2, cv2.INPAINT_TELEA)
        rgb = np.where(solid[..., None] > 0, self.src, filled.astype(np.float32))
        return np.dstack([rgb, alpha * 255.0]).astype(np.float32)

    # ----------------------------------------------------------------- output
    def save(self, name: str, rgba: np.ndarray, world_x: float, world_y: float, *, scale: int = 1, **extra) -> dict:
        """Crop to content, write the PNG and record where its top-left corner sits in the world.

        `scale` is image pixels per world unit (renders are stored sharper than the photo)."""
        alpha = rgba[..., 3]
        ys, xs = np.nonzero(alpha > 2)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        crop = np.clip(rgba[y0:y1, x0:x1], 0, 255).astype(np.uint8)
        # Fully transparent pixels compress better as black.
        crop[crop[..., 3] == 0] = 0
        cv2.imwrite(str(self.out / f'{name}.png'), crop)
        entry = {'file': f'{name}.png', 'x': round(float(world_x + x0 / scale), 2), 'y': round(float(world_y + y0 / scale), 2),
                 'w': round(crop.shape[1] / scale, 2), 'h': round(crop.shape[0] / scale, 2)}
        if scale != 1:
            entry['scale'] = scale
        entry.update(extra)
        self.manifest[name] = entry
        return entry

    def effects(self, skip: tuple[str, ...] = (), pad: int = 10) -> None:
        """Soft shadow and highlight halo for every sprite, so the browser never has to blur."""
        for name, entry in self.manifest.items():
            if name in skip:
                continue
            sprite = cv2.imread(str(self.out / entry['file']), cv2.IMREAD_UNCHANGED)
            alpha = sprite[..., 3].astype(np.float32) / 255.0
            if entry.get('scale', 1) != 1:
                alpha = cv2.resize(alpha, (int(round(entry['w'])), int(round(entry['h']))), interpolation=cv2.INTER_AREA)
            alpha = np.pad(alpha, pad)
            shadow = cv2.GaussianBlur(alpha, (0, 0), 3.2) * 0.62
            shadow_rgba = np.dstack([np.full_like(shadow, 12), np.full_like(shadow, 14), np.full_like(shadow, 10), shadow * 255])
            cv2.imwrite(str(self.out / f'{name}-shadow.png'), np.clip(shadow_rgba, 0, 255).astype(np.uint8))
            glow = cv2.GaussianBlur(cv2.dilate(alpha, np.ones((5, 5), np.uint8)), (0, 0), 3.0)
            glow = np.clip(glow * 1.6, 0, 1) * (1 - alpha * 0.85)
            glow_rgba = np.dstack([np.full_like(glow, 110), np.full_like(glow, 232), np.full_like(glow, 206), glow * 255])   # BGR lime
            cv2.imwrite(str(self.out / f'{name}-glow.png'), np.clip(glow_rgba, 0, 255).astype(np.uint8))
            entry['pad'] = pad

    def mat_texture(self, seed: int = 11) -> None:
        """Seamless rubber cleaning-mat texture for the work surface behind the parts."""
        rng = np.random.default_rng(seed)
        tile = 256
        noise = np.zeros((tile, tile), np.float32)
        for scale, amp in ((64, 7.0), (16, 5.0), (4, 3.5), (1, 2.5)):
            n = rng.normal(0, 1, (tile // scale + 1, tile // scale + 1)).astype(np.float32)
            n[-1, :], n[:, -1] = n[0, :], n[:, 0]
            noise += amp * cv2.resize(n, (tile + scale, tile + scale), interpolation=cv2.INTER_CUBIC)[:tile, :tile]
        mat = np.dstack([np.full((tile, tile), c, np.float32) + noise for c in (34, 44, 36)])   # BGR, dark olive
        cv2.imwrite(str(self.out / 'mat-texture.png'), np.clip(mat, 0, 255).astype(np.uint8))

    def write_manifest(self, path: Path, **extra) -> None:
        path.write_text(json.dumps({**extra, 'sprites': self.manifest}, indent=2), encoding='utf-8')


# --------------------------------------------------------------------------- orientation
def orient(img: np.ndarray, how: str) -> np.ndarray:
    """`ccw`/`cw` rotate by 90 degrees; `t` transposes (rotation plus mirror); `fx` mirrors."""
    if how == 'ccw':
        return cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
    if how == 'cw':
        return cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
    if how == 't':
        return cv2.transpose(img)
    if how == 'fx':
        return img[:, ::-1].copy()
    return img


def orient_point(x: float, y: float, w: int, h: int, how: str) -> tuple[float, float]:
    """Where pixel (x, y) of a w x h image lands after `orient`."""
    if how == 'ccw':
        return y, w - 1 - x
    if how == 'cw':
        return h - 1 - y, x
    if how == 't':
        return y, x
    if how == 'fx':
        return w - 1 - x, y
    return x, y


class Placement:
    """Crop of the sheet -> oriented, scaled image placed in world units.

    The anchor is a point of the source photo and the world position it must land on."""

    def __init__(self, box: tuple[int, int, int, int], how: str, scale: float | tuple[float, float],
                 anchor_src: tuple[float, float], anchor_world: tuple[float, float]):
        self.box, self.how = box, how
        self.sx, self.sy = scale if isinstance(scale, tuple) else (scale, scale)
        x0, y0, x1, y1 = box
        self.w, self.h = x1 - x0, y1 - y0
        ax, ay = orient_point(anchor_src[0] - x0, anchor_src[1] - y0, self.w, self.h, how)
        self.tx = anchor_world[0] - ax * self.sx
        self.ty = anchor_world[1] - ay * self.sy

    def world(self, x: float, y: float) -> tuple[float, float]:
        """World position of a source-photo point."""
        x0, y0 = self.box[:2]
        ox, oy = orient_point(x - x0, y - y0, self.w, self.h, self.how)
        return self.tx + ox * self.sx, self.ty + oy * self.sy

    def image(self, rgba: np.ndarray) -> np.ndarray:
        x0, y0, x1, y1 = self.box
        crop = orient(rgba[y0:y1, x0:x1], self.how)
        size = (max(1, int(round(crop.shape[1] * self.sx))), max(1, int(round(crop.shape[0] * self.sy))))
        interp = cv2.INTER_AREA if self.sx * self.sy < 1 else cv2.INTER_CUBIC
        # Resize premultiplied so the transparent surroundings do not bleed into the edge.
        a = crop[..., 3:4] / 255.0
        pre = cv2.resize(np.dstack([crop[..., :3] * a, a * 255.0]).astype(np.float32), size, interpolation=interp)
        alpha = np.clip(pre[..., 3], 0, 255)
        rgb = pre[..., :3] / np.maximum(alpha[..., None] / 255.0, 1e-4)
        return np.dstack([np.clip(rgb, 0, 255), alpha]).astype(np.float32)


# --------------------------------------------------------------------------- rendering
def shade_cylinder(v: np.ndarray, base: tuple[float, float, float], gloss: float) -> np.ndarray:
    """Colour of a horizontal cylinder at normalised height v (-1 top, +1 bottom)."""
    nz = np.sqrt(np.clip(1 - v * v, 0, 1))
    ny = v
    light = np.array([-0.35, -0.72, 0.6])
    light = light / np.linalg.norm(light)
    lambert = np.clip(-ny * light[1] + nz * light[2], 0, 1)
    half = light + np.array([0, 0, 1.0])
    half = half / np.linalg.norm(half)
    spec = np.clip(-ny * half[1] + nz * half[2], 0, 1) ** 36
    env = 0.55 + 0.45 * smoothstep(0.2, -0.8, v)
    rim = smoothstep(0.6, 1.0, np.abs(v)) * 0.3
    colour = np.array(base)[None, None, :]
    shade = (0.52 + 0.62 * lambert * env)[..., None] * colour
    shade = shade + (gloss * 150 * spec)[..., None] + (gloss * 34 * env)[..., None]
    return shade * (1 - rim[..., None])


def render_disc(radius: float, base: tuple[float, float, float], ss: int = 8, scale: int = 4) -> np.ndarray:
    """Pin head seen end-on, lit from the top left like the photo; stored `scale` px per unit."""
    size = radius * 2 + 4
    n = int(np.ceil(size * ss))
    ys, xs = np.mgrid[0:n, 0:n].astype(np.float32)
    X = (xs + 0.5) / ss - size / 2
    Y = (ys + 0.5) / ss - size / 2
    d = np.hypot(X, Y)
    cover = 1 - smoothstep(radius - 0.5, radius, d)
    v = np.clip(Y / radius, -1, 1)
    colour = shade_cylinder(v * 0.55, base, 0.4)
    colour = colour * (1 - 0.3 * smoothstep(radius * 0.45, radius * 0.95, d))[..., None]
    ring = np.exp(-((d - radius * 0.62) / 0.35) ** 2) * 0.25
    colour = colour * (1 - ring[..., None])
    out = np.dstack([colour, cover * 255])
    target = int(round(size * scale))
    rgb = cv2.resize(out[..., :3] * out[..., 3:4] / 255, (target, target), interpolation=cv2.INTER_AREA)
    a = cv2.resize(out[..., 3], (target, target), interpolation=cv2.INTER_AREA)
    rgb = rgb / np.maximum(a[..., None] / 255, 1e-4)
    return np.dstack([np.clip(rgb, 0, 255), a]).astype(np.float32)
