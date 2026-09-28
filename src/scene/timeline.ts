import { lerp, type Ease } from './math';
import { partBox, type PartDef, type SceneModel } from './model';

/**
 * Pose of a part relative to where it sits in the assembled weapon.
 * x, y: offset in world units; r: rotation in degrees about the part pivot; s: scale;
 * o: opacity; z: how far a pin has been pushed out (0..1); v: pin turned from end-on (0)
 * to lying flat (1), or sling laid out (0..1); c: spring compression; spin: turns when
 * unscrewing; fold: stock fold angle in degrees; lift: 1 while carried to or lying on the
 * mat; press: catch or hook pressed (0..1).
 */
export type Pose = { x: number; y: number; r: number; s: number; o: number; z: number; v: number; c: number; spin: number; fold: number; lift: number; press: number };

export const REST: Pose = { x: 0, y: 0, r: 0, s: 1, o: 1, z: 0, v: 0, c: 0, spin: 0, fold: 0, lift: 0, press: 0 };

export type Key = { t: number; pose: Pose; ease: Ease };
export type Track = { part: string; keys: Key[] };
/** Direction marks drawn over the scene; `out` = towards the viewer (⊙), `in` = away (⊗). */
export type Arrow = { kind: 'line' | 'arc' | 'out' | 'in'; points: [number, number][]; t: [number, number]; on?: string };
/** A removed pin put into storage hole `hole` of the stash close-up during t (segment progress). */
export type Stow = { part: string; hole: number; t: [number, number] };

export type Segment = {
  id: string;
  kind: 'prep' | 'step' | 'check';
  duration: number;
  tracks: Track[];
  arrows: Arrow[];
  stow: Stow[];
  /** X-ray windows (segment progress) per key, see PartDef.xray. */
  xray: Partial<Record<string, [number, number]>>;
  focus: string[];
};

/** What a timeline script needs to know about the weapon while it is being built. */
export type TimelineContext = Pick<SceneModel, 'sprites' | 'sling' | 'tray'> & { parts: PartDef[]; partById: Record<string, PartDef> };

export class SegmentBuilder {
  readonly seg: Segment;

  constructor(private readonly ctx: TimelineContext, private readonly state: Map<string, Pose>, seg: Segment) {
    this.seg = seg;
  }

  cur(part: string): Pose {
    return this.state.get(part) ?? REST;
  }

  private track(part: string): Track {
    if (!this.ctx.partById[part]) throw new Error(`Nezināma detaļa animācijā: ${part}`);
    let track = this.seg.tracks.find((candidate) => candidate.part === part);
    if (!track) {
      track = { part, keys: [{ t: 0, pose: { ...this.cur(part) }, ease: 'linear' }] };
      this.seg.tracks.push(track);
    }
    return track;
  }

  to(part: string, t: number, changes: Partial<Pose>, ease: Ease = 'inOut'): this {
    const track = this.track(part);
    const pose = { ...this.cur(part), ...changes };
    track.keys.push({ t, pose, ease });
    this.state.set(part, pose);
    return this;
  }

  by(part: string, t: number, delta: { x?: number; y?: number; r?: number }, ease: Ease = 'inOut'): this {
    const pose = this.cur(part);
    return this.to(part, t, { x: pose.x + (delta.x ?? 0), y: pose.y + (delta.y ?? 0), r: pose.r + (delta.r ?? 0) }, ease);
  }

  hold(part: string, t: number): this {
    return this.to(part, t, {}, 'linear');
  }

  /** Carry a part in a shallow arc to its place on the mat. */
  tray(part: string, t0: number, t1: number, extra: Partial<Pose> = {}): this {
    const target = trayOffset(this.ctx, part);
    this.to(part, t0, { lift: 1 }, 'linear');
    const from = this.cur(part);
    const tm = lerp(t0, t1, 0.5);
    const isPin = this.ctx.partById[part].kind === 'pin';
    this.to(part, tm, {
      x: lerp(from.x, target[0], 0.5), y: lerp(from.y, target[1], 0.45) - 26,
      s: 1.05, v: isPin ? 0.8 : from.v, r: lerp(from.r, extra.r ?? 0, 0.6),
    }, 'inOut');
    return this.to(part, t1, { x: target[0], y: target[1], s: 1, v: isPin ? 1 : from.v, r: 0, ...extra }, 'inOut');
  }

  /** Direction mark; `on` makes the points relative to a part (they move with it). */
  arrow(kind: Arrow['kind'], points: [number, number][], t: [number, number], on?: string): this {
    this.seg.arrows.push({ kind, points, t, on });
    return this;
  }

  /** Show a removed pin going into a storage hole of the stash close-up (the recommended place). */
  stow(part: string, hole: number, t: [number, number]): this {
    if (this.ctx.partById[part]?.kind !== 'pin') throw new Error(`Uzglabāt var tikai tapas: ${part}`);
    this.seg.stow.push({ part, hole, t });
    return this;
  }
}

/** Pose offset that puts a part on its mat position. Child parts are relative to their parent. */
export function trayOffset(ctx: TimelineContext, part: string): [number, number] {
  const def = ctx.partById[part];
  const target = ctx.tray[part];
  if (!target) throw new Error(`Nav paredzēta vieta uz paklāja: ${part}`);
  const box = partBox(ctx, def);
  const origin = def.kind === 'pin' && def.pin ? def.pin.hole : [box.x, box.y];
  let dx = target[0] - origin[0], dy = target[1] - origin[1];
  if (def.parent) {
    const parent = trayOffset(ctx, def.parent);
    dx -= parent[0];
    dy -= parent[1];
  }
  return [dx, dy];
}

type SegmentMeta = { id: string; kind: Segment['kind']; duration: number; focus: string[]; xray?: Segment['xray'] };

/** Build a disassembly timeline segment by segment; every segment starts where the last ended. */
export function timeline(ctx: TimelineContext) {
  const state = new Map<string, Pose>(ctx.parts.map((part) => [part.id, { ...REST }]));
  const segments: Segment[] = [];
  return {
    segments,
    segment(meta: SegmentMeta, body: (b: SegmentBuilder) => void): void {
      const builder = new SegmentBuilder(ctx, state, { ...meta, xray: meta.xray ?? {}, tracks: [], arrows: [], stow: [] });
      body(builder);
      segments.push(builder.seg);
    },
    /** A segment played on the assembled weapon, independent of the disassembly state. */
    standalone(meta: SegmentMeta, body: (b: SegmentBuilder) => void): Segment {
      const assembled = new Map<string, Pose>(ctx.parts.map((part) => [part.id, { ...REST }]));
      const builder = new SegmentBuilder(ctx, assembled, { ...meta, xray: meta.xray ?? {}, tracks: [], arrows: [], stow: [] });
      body(builder);
      return builder.seg;
    },
  };
}

function easeKey(kind: Ease, t: number): number {
  switch (kind) {
    case 'in': return t * t * t;
    case 'out': return 1 - (1 - t) ** 3;
    case 'inOut': return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    default: return t;
  }
}

export function evalTrack(track: Track, u: number): Pose {
  const keys = track.keys;
  if (u <= keys[0].t) return keys[0].pose;
  for (let i = 1; i < keys.length; i += 1) {
    const a = keys[i - 1], b = keys[i];
    if (u <= b.t) {
      const span = b.t - a.t;
      const raw = span <= 0 ? 1 : (u - a.t) / span;
      const e = easeKey(b.ease, raw);
      const out = { ...a.pose };
      for (const field of Object.keys(out) as (keyof Pose)[]) out[field] = lerp(a.pose[field], b.pose[field], e);
      // Layer changes are instant: a part is "lifted" from the key that lifts it.
      out.lift = raw >= 1 ? b.pose.lift : a.pose.lift;
      return out;
    }
  }
  return keys[keys.length - 1].pose;
}

/**
 * Pose of every part at disassembly time D (0 = assembled, k = after segment k).
 * Parts not touched yet stay at REST (absent from the map or explicitly REST).
 */
export function posesAt(segments: Segment[], time: number): Map<string, Pose> {
  const count = segments.length;
  const d = Math.min(Math.max(time, 0), count);
  const current = Math.min(Math.max(Math.ceil(d), 1), count);
  const u = d - (current - 1);
  const poses = new Map<string, Pose>();
  for (let index = 0; index < current; index += 1) {
    const local = index === current - 1 ? u : 1;
    for (const track of segments[index].tracks) poses.set(track.part, evalTrack(track, local));
  }
  return poses;
}
