import { describe, expect, it } from 'vitest';
import { REST, posesAt, type Pose } from '../../scene/timeline';
import { steps } from './content';
import { assetFiles, partById, parts, sprites } from './parts';
import { TRAY, check, disassembly } from './timeline';

const SEGMENTS = disassembly.length;
const close = (a: Pose, b: Pose) => (Object.keys(a) as (keyof Pose)[]).every((key) => Math.abs(a[key] - b[key]) < 1e-6);
const at = (time: number) => posesAt(disassembly, time);

describe('G36C disassembly timeline', () => {
  it('has the safety check followed by one segment per course step, in the course order', () => {
    expect(SEGMENTS).toBe(steps.length + 1);
    expect(disassembly[0].kind).toBe('prep');
    expect(disassembly.slice(1).map((segment) => segment.id)).toEqual(steps.map((step) => step.id));
    expect(check.kind).toBe('check');
  });

  it('only animates parts that exist, and every part is removed exactly once', () => {
    const moved = new Map<string, string[]>();
    for (const segment of disassembly) {
      for (const track of segment.tracks) {
        expect(partById[track.part as keyof typeof partById], track.part).toBeDefined();
        if (track.keys.some((key) => key.pose.lift === 1)) moved.set(track.part, [...(moved.get(track.part) ?? []), segment.id]);
      }
    }
    for (const id of Object.keys(TRAY)) expect(moved.get(id), id).toHaveLength(1);
  });

  it('keeps every pose continuous from one segment to the next', () => {
    for (let index = 1; index < SEGMENTS; index += 1) {
      const end = at(index);
      const start = at(index + 1e-9);
      for (const part of parts) expect(close(end.get(part.id) ?? REST, start.get(part.id) ?? REST), `${part.id} at ${index}`).toBe(true);
    }
  });

  it('ends with every removed part lying on its mat position and the stock folded', () => {
    const end = at(SEGMENTS);
    for (const id of Object.keys(TRAY)) {
      expect(end.get(id)?.lift, id).toBe(1);
      expect(end.get(id)?.s, id).toBeCloseTo(1);
    }
    expect(end.get('stock')?.fold).toBe(180);
    expect(end.get('sling')?.v).toBe(1);
    // The body of the rifle never moves.
    for (const id of ['receiver', 'rail', 'barrel']) expect(end.get(id)).toBeUndefined();
  });

  it('starts from the assembled rifle and the function check returns the carrier home', () => {
    for (const [id, pose] of at(0)) expect(close(pose, REST), id).toBe(true);
    const carrier = check.tracks.find((track) => track.part === 'carrier');
    expect(carrier?.keys.at(-1)?.pose.x).toBeCloseTo(0);
  });
});

describe('G36C part images', () => {
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
