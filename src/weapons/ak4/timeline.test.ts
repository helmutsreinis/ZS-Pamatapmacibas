import { describe, expect, it } from 'vitest';
import { apply, poseMatrix } from '../../scene/math';
import { REST, posesAt, type Pose } from '../../scene/timeline';
import { steps } from './content';
import { assetFiles, holes, partById, parts, sprites } from './parts';
import { MAT, TRAY, check, disassembly } from './timeline';

const SEGMENTS = disassembly.length;
const close = (a: Pose, b: Pose) => (Object.keys(a) as (keyof Pose)[]).every((key) => Math.abs(a[key] - b[key]) < 1e-6);
const at = (time: number) => posesAt(disassembly, time);

describe('AK-4 disassembly timeline', () => {
  it('has the safety check followed by one segment per course step, in the course order', () => {
    expect(SEGMENTS).toBe(steps.length + 1);
    expect(disassembly[0].kind).toBe('prep');
    expect(disassembly.slice(1).map((segment) => segment.id)).toEqual(steps.map((step) => step.id));
    expect(check.kind).toBe('check');
  });

  it('only animates parts that exist, and every part on the mat is carried there exactly once', () => {
    const moved = new Map<string, string[]>();
    for (const segment of disassembly) {
      for (const track of segment.tracks) {
        expect(partById[track.part as keyof typeof partById], track.part).toBeDefined();
        const lifts = track.keys.some((key) => key.pose.lift === 1) && !track.part.startsWith('pin');
        if (lifts) moved.set(track.part, [...(moved.get(track.part) ?? []), segment.id]);
      }
    }
    // The magazine is lifted in the safety check and stays on the mat.
    for (const id of Object.keys(TRAY)) expect(moved.get(id)?.length, id).toBeGreaterThanOrEqual(1);
    for (const [id, segments] of moved) expect(new Set(segments).size, `${id}: ${segments.join(', ')}`).toBe(segments.length);
  });

  it('keeps every pose continuous from one segment to the next', () => {
    for (let index = 1; index < SEGMENTS; index += 1) {
      const end = at(index);
      const start = at(index + 1e-9);
      for (const part of parts) expect(close(end.get(part.id) ?? REST, start.get(part.id) ?? REST), `${part.id} at ${index}`).toBe(true);
    }
  });

  it('ends with every removed part on its mat position inside the mat, and the receiver in place', () => {
    const end = at(SEGMENTS);
    for (const id of Object.keys(TRAY)) {
      expect(end.get(id)?.s ?? 1, id).toBeCloseTo(1);
      const target = TRAY[id as keyof typeof TRAY];
      expect(target[0], id).toBeGreaterThanOrEqual(MAT.x);
      expect(target[1], id).toBeGreaterThanOrEqual(MAT.y);
    }
    for (const id of ['receiver', 'barrel']) expect(end.get(id), id).toBeUndefined();
  });

  it('stores the stock pins in the hollow rivets and carries them with the stock', () => {
    const end = at(SEGMENTS);
    const stock = end.get('stock')!;
    const [px, py] = partById.stock.pivot;
    for (const [pin, hole, rivet] of [['pinStockA', holes.stockA, holes.rivetA], ['pinStockB', holes.stockB, holes.rivetB]] as const) {
      const pose = end.get(pin)!;
      expect(pose.z, pin).toBeCloseTo(0);
      const [x, y] = apply(poseMatrix(stock.x, stock.y, stock.r, stock.s, stock.s, px, py), rivet[0], rivet[1]);
      expect(hole[0] + pose.x, pin).toBeCloseTo(x, 3);
      expect(hole[1] + pose.y, pin).toBeCloseTo(y, 3);
    }
    // The grip and handguard pins are back in a hole, not lying loose.
    expect(end.get('pinGrip')?.z).toBeCloseTo(0);
    expect(end.get('pinHandguard')?.z).toBeCloseTo(0);
  });

  it('starts from the assembled rifle and the function check leaves the selector on S', () => {
    for (const [id, pose] of at(0)) expect(close(pose, REST), id).toBe(true);
    const selector = check.tracks.find((track) => track.part === 'selector');
    expect(selector?.keys.at(-1)?.pose.r).toBeCloseTo(0);
    const carrier = check.tracks.find((track) => track.part === 'carrier');
    expect(carrier?.keys.at(-1)?.pose.x).toBeCloseTo(0);
  });
});

describe('AK-4 part images', () => {
  it('has an image file for every sprite a part draws, with its shadow and glow', () => {
    const files = new Set(assetFiles);
    const names = new Set(parts.flatMap((part) => [...part.sprites, ...(part.pin ? [part.pin.side, part.pin.end] : [])]));
    for (const name of names) {
      expect(sprites[name], name).toBeDefined();
      expect(files.has(sprites[name].file), sprites[name].file).toBe(true);
    }
    for (const part of parts) {
      for (const name of part.sprites) {
        expect(files.has(sprites[name].file.replace('.png', '-shadow.png')), `${name} shadow`).toBe(true);
        expect(files.has(sprites[name].file.replace('.png', '-glow.png')), `${name} glow`).toBe(true);
      }
    }
    expect(files.has('mat-texture.png')).toBe(true);
  });
});
