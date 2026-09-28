export type Ease = 'linear' | 'in' | 'out' | 'inOut' | 'back';

export const clamp = (value: number, min = 0, max = 1): number => Math.min(Math.max(value, min), max);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export function ease(kind: Ease, t: number): number {
  switch (kind) {
    case 'in': return t * t * t;
    case 'out': return 1 - (1 - t) ** 3;
    case 'inOut': return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    case 'back': { const c = 1.4; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; }
    default: return t;
  }
}

/** Smooth 0..1 ramp between two times, used for fades and x-ray windows. */
export function window01(t: number, start: number, end: number, fade = 0.08): number {
  if (t <= start - fade || t >= end + fade) return 0;
  if (t < start) return ease('inOut', (t - (start - fade)) / fade);
  if (t > end) return 1 - ease('inOut', (t - end) / fade);
  return 1;
}

/** 2D affine matrix [a, b, c, d, e, f] as used by SVG. */
export type Matrix = [number, number, number, number, number, number];

export const identity = (): Matrix => [1, 0, 0, 1, 0, 0];

export function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

/** translate(x, y) · translate(pivot) · rotate(deg) · scale(sx, sy) · translate(-pivot) */
export function poseMatrix(x: number, y: number, deg: number, sx: number, sy: number, px: number, py: number): Matrix {
  const rad = deg * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const a = cos * sx, b = sin * sx, c = -sin * sy, d = cos * sy;
  return [a, b, c, d, x + px - a * px - c * py, y + py - b * px - d * py];
}

export function apply(m: Matrix, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

export const matrixAttr = (m: Matrix): string => `matrix(${m.map((v) => Math.round(v * 1000) / 1000).join(' ')})`;

export type Box = { x: number; y: number; w: number; h: number };

export function transformBox(m: Matrix, box: Box): Box {
  const corners = [apply(m, box.x, box.y), apply(m, box.x + box.w, box.y), apply(m, box.x, box.y + box.h), apply(m, box.x + box.w, box.y + box.h)];
  const xs = corners.map((p) => p[0]), ys = corners.map((p) => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

export function unionBox(boxes: Box[]): Box {
  const x = Math.min(...boxes.map((b) => b.x)), y = Math.min(...boxes.map((b) => b.y));
  const x2 = Math.max(...boxes.map((b) => b.x + b.w)), y2 = Math.max(...boxes.map((b) => b.y + b.h));
  return { x, y, w: x2 - x, h: y2 - y };
}

/** Grow a box to an aspect ratio (w/h) and a minimum width, keeping its centre. */
export function fitAspect(box: Box, aspect: number, minWidth: number, pad: number): Box {
  let w = Math.max(box.w + pad * 2, minWidth), h = box.h + pad * 2;
  if (w / h > aspect) h = w / aspect; else w = h * aspect;
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

export const lerpBox = (a: Box, b: Box, t: number): Box => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });
