"""Build the photographic part sprites used by the G36C learning scene.

Source photo: src/assets/g36-reference-parts.png (field-stripped G36C, left side view,
white background). Every large part is cut out of that single photo, so all sprites share
the same light, colour and scale (1 world unit = 1 source pixel, roughly 1 mm).

The photo does not show the parts hidden inside the rifle (pins, firing pin, gas piston,
operating rod, barrel under the handguard). Those are rendered here as shaded cylinders
in the photo's colours. Any render can be replaced by a real photo with the same file
name and roughly the same pixel size.

Outputs
  src/weapons/g36c/assets/<name>.png   RGBA sprites
  src/weapons/g36c/parts.json          placement of every sprite in the assembled rifle

Run:  python tools/build_part_images.py
Needs numpy and opencv-python.
"""
from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'src' / 'assets' / 'g36-reference-parts.png'
OUT = ROOT / 'src' / 'weapons' / 'g36c' / 'assets'
MANIFEST = ROOT / 'src' / 'weapons' / 'g36c' / 'parts.json'

BORE_Y = 258          # barrel axis in world units
GAS_Y = 236           # gas piston and operating rod axis

src = cv2.imread(str(SRC), cv2.IMREAD_COLOR).astype(np.float32)
H, W = src.shape[:2]
min_ch = src.min(axis=2)
_, labels = cv2.connectedComponents((min_ch < 243).astype(np.uint8), connectivity=8)

manifest: dict[str, dict] = {}


# --------------------------------------------------------------------------- matting
def component(seed: tuple[int, int]) -> np.ndarray:
    """Hard mask of the connected part that contains the seed pixel (x, y)."""
    label = labels[seed[1], seed[0]]
    assert label != 0, f'seed {seed} is on the background'
    mask = (labels == label).astype(np.uint8)
    # Fill small enclosed bright spots (specular highlights), keep real windows.
    padded = np.pad(mask, 2)
    flood = padded.copy()
    cv2.floodFill(flood, None, (0, 0), 1)
    holes = (flood == 0).astype(np.uint8)[2:-2, 2:-2]
    count, hole_labels, stats, _ = cv2.connectedComponentsWithStats(holes, connectivity=4)
    for i in range(1, count):
        if stats[i, cv2.CC_STAT_AREA] < 160:
            mask[hole_labels == i] = 1
    return mask


def poly_mask(points: list[tuple[float, float]]) -> np.ndarray:
    mask = np.zeros((H, W), np.uint8)
    cv2.fillPoly(mask, [np.round(np.array(points)).astype(np.int32)], 1)
    return mask


def rect_mask(x0: int, y0: int, x1: int, y1: int) -> np.ndarray:
    mask = np.zeros((H, W), np.uint8)
    mask[y0:y1, x0:x1] = 1
    return mask


def matte(mask: np.ndarray, image: np.ndarray = src) -> np.ndarray:
    """Soft alpha from a hard mask on a white background, with the white fringe removed."""
    mask = mask.astype(np.uint8)
    lum = image.mean(axis=2)
    # Local foreground brightness, taken from pixels well inside the mask.
    inner = cv2.erode(mask, np.ones((3, 3), np.uint8))
    weight = cv2.GaussianBlur(inner.astype(np.float32), (0, 0), 3)
    fg_lum = cv2.GaussianBlur(lum * inner, (0, 0), 3) / np.maximum(weight, 1e-4)
    fg_lum = np.where(weight > 1e-3, fg_lum, 90.0)
    soft = np.clip((255.0 - lum) / np.maximum(255.0 - fg_lum, 25.0), 0, 1)
    band = cv2.dilate(mask, np.ones((3, 3), np.uint8)) - inner
    alpha = np.where(inner > 0, 1.0, np.where(band > 0, soft, 0.0)).astype(np.float32)
    # A cut edge that is not a photo edge (for example handguard vs receiver) stays hard.
    alpha = np.where((band > 0) & (lum < 170), np.maximum(alpha, mask.astype(np.float32)), alpha)
    # Trim the faint halo, then give every edge pixel the colour of the solid part next to it,
    # so no white from the photo background survives in the blend.
    alpha = np.clip((alpha - 0.18) / 0.82, 0, 1)
    solid = (alpha >= 0.97).astype(np.uint8)
    edge = ((alpha > 0) & (solid == 0)).astype(np.uint8)
    bgr = np.clip(image, 0, 255).astype(np.uint8)
    rgb = cv2.inpaint(bgr, cv2.dilate(edge, np.ones((3, 3), np.uint8)) & (1 - solid), 2, cv2.INPAINT_TELEA)
    rgb = np.where(solid[..., None] > 0, image, rgb.astype(np.float32))
    return np.dstack([rgb, alpha * 255.0])


def inpaint(rgba: np.ndarray, region: np.ndarray, radius: int = 3) -> np.ndarray:
    """Fill a region of the colour channels from its surroundings (alpha untouched)."""
    bgr = np.clip(rgba[..., :3], 0, 255).astype(np.uint8)
    filled = cv2.inpaint(bgr, region.astype(np.uint8), radius, cv2.INPAINT_TELEA)
    out = rgba.copy()
    out[..., :3] = np.where(region[..., None] > 0, filled.astype(np.float32), rgba[..., :3])
    return out


def save(name: str, rgba: np.ndarray, world_x: float, world_y: float, *, crop: bool = True, scale: int = 1, **extra) -> None:
    """Crop to content, write the PNG and record where its top-left corner sits in the world.

    `scale` is image pixels per world unit (renders are stored sharper than the photo)."""
    alpha = rgba[..., 3]
    if crop:
        ys, xs = np.nonzero(alpha > 2)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        rgba = rgba[y0:y1, x0:x1]
    else:
        x0 = y0 = 0
    out = np.clip(rgba, 0, 255).astype(np.uint8)
    cv2.imwrite(str(OUT / f'{name}.png'), out)
    entry = {'file': f'{name}.png', 'x': round(float(world_x + x0 / scale), 2), 'y': round(float(world_y + y0 / scale), 2),
             'w': round(out.shape[1] / scale, 2), 'h': round(out.shape[0] / scale, 2)}
    if scale != 1:
        entry['scale'] = scale
    entry.update(extra)
    manifest[name] = entry


def neutral(rgba: np.ndarray, strength: float = 0.8) -> np.ndarray:
    """Remove JPEG colour noise from bare-metal parts, which are grey in reality."""
    rgb = rgba[..., :3]
    grey = rgb.mean(axis=2, keepdims=True)
    tint = np.array([1.02, 0.98, 1.03], np.float32)       # keep the photo's slight cool cast
    out = rgba.copy()
    out[..., :3] = rgb * (1 - strength) + grey * tint * strength
    return out


def save_photo(name: str, mask: np.ndarray, dx: float = 0, dy: float = 0, *, fix=None, metal: bool = False,
               **extra) -> None:
    rgba = matte(mask)
    if fix is not None:
        rgba = fix(rgba)
    if metal:
        rgba = neutral(rgba)
    save(name, rgba, dx, dy, **extra)


# --------------------------------------------------------------------------- renderer
def smoothstep(e0: float, e1: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


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
    env = 0.55 + 0.45 * smoothstep(0.2, -0.8, v)          # studio sky from above
    rim = smoothstep(0.6, 1.0, np.abs(v)) * 0.3            # darker silhouette edge
    colour = np.array(base)[None, None, :]
    shade = (0.52 + 0.62 * lambert * env)[..., None] * colour
    shade = shade + (gloss * 150 * spec)[..., None] + (gloss * 34 * env)[..., None]
    return shade * (1 - rim[..., None])


class Canvas:
    """Supersampled RGBA canvas in world units."""

    def __init__(self, x0: float, y0: float, x1: float, y1: float, ss: int = 8):
        self.x0, self.y0, self.ss = x0, y0, ss
        self.w = int(np.ceil((x1 - x0) * ss))
        self.h = int(np.ceil((y1 - y0) * ss))
        self.rgb = np.zeros((self.h, self.w, 3), np.float32)
        self.a = np.zeros((self.h, self.w), np.float32)
        ys, xs = np.mgrid[0:self.h, 0:self.w].astype(np.float32)
        self.X = x0 + (xs + 0.5) / ss
        self.Y = y0 + (ys + 0.5) / ss

    def paint(self, cover: np.ndarray, colour: np.ndarray) -> None:
        cover = np.clip(cover, 0, 1)
        self.rgb = self.rgb * (1 - cover[..., None]) + colour * cover[..., None]
        self.a = self.a + cover * (1 - self.a)

    def cylinder(self, xa: float, xb: float, cy: float, ra: float, rb: float | None = None, *,
                 base=(118, 112, 122), gloss: float = 0.5, grooves: tuple = ()) -> None:
        """Horizontal cylinder or cone from xa to xb with radius ra..rb, centred at cy."""
        rb = ra if rb is None else rb
        t = np.clip((self.X - xa) / max(xb - xa, 1e-6), 0, 1)
        r = ra + (rb - ra) * t
        inside_x = smoothstep(xa - 0.3, xa + 0.3, self.X) * (1 - smoothstep(xb - 0.3, xb + 0.3, self.X))
        v = (self.Y - cy) / r
        cover = inside_x * (1 - smoothstep(0.93, 1.0, np.abs(v)))
        colour = shade_cylinder(np.clip(v, -1, 1), base, gloss)
        for gx, gw, depth in grooves:
            g = np.exp(-((self.X - gx) / gw) ** 2)
            colour = colour * (1 - depth * g[..., None])
        # soft machining streaks along the axis
        rng = np.random.default_rng(int(xa * 7 + cy))
        streak = rng.normal(0, 1, (self.h, 1)).astype(np.float32)
        colour = colour * (1 + 0.03 * cv2.GaussianBlur(streak, (1, 5), 0)[..., None])
        self.paint(cover, colour)

    def box(self, xa: float, ya: float, xb: float, yb: float, radius: float, *, base=(96, 92, 100), gloss=0.25) -> None:
        """Rounded block, lit from above like the photo."""
        cx, cy = (xa + xb) / 2, (ya + yb) / 2
        hx, hy = (xb - xa) / 2 - radius, (yb - ya) / 2 - radius
        qx = np.maximum(np.abs(self.X - cx) - hx, 0)
        qy = np.maximum(np.abs(self.Y - cy) - hy, 0)
        d = np.sqrt(qx * qx + qy * qy) - radius
        cover = 1 - smoothstep(-0.6, 0.2, d)
        v = np.clip((self.Y - cy) / ((yb - ya) / 2), -1, 1)
        top_light = 0.62 + 0.38 * smoothstep(0.9, -0.9, v)
        edge = smoothstep(-2.5, 0.0, d)
        colour = np.array(base)[None, None, :] * top_light[..., None] * (1 - 0.35 * edge[..., None])
        colour = colour + gloss * 60 * np.exp(-((self.Y - ya - 1.2) / 0.9) ** 2)[..., None]
        self.paint(cover, colour)

    def spring(self, xa: float, xb: float, cy: float, radius: float, wire: float, coils: int, *,
               base=(150, 142, 150), front: bool = True) -> None:
        """Helical spring seen from the side, one strand layer at a time."""
        pitch = (xb - xa) / coils
        for i in range(coils):
            x = xa + i * pitch
            if front:
                ax, ay, bx, by = x, cy - radius, x + pitch * 0.5, cy + radius
            else:
                ax, ay, bx, by = x + pitch * 0.5, cy + radius, x + pitch, cy - radius
            self.capsule(ax, ay, bx, by, wire, base=base if front else tuple(c * 0.55 for c in base),
                         gloss=0.55 if front else 0.15)

    def capsule(self, ax, ay, bx, by, radius, *, base, gloss) -> None:
        px, py = self.X - ax, self.Y - ay
        dx, dy = bx - ax, by - ay
        t = np.clip((px * dx + py * dy) / (dx * dx + dy * dy), 0, 1)
        qx, qy = px - t * dx, py - t * dy
        dist = np.sqrt(qx * qx + qy * qy)
        cover = 1 - smoothstep(radius * 0.8, radius, dist)
        length = np.hypot(dx, dy)
        v = np.clip((qx * (-dy) + qy * dx) / (length * radius), -1, 1)
        self.paint(cover, shade_cylinder(v, base, gloss))

    def result(self, blur: float = 0.55, scale: int = 1) -> np.ndarray:
        """Downsample to `scale` pixels per world unit, with a light blur that matches the photo."""
        size = (self.w * scale // self.ss, self.h * scale // self.ss)
        rgb = cv2.resize(self.rgb, size, interpolation=cv2.INTER_AREA)
        a = cv2.resize(self.a, size, interpolation=cv2.INTER_AREA)
        if blur:
            premul = cv2.GaussianBlur(rgb * a[..., None], (0, 0), blur * scale * 0.6)
            a = cv2.GaussianBlur(a, (0, 0), blur * scale * 0.6)
            rgb = premul / np.maximum(a[..., None], 1e-4)
        noise = np.random.default_rng(7).normal(0, 2.2, rgb.shape).astype(np.float32)
        rgb = np.where(a[..., None] > 0.004, np.clip(rgb + noise, 0, 255), 0)   # empty pixels compress well
        return np.dstack([rgb, a * 255])


RENDER_SCALE = 4


def save_render(name: str, canvas: Canvas, scale: int = RENDER_SCALE, **extra) -> None:
    save(name, canvas.result(scale=scale), canvas.x0, canvas.y0, scale=scale, **extra)


STEEL = (150, 142, 152)     # BGR, sampled from the bolt carrier and spring
DARK_STEEL = (100, 95, 105)  # flash hider and barrel finish
POLYMER = (96, 90, 98)


# --------------------------------------------------------------------------- photo parts
FRONT = component((200, 260))
STOCK_UNIT = component((800, 236))
CARRIER_UNIT = component((420, 200))

# Front unit: flash hider, handguard, and the front of the receiver.
FLASH = FRONT & rect_mask(0, 243, 45, 274)
# The small rod in front of the handguard is the gas plug; it is part of the rendered barrel.
HANDGUARD_POLY = [(58, 218), (131, 218), (133, 241), (238, 241), (264, 288), (262, 294),
                  (52, 294), (43, 287), (43, 244), (57, 241), (57, 226)]
HANDGUARD = FRONT & poly_mask(HANDGUARD_POLY) & (1 - FLASH)
FRONT_PIN = (255, 285)


def handguard_fix(rgba: np.ndarray) -> np.ndarray:
    # The front pin is rendered separately: leave a dark hole where its head was.
    hole = np.zeros((H, W), np.uint8)
    cv2.circle(hole, FRONT_PIN, 6, 1, -1)
    rgba = inpaint(rgba, hole, 4)
    cv2.circle(rgba, FRONT_PIN, 3, (32, 30, 34, 255), -1, cv2.LINE_AA)
    return rgba


save_photo('flash-hider', FLASH, metal=True)
save_photo('handguard', HANDGUARD, fix=handguard_fix)

# The photo lacks a 75 px middle section of the receiver. Rebuild it from the plain side
# of the receiver so that the grip, magazine well and rail line up as on the real rifle.
CUT = 333
BOX_X0, BOX_SEAM = 592, 690      # rear box in source coordinates, and the hinge seam
BOX_DX, BOX_DY = -184, 33        # rear box and stock placement in the world
MID_X0, MID_X1 = CUT, BOX_X0 + BOX_DX

receiver_front = matte(FRONT & (1 - HANDGUARD) & (1 - FLASH) & rect_mask(120, 0, CUT, H))
box_mask = STOCK_UNIT & poly_mask([(BOX_X0, 190), (686, 190), (686, 236), (697, 283), (697, 320), (BOX_X0, 320)])
box_rgba = matte(box_mask)

WORLD_W, WORLD_H = 760, 560
receiver = np.zeros((WORLD_H, WORLD_W, 4), np.float32)
receiver[:H, :CUT] = receiver_front[:, :CUT]
shifted = np.zeros((WORLD_H, WORLD_W, 4), np.float32)
M = np.float32([[1, 0, BOX_DX], [0, 1, BOX_DY]])
shifted = cv2.warpAffine(box_rgba, M, (WORLD_W, WORLD_H), flags=cv2.INTER_LINEAR)
receiver = np.where(shifted[..., 3:4] > receiver[..., 3:4], shifted, receiver)

strip_x0, strip_x1 = 300, CUT
strip = receiver_front[:, strip_x0:strip_x1]
top_front, bottom_front = 235, 290
top_box, bottom_box = 201 + BOX_DY, 262 + BOX_DY
for X in range(MID_X0, MID_X1 + 4):
    t = (X - MID_X0) / (MID_X1 - MID_X0)
    top = top_front + (top_box - top_front) * smoothstep(0.55, 1.0, np.array(t))
    bottom = bottom_front + (bottom_box - bottom_front) * smoothstep(0.35, 1.0, np.array(t))
    column = strip[:, (X - MID_X0) % (strip_x1 - strip_x0)]
    ys = np.arange(WORLD_H)
    # map the column's own top..bottom onto the blended top..bottom
    src_y = top_front + (ys - top) * (bottom_front - top_front) / max(bottom - top, 1)
    col = np.stack([np.interp(src_y, np.arange(H), column[:, c], left=0, right=0) for c in range(4)], axis=1)
    col[(ys < top - 1) | (ys > bottom + 1), 3] = 0
    blend = smoothstep(0.85, 1.0, np.array(t))
    existing = receiver[:, X]
    receiver[:, X] = np.where(existing[:, 3:4] > 0, existing * blend + col * (1 - blend), col)

# Receiver sling swivel stays; soften the seam where the rebuilt section meets the rear box.
seam = np.zeros((WORLD_H, WORLD_W), np.uint8)
seam[top_box:bottom_box + 2, MID_X1 - 3:MID_X1 + 5] = 1
receiver = inpaint(receiver, seam & (receiver[..., 3] > 200).astype(np.uint8), 3)


def pin_holes(rgba: np.ndarray, holes: list[tuple[int, int]], radius: float) -> np.ndarray:
    for x, y in holes:
        cv2.circle(rgba, (int(x), int(y)), int(radius) + 1, (40, 37, 42, 255), -1, cv2.LINE_AA)
        cv2.circle(rgba, (int(x), int(y)), int(radius), (22, 21, 24, 255), -1, cv2.LINE_AA)
    return rgba


# Pin positions in world units (grip pins come from the grip's own holes, see GRIP_DX/DY).
GRIP_DX, GRIP_DY = -126, 16
REAR_PIN = (596 + GRIP_DX, 284 + GRIP_DY)
CENTRE_PIN = (482 + GRIP_DX, 306 + GRIP_DY)
receiver = pin_holes(receiver, [REAR_PIN], 3)
save('receiver', receiver, 0, 0)

# Stock (folds on the hinge seam). Remove the two pins stored in its lower strut.
stock_mask = STOCK_UNIT & poly_mask([(686, 190), (930, 190), (930, 400), (697, 400), (697, 283), (686, 236)])


def stock_fix(rgba: np.ndarray) -> np.ndarray:
    window = rect_mask(732, 246, 764, 274) | rect_mask(732, 286, 764, 306)
    rgba[..., 3] = np.where(window > 0, 0, rgba[..., 3])
    strut = rect_mask(732, 274, 764, 286) & (rgba[..., 3] > 0).astype(np.uint8)
    return inpaint(rgba, strut, 3)


save_photo('stock', stock_mask, BOX_DX, BOX_DY, fix=stock_fix, pivot=[BOX_SEAM + BOX_DX, 260 + BOX_DY])

save_photo('rail', component((300, 100)), -29, 118)
save_photo('grip', component((595, 370)), GRIP_DX, GRIP_DY)
save_photo('magwell', component((380, 330)), -55, -20)
save_photo('magazine', component((250, 420)), 72, -40)
save_photo('mag-catch', component((452, 390)), -91, -65)
save_photo('recoil-spring', component((542, 170)), -52, 84, metal=True)

# Bolt carrier: split off the bolt head, cam pin head and firing-pin retaining pin head.
CARRIER_DX, CARRIER_DY = -96, 48
BOLT_HEAD = CARRIER_UNIT & rect_mask(342, 196, 375, 224)
CAM_PIN = (391, 211)
RETAINER = (451, 209)


def circle_mask(centre: tuple[int, int], radius: float) -> np.ndarray:
    mask = np.zeros((H, W), np.uint8)
    cv2.circle(mask, centre, int(round(radius)), 1, -1)
    return mask


def slot_colour() -> tuple[float, ...]:
    # Dark interior of the cam slot, sampled next to the pin head.
    return tuple(float(c) for c in np.median(src[209:213, 399:405].reshape(-1, 3), axis=0)) + (255.0,)


def carrier_fix(rgba: np.ndarray) -> np.ndarray:
    # Without its pin the cam slot is an empty dark groove.
    rgba = inpaint(rgba, circle_mask(CAM_PIN, 5), 3)
    shade = slot_colour()
    cv2.line(rgba, (388, 213), (406, 206), shade, 5, cv2.LINE_AA)
    cv2.line(rgba, (388, 211), (405, 204), tuple(c * 0.75 for c in shade[:3]) + (255.0,), 2, cv2.LINE_AA)
    # Empty retaining-pin hole.
    rgba = inpaint(rgba, circle_mask(RETAINER, 4.5), 3)
    cv2.circle(rgba, RETAINER, 3, (70, 66, 74, 255), -1, cv2.LINE_AA)
    cv2.circle(rgba, RETAINER, 2, (34, 32, 37, 255), -1, cv2.LINE_AA)
    return rgba


save_photo('bolt-carrier', CARRIER_UNIT & (1 - BOLT_HEAD), CARRIER_DX, CARRIER_DY, fix=carrier_fix, metal=True)

# Bolt head: photo of the visible front, plus a rendered tail that normally sits inside the carrier.
head = neutral(matte(BOLT_HEAD))
canvas = Canvas(342, 194, 420, 226)
canvas.cylinder(374, 414, 210, 7.5, base=STEEL, gloss=0.55, grooves=((392, 0.6, 0.35),))
tail = canvas.result(scale=1)
patch = head[194:226, 342:420]
full = np.where(patch[..., 3:4] > 10, patch, tail)
save('bolt-head', full, 342 + CARRIER_DX, 194 + CARRIER_DY)

# Cam pin and retaining pin heads (end-on) straight from the photo, cut round.
cam_rgba = neutral(matte(CARRIER_UNIT & circle_mask(CAM_PIN, 4)))
save('cam-pin-head', cam_rgba, CARRIER_DX, CARRIER_DY)
ret_rgba = neutral(matte(CARRIER_UNIT & circle_mask(RETAINER, 3.5)))
save('retainer-head', ret_rgba, CARRIER_DX, CARRIER_DY)


# --------------------------------------------------------------------------- rendered parts
def render_pin(name: str, length: float, radius: float, head: float, *, groove_at: float | None = None) -> None:
    """Pin lying on its side, head at the left; drawn at the origin."""
    c = Canvas(-2, -head - 2, length + 2, head + 2)
    grooves = ((groove_at, 0.5, 0.45),) if groove_at else ()
    c.cylinder(1.4, length, 0, radius, base=STEEL, gloss=0.6, grooves=grooves)
    c.cylinder(length - 1.4, length, 0, radius, radius * 0.72, base=STEEL, gloss=0.5)
    c.cylinder(0, 1.6, 0, head * 0.85, head, base=STEEL, gloss=0.55)
    save_render(name, c, length=length, radius=radius, head=head)


def render_pin_end(name: str, radius: float, *, flats: bool = False) -> None:
    """Pin seen end-on (as it sits in its hole)."""
    size = radius * 2 + 4
    c = Canvas(-size / 2, -size / 2, size / 2, size / 2)
    d = np.hypot(c.X, c.Y)
    cover = 1 - smoothstep(radius - 0.5, radius, d)
    if flats:
        cover = cover * (1 - smoothstep(radius * 0.78, radius * 0.86, np.abs(c.Y)))
    v = np.clip(c.Y / radius, -1, 1)
    colour = shade_cylinder(v * 0.55, STEEL, 0.4)
    colour = colour * (1 - 0.25 * smoothstep(radius * 0.45, radius * 0.95, d))[..., None]
    c.paint(cover, colour)
    save_render(name, c, radius=radius)


render_pin('pin', 42, 2.7, 3.4, groove_at=36)
render_pin_end('pin-end', 3.4)
render_pin('retainer', 16, 2.0, 2.3, groove_at=None)
render_pin('cam-pin', 20, 3.0, 4.2)

# Firing pin, lying in the carrier along the bore axis.
fp = Canvas(248, BORE_Y - 5, 374, BORE_Y + 5)
fp.cylinder(249, 254, BORE_Y, 0.9, 1.7, base=STEEL, gloss=0.6)
fp.cylinder(254, 352, BORE_Y, 1.7, base=STEEL, gloss=0.6)
fp.cylinder(352, 360, BORE_Y, 3.2, base=STEEL, gloss=0.55)
fp.cylinder(360, 373, BORE_Y, 2.1, base=STEEL, gloss=0.55, grooves=((368, 0.5, 0.3),))
save_render('firing-pin', fp)

# Barrel with gas block and barrel nut; sits under the handguard.
bar = Canvas(40, GAS_Y - 12, 268, BORE_Y + 14)
bar.cylinder(44, 262, BORE_Y, 6.4, base=DARK_STEEL, gloss=0.35, grooves=((56, 0.6, 0.3), (58, 0.6, 0.3)))
bar.cylinder(232, 262, BORE_Y, 11.5, base=DARK_STEEL, gloss=0.3, grooves=((240, 0.8, 0.45), (250, 0.8, 0.45)))
bar.box(50, GAS_Y - 9, 82, BORE_Y + 10, 3, base=(88, 84, 92), gloss=0.3)
bar.cylinder(44, 58, GAS_Y, 3.6, base=DARK_STEEL, gloss=0.35)           # gas plug seen at the handguard front
bar.cylinder(56, 82, GAS_Y, 7.6, base=(92, 88, 96), gloss=0.3)
save_render('barrel', bar, scale=2)

# Gas piston: head inside the gas block, tip pointing back at the operating rod.
pis = Canvas(56, GAS_Y - 7, 94, GAS_Y + 7)
pis.cylinder(58, 68, GAS_Y, 5.2, base=STEEL, gloss=0.55, grooves=((61, 0.45, 0.5),))
pis.cylinder(68, 88, GAS_Y, 2.5, base=STEEL, gloss=0.6)
pis.cylinder(88, 92, GAS_Y, 2.5, 1.1, base=STEEL, gloss=0.6)
save_render('piston', pis)

# Operating rod with its return spring. The spring is its own sprite so it can compress.
rod = Canvas(84, GAS_Y - 6, 192, GAS_Y + 6)
rod.cylinder(86, 95, GAS_Y, 4.2, base=STEEL, gloss=0.5, grooves=((88, 0.5, 0.4),))
rod.cylinder(95, 190, GAS_Y, 1.9, base=STEEL, gloss=0.6)
rod.cylinder(96, 98, GAS_Y, 5.6, base=STEEL, gloss=0.4)
save_render('operating-rod', rod)
spr = Canvas(98, GAS_Y - 7, 142, GAS_Y + 7)
spr.spring(98, 141, GAS_Y, 5.0, 0.75, 13, front=False)
spr.spring(98, 141, GAS_Y, 5.0, 0.75, 13, front=True)
save_render('operating-spring', spr)


# Soft shadow and highlight halo for every sprite, so the browser never has to blur.
PAD = 10
for name in list(manifest):
    entry = manifest[name]
    if name in ('pin', 'pin-end', 'retainer', 'cam-pin', 'cam-pin-head', 'retainer-head'):
        continue
    sprite = cv2.imread(str(OUT / entry['file']), cv2.IMREAD_UNCHANGED)
    alpha = sprite[..., 3].astype(np.float32) / 255.0
    if entry.get('scale', 1) != 1:
        alpha = cv2.resize(alpha, (int(round(entry['w'])), int(round(entry['h']))), interpolation=cv2.INTER_AREA)
    alpha = np.pad(alpha, PAD)
    shadow = cv2.GaussianBlur(alpha, (0, 0), 3.2) * 0.62
    shadow_rgba = np.dstack([np.full_like(shadow, 12), np.full_like(shadow, 14), np.full_like(shadow, 10), shadow * 255])
    cv2.imwrite(str(OUT / f'{name}-shadow.png'), np.clip(shadow_rgba, 0, 255).astype(np.uint8))
    glow = cv2.GaussianBlur(cv2.dilate(alpha, np.ones((5, 5), np.uint8)), (0, 0), 3.0)
    glow = np.clip(glow * 1.6, 0, 1) * (1 - alpha * 0.85)
    glow_rgba = np.dstack([np.full_like(glow, 110), np.full_like(glow, 232), np.full_like(glow, 206), glow * 255])  # BGR lime
    cv2.imwrite(str(OUT / f'{name}-glow.png'), np.clip(glow_rgba, 0, 255).astype(np.uint8))
    entry['pad'] = PAD

# Seamless rubber cleaning-mat texture for the work surface behind the parts.
rng = np.random.default_rng(11)
tile = 256
noise = np.zeros((tile, tile), np.float32)
for scale, amp in ((64, 7.0), (16, 5.0), (4, 3.5), (1, 2.5)):
    n = rng.normal(0, 1, (tile // scale + 1, tile // scale + 1)).astype(np.float32)
    n[-1, :], n[:, -1] = n[0, :], n[:, 0]
    noise += amp * cv2.resize(n, (tile + scale, tile + scale), interpolation=cv2.INTER_CUBIC)[:tile, :tile]
mat = np.dstack([np.full((tile, tile), c, np.float32) + noise for c in (34, 44, 36)])   # BGR, dark olive
cv2.imwrite(str(OUT / 'mat-texture.png'), np.clip(mat, 0, 255).astype(np.uint8))

MANIFEST.write_text(json.dumps({'boreY': BORE_Y, 'gasY': GAS_Y,
                                'pins': {'rear': REAR_PIN, 'centre': CENTRE_PIN, 'front': FRONT_PIN,
                                         'cam': [CAM_PIN[0] + CARRIER_DX, CAM_PIN[1] + CARRIER_DY],
                                         'retainer': [RETAINER[0] + CARRIER_DX, RETAINER[1] + CARRIER_DY]},
                                'sprites': manifest}, indent=2), encoding='utf-8')
print(f'wrote {len(manifest)} sprites to {OUT}')
for name, entry in manifest.items():
    print(f"  {name:18s} {entry['w']:6.1f} x {entry['h']:<6.1f} at ({entry['x']:.0f}, {entry['y']:.0f})")
