import { apply, poseMatrix } from '../../scene/math';
import { timeline, type SegmentBuilder, type TimelineContext } from '../../scene/timeline';
import { holes, parts, partById, sprites, type PartId } from './parts';

/** Where every removed part is laid out on the mat (top-left corner of its image, world units). */
export const TRAY = {
  handguard: [20, 468], carrier: [470, 478], magazine: [1262, 598], stock: [520, 598],
  grip: [30, 575], trigger: [300, 598], selector: [290, 762],
  boltHead: [40, 792], lockingPiece: [135, 799], firingPin: [340, 802], firingSpring: [535, 799],
} as const satisfies Partial<Record<PartId, readonly [number, number]>>;

export const MAT = { x: -20, y: 440, w: 1390, h: 410 };

const ctx: TimelineContext = { sprites, tray: TRAY, parts, partById };

/** Keep a pin in a hole of a part that moves: repeats the leader's keys from time t0 on. */
function ride(b: SegmentBuilder, pin: PartId, leader: PartId, point: readonly [number, number], t0: number): void {
  const track = b.seg.tracks.find((candidate) => candidate.part === leader);
  const hole = partById[pin].pin?.hole;
  if (!track || !hole) return;
  const [px, py] = partById[leader].pivot;
  for (const key of track.keys) {
    if (key.t < t0) continue;
    const p = key.pose;
    const [x, y] = apply(poseMatrix(p.x, p.y, p.r, p.s, p.s, px, py), point[0], point[1]);
    b.to(pin, key.t, { x: x - hole[0], y: y - hole[1], s: p.s, lift: p.lift }, key.ease);
  }
}

/** Cocking handle back and released: it meets the carrier's tube after a free travel of 95 units. */
function cycle(b: SegmentBuilder, t0: number, back = 0.08, hold = 0.01, forward = 0.05): void {
  b.hold('cockingHandle', t0).to('cockingHandle', t0 + back, { x: 150 }, 'inOut');
  b.hold('carrier', t0 + back * 0.55).to('carrier', t0 + back, { x: 55 }, 'out');
  b.hold('cockingHandle', t0 + back + hold).to('cockingHandle', t0 + back + hold + forward, { x: 0 }, 'in');
  b.hold('carrier', t0 + back + hold).to('carrier', t0 + back + hold + forward, { x: 0 }, 'in');
}

/**
 * AK-4 field strip in the order of the Jaunsargs' handbook (Jaunsarga rokasgrāmata, 12.2).
 * Movements follow the Bundeswehr manual ZDv 3/13 for the G3, Nr. 319–323.
 */
const t = timeline(ctx);

// 00 Safety check: magazine catch, magazine out, cocking handle back (chamber check), control press.
t.segment({ id: 'prep', kind: 'prep', duration: 5.4, focus: ['magazine', 'cockingHandle', 'carrier', 'selector'], xray: { receiver: [0.5, 0.8] } }, (b) => {
  b.to('magCatch', 0.05, { press: 1 }).hold('magCatch', 0.22).to('magCatch', 0.28, { press: 0 });
  b.hold('magazine', 0.07).to('magazine', 0.24, { y: 70, r: -3 }, 'in').tray('magazine', 0.26, 0.46);
  cycle(b, 0.5, 0.14, 0.08, 0.06);
  // Control press: the selector goes to P for the trigger press, then back to S.
  b.hold('selector', 0.8).to('selector', 0.86, { r: 38 }).hold('selector', 0.92).to('selector', 0.98, { r: 0 });
  b.arrow('line', [[674, 362], [674, 414]], [0.06, 0.24]);
  b.arrow('line', [[335, 92], [480, 92]], [0.5, 0.64]);
  b.arrow('line', [[480, 92], [335, 92]], [0.72, 0.78]);
  b.arrow('arc', [[846, 186], [862, 198], [857, 214]], [0.8, 0.86]);
});

// 01 Both stock pins out sideways (towards the viewer), into the hollow rivets; stock straight back.
t.segment({ id: 'stock', kind: 'step', duration: 5.4, focus: ['pinStockA', 'pinStockB', 'stock'], xray: { receiver: [0.58, 0.84] } }, (b) => {
  b.to('pinStockA', 0.16, { z: 1 }).hold('pinStockB', 0.06).to('pinStockB', 0.22, { z: 1 });
  const store = (pin: PartId, from: readonly [number, number], to: readonly [number, number], t0: number) => {
    const dx = to[0] - from[0], dy = to[1] - from[1];
    b.hold(pin, t0).to(pin, t0 + 0.09, { x: dx / 2, y: dy / 2 - 42 }).to(pin, t0 + 0.18, { x: dx, y: dy }).to(pin, t0 + 0.26, { z: 0 });
  };
  store('pinStockA', holes.stockA, holes.rivetA, 0.24);
  store('pinStockB', holes.stockB, holes.rivetB, 0.3);
  b.hold('stock', 0.58).to('stock', 0.82, { x: 400 }, 'inOut').tray('stock', 0.84, 1);
  ride(b, 'pinStockA', 'stock', holes.rivetA, 0.58);
  ride(b, 'pinStockB', 'stock', holes.rivetB, 0.58);
  b.arrow('out', [[holes.stockA[0], holes.stockA[1]]], [0, 0.18]).arrow('out', [[holes.stockB[0], holes.stockB[1]]], [0.05, 0.24]);
  b.arrow('arc', [[1000, 160], [1130, 120], [1240, 180]], [0.26, 0.48]);
  b.arrow('in', [[holes.rivetA[0], holes.rivetA[1]]], [0.42, 0.52]).arrow('in', [[holes.rivetB[0], holes.rivetB[1]]], [0.48, 0.58]);
  b.arrow('line', [[1040, 92], [1240, 92]], [0.58, 0.82]);
});

// 02 Pulling the cocking handle pushes the bolt carrier with the bolt out of the receiver's rear.
t.segment({ id: 'carrier', kind: 'step', duration: 4.4, focus: ['cockingHandle', 'carrier'], xray: { receiver: [0, 0.6] } }, (b) => {
  b.to('cockingHandle', 0.24, { x: 150 }, 'inOut');
  b.hold('carrier', 0.13).to('carrier', 0.24, { x: 55 }, 'out').to('carrier', 0.56, { x: 500 }, 'inOut').tray('carrier', 0.6, 1);
  b.hold('cockingHandle', 0.34).to('cockingHandle', 0.48, { x: 0 });
  b.arrow('line', [[335, 92], [480, 92]], [0.02, 0.24]);
  b.arrow('line', [[990, 126], [1170, 126]], [0.26, 0.56]);
});

// 03 Pin at the front of the trigger mechanism housing out; the grip with the trigger mechanism comes off downwards.
t.segment({ id: 'grip', kind: 'step', duration: 4.2, focus: ['pinGrip', 'grip'] }, (b) => {
  b.to('pinGrip', 0.2, { z: 1 });
  b.hold('grip', 0.22).to('grip', 0.38, { r: 7 }).to('grip', 0.54, { x: 12, y: 60, r: 7 }).tray('grip', 0.58, 0.95);
  ride(b, 'pinGrip', 'grip', holes.grip, 0.22);
  b.to('pinGrip', 1, { z: 0 });          // back into its hole in the housing (temporary place)
  b.arrow('out', [[holes.grip[0], holes.grip[1]]], [0, 0.2]);
  b.arrow('arc', [[960, 230], [972, 254], [960, 278]], [0.22, 0.38]);
  b.arrow('line', [[870, 372], [870, 424]], [0.38, 0.54]);
});

// 04 Handguard pin out; the front of the handguard swings down, the handguard slides forward off the receiver.
t.segment({ id: 'handguard', kind: 'step', duration: 4.0, focus: ['pinHandguard', 'handguard'] }, (b) => {
  b.to('pinHandguard', 0.18, { z: 1 });
  b.hold('handguard', 0.2).to('handguard', 0.36, { r: -5 }).to('handguard', 0.52, { x: -30, y: 14, r: -5 }).tray('handguard', 0.56, 0.96);
  b.hold('pinHandguard', 0.6).to('pinHandguard', 0.74, { z: 0 });   // back into the front sight holder
  b.arrow('out', [[holes.handguard[0], holes.handguard[1]]], [0, 0.18]);
  b.arrow('arc', [[240, 176], [226, 194], [236, 212]], [0.2, 0.36]);
  b.arrow('line', [[520, 224], [430, 224]], [0.36, 0.52]);
  b.arrow('in', [[holes.handguard[0], holes.handguard[1]]], [0.6, 0.74]);
});

// 05 On the mat: selector turned anticlockwise to vertical, then pulled out sideways.
t.segment({ id: 'selector', kind: 'step', duration: 3.4, focus: ['selector'] }, (b) => {
  b.hold('selector', 0.06).to('selector', 0.36, { r: -52 });
  b.to('selector', 0.56, { x: -9, y: 9, s: 1.08, r: -52 });
  b.tray('selector', 0.6, 1);
  b.arrow('arc', [[850, 196], [838, 176], [822, 178]], [0.06, 0.36], 'grip');
  b.arrow('out', [[823, 214]], [0.36, 0.56], 'grip');
});

// 06 Trigger mechanism lifted out of the housing by its hammer.
t.segment({ id: 'trigger', kind: 'step', duration: 3.2, focus: ['trigger'], xray: { grip: [0, 0.5] } }, (b) => {
  b.hold('trigger', 0.08).to('trigger', 0.44, { y: -112 }, 'inOut').tray('trigger', 0.48, 1);
  b.arrow('line', [[800, 150], [800, 84]], [0.08, 0.44], 'grip');
});

// 07 Bolt turned until the locking lever lets go; bolt with the locking piece off the carrier, forwards.
t.segment({ id: 'bolt', kind: 'step', duration: 3.8, focus: ['boltHead', 'lockingPiece'], xray: { carrier: [0, 0.62] } }, (b) => {
  b.to('boltHead', 0.28, { spin: 1 });
  b.hold('lockingPiece', 0.3).to('lockingPiece', 0.56, { x: -100 });
  b.to('boltHead', 0.56, { x: -100 });
  b.tray('boltHead', 0.6, 0.94).tray('lockingPiece', 0.64, 1);
  b.arrow('arc', [[662, 132], [646, 154], [662, 176]], [0.02, 0.28], 'carrier');
  b.arrow('line', [[650, 190], [556, 190]], [0.3, 0.56], 'carrier');
});

// 08 Firing pin and its spring out of the front of the carrier.
t.segment({ id: 'firing-pin', kind: 'step', duration: 3.2, focus: ['firingPin', 'firingSpring'], xray: { carrier: [0, 0.5] } }, (b) => {
  b.hold('firingPin', 0.06).to('firingPin', 0.44, { x: -230 });
  b.hold('firingSpring', 0.06).to('firingSpring', 0.44, { x: -230 });
  b.tray('firingPin', 0.48, 0.94).tray('firingSpring', 0.54, 1);
  b.arrow('line', [[720, 190], [560, 190]], [0.06, 0.44], 'carrier');
});

export const disassembly = t.segments;

/** Function check on the assembled rifle: S blocks the trigger, then P and A with the cocking handle. */
export const check = t.standalone({ id: 'check', kind: 'check', duration: 5.8, focus: ['selector', 'cockingHandle', 'carrier'], xray: { receiver: [0.14, 0.84] } }, (b) => {
  b.hold('selector', 0.04).to('selector', 0.12, { r: 38 });
  cycle(b, 0.16);
  b.hold('selector', 0.4).to('selector', 0.48, { r: 76 });
  cycle(b, 0.52);
  cycle(b, 0.68);
  b.hold('selector', 0.86).to('selector', 0.96, { r: 0 });
});
