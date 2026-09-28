import { apply, clamp, ease, fitAspect, lerp, lerpBox, matrixAttr, multiply, poseMatrix, transformBox, unionBox, window01, type Box, type Matrix } from './math';
import { partBox, spriteUrl, type LayerId, type PartDef, type SceneModel } from './model';
import { REST, evalTrack, posesAt, type Arrow, type Pose, type Segment } from './timeline';

const NS = 'http://www.w3.org/2000/svg';
const CAMERA_SAMPLES = 24;
/** Narrowest shot in world units, so photos are never enlarged far past their resolution. */
const CAMERA_MIN = 480;
/** How far a part's body fades in x-ray (the carrier stays a little more visible). */
const XRAY_FADE: Record<string, number> = { carrier: 0.68 };

export type SceneMode = 'disassembly' | 'assembly';
export type CameraMode = 'auto' | 'overview' | 'rifle' | 'segment';

export type SceneOptions = {
  uid: string;
  /** Show the part outlines and step numbers printed on the mat. */
  board?: boolean;
  /** Tag printed next to each part's mat position. */
  boardTags?: Record<string, string>;
  camera?: CameraMode;
  /** Direction arrows (off for static pictures). */
  arrows?: boolean;
  label?: (info: ActiveSegment) => { title: string; hint?: string } | null;
  ariaLabel?: string;
};

/** What is happening at a given moment of either timeline. */
export type ActiveSegment = {
  /** Index in the playback direction, 0..length-1. */
  index: number;
  /** Progress through that segment in the playback direction, 0..1. */
  progress: number;
  segment: Segment;
  /** Disassembly-direction progress used for poses. */
  u: number;
  time: number;
  mode: SceneMode;
};

/** Segments on either timeline: disassembly = safety check + steps; assembly = steps + function check. */
export const timelineLength = (model: SceneModel): number => model.disassembly.length;

export function activeSegment(model: SceneModel, mode: SceneMode, time: number): ActiveSegment {
  const count = model.disassembly.length;
  const t = clamp(time, 0, count);
  const index = Math.min(Math.max(Math.ceil(t) - 1, 0), count - 1);
  const progress = t - index;
  if (mode === 'disassembly') return { index, progress, segment: model.disassembly[index], u: progress, time: t, mode };
  if (index === count - 1) return { index, progress, segment: model.check, u: progress, time: t, mode };
  // Assembly plays the disassembly steps backwards, last step first.
  return { index, progress, segment: model.disassembly[count - 1 - index], u: 1 - progress, time: t, mode };
}

/** Disassembly time for the part poses at a given moment of either timeline. */
function disassemblyTime(model: SceneModel, mode: SceneMode, time: number): number {
  const count = model.disassembly.length;
  const t = clamp(time, 0, count);
  if (mode === 'disassembly') return t;
  return t >= count - 1 ? 1 : count - t;
}

type PartView = {
  def: PartDef;
  g: SVGGElement;
  home: Comment;
  shadow?: SVGImageElement;
  glow?: SVGImageElement;
  body?: SVGImageElement;
  lifted: boolean;
  // pins
  pinBody?: SVGGElement;
  pinEnd?: SVGImageElement;
  pinClip?: SVGRectElement;
  pinRing?: SVGCircleElement;
  pinLength?: number;
  // special parts
  spring?: SVGImageElement;
  shade?: SVGImageElement;
  bands?: SVGRectElement[];
  sling?: { edge: SVGPathElement; strap: SVGPathElement; stitch: SVGPathElement; hooks: SVGGElement[] };
};

type ArrowView = { arrow: Arrow; segment: Segment; g: SVGGElement; path: SVGPathElement; head: SVGPathElement; mark?: SVGGElement };

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}, parent?: Element): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  parent?.appendChild(node);
  return node;
}

function image(model: SceneModel, name: string, parent: Element, extra: Record<string, string | number> = {}, variant = ''): SVGImageElement {
  const sprite = model.sprites[name];
  const pad = variant ? sprite.pad ?? 0 : 0;
  return el('image', {
    href: spriteUrl(model, name, variant),
    x: sprite.x - pad, y: sprite.y - pad, width: sprite.w + pad * 2, height: sprite.h + pad * 2,
    preserveAspectRatio: 'none', ...extra,
  }, parent);
}

export class Scene {
  readonly root: HTMLDivElement;
  readonly svg: SVGSVGElement;
  private readonly label: HTMLDivElement;
  private readonly views = new Map<string, PartView>();
  private readonly layers = new Map<LayerId | 'lifted', SVGGElement>();
  private readonly arrows: ArrowView[] = [];
  private readonly camPaths: Box[][] = [];
  private readonly subjects: string[][][] = [];
  private readonly resize: ResizeObserver;
  private aspect = 4 / 3;
  private width = 800;
  private cameraMode: CameraMode;
  private mode: SceneMode = 'disassembly';
  private time = 0;
  private highlightOverride: string[] | null = null;
  private cameraIndex = 0;
  private labelWidth = 0;

  constructor(host: HTMLElement, private readonly model: SceneModel, private readonly options: SceneOptions) {
    this.cameraMode = options.camera ?? 'auto';
    this.root = document.createElement('div');
    this.root.className = 'scene';
    this.svg = el('svg', { class: 'scene-svg', role: 'img', 'aria-label': options.ariaLabel ?? 'Ieroča fotoattēls' });
    this.root.appendChild(this.svg);
    this.label = document.createElement('div');
    this.label.className = 'scene-label';
    this.label.hidden = true;
    this.label.setAttribute('aria-hidden', 'true');
    this.root.appendChild(this.label);
    host.replaceChildren(this.root);
    this.build();
    this.computeCameras();
    this.resize = new ResizeObserver(() => this.measure());
    this.resize.observe(this.root);
    this.measure();
  }

  destroy(): void {
    this.resize.disconnect();
    this.root.remove();
  }

  setCamera(mode: CameraMode): void {
    this.cameraMode = mode;
    this.render();
  }

  /** Hold the camera on the framing used for one disassembly segment (static pictures). */
  frameSegment(index: number): void {
    this.cameraMode = 'segment';
    this.cameraIndex = Math.min(Math.max(index, 0), this.model.disassembly.length - 1);
    this.render();
  }

  /** Force highlighted parts (static pictures, quiz); null returns to automatic. */
  setHighlight(ids: string[] | null): void {
    this.highlightOverride = ids;
    this.render();
  }

  show(mode: SceneMode, time: number): void {
    this.mode = mode;
    this.time = time;
    this.render();
  }

  private measure(): void {
    const rect = this.root.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.width = rect.width;
      this.aspect = rect.width / rect.height;
    }
    this.render();
  }

  // ------------------------------------------------------------------ construction
  private build(): void {
    const { uid } = this.options;
    const { model } = this;
    const MAT = model.mat;
    const defs = el('defs', {}, this.svg);
    const pattern = el('pattern', { id: `mat-${uid}`, patternUnits: 'userSpaceOnUse', width: 256, height: 256 }, defs);
    el('image', { href: model.matTexture, width: 256, height: 256 }, pattern);
    const arrowGrad = el('linearGradient', { id: `band-${uid}`, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0 }, arrowGrad);
    el('stop', { offset: 0.5, 'stop-color': '#fff', 'stop-opacity': 0.55 }, arrowGrad);
    el('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 }, arrowGrad);
    const silhouette = el('filter', { id: `silhouette-${uid}`, 'color-interpolation-filters': 'sRGB' }, defs);
    el('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.02  0 0 0 0 0.03  0 0 0 0 0.02  0 0 0 1 0' }, silhouette);

    const bench = el('g', { class: 'bench' }, this.svg);
    const around = unionBox([model.body, MAT]);
    const benchBox = { x: around.x - 1200, y: around.y - 900, width: around.w + 2400, height: around.h + 1800 };
    el('rect', { ...benchBox, fill: `url(#mat-${uid})` }, bench);
    el('rect', { ...benchBox, class: 'bench-tint' }, bench);
    const mat = el('g', { class: 'mat' }, bench);
    el('rect', { x: MAT.x, y: MAT.y, width: MAT.w, height: MAT.h, rx: 14, class: 'mat-surface', fill: `url(#mat-${uid})` }, mat);
    el('rect', { x: MAT.x, y: MAT.y, width: MAT.w, height: MAT.h, rx: 14, class: 'mat-tint' }, mat);
    const grid = el('g', { class: 'mat-grid' }, mat);
    for (let x = MAT.x + 50; x < MAT.x + MAT.w; x += 50) el('line', { x1: x, y1: MAT.y + 6, x2: x, y2: MAT.y + MAT.h - 6 }, grid);
    for (let y = MAT.y + 50; y < MAT.y + MAT.h; y += 50) el('line', { x1: MAT.x + 6, y1: y, x2: MAT.x + MAT.w - 6, y2: y }, grid);
    el('rect', { x: MAT.x + 6, y: MAT.y + 6, width: MAT.w - 12, height: MAT.h - 12, rx: 10, class: 'mat-border' }, mat);
    if (this.options.board) this.buildBoard(mat);

    for (const layer of ['back', 'inner', 'under', 'shell', 'over', 'sling', 'lifted'] as const) {
      this.layers.set(layer, el('g', { class: `layer layer-${layer}` }, this.svg));
    }
    for (const def of model.parts.filter((part) => !part.parent)) this.buildPart(def, this.layers.get(def.layer)!);

    const fx = el('g', { class: 'fx' }, this.svg);
    for (const segment of [...model.disassembly, model.check]) {
      for (const arrow of segment.arrows) {
        const g = el('g', { class: `arrow arrow-${arrow.kind}`, opacity: 0 }, fx);
        const path = el('path', { class: 'arrow-line' }, g);
        const head = el('path', { class: 'arrow-head' }, g);
        let mark: SVGGElement | undefined;
        if (arrow.kind === 'out' || arrow.kind === 'in') {
          mark = el('g', { class: 'arrow-mark' }, g);
          el('circle', { r: 1, class: 'mark-ring' }, mark);
          el('path', { class: 'mark-sign' }, mark);
        }
        this.arrows.push({ arrow, segment, g, path, head, mark });
      }
    }
  }

  private buildBoard(mat: SVGGElement): void {
    const { model } = this;
    const board = el('g', { class: 'mat-board' }, mat);
    for (const [id, target] of Object.entries(model.tray)) {
      const def = model.partById[id];
      if (def.kind === 'pin') {
        el('rect', { x: target[0] - 3, y: target[1] - 5, width: 50, height: 10, rx: 5, class: 'board-slot' }, board);
      } else {
        const box = partBox(model, def);
        const g = el('g', { transform: `translate(${target[0] - box.x} ${target[1] - box.y})`, class: 'board-shape' }, board);
        for (const name of def.sprites) image(model, name, g, {}, '-shadow');
      }
      const tag = this.options.boardTags?.[id];
      if (tag) {
        const text = el('text', { x: target[0] - 4, y: target[1] - (def.kind === 'pin' ? 12 : 6), class: 'board-tag' }, board);
        text.textContent = tag;
      }
    }
    const tag = this.options.boardTags?.sling;
    if (tag && model.sling) {
      const text = el('text', { x: model.sling.mat[0][0] - 4, y: model.sling.mat[0][1] - 14, class: 'board-tag' }, board);
      text.textContent = tag;
    }
  }

  private buildPart(def: PartDef, parent: SVGGElement): void {
    const home = document.createComment(def.id);
    parent.appendChild(home);
    const g = el('g', { class: `part part-${def.kind ?? 'sprite'}`, 'data-part': def.id }, parent);
    const view: PartView = { def, g, home, lifted: false };
    this.views.set(def.id, view);

    const { model } = this;
    if (def.kind === 'pin' && def.pin) {
      const side = model.sprites[def.pin.side];
      const end = model.sprites[def.pin.end];
      view.pinLength = side.length ?? side.w;
      view.pinRing = el('circle', { r: (end.w / 2) + 3.5, class: 'pin-ring', opacity: 0 }, g);
      const clipId = `clip-${def.id}-${this.options.uid}`;
      const clip = el('clipPath', { id: clipId, clipPathUnits: 'userSpaceOnUse' }, g);
      view.pinClip = el('rect', { x: -4, y: side.y - 1, width: 0, height: side.h + 2 }, clip);
      view.pinBody = el('g', { class: 'pin-body' }, g);
      el('image', { href: spriteUrl(model, def.pin.side), x: side.x, y: side.y, width: side.w, height: side.h, 'clip-path': `url(#${clipId})`, preserveAspectRatio: 'none' }, view.pinBody);
      view.pinEnd = el('image', { href: spriteUrl(model, def.pin.end), x: -end.w / 2, y: -end.h / 2, width: end.w, height: end.h, class: 'pin-end', preserveAspectRatio: 'none' }, g);
      return;
    }
    if (def.kind === 'sling') {
      const edge = el('path', { class: 'sling-edge' }, g);
      const strap = el('path', { class: 'sling-strap', stroke: `url(#mat-${this.options.uid})` }, g);
      const stitch = el('path', { class: 'sling-stitch' }, g);
      const hooks = [0, 1].map(() => {
        const hook = el('g', { class: 'sling-hook' }, g);
        el('rect', { x: -2, y: -6.5, width: 9, height: 13, rx: 2, class: 'hook-loop' }, hook);
        el('path', { d: 'M7 -4 h9 a4 4 0 0 1 0 8 h-9', class: 'hook-body' }, hook);
        el('path', { d: 'M16 -4 l-4 5', class: 'hook-gate' }, hook);
        return hook;
      });
      view.sling = { edge, strap, stitch, hooks };
      return;
    }

    for (const name of def.sprites) {
      view.shadow ??= image(model, name, g, { class: 'part-shadow', opacity: 0 }, '-shadow');
    }
    for (const name of def.sprites) {
      view.glow ??= image(model, name, g, { class: 'part-glow', opacity: 0 }, '-glow');
    }
    // Child parts ride inside their parent: most are hidden in it, `above` ones sit on its surface.
    const children = model.parts.filter((part) => part.parent === def.id);
    for (const child of children.filter((part) => !part.above)) this.buildPart(child, g as SVGGElement);
    def.sprites.forEach((name, index) => {
      const img = image(model, name, g, { class: 'part-img' });
      if (index === 0) view.body = img;
      // An operating rod's last sprite is its spring, which compresses.
      if (def.kind === 'oprod' && index === def.sprites.length - 1 && index > 0) view.spring = img;
    });
    for (const child of children.filter((part) => part.above)) this.buildPart(child, g as SVGGElement);
    if (def.kind === 'stock') {
      view.shade = image(model, def.sprites[0], g, { class: 'stock-shade', opacity: 0, filter: `url(#silhouette-${this.options.uid})` });
    }
    if (def.kind === 'flash' || def.kind === 'spin') {
      const maskId = `fh-${def.id}-${this.options.uid}`;
      const mask = el('mask', { id: maskId, maskUnits: 'userSpaceOnUse', style: 'mask-type:alpha' }, g);
      image(model, def.sprites[0], mask);
      const bands = el('g', { mask: `url(#${maskId})`, class: 'flash-bands' }, g);
      const s = model.sprites[def.sprites[0]];
      view.bands = [0, 1].map((i) => el('rect', { x: s.x, y: s.y, width: s.w, height: 7, fill: i === 0 ? `url(#band-${this.options.uid})` : '#000', opacity: 0 }, bands));
    }
  }

  // ------------------------------------------------------------------ geometry
  private localMatrix(def: PartDef, pose: Pose): Matrix {
    if (def.kind === 'pin' && def.pin) {
      return poseMatrix(def.pin.hole[0] + pose.x, def.pin.hole[1] + pose.y, pose.r, pose.s, pose.s, 0, 0);
    }
    if (def.kind === 'stock') {
      const fold = Math.cos(pose.fold * Math.PI / 180);
      return poseMatrix(pose.x, pose.y, pose.r, (Math.abs(fold) < 0.02 ? 0.02 * Math.sign(fold || 1) : fold) * pose.s, pose.s, def.pivot[0], def.pivot[1]);
    }
    if (def.kind === 'catch') {
      return poseMatrix(pose.x, pose.y, pose.r + pose.press * 9, pose.s, pose.s, def.pivot[0], def.pivot[1]);
    }
    return poseMatrix(pose.x, pose.y, pose.r, pose.s, pose.s, def.pivot[0], def.pivot[1]);
  }

  private worldMatrix(def: PartDef, poses: Map<string, Pose>): Matrix {
    const own = this.localMatrix(def, poses.get(def.id) ?? REST);
    if (!def.parent) return own;
    return multiply(this.worldMatrix(this.model.partById[def.parent], poses), own);
  }

  private worldBox(def: PartDef, poses: Map<string, Pose>): Box {
    if (def.kind === 'sling') {
      const points = this.slingPoints(poses.get('sling') ?? REST);
      return unionBox(points.map(([x, y]) => ({ x: x - 10, y: y - 10, w: 20, h: 20 })));
    }
    if (def.kind === 'pin') {
      const pose = poses.get(def.id) ?? REST;
      const view = this.views.get(def.id);
      const length = view?.pinLength ?? 40;
      const local: Box = { x: -8, y: -8, w: length * (0.4 + pose.v * 0.6) + 16, h: 16 };
      return transformBox(this.worldMatrix(def, poses), local);
    }
    return transformBox(this.worldMatrix(def, poses), partBox(this.model, def));
  }

  /** A focus part is "moving" at u when its pose changes over the next moment. */
  private moving(index: number, id: string, u: number): boolean {
    const a = posesAt(this.model.disassembly, index + clamp(u - 0.02)).get(id) ?? REST;
    const b = posesAt(this.model.disassembly, index + clamp(u + 0.05)).get(id) ?? REST;
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.r - b.r) + 30 * Math.abs(a.z - b.z) + 30 * Math.abs(a.v - b.v)
      + Math.abs(a.fold - b.fold) + Math.abs(a.c - b.c) + 20 * Math.abs(a.spin - b.spin) + 30 * Math.abs(a.press - b.press) > 0.05;
  }

  /**
   * Camera path per segment: at each sample it frames the parts that are moving then,
   * a little ahead in time, so the shot closes in on a removal and widens as the part
   * travels to the mat. Samples are smoothed so the camera glides instead of jumping.
   */
  private computeCameras(): void {
    const { model } = this;
    model.disassembly.forEach((segment, index) => {
      const raw: Box[] = [];
      const subjects: string[][] = [];
      for (let j = 0; j <= CAMERA_SAMPLES; j += 1) {
        const u = j / CAMERA_SAMPLES;
        const moving = segment.focus.filter((id) => this.moving(index, id, u));
        const active = moving.length ? moving : segment.focus;
        subjects.push(active);
        // Child parts are handled on their parent (bolt parts on the carrier): keep the parent in shot.
        const parents = active.map((id) => model.partById[id].parent).filter((id): id is string => !!id);
        const ids = [...active, ...parents];
        const boxes: Box[] = [];
        for (const du of [-0.08, 0, 0.12, 0.24]) {
          const poses = posesAt(model.disassembly, index + clamp(u + du));
          for (const id of ids) boxes.push(this.worldBox(model.partById[id], poses));
        }
        raw.push(unionBox(boxes));
      }
      const smooth = raw.map((_, j) => {
        const window = raw.slice(Math.max(0, j - 3), j + 4);
        const avg = (key: keyof Box) => window.reduce((sum, box) => sum + box[key], 0) / window.length;
        return { x: avg('x'), y: avg('y'), w: avg('w'), h: avg('h') };
      });
      this.camPaths.push(smooth);
      this.subjects.push(subjects);
    });
  }

  private pathBox(index: number, u: number): Box {
    const path = this.camPaths[index];
    const f = clamp(u) * CAMERA_SAMPLES;
    const j = Math.min(Math.floor(f), CAMERA_SAMPLES - 1);
    return lerpBox(path[j], path[j + 1], f - j);
  }

  private overview(): Box {
    return unionBox([this.model.body, this.model.mat]);
  }

  private camera(time: number): Box {
    const aspect = this.aspect;
    const count = this.model.disassembly.length;
    const fit = (box: Box, min = this.model.cameraMin ?? CAMERA_MIN) => fitAspect(box, aspect, min, 40);
    if (this.cameraMode === 'overview') return fit(this.overview(), 600);
    const whole = fit(this.model.body, 600);
    if (this.cameraMode === 'rifle') return whole;
    if (this.cameraMode === 'segment') return fit(this.pathBox(this.cameraIndex, 0.12));
    const active = activeSegment(this.model, this.mode, time);
    if (this.mode === 'assembly' && active.segment.kind === 'check') {
      return lerpBox(fit(this.pathBox(0, 1)), whole, ease('inOut', clamp(active.progress / 0.35)));
    }
    const d = disassemblyTime(this.model, this.mode, time);
    if (d <= 0) return whole;
    const index = Math.min(Math.max(Math.ceil(d) - 1, 0), count - 1);
    const u = d - index;
    const previous = index === 0 ? whole : fit(this.pathBox(index - 1, 1));
    const current = fit(this.pathBox(index, u));
    let box = u < 0.2 ? lerpBox(previous, current, ease('inOut', u / 0.2)) : current;
    if (index === count - 1 && u > 0.78) box = lerpBox(box, fit(this.overview(), 600), ease('inOut', (u - 0.78) / 0.22));
    return box;
  }

  /** Parts that are moving at a moment of a segment (label anchor). */
  private subjectsAt(index: number, u: number): string[] {
    return this.subjects[index][Math.round(clamp(u) * CAMERA_SAMPLES)];
  }

  private slingPoints(pose: Pose): [number, number][] {
    const sling = this.model.sling;
    if (!sling) return [];
    const t = pose.v;
    const last = sling.on.length - 1;
    return sling.on.map((point, i) => {
      const target = sling.mat[i];
      const lift = Math.sin(Math.PI * t) * (i === 0 || i === last ? 40 : 70);
      const k = ease('inOut', clamp((t - i * 0.035) / 0.8));
      return [lerp(point[0], target[0], k), lerp(point[1], target[1], k) - lift] as [number, number];
    });
  }

  // ------------------------------------------------------------------ frame
  private render(): void {
    if (!this.views.size) return;
    const time = this.time;
    const { model } = this;
    const active = activeSegment(model, this.mode, time);
    const d = disassemblyTime(model, this.mode, time);
    const poses = posesAt(model.disassembly, d);
    if (active.segment.kind === 'check') {
      for (const track of active.segment.tracks) poses.set(track.part, evalTrack(track, active.u));
    }
    const focus = this.highlightOverride ?? (time > 0.001 ? active.segment.focus : []);
    const pulse = 0.72 + 0.28 * Math.sin(performance.now() / 260);
    const xray = (key: string) => {
      const range = active.segment.xray[key];
      return range ? window01(active.u, ...range) : 0;
    };

    for (const view of this.views.values()) {
      const pose = poses.get(view.def.id) ?? REST;
      view.g.setAttribute('transform', matrixAttr(this.localMatrix(view.def, pose)));
      view.g.setAttribute('opacity', String(pose.o));
      this.setLifted(view, pose.lift > 0.5);
      const lit = focus.includes(view.def.id);
      if (view.glow) view.glow.setAttribute('opacity', lit ? String(pulse) : '0');
      if (view.shadow) {
        const lift = pose.lift > 0.5 ? 1 : 0;
        view.shadow.setAttribute('opacity', String(lift * (0.45 + (pose.s - 1) * 6)));
        view.shadow.setAttribute('transform', `translate(${2 + (pose.s - 1) * 120} ${3 + (pose.s - 1) * 160})`);
      }
      if (view.def.xray && view.body) view.body.setAttribute('opacity', String(1 - (XRAY_FADE[view.def.xray] ?? 0.74) * xray(view.def.xray)));
      if (view.def.kind === 'pin') this.renderPin(view, pose, lit, pulse);
      if (view.spring) {
        const s = model.sprites[view.def.sprites[view.def.sprites.length - 1]];
        const k = (s.w - pose.c) / s.w;
        view.spring.setAttribute('transform', `translate(${s.x} 0) scale(${k} 1) translate(${-s.x} 0)`);
      }
      if (view.shade) {
        const angle = pose.fold * Math.PI / 180;
        view.shade.setAttribute('opacity', String(Math.min(0.72, 0.5 * Math.sin(angle) + 0.28 * (pose.fold / 180))));
      }
      if (view.bands) {
        const s = model.sprites[view.def.sprites[0]];
        // A flash hider turns four times while it is unscrewed; a `spin` part turns once (spin 0..1).
        const turns = view.def.kind === 'spin' ? 1 : 4;
        const turning = pose.spin > 0.02 && pose.spin < turns - 0.02;
        view.bands.forEach((band, i) => {
          const phase = ((view.def.kind === 'spin' ? pose.spin * 1.5 : pose.spin) + i * 0.5) % 1;
          band.setAttribute('y', String(s.y - 7 + phase * (s.h + 7)));
          band.setAttribute('opacity', turning ? (i === 0 ? '0.9' : '0.22') : '0');
        });
      }
      if (view.sling) this.renderSling(view, pose, lit, pulse);
    }

    const cam = this.camera(time);
    this.svg.setAttribute('viewBox', `${cam.x.toFixed(2)} ${cam.y.toFixed(2)} ${cam.w.toFixed(2)} ${cam.h.toFixed(2)}`);
    const unit = cam.w / this.width;   // world units per screen pixel
    this.renderArrows(active, poses, unit);
    this.renderLabel(active, poses, cam, focus);
  }

  private setLifted(view: PartView, lifted: boolean): void {
    if (view.def.parent || view.lifted === lifted) return;
    view.lifted = lifted;
    if (lifted) this.layers.get('lifted')!.appendChild(view.g);
    else view.home.after(view.g);
  }

  private renderPin(view: PartView, pose: Pose, lit: boolean, pulse: number): void {
    const length = view.pinLength ?? 40;
    const { pinOut, pinDepth } = this.model;
    const out = pose.z * length * pinDepth * (1 - pose.v);
    const hx = pinOut[0] * out, hy = pinOut[1] * out;
    // The shank points back into the hole, opposite to the direction the pin comes out.
    const inward = Math.atan2(-pinOut[1], -pinOut[0]) * 180 / Math.PI;
    const angle = inward * (1 - pose.v);
    const foreshorten = lerp(pinDepth, 1, pose.v);
    view.pinBody!.setAttribute('transform', `translate(${hx.toFixed(2)} ${hy.toFixed(2)}) rotate(${angle.toFixed(2)}) scale(${foreshorten.toFixed(3)} 1)`);
    const visible = pose.v > 0 ? length + 6 : 2 + pose.z * length;
    view.pinClip!.setAttribute('width', String(visible + 4));
    view.pinEnd!.setAttribute('transform', `translate(${hx.toFixed(2)} ${hy.toFixed(2)})`);
    view.pinEnd!.setAttribute('opacity', String(clamp(1 - pose.v * 1.4)));
    view.pinRing!.setAttribute('cx', hx.toFixed(2));
    view.pinRing!.setAttribute('cy', hy.toFixed(2));
    view.pinRing!.setAttribute('opacity', lit && pose.v < 0.5 ? String(pulse) : '0');
  }

  private renderSling(view: PartView, pose: Pose, lit: boolean, pulse: number): void {
    const p = this.slingPoints(pose);
    if (p.length < 7) return;
    const d = `M${p[0].join(' ')} C${p[1].join(' ')} ${p[2].join(' ')} ${p[3].join(' ')} C${p[4].join(' ')} ${p[5].join(' ')} ${p[6].join(' ')}`;
    const { edge, strap, stitch, hooks } = view.sling!;
    edge.setAttribute('d', d);
    strap.setAttribute('d', d);
    stitch.setAttribute('d', d);
    edge.classList.toggle('lit', lit);
    edge.setAttribute('stroke-opacity', lit ? String(0.55 + 0.45 * pulse) : '1');
    const ends: [[number, number], [number, number]][] = [[p[0], p[1]], [p[6], p[5]]];
    ends.forEach(([tip, towards], i) => {
      const angle = Math.atan2(tip[1] - towards[1], tip[0] - towards[0]) * 180 / Math.PI;
      const unhook = pose.press * (1 - pose.v) * (i === 0 ? -18 : 18);
      hooks[i].setAttribute('transform', `translate(${tip[0].toFixed(1)} ${tip[1].toFixed(1)}) rotate(${(angle + unhook).toFixed(1)}) translate(-4 0)`);
    });
  }

  private renderArrows(active: ActiveSegment, poses: Map<string, Pose>, unit: number): void {
    const reverse = this.mode === 'assembly';
    for (const view of this.arrows) {
      const on = this.options.arrows !== false && view.segment === active.segment && active.time > 0;
      const { arrow } = view;
      const alpha = on ? window01(active.u, arrow.t[0], arrow.t[1], 0.05) : 0;
      view.g.setAttribute('opacity', String(alpha));
      if (!alpha) continue;
      const frame = arrow.on ? this.worldMatrix(this.model.partById[arrow.on], poses) : null;
      let points = arrow.points.map(([x, y]) => (frame ? apply(frame, x, y) : [x, y]) as [number, number]);
      if (reverse) points = [...points].reverse();
      const stroke = 2.6 * unit;
      view.g.style.setProperty('--w', `${stroke}px`);
      if (arrow.kind === 'out' || arrow.kind === 'in') {
        const kind = reverse ? (arrow.kind === 'out' ? 'in' : 'out') : arrow.kind;
        const [x, y] = points[0];
        const r = 9 * unit;
        view.mark!.setAttribute('transform', `translate(${x} ${y})`);
        const ring = view.mark!.querySelector('circle')!;
        ring.setAttribute('r', String(r));
        ring.setAttribute('stroke-width', String(stroke));
        const sign = view.mark!.querySelector('path')!;
        const s = r * 0.5;
        sign.setAttribute('d', kind === 'out' ? `M${-s * 0.35} 0 a${s * 0.35} ${s * 0.35} 0 1 0 ${s * 0.7} 0 a${s * 0.35} ${s * 0.35} 0 1 0 ${-s * 0.7} 0` : `M${-s} ${-s} L${s} ${s} M${s} ${-s} L${-s} ${s}`);
        sign.setAttribute('stroke-width', String(stroke));
        view.path.setAttribute('d', '');
        view.head.setAttribute('d', '');
        continue;
      }
      const [a, b, c] = points;
      const d = arrow.kind === 'arc' ? `M${a[0]} ${a[1]} Q${b[0]} ${b[1]} ${c[0]} ${c[1]}` : `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`;
      const tip = arrow.kind === 'arc' ? c : b;
      const from = arrow.kind === 'arc' ? b : a;
      view.path.setAttribute('d', d);
      view.path.setAttribute('stroke-width', String(stroke));
      view.path.setAttribute('stroke-dasharray', `${8 * unit} ${5 * unit}`);
      view.path.setAttribute('stroke-dashoffset', String(-(performance.now() / 40) * unit));
      const angle = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
      const size = 11 * unit;
      const left = [tip[0] - size * Math.cos(angle - 0.45), tip[1] - size * Math.sin(angle - 0.45)];
      const right = [tip[0] - size * Math.cos(angle + 0.45), tip[1] - size * Math.sin(angle + 0.45)];
      view.head.setAttribute('d', `M${tip[0]} ${tip[1]} L${left[0]} ${left[1]} L${right[0]} ${right[1]} Z`);
      view.head.setAttribute('stroke-width', String(unit * 1.2));
    }
  }

  private renderLabel(active: ActiveSegment, poses: Map<string, Pose>, cam: Box, focus: string[]): void {
    const info = this.options.label?.(active);
    if (!info || !focus.length || active.time <= 0) {
      this.label.hidden = true;
      return;
    }
    const index = active.segment.kind === 'check' ? -1 : this.model.disassembly.indexOf(active.segment);
    const anchor = this.highlightOverride ?? (index >= 0 ? this.subjectsAt(index, active.u) : focus);
    const box = unionBox(anchor.map((id) => this.worldBox(this.model.partById[id], poses)));
    const k = this.width / cam.w;
    const height = this.width / this.aspect;
    let x = (box.x + box.w / 2 - cam.x) * k;
    let y = (box.y - cam.y) * k - 14;
    const below = y < 64;
    if (below) y = (box.y + box.h - cam.y) * k + 14;
    this.label.hidden = false;
    const key = `${info.title}|${info.hint ?? ''}`;
    if (this.label.dataset.key !== key) {
      this.label.dataset.key = key;
      this.label.innerHTML = '';
      const title = document.createElement('b');
      title.textContent = info.title;
      this.label.appendChild(title);
      if (info.hint) {
        const hint = document.createElement('span');
        hint.textContent = info.hint;
        this.label.appendChild(hint);
      }
      this.labelWidth = this.label.offsetWidth;
    }
    // Keep the whole callout inside the stage.
    const half = this.labelWidth / 2 + 8;
    const anchorX = x;
    x = half * 2 < this.width ? clamp(x, half, this.width - half) : this.width / 2;
    const pointer = clamp(anchorX - (x - this.labelWidth / 2), 14, this.labelWidth - 14);
    this.label.style.setProperty('--pointer', `${pointer.toFixed(1)}px`);
    y = clamp(y, 8, height - 8);
    this.label.classList.toggle('below', below);
    this.label.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, ${below ? '0' : '-100%'})`;
  }
}

/** Static picture of the scene (hero, test illustrations). */
export function staticScene(host: HTMLElement, model: SceneModel, options: SceneOptions & { mode?: SceneMode; time?: number; highlight?: string[] }): Scene {
  const scene = new Scene(host, model, { camera: 'rifle', arrows: false, ...options });
  scene.setHighlight(options.highlight ?? []);
  scene.show(options.mode ?? 'disassembly', options.time ?? 0);
  return scene;
}
