import manifest from './parts.json';
import type { PartDef, Sprite } from '../../scene/model';

/**
 * G36 parts. World units are pixels of the source field-strip photo of a G36C (about 1 mm);
 * every part is drawn where it sits in the assembled rifle, left side view. The adjustable
 * stock comes from a second photo, scaled to the same units.
 */
export const sprites = manifest.sprites as Record<string, Sprite>;
export const holes = manifest.pins as Record<'rear' | 'centre' | 'front' | 'cam' | 'retainer', [number, number]>;
/** Pin storage holes in the stock near the butt: front, rear and lower (left side, stock unfolded). */
export const stockHoles = manifest.stockHoles as [number, number][];
export const BORE_Y = manifest.boreY;
export const GAS_Y = manifest.gasY;

const urls = import.meta.glob('./assets/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export function assetUrl(file: string): string {
  const url = urls[`./assets/${file}`];
  if (!url) throw new Error(`Trūkst detaļas attēla: ${file}`);
  return url;
}

export const assetFiles = Object.keys(urls).map((path) => path.split('/').pop() ?? path);

export type PartId =
  | 'receiver' | 'rail' | 'barrel' | 'magCatch' | 'magazine'
  | 'sling' | 'stock' | 'pinRear' | 'pinCentre' | 'grip' | 'recoil' | 'carrier'
  | 'magwell' | 'pinFront' | 'handguard' | 'opRod' | 'piston' | 'flashHider'
  | 'retainer' | 'firingPin' | 'camPin' | 'boltHead';

const centre = (name: string): [number, number] => {
  const s = sprites[name];
  return [s.x + s.w / 2, s.y + s.h / 2];
};

type G36Part = PartDef & { id: PartId };

export const parts: G36Part[] = [
  { id: 'stock', layer: 'back', sprites: ['stock'], pivot: sprites.stock.pivot as [number, number], kind: 'stock' },
  { id: 'barrel', layer: 'inner', sprites: ['barrel'], pivot: centre('barrel') },
  { id: 'flashHider', layer: 'inner', sprites: ['flash-hider'], pivot: centre('flash-hider'), kind: 'flash' },
  { id: 'piston', layer: 'inner', sprites: ['piston'], pivot: [92, GAS_Y] },
  { id: 'opRod', layer: 'inner', sprites: ['operating-rod', 'operating-spring'], pivot: [190, GAS_Y], kind: 'oprod' },
  { id: 'magazine', layer: 'inner', sprites: ['magazine'], pivot: centre('magazine') },
  { id: 'recoil', layer: 'inner', sprites: ['recoil-spring'], pivot: [300, 240] },
  { id: 'carrier', layer: 'inner', sprites: ['bolt-carrier'], pivot: centre('bolt-carrier'), xray: 'carrier' },
  { id: 'firingPin', layer: 'inner', sprites: ['firing-pin'], pivot: centre('firing-pin'), parent: 'carrier' },
  { id: 'boltHead', layer: 'inner', sprites: ['bolt-head'], pivot: centre('bolt-head'), parent: 'carrier' },
  { id: 'camPin', layer: 'inner', sprites: [], pivot: [0, 0], kind: 'pin', parent: 'carrier', above: true,
    pin: { side: 'cam-pin', end: 'cam-pin-head', hole: holes.cam } },
  { id: 'retainer', layer: 'inner', sprites: [], pivot: [0, 0], kind: 'pin', parent: 'carrier', above: true,
    pin: { side: 'retainer', end: 'retainer-head', hole: holes.retainer } },
  { id: 'magwell', layer: 'under', sprites: ['magwell'], pivot: [271, 300] },
  { id: 'magCatch', layer: 'under', sprites: ['mag-catch'], pivot: [358, 294], kind: 'catch' },
  { id: 'grip', layer: 'under', sprites: ['grip'], pivot: centre('grip') },
  { id: 'receiver', layer: 'shell', sprites: ['receiver'], pivot: centre('receiver'), xray: 'receiver' },
  { id: 'handguard', layer: 'over', sprites: ['handguard'], pivot: centre('handguard') },
  { id: 'rail', layer: 'over', sprites: ['rail'], pivot: centre('rail') },
  { id: 'pinRear', layer: 'over', sprites: [], pivot: [0, 0], kind: 'pin', pin: { side: 'pin', end: 'pin-end', hole: holes.rear } },
  { id: 'pinCentre', layer: 'over', sprites: [], pivot: [0, 0], kind: 'pin', pin: { side: 'pin', end: 'pin-end', hole: holes.centre } },
  { id: 'pinFront', layer: 'over', sprites: [], pivot: [0, 0], kind: 'pin', pin: { side: 'pin', end: 'pin-end', hole: holes.front } },
  { id: 'sling', layer: 'sling', sprites: [], pivot: [0, 0], kind: 'sling' },
];

export const partById = Object.fromEntries(parts.map((part) => [part.id, part])) as Record<PartId, G36Part>;

// The sling is drawn as a textured strap along two cubic Bézier segments (7 control points). It is
// hooked to the front swivel under the handguard and to the sling loop at the rear of the receiver.
export const SLING = {
  on: [[56, 298], [64, 430], [160, 522], [300, 526], [420, 530], [488, 440], [482, 274]] as [number, number][],
  mat: [[-40, 846], [150, 842], [360, 836], [468, 856], [520, 882], [280, 884], [60, 878]] as [number, number][],
};
