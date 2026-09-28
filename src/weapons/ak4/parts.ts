import manifest from './parts.json';
import type { PartDef, Sprite } from '../../scene/model';

/**
 * AK-4 (HK G3) parts. World units are pixels of the picture of the assembled rifle in the
 * source photo (about 0.8 mm); every part is drawn where it sits in the assembled rifle,
 * left side view, muzzle to the left.
 */
export const sprites = manifest.sprites as Record<string, Sprite>;
export const holes = manifest.holes as Record<'stockA' | 'stockB' | 'grip' | 'handguard' | 'rivetA' | 'rivetB', [number, number]>;
const pivots = manifest.pivots as Record<'grip' | 'handguard' | 'selector' | 'catch', [number, number]>;
export const BORE_Y = manifest.boreY;
export const TUBE_Y = manifest.tubeY;

const urls = import.meta.glob('./assets/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export function assetUrl(file: string): string {
  const url = urls[`./assets/${file}`];
  if (!url) throw new Error(`Trūkst detaļas attēla: ${file}`);
  return url;
}

export const assetFiles = Object.keys(urls).map((path) => path.split('/').pop() ?? path);

export type PartId =
  | 'stock' | 'barrel' | 'magazine' | 'carrier' | 'boltHead' | 'lockingPiece' | 'firingPin' | 'firingSpring'
  | 'handguard' | 'grip' | 'trigger' | 'selector' | 'receiver' | 'cockingHandle' | 'magCatch'
  | 'pinStockA' | 'pinStockB' | 'pinGrip' | 'pinHandguard';

const centre = (name: string): [number, number] => {
  const s = sprites[name];
  return [s.x + s.w / 2, s.y + s.h / 2];
};

type AkPart = PartDef & { id: PartId };

export const parts: AkPart[] = [
  // Behind the receiver: the stock's end piece and recoil spring guide go into it.
  { id: 'stock', layer: 'back', sprites: ['stock'], pivot: centre('stock') },
  // Inside or under the receiver.
  { id: 'barrel', layer: 'inner', sprites: ['barrel'], pivot: centre('barrel') },
  { id: 'magazine', layer: 'inner', sprites: ['magazine'], pivot: [674, 200] },
  { id: 'carrier', layer: 'inner', sprites: ['carrier'], pivot: centre('carrier'), xray: 'carrier' },
  { id: 'firingPin', layer: 'inner', sprites: ['firing-pin'], pivot: centre('firing-pin'), parent: 'carrier' },
  { id: 'firingSpring', layer: 'inner', sprites: ['firing-spring'], pivot: centre('firing-spring'), parent: 'carrier' },
  { id: 'lockingPiece', layer: 'inner', sprites: ['locking-piece'], pivot: centre('locking-piece'), parent: 'carrier' },
  { id: 'boltHead', layer: 'inner', sprites: ['bolt-head'], pivot: centre('bolt-head'), parent: 'carrier', kind: 'spin' },
  { id: 'handguard', layer: 'under', sprites: ['handguard'], pivot: pivots.handguard },
  { id: 'grip', layer: 'under', sprites: ['grip'], pivot: pivots.grip, xray: 'grip' },
  { id: 'trigger', layer: 'under', sprites: ['trigger'], pivot: centre('trigger'), parent: 'grip' },
  { id: 'selector', layer: 'under', sprites: ['selector'], pivot: pivots.selector, parent: 'grip', above: true },
  { id: 'receiver', layer: 'shell', sprites: ['receiver'], pivot: centre('receiver'), xray: 'receiver' },
  { id: 'cockingHandle', layer: 'shell', sprites: ['cocking-handle'], pivot: centre('cocking-handle'), parent: 'receiver', above: true },
  { id: 'magCatch', layer: 'shell', sprites: ['mag-catch'], pivot: pivots.catch, parent: 'receiver', above: true, kind: 'catch' },
  // Locking pins, heads on the left side (towards the viewer).
  { id: 'pinStockA', layer: 'over', sprites: [], pivot: [0, 0], kind: 'pin', pin: { side: 'pin-long-a', end: 'pin-long-end', hole: holes.stockA } },
  { id: 'pinStockB', layer: 'over', sprites: [], pivot: [0, 0], kind: 'pin', pin: { side: 'pin-long-b', end: 'pin-long-end', hole: holes.stockB } },
  { id: 'pinGrip', layer: 'over', sprites: [], pivot: [0, 0], kind: 'pin', pin: { side: 'pin-short-a', end: 'pin-short-end', hole: holes.grip } },
  { id: 'pinHandguard', layer: 'over', sprites: [], pivot: [0, 0], kind: 'pin', pin: { side: 'pin-short-b', end: 'pin-short-end', hole: holes.handguard } },
];

export const partById = Object.fromEntries(parts.map((part) => [part.id, part])) as Record<PartId, AkPart>;
