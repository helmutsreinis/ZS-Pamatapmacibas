"""Build the photographic part sprites used by the AK-4 learning scene.

Source photo: src/assets/ak4-reference-parts.jpg — "G3A3 disassembled mod.jpg" by lago4096
(retouched by Auge=mit), Wikimedia Commons, CC BY-SA 4.0. The AK-4 is the Swedish licence
build of the HK G3; the parts are the same. The sprites are derived works under the same licence.

The photo is a collage ("nicht maßstabsgetreu"): every part was photographed at its own
scale and some from the other side. Each part is therefore rotated, mirrored where needed and
scaled so that it matches the faded picture of the assembled rifle at the top of the photo,
which defines the world: 1 unit = 1 pixel of that picture (about 0.8 mm), left side view,
muzzle to the left. Parts hidden in the assembled rifle (bolt group, trigger mechanism) are
scaled to fit the parts that hold them.

Outputs
  src/weapons/ak4/assets/<name>.png   RGBA sprites (+ -shadow / -glow variants)
  src/weapons/ak4/parts.json          placement of every sprite in the assembled rifle

Run:  python tools/build_ak4_images.py [--debug DIR]
Needs numpy and opencv-python.
"""
from __future__ import annotations

import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sprite_kit import Placement, Sheet, orient, render_disc, smoothstep  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
sheet = Sheet(ROOT / 'src' / 'assets' / 'ak4-reference-parts.jpg', ROOT / 'src' / 'weapons' / 'ak4' / 'assets')
MANIFEST = ROOT / 'src' / 'weapons' / 'ak4' / 'parts.json'
DEBUG = Path(sys.argv[sys.argv.index('--debug') + 1]) if '--debug' in sys.argv else None

BORE_Y = 154.5        # barrel axis
TUBE_Y = 126.5        # cocking tube axis (bolt carrier tube, recoil spring)
STEEL = (132, 126, 134)   # BGR, the grey of the pins in the photo

world: dict[str, tuple[np.ndarray, float, float]] = {}   # name -> (rgba, x, y) in world units


def place(name: str, mask: np.ndarray, placement: Placement, *, shrink: int = 1) -> tuple[np.ndarray, float, float]:
    rgba = placement.image(sheet.matte(mask, shrink=shrink))
    world[name] = (rgba, placement.tx, placement.ty)
    return world[name]


# --------------------------------------------------------------------------- masks
# Dark parts separate cleanly from the white background and their drop shadows.
receiver_mask = sheet.largest(sheet.grabcut((1276, 66, 1490, 1145)) & (1 - sheet.rect(1428, 60, 1492, 165)))
stock_mask = sheet.largest(sheet.grabcut((335, 295, 565, 1100)) & (1 - sheet.rect(538, 640, 570, 1100)))
grip_mask = sheet.fill_small_holes(sheet.largest(sheet.grabcut((538, 662, 748, 950))), 60)
handguard_mask = sheet.fill_small_holes(sheet.largest(sheet.grabcut((1105, 595, 1210, 1125))), 200)
magazine_mask = sheet.fill_small_holes(sheet.largest(sheet.grabcut((1052, 512, 1272, 578))), 200)
carrier_mask = sheet.fill_small_holes(sheet.largest(sheet.grabcut((970, 695, 1045, 1075))), 200)

# Bright steel parts: traced outline, refined within a few pixels.
TRIGGER = [(744, 690), (760, 689), (769, 682), (776, 684), (781, 689), (783, 673), (797, 672), (799, 690),
           (842, 691), (843, 749), (858, 752), (872, 757), (885, 752), (893, 749), (890, 756), (878, 764),
           (862, 767), (850, 770), (846, 784), (843, 822), (809, 824), (808, 836), (802, 836), (801, 825),
           (790, 826), (786, 851), (765, 852), (767, 836), (776, 805), (787, 779), (792, 756), (794, 738),
           (791, 718), (784, 706), (770, 703), (756, 702), (745, 697)]
BOLT_HEAD = [(861, 864), (895, 864), (896, 933), (861, 933)]
LOCKING = [(927, 843), (937, 843), (939, 850), (944, 858), (944, 892), (940, 898), (939, 938), (936, 942),
           (929, 942), (927, 938), (927, 898), (922, 892), (921, 858), (925, 850)]
FIRING_PIN = [(928.5, 599), (931.5, 599), (932, 705), (935, 706), (935, 746), (934, 752), (926, 752), (925, 746),
              (924, 706), (928, 705)]
SPRING = [(920, 765), (939, 765), (939, 827), (920, 827)]
SELECTOR = [(772, 1036), (776, 1027), (785, 1023), (795, 1024), (802, 1030), (815, 1033), (824, 1034), (826, 1040),
            (822, 1045), (806, 1045), (800, 1043), (790, 1043), (776, 1042)]
PINS = {   # heads at the top of the photo
    'pin-long-a': [(658, 1031), (676, 1031), (676, 1037), (673, 1038), (673, 1088), (662, 1088), (662, 1038), (658, 1037)],
    'pin-long-b': [(684, 1031), (701, 1031), (701, 1037), (699, 1038), (699, 1088), (687, 1088), (687, 1038), (684, 1037)],
    'pin-short-a': [(708, 1031), (723, 1031), (723, 1036), (720, 1037), (720, 1077), (711, 1077), (711, 1037), (708, 1036)],
    'pin-short-b': [(741, 1027), (756, 1027), (756, 1033), (754, 1034), (754, 1074), (745, 1074), (745, 1034), (741, 1033)],
}


def traced(points, box, band=2):
    return sheet.fill_small_holes(sheet.largest(sheet.grabcut(box, hint=sheet.poly(points), band=band)), 80)


trigger_mask = traced(TRIGGER, (738, 660, 905, 860), 3)
bolt_head_mask = traced(BOLT_HEAD, (852, 855, 905, 940))
locking_mask = traced(LOCKING, (912, 832, 955, 948))
firing_pin_mask = traced(FIRING_PIN, (916, 594, 946, 758), 1)
spring_mask = traced(SPRING, (914, 758, 946, 832))
selector_mask = traced(SELECTOR, (764, 1014, 832, 1050))
pin_masks = {name: traced(points, (int(min(p[0] for p in points)) - 5, int(min(p[1] for p in points)) - 5,
                                   int(max(p[0] for p in points)) + 6, int(max(p[1] for p in points)) + 6), 1)
             for name, points in PINS.items()}

# --------------------------------------------------------------------------- placements
# Fitted by eye against the assembled rifle at the top of the photo.
RECEIVER = Placement((1276, 66, 1490, 1145), 'ccw', 0.885, (1394, 74), (36, BORE_Y))
STOCK = Placement((335, 295, 565, 1100), 't', 0.90, (397, 1092), (1322, 150))
GRIP = Placement((538, 662, 748, 950), 't', 0.87, (548, 672), (732, 188))
MAGAZINE = Placement((1052, 512, 1272, 578), 'ccw', (1.47, 0.93), (1262, 514), (629, 160))
HANDGUARD = Placement((1105, 595, 1210, 1125), 'ccw', 0.76, (1156, 603), (222, 165))
# The trigger mechanism sits in the grip housing: same shot, shifted into the housing.
TRIGGER_P = Placement((738, 660, 905, 860), 't', 0.87, (783, 672), GRIP.world(548, 672))

receiver = place('receiver', receiver_mask, RECEIVER)
stock = place('stock', stock_mask, STOCK)
grip = place('grip', grip_mask, GRIP)
magazine = place('magazine', magazine_mask, MAGAZINE)
handguard = place('handguard', handguard_mask, HANDGUARD)
trigger = place('trigger', trigger_mask, TRIGGER_P)


def world_canvas(names, x0=-20, y0=40, x1=1360, y1=380):
    """Debug composite of world sprites in draw order."""
    canvas = np.full((y1 - y0, x1 - x0, 3), 255, np.float32)
    for name in names:
        rgba, tx, ty = world[name]
        h, w = rgba.shape[:2]
        X, Y = int(round(tx)) - x0, int(round(ty)) - y0
        xa, ya, xb, yb = max(X, 0), max(Y, 0), min(X + w, canvas.shape[1]), min(Y + h, canvas.shape[0])
        if xa >= xb or ya >= yb:
            continue
        sub = rgba[ya - Y:yb - Y, xa - X:xb - X]
        a = sub[..., 3:4] / 255
        canvas[ya:yb, xa:xb] = canvas[ya:yb, xa:xb] * (1 - a) + sub[..., :3] * a
    return canvas


def world_grid(rgba, tx, ty, x0, y0, x1, y1, k=4, step=10, path=None):
    """Debug zoom of a world sprite with a world-coordinate grid."""
    canvas = np.full((y1 - y0, x1 - x0, 3), 255, np.float32)
    h, w = rgba.shape[:2]
    X, Y = int(round(tx)) - x0, int(round(ty)) - y0
    xa, ya, xb, yb = max(X, 0), max(Y, 0), min(X + w, canvas.shape[1]), min(Y + h, canvas.shape[0])
    sub = rgba[ya - Y:yb - Y, xa - X:xb - X]
    a = sub[..., 3:4] / 255
    canvas[ya:yb, xa:xb] = canvas[ya:yb, xa:xb] * (1 - a) + sub[..., :3] * a
    z = cv2.resize(canvas.astype(np.uint8), None, fx=k, fy=k, interpolation=cv2.INTER_NEAREST)
    for x in range((x0 // step + 1) * step, x1, step):
        cv2.line(z, ((x - x0) * k, 0), ((x - x0) * k, z.shape[0]), (0, 170, 255) if x % 50 else (0, 0, 255), 1)
        if x % 20 == 0:
            cv2.putText(z, str(x), ((x - x0) * k + 2, 12), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 200), 1)
    for y in range((y0 // step + 1) * step, y1, step):
        cv2.line(z, (0, (y - y0) * k), (z.shape[1], (y - y0) * k), (255, 170, 0) if y % 50 else (255, 0, 0), 1)
        cv2.putText(z, str(y), (2, (y - y0) * k - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (200, 0, 0), 1)
    cv2.imwrite(str(path), z)



if DEBUG:
    DEBUG.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(DEBUG / 'assembled_pass1.png'), world_canvas(['stock', 'magazine', 'trigger', 'grip', 'handguard', 'receiver']).astype(np.uint8))
    print('placements', {k: (round(v[1], 1), round(v[2], 1), v[0].shape[1], v[0].shape[0]) for k, v in world.items()})

if DEBUG:
    r, rx, ry = world['receiver']
    world_grid(r, rx, ry, 300, 90, 420, 135, 6, path=DEBUG / 'z_handle.png')
    world_grid(r, rx, ry, 690, 175, 760, 265, 6, path=DEBUG / 'z_catch.png')
    world_grid(r, rx, ry, 880, 150, 980, 215, 6, path=DEBUG / 'z_reartab.png')
    world_grid(r, rx, ry, 180, 70, 260, 175, 6, path=DEBUG / 'z_frontsight.png')
    world_grid(r, rx, ry, 220, 135, 620, 180, 3, path=DEBUG / 'z_barrel.png')
    s, sx, sy = world['stock']
    world_grid(s, sx, sy, 940, 80, 1080, 210, 4, path=DEBUG / 'z_stockfront.png')
    world_grid(s, sx, sy, 1240, 170, 1300, 250, 6, path=DEBUG / 'z_rivets.png')
    g, gx, gy = world['grip']
    world_grid(g, gx, gy, 720, 175, 860, 240, 5, path=DEBUG / 'z_gripfront.png')


# --------------------------------------------------------------------------- post-processing helpers
def world_poly(rgba: np.ndarray, tx: float, ty: float, points) -> np.ndarray:
    h, w = rgba.shape[:2]
    mask = np.zeros((h, w), np.uint8)
    pts = np.array([(x - tx, y - ty) for x, y in points])
    cv2.fillPoly(mask, [np.round(pts).astype(np.int32)], 1)
    return mask


def world_region(rgba: np.ndarray, tx: float, ty: float, fn) -> np.ndarray:
    h, w = rgba.shape[:2]
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    return fn(xs + tx, ys + ty).astype(np.uint8)


def inpaint(rgba: np.ndarray, region: np.ndarray, radius: int = 3) -> np.ndarray:
    bgr = np.clip(rgba[..., :3], 0, 255).astype(np.uint8)
    filled = cv2.inpaint(bgr, region.astype(np.uint8), radius, cv2.INPAINT_TELEA)
    out = rgba.copy()
    out[..., :3] = np.where(region[..., None] > 0, filled.astype(np.float32), rgba[..., :3])
    return out


def split(rgba: np.ndarray, mask: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """The masked pixels as one sprite, the rest as another."""
    inside, outside = rgba.copy(), rgba.copy()
    inside[..., 3] *= mask
    outside[..., 3] *= 1 - mask
    return inside, outside


def hole(rgba: np.ndarray, tx: float, ty: float, centre: tuple[float, float], radius: float) -> np.ndarray:
    """An empty pin hole: dark bore with a slightly lighter rim, drawn only on the part itself."""
    x, y = centre[0] - tx, centre[1] - ty
    out = np.ascontiguousarray(rgba).copy()
    k = 4   # supersampled for a round edge
    for r, colour in ((radius + 0.9, (46, 44, 48)), (radius, (20, 19, 22))):
        big = np.zeros((out.shape[0] * k, out.shape[1] * k), np.uint8)
        cv2.circle(big, (int(round(x * k)), int(round(y * k))), int(round(r * k)), 255, -1, cv2.LINE_AA)
        layer = cv2.resize(big.astype(np.float32) / 255, (out.shape[1], out.shape[0]), interpolation=cv2.INTER_AREA)
        layer *= out[..., 3] > 0
        out[..., :3] = out[..., :3] * (1 - layer[..., None]) + np.array(colour, np.float32) * layer[..., None]
    return out


def rotated(rgba: np.ndarray, angle: float, pivot: tuple[float, float]) -> tuple[np.ndarray, tuple[float, float]]:
    """Rotate an image about a pixel (degrees, clockwise on screen); returns the image and the new pivot pixel."""
    h, w = rgba.shape[:2]
    pad = int(np.hypot(w, h) / 2) + 2
    big = cv2.copyMakeBorder(rgba, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=0)
    px, py = pivot[0] + pad, pivot[1] + pad
    M = cv2.getRotationMatrix2D((px, py), -angle, 1.0)
    out = cv2.warpAffine(big, M, (big.shape[1], big.shape[0]), flags=cv2.INTER_CUBIC, borderValue=0)
    return np.clip(out, 0, 255), (px, py)


# --------------------------------------------------------------------------- receiver
rec, rx, ry = world['receiver']
# The bare barrel between the front sight holder and the receiver lies under the handguard.
barrel_region = world_region(rec, rx, ry, lambda X, Y: (X >= 230) & (X <= 546) & (Y >= 142))
barrel_img, rec = split(rec, barrel_region)

# Cocking handle, folded forward on top of the cocking tube; it slides back along the tube.
HANDLE = [(316, 115), (320, 108), (326, 104), (338, 102.5), (349, 103.5), (353, 106), (372, 106.5), (386, 108),
          (398, 112), (400, 115)]
handle_img, rec = split(rec, world_poly(rec, rx, ry, HANDLE))
# Rebuild the top of the tube under the handle from the tube just behind it.
tube_rows = world_region(rec, rx, ry, lambda X, Y: (X >= 314) & (X <= 402) & (Y >= 109) & (Y <= 118))
ys, xs = np.nonzero(tube_rows)
rec[ys, xs] = rec[ys, np.minimum(xs + 92, rec.shape[1] - 1)]
seams = world_region(rec, rx, ry, lambda X, Y: ((np.abs(X - 314) < 2.5) | (np.abs(X - 402) < 2.5)) & (Y >= 109) & (Y <= 118))
rec = inpaint(rec, seams & (rec[..., 3] > 0).astype(np.uint8), 2)

# Magazine catch paddle behind the magazine well.
CATCH = [(721.5, 232), (728.5, 232), (728.5, 253), (721.5, 253)]
catch_img, rec = split(rec, world_poly(rec, rx, ry, CATCH))

# Pin holes (the pins themselves are drawn separately).
HOLES = {
    'stockA': (962.0, 178.5), 'stockB': (982.0, 178.5),   # through the end piece of the stock
    'grip': (744.0, 233.0),                              # front of the trigger mechanism housing
    'handguard': (221.0, 138.0),                          # front sight holder lug
}
RIVETS = {'rivetA': (1264.0, 193.0), 'rivetB': (1260.0, 236.5)}   # hollow rivets in the stock (pin storage)
rec = hole(rec, rx, ry, HOLES['handguard'], 3.0)
world['receiver'] = (rec, rx, ry)
world['barrel'] = (barrel_img, rx, ry)
world['cocking-handle'] = (handle_img, rx, ry)
world['mag-catch'] = (catch_img, rx, ry)

# --------------------------------------------------------------------------- stock
st, sx, sy = world['stock']
# The end piece sits inside the receiver: nothing of it rises above the receiver's top line.
above = world_region(st, sx, sy, lambda X, Y: (X >= 972) & (X <= 1032) & (Y < 114))
st[..., 3] *= 1 - above
for c in (HOLES['stockA'], HOLES['stockB']):
    st = hole(st, sx, sy, c, 3.4)
world['stock'] = (st, sx, sy)

# --------------------------------------------------------------------------- grip, trigger, selector
g, gx, gy = world['grip']
SELECTOR_HUB = GRIP.world(575, 777)
# The pin hole and the selector shaft hole go right through the housing: dark, not background white.
world['grip'] = (hole(hole(g, gx, gy, HOLES['grip'], 3.4), gx, gy, SELECTOR_HUB, 6.5), gx, gy)
# The selector photo shows the lever with its shaft; only the lever shows on the rifle.
sel = sheet.matte(selector_mask & (1 - sheet.rect(800, 1043, 832, 1050)))
x0, y0, x1, y1 = 764, 1014, 832, 1047
sel = orient(sel[y0:y1, x0:x1], 'fx')                  # shaft end to the left: the lever points rearward
S_SCALE = 0.87
sel = cv2.resize(sel, None, fx=S_SCALE, fy=S_SCALE, interpolation=cv2.INTER_AREA)
hub_px = ((x1 - 1 - 818) * S_SCALE, (1039 - y0) * S_SCALE)
SELECTOR_S = -38.0     # position S: lever up and to the rear
sel, hub_px = rotated(sel, SELECTOR_S, hub_px)
world['selector'] = (sel, SELECTOR_HUB[0] - hub_px[0], SELECTOR_HUB[1] - hub_px[1])

# --------------------------------------------------------------------------- bolt group (hidden in the receiver)
# The carrier photo is a top view: rebuild a side view with the tube on top of the body.
CARRIER_P = Placement((970, 695, 1045, 1075), 'ccw', 0.92, (1012, 702), (493.0, TUBE_Y))
car = CARRIER_P.image(sheet.matte(carrier_mask))
cx, cy = CARRIER_P.tx, CARRIER_P.ty
tube_top, tube_bottom = TUBE_Y - 12.0, TUBE_Y + 12.0
body_front = CARRIER_P.world(1012, 946)[0]
body = car.copy()
body[..., 3] *= world_region(car, cx, cy, lambda X, Y: X >= body_front - 1)
tube = car.copy()
tube[..., 3] *= world_region(car, cx, cy, lambda X, Y: (Y >= tube_top) & (Y <= tube_bottom))
shift = int(round(TUBE_Y - tube_top - 3))
side = np.zeros((car.shape[0] + shift, car.shape[1], 4), np.float32)
side[shift:] = body
a = tube[..., 3:4] / 255
side[:car.shape[0]] = side[:car.shape[0]] * (1 - a) + tube * a
world['carrier'] = (side, cx, cy)

BOLT_P = Placement((852, 855, 905, 940), 'ccw', 0.98, (878, 864), (655.0, BORE_Y))
LOCK_P = Placement((912, 832, 955, 948), 'ccw', 0.92, (932, 843), (690.0, BORE_Y))
FP_P = Placement((916, 594, 946, 758), 'ccw', 1.07, (930, 600), (657.0, BORE_Y))
SPRING_P = Placement((914, 758, 946, 832), 'ccw', 1.0, (929.5, 766), (770.0, BORE_Y))
place('bolt-head', bolt_head_mask, BOLT_P)
place('locking-piece', locking_mask, LOCK_P)
place('firing-pin', firing_pin_mask, FP_P, shrink=0)
place('firing-spring', spring_mask, SPRING_P, shrink=0)

# --------------------------------------------------------------------------- pins
PIN_SCALE = 0.85
pin_meta: dict[str, dict] = {}
for name, points in PINS.items():
    xs_ = [p[0] for p in points]
    ys_ = [p[1] for p in points]
    box = (int(min(xs_)) - 4, int(min(ys_)) - 3, int(max(xs_)) + 5, int(max(ys_)) + 4)
    head_x = (min(xs_) + max(xs_)) / 2
    P = Placement(box, 'ccw', PIN_SCALE, (head_x, min(ys_)), (0.0, 0.0))
    world[name] = (P.image(sheet.matte(pin_masks[name], shrink=0)), P.tx, P.ty)
    head = (max(xs_) - min(xs_)) * PIN_SCALE
    pin_meta[name] = {'length': round((max(ys_) - min(ys_)) * PIN_SCALE, 2), 'radius': round(head * 0.34, 2), 'head': round(head / 2, 2)}

# --------------------------------------------------------------------------- save
LAYOUT = ['stock', 'barrel', 'magazine', 'carrier', 'bolt-head', 'locking-piece', 'firing-pin', 'firing-spring',
          'trigger', 'grip', 'selector', 'handguard', 'receiver', 'cocking-handle', 'mag-catch']
for name in LAYOUT + list(PINS):
    rgba, tx, ty = world[name]
    sheet.save(name, rgba, tx, ty, **pin_meta.get(name, {}))
# Pin heads seen end-on, rendered to match the photo's steel.
for kind, source in (('pin-long-end', 'pin-long-a'), ('pin-short-end', 'pin-short-a')):
    r = pin_meta[source]['head']
    size = r * 2 + 4
    sheet.save(kind, render_disc(r, STEEL), -size / 2, -size / 2, scale=4, radius=r)
sheet.effects(skip=tuple(PINS) + ('pin-long-end', 'pin-short-end'))
sheet.mat_texture()
# Parts-only crop of the photo (without the faded assembled rifle and its caption) for page headers and the hub.
cv2.imwrite(str(ROOT / 'src' / 'assets' / 'ak4-reference-cover.jpg'), np.clip(sheet.src[365:1200], 0, 255).astype(np.uint8),
            [cv2.IMWRITE_JPEG_QUALITY, 84])

pivots = {
    'grip': list(HOLES['grip']),
    'handguard': [612.0, 170.0],
    'selector': [round(SELECTOR_HUB[0], 2), round(SELECTOR_HUB[1], 2)],
    'catch': [725.0, 232.0],
}
sheet.write_manifest(MANIFEST, boreY=BORE_Y, tubeY=TUBE_Y, holes={**HOLES, **RIVETS}, pivots=pivots, selectorS=SELECTOR_S)
print(f'wrote {len(sheet.manifest)} sprites to {sheet.out}')
for name, entry in sheet.manifest.items():
    print(f"  {name:16s} {entry['w']:7.1f} x {entry['h']:<7.1f} at ({entry['x']:.0f}, {entry['y']:.0f})")

if DEBUG:
    order = ['stock', 'barrel', 'carrier', 'bolt-head', 'locking-piece', 'firing-spring', 'firing-pin', 'magazine',
             'trigger', 'grip', 'selector', 'handguard', 'receiver', 'cocking-handle', 'mag-catch']
    cv2.imwrite(str(DEBUG / 'assembled_pass2.png'), world_canvas(order).astype(np.uint8))
    cv2.imwrite(str(DEBUG / 'inner.png'), world_canvas(['stock', 'carrier', 'bolt-head', 'locking-piece', 'firing-spring',
                                                        'firing-pin', 'trigger']).astype(np.uint8))
