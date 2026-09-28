import type { Box } from './math';
import type { Segment } from './timeline';

/** One image cut from a reference photo (or rendered to match it), placed in world units. */
export type Sprite = {
  file: string; x: number; y: number; w: number; h: number;
  length?: number; radius?: number; head?: number; pivot?: number[]; pad?: number;
};

export type LayerId = 'back' | 'inner' | 'under' | 'shell' | 'over' | 'sling';

export type PinSpec = { side: string; end: string; hole: [number, number] };

export type PartDef = {
  id: string;
  layer: LayerId;
  /** Sprites drawn inside the part, bottom to top. Pins, the sling and the stock build their own. */
  sprites: string[];
  /** Rotation and scale centre, in world units of the assembled weapon. */
  pivot: [number, number];
  /** `flash`/`spin`: turning bands while the part is screwed or rotated off. */
  kind?: 'pin' | 'stock' | 'sling' | 'oprod' | 'flash' | 'spin' | 'catch';
  pin?: PinSpec;
  /** Parts that ride inside another part (bolt parts in the carrier). */
  parent?: string;
  /** Child drawn over its parent instead of under it. */
  above?: boolean;
  /** X-ray key: the part's body fades while a segment lists this key (receiver, carrier, grip …). */
  xray?: string;
};

/**
 * Close-up of the place where removed pins are kept (the storage holes in the stock), shown in a
 * corner of the stage while a segment stows pins there, because that place is out of sight then.
 */
export type Stash = {
  kicker: string;
  title: string;
  /** Picture of the storage place, and the part of it that the close-up shows (world units). */
  sprite: string;
  view: Box;
  /** Storage holes; a pin goes in from the viewer's side, as into its holes in the weapon. */
  holes: [number, number][];
  pin: Pick<PinSpec, 'side' | 'end'>;
};

/** Everything the scene engine needs to draw and animate one weapon. */
export type SceneModel = {
  id: string;
  sprites: Record<string, Sprite>;
  parts: PartDef[];
  partById: Record<string, PartDef>;
  /** URL of an image file shipped with the weapon (sprite, `-shadow` or `-glow` variant). */
  url: (file: string) => string;
  matTexture: string;
  disassembly: Segment[];
  check: Segment;
  /** Where each removed part lies on the mat (top-left corner, or pin head position). */
  tray: Record<string, readonly [number, number]>;
  mat: Box;
  /** The assembled weapon, for the default and overview camera shots. */
  body: Box;
  /** Screen direction of "towards the viewer" for pins pushed out, and its foreshortening. */
  pinOut: [number, number];
  pinDepth: number;
  sling?: { on: [number, number][]; mat: [number, number][] };
  stash?: Stash;
  /** Narrowest camera shot in world units (default 480), so photos are not enlarged past their resolution. */
  cameraMin?: number;
};

export function spriteUrl(model: SceneModel, name: string, variant = ''): string {
  const file = model.sprites[name]?.file ?? `${name}.png`;
  return model.url(variant ? file.replace('.png', `${variant}.png`) : file);
}

/** Bounding box of a part in its own (installed, world) coordinates. */
export function partBox(model: Pick<SceneModel, 'sprites' | 'sling'>, part: PartDef): Box {
  if (part.kind === 'pin' && part.pin) {
    const side = model.sprites[part.pin.side];
    const length = side.length ?? side.w;
    return { x: part.pin.hole[0] - 6, y: part.pin.hole[1] - 6, w: length + 12, h: 12 };
  }
  if (part.kind === 'sling' && model.sling) {
    const xs = model.sling.on.map((p) => p[0]), ys = model.sling.on.map((p) => p[1]);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  }
  const boxes = part.sprites.map((name) => model.sprites[name]);
  const x = Math.min(...boxes.map((s) => s.x)), y = Math.min(...boxes.map((s) => s.y));
  const x2 = Math.max(...boxes.map((s) => s.x + s.w)), y2 = Math.max(...boxes.map((s) => s.y + s.h));
  return { x, y, w: x2 - x, h: y2 - y };
}
