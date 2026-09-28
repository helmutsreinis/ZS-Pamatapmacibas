"""Web images for the study modules (Munīcija, Ekipējums).

Every picture is listed in tools/study_images.json with its source URL, author and licence.
The script downloads each source once into tools/.cache/study/ (not committed), crops and
scales it, saves it to src/study/<module>/assets/ and writes the final pixel sizes to
src/study/<module>/assets/images.json, which the module content reads.

    python tools/build_study_images.py             # every image
    python tools/build_study_images.py uniform     # only images whose file name contains "uniform"

Needs Pillow, numpy and opencv-python (for painting over printed labels).
"""
from __future__ import annotations

import colorsys
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / 'tools' / 'study_images.json'
CACHE = ROOT / 'tools' / '.cache' / 'study'
# Wikimedia asks automated clients for a descriptive User-Agent.
USER_AGENT = 'MacibuCentrs-study-images/1.0 (static study site build script)'


def fetch(url: str, target: Path) -> None:
    if target.exists():
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    # Wikimedia rate-limits bursts (HTTP 429): wait between files and back off on refusals.
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                target.write_bytes(response.read())
            time.sleep(2)
            return
        except urllib.error.HTTPError as error:
            if error.code != 429 or attempt == 4:
                raise
            time.sleep(10 * (attempt + 1))


def _is_line(pixels: np.ndarray, x: int, y: int) -> bool:
    """A pixel of a thin red leader line: pinkish on the white background, clearly red on the photo."""
    h, w = pixels.shape[:2]
    if not (0 <= x < w and 0 <= y < h):
        return False
    r, g, b = (int(v) for v in pixels[y, x])
    if min(r, g, b) > 238:
        return False
    if r > 200 and g > 185 and b > 185:
        return r > g + 8 and r > b + 5
    hue, sat, _ = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    return (hue < 20 / 360 or hue > 340 / 360) and sat > 0.25


def erase_traced_lines(image: Image.Image, lines: list, keep: list) -> Image.Image:
    """Follow each printed leader line column by column from [x0, y0] towards x1 and paint it out.

    Pixels inside the `keep` rectangles (the patches the lines point at) are never touched."""
    pixels = np.array(image)
    mask = np.zeros(pixels.shape[:2], np.uint8)
    for x0, y0, x1, step in lines:
        y, misses = float(y0), 0
        for x in range(x0, x1 + step, step):
            rows = [yy for yy in range(round(y) - 3, round(y) + 4) if _is_line(pixels, x, yy)]
            if not rows:
                misses += 1
                if misses > 6:
                    break
                continue
            misses = 0
            y = sum(rows) / len(rows)
            for yy in rows:
                mask[max(yy - 1, 0):yy + 2, x] = 255
    mask = cv2.dilate(mask, np.ones((3, 3), np.uint8))
    for x, y, w, h in keep:
        mask[y:y + h, x:x + w] = 0
    return Image.fromarray(cv2.inpaint(pixels, mask, 5, cv2.INPAINT_TELEA))


def remove_markers(image: Image.Image, markers: list, radius: int) -> Image.Image:
    """Paint out printed numbered circles.

    Each marker is {"at": [x, y]} plus an optional way to rebuild what is under it:
    "shift": [dx, dy] copies the disk from that offset (webbing a whole number of rows away);
    "rows": p fills every pixel from the same column k·p rows away (k = ±1, ±2, ±3), never
    from inside another circle. Anything left, and markers without either, are inpainted."""
    pixels = np.array(image).astype(np.float32)
    h, w = pixels.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    disks = [np.hypot(xx - m['at'][0], yy - m['at'][1]) <= radius + 1 for m in markers]
    anywhere = np.logical_or.reduce(disks)
    out = pixels.copy()
    todo = np.zeros((h, w), np.uint8)
    for marker, disk in zip(markers, disks):
        ys, xs = np.nonzero(disk)
        if 'shift' in marker:
            dx, dy = marker['shift']
            out[ys, xs] = pixels[ys + dy, xs + dx]
        elif 'rows' in marker:
            period = marker['rows']
            for y, x in zip(ys, xs):
                for k in (-1, 1, -2, 2, -3, 3):
                    source_y = y + k * period
                    if 0 <= source_y < h and not anywhere[source_y, x]:
                        out[y, x] = pixels[source_y, x]
                        break
                else:
                    todo[y, x] = 255
        else:
            todo[disk] = 255
    result = out.clip(0, 255).astype(np.uint8)
    return Image.fromarray(cv2.inpaint(result, todo, 6, cv2.INPAINT_TELEA))


def build(entry: dict) -> tuple[Path, tuple[int, int]]:
    if entry.get('source'):
        # Course material supplied by the trainee, kept in tools/study-sources/.
        source = ROOT / entry['source']
    else:
        source = CACHE / entry['cache']
        fetch(entry['url'], source)
    image = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    if entry.get('remove_markers'):
        image = remove_markers(image, entry['remove_markers'], entry.get('marker_radius', 17))
    if entry.get('rotate'):
        image = image.rotate(entry['rotate'], resample=Image.BICUBIC, expand=True, fillcolor=tuple(entry.get('fill', [255, 255, 255])))
    if entry.get('trace_lines'):
        image = erase_traced_lines(image, entry['trace_lines'], entry.get('keep') or [])
    if entry.get('paint_lines'):
        # Short line pieces the tracer cannot tell from the fabric: paint out the given polylines.
        pixels = np.array(image)
        mask = np.zeros(pixels.shape[:2], np.uint8)
        for points in entry['paint_lines']:
            cv2.polylines(mask, [np.array(points, np.int32).reshape(-1, 1, 2)], False, 255, thickness=3)
        image = Image.fromarray(cv2.inpaint(pixels, mask, 4, cv2.INPAINT_TELEA))
    if entry.get('erase'):
        # Paint over printed labels and numbers (rectangles in the rotated source's pixels).
        pixels = np.array(image)
        mask = np.zeros(pixels.shape[:2], np.uint8)
        for x, y, w, h in entry['erase']:
            mask[y:y + h, x:x + w] = 255
        image = Image.fromarray(cv2.inpaint(pixels, mask, 7, cv2.INPAINT_TELEA))
    if entry.get('whiteout'):
        # Printed text on a plain white background: fill with white instead of inpainting.
        pixels = np.array(image)
        for x, y, w, h in entry['whiteout']:
            pixels[y:y + h, x:x + w] = entry.get('fill', [255, 255, 255])
        image = Image.fromarray(pixels)
    if entry.get('prescale'):
        image = image.resize((round(image.width * entry['prescale']), round(image.height * entry['prescale'])), Image.LANCZOS)
    if entry.get('crop'):
        x, y, w, h = entry['crop']
        image = image.crop((x, y, x + w, y + h))
    if entry.get('pad'):
        # White margin [top, right, bottom, left], e.g. room for dimension lines.
        top, right, bottom, left = entry['pad']
        padded = Image.new('RGB', (image.width + left + right, image.height + top + bottom), tuple(entry.get('fill', [255, 255, 255])))
        padded.paste(image, (left, top))
        image = padded
    if entry.get('mirror'):
        image = ImageOps.mirror(image)
    max_w, max_h = entry.get('max') or [1400, 1400]
    image.thumbnail((max_w, max_h), Image.LANCZOS)
    out = ROOT / 'src' / 'study' / entry['module'] / 'assets' / entry['file']
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.suffix.lower() == '.webp':
        image.save(out, 'WEBP', quality=entry.get('quality', 82), method=6)
    else:
        image.save(out, 'JPEG', quality=entry.get('quality', 84), optimize=True, progressive=True)
    return out, image.size


def main() -> None:
    entries = json.loads(MANIFEST.read_text(encoding='utf-8'))['images']
    only = sys.argv[1] if len(sys.argv) > 1 else ''
    sizes: dict[str, dict[str, dict[str, int]]] = {}
    for entry in entries:
        module = entry['module']
        sizes_file = ROOT / 'src' / 'study' / module / 'assets' / 'images.json'
        if module not in sizes:
            sizes[module] = json.loads(sizes_file.read_text(encoding='utf-8')) if sizes_file.exists() else {}
        if only and only not in entry['file']:
            continue
        out, (w, h) = build(entry)
        sizes[module][entry['file']] = {'width': w, 'height': h}
        print(f'{out.relative_to(ROOT)}  {w}×{h}  {out.stat().st_size // 1024} KB')
    known = {entry['file'] for entry in entries}
    for module, table in sizes.items():
        table = {name: size for name, size in sorted(table.items()) if name in known}
        path = ROOT / 'src' / 'study' / module / 'assets' / 'images.json'
        # write_bytes: LF line endings on every platform, like the rest of the repository
        path.write_bytes((json.dumps(table, ensure_ascii=False, indent=1) + '\n').encode('utf-8'))


if __name__ == '__main__':
    main()
