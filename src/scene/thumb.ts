import type { Box } from './math';
import { spriteUrl, type SceneModel } from './model';

type Placed = { name: string; x: number; y: number };

/** Sprites that make up a part on its own: pins lie flat, parents include their children. */
function placedSprites(model: SceneModel, id: string, row: number): Placed[] {
  const part = model.partById[id];
  if (part.kind === 'pin' && part.pin) return [{ name: part.pin.side, x: 0, y: row * 16 }];
  const children = model.parts.filter((child) => child.parent === id);
  const names = [
    ...children.filter((child) => !child.above).flatMap((child) => child.sprites),
    ...part.sprites,
    ...children.filter((child) => child.above && !child.pin).flatMap((child) => child.sprites),
    ...children.filter((child) => child.above && child.pin).map((child) => child.pin!.end),
  ];
  return names.map((name) => ({ name, x: 0, y: 0 }));
}

function sling(label: string): string {
  const d = 'M4 40 C60 10 150 70 230 38 S330 20 356 44';
  return `<svg viewBox="-10 0 380 84" class="part-thumb-svg" role="img" aria-label="${label}">
    <path d="${d}" fill="none" stroke="#161a15" stroke-width="16" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="#3a4230" stroke-width="12" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="#6d7659" stroke-width="1.2" stroke-dasharray="4 3" opacity=".8"/>
    <g class="thumb-hook" transform="translate(4 40) rotate(150)"><rect x="-2" y="-6" width="9" height="12" rx="2"/><path d="M7 -4h9a4 4 0 0 1 0 8h-9"/></g>
    <g class="thumb-hook" transform="translate(356 44) rotate(40)"><rect x="-2" y="-6" width="9" height="12" rx="2"/><path d="M7 -4h9a4 4 0 0 1 0 8h-9"/></g>
  </svg>`;
}

/** Inline SVG showing the real images of some parts on their own, cropped with some margin. */
export function partThumb(model: SceneModel, ids: string[], label: string): string {
  if (ids.some((id) => model.partById[id]?.kind === 'sling')) return sling(label);
  const placed = ids.flatMap((id, row) => placedSprites(model, id, row));
  if (!placed.length) return '';
  const boxes: Box[] = placed.map((p) => {
    const s = model.sprites[p.name];
    return { x: s.x + p.x, y: s.y + p.y, w: s.w, h: s.h };
  });
  const x = Math.min(...boxes.map((b) => b.x)), y = Math.min(...boxes.map((b) => b.y));
  const w = Math.max(...boxes.map((b) => b.x + b.w)) - x, h = Math.max(...boxes.map((b) => b.y + b.h)) - y;
  // Small parts get a minimum frame so they are not blown up past their image resolution.
  const frameW = Math.max(w * 1.18, 54), frameH = Math.max(h * 1.3, frameW * 0.42);
  const vx = x + w / 2 - frameW / 2, vy = y + h / 2 - frameH / 2;
  const images = placed.map((p) => {
    const s = model.sprites[p.name];
    return `<image href="${spriteUrl(model, p.name)}" x="${s.x + p.x}" y="${s.y + p.y}" width="${s.w}" height="${s.h}" preserveAspectRatio="none"/>`;
  }).join('');
  return `<svg viewBox="${vx.toFixed(1)} ${vy.toFixed(1)} ${frameW.toFixed(1)} ${frameH.toFixed(1)}" class="part-thumb-svg" role="img" aria-label="${label}">${images}</svg>`;
}
