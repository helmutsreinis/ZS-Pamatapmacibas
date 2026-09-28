import { timeline, type TimelineContext } from '../../scene/timeline';
import { SLING, parts, partById, sprites, type PartId } from './parts';

/** Where every removed part is laid out on the mat (top-left corner of its image, world units). */
export const TRAY = {
  magazine: [690, 640], grip: [505, 548], magwell: [690, 552], recoil: [240, 548], carrier: [268, 652],
  handguard: [-40, 548], opRod: [-30, 660], piston: [100, 662], flashHider: [160, 655],
  firingPin: [272, 736], boltHead: [415, 732],
  pinRear: [518, 738], pinCentre: [518, 758], pinFront: [518, 778], retainer: [600, 740], camPin: [600, 761],
} as const satisfies Partial<Record<PartId, readonly [number, number]>>;

export const MAT = { x: -70, y: 525, w: 900, h: 380 };

const ctx: TimelineContext = { sprites, sling: SLING, tray: TRAY, parts, partById };

/**
 * G36 field strip, one segment per course step. Movements follow Bundeswehr
 * Zentralrichtlinie A2-222/0-0-4741, §331 and §333.
 */
const t = timeline(ctx);

// 00 Safety check: catch pressed, magazine out, cocking handle back and forward.
t.segment({ id: 'prep', kind: 'prep', duration: 3.8, focus: ['magazine', 'carrier'], xray: { receiver: [0.62, 0.98] } }, (b) => {
  b.to('magCatch', 0.06, { press: 1 }).to('magCatch', 0.3, { press: 1 }, 'linear').to('magCatch', 0.38, { press: 0 });
  b.hold('magazine', 0.1).by('magazine', 0.34, { y: 74 }, 'in').tray('magazine', 0.36, 0.62, { r: -4 });
  b.hold('carrier', 0.66).by('carrier', 0.78, { x: 58 }, 'out').hold('carrier', 0.86).by('carrier', 0.96, { x: -58 }, 'in');
  b.arrow('line', [[318, 505], [318, 560]], [0.08, 0.34]);
  b.arrow('line', [[222, 170], [288, 170]], [0.64, 0.8]);
  b.arrow('line', [[288, 170], [222, 170]], [0.84, 0.97]);
});

// 01 Sling off: unhook both ends, lay it along the front of the mat.
t.segment({ id: 'sling', kind: 'step', duration: 3.0, focus: ['sling'] }, (b) => {
  b.to('sling', 0.12, { press: 1 }, 'out').to('sling', 1, { v: 1 }, 'inOut');
  b.arrow('line', [[60, 300], [60, 340]], [0.02, 0.2]);
  b.arrow('line', [[482, 278], [482, 318]], [0.02, 0.2]);
});

// 02 Stock folds to the right side, i.e. away from the viewer, round the hinge.
t.segment({ id: 'stock', kind: 'step', duration: 2.8, focus: ['stock'] }, (b) => {
  b.hold('stock', 0.12).to('stock', 0.92, { fold: 180 }, 'inOut');
  b.arrow('in', [[640, 316]], [0.05, 0.9], 'stock');
  b.arrow('arc', [[690, 250], [600, 200], [510, 250]], [0.12, 0.9]);
});

// 03 Both grip pins are pushed out to the left (towards the viewer). The close-up shows where
// they belong: the storage holes in the stock (the mat only keeps them in view).
t.segment({ id: 'rear-pins', kind: 'step', duration: 3.2, focus: ['pinRear', 'pinCentre'] }, (b) => {
  b.to('pinRear', 0.4, { z: 1 }, 'inOut').hold('pinCentre', 0.08).to('pinCentre', 0.48, { z: 1 }, 'inOut');
  b.tray('pinRear', 0.5, 0.92).tray('pinCentre', 0.56, 1);
  b.stow('pinRear', 1, [0.5, 0.9]).stow('pinCentre', 2, [0.56, 0.98]);
  b.arrow('out', [[470, 300]], [0, 0.42]).arrow('out', [[356, 322]], [0.06, 0.5]);
});

// 04 Grip with the trigger mechanism comes off downwards.
t.segment({ id: 'trigger-group', kind: 'step', duration: 2.8, focus: ['grip'] }, (b) => {
  b.by('grip', 0.38, { y: 48 }, 'inOut').tray('grip', 0.42, 1);
  b.arrow('line', [[420, 440], [420, 500]], [0, 0.4]);
});

// 05 End piece with recoil spring: press down to free its top lug, pull out to the rear.
t.segment({ id: 'bolt-return', kind: 'step', duration: 3.4, focus: ['recoil'], xray: { receiver: [0, 0.62] } }, (b) => {
  b.to('recoil', 0.14, { y: 3, r: 1.5 }, 'inOut').by('recoil', 0.6, { x: 250 }, 'inOut').tray('recoil', 0.62, 1);
  b.arrow('line', [[492, 212], [492, 236]], [0, 0.16]);
  b.arrow('line', [[520, 236], [610, 236]], [0.14, 0.58]);
});

// 06 Bolt carrier with cocking handle slides out of the rear of the receiver.
t.segment({ id: 'carrier', kind: 'step', duration: 3.4, focus: ['carrier'], xray: { receiver: [0, 0.62] } }, (b) => {
  b.by('carrier', 0.62, { x: 330 }, 'inOut').tray('carrier', 0.64, 1);
  b.arrow('line', [[380, 170], [520, 170]], [0, 0.6]);
});

// 07 Magazine well: press the catch, swing it down round its front mounting, lift off.
t.segment({ id: 'magwell', kind: 'step', duration: 3.0, focus: ['magwell'] }, (b) => {
  b.to('magCatch', 0.1, { press: 1 }).to('magCatch', 0.34, { press: 1 }, 'linear').to('magCatch', 0.44, { press: 0 });
  b.hold('magwell', 0.12).to('magwell', 0.44, { r: 20 }, 'inOut').by('magwell', 0.56, { x: -6, y: 34 }, 'inOut').tray('magwell', 0.58, 1);
  b.arrow('arc', [[380, 318], [392, 350], [372, 380]], [0.12, 0.46]);
});

// 08 Front pin: pushed out to the left; it belongs in the front storage hole.
t.segment({ id: 'front-pin', kind: 'step', duration: 2.6, focus: ['pinFront'] }, (b) => {
  b.to('pinFront', 0.45, { z: 1 }, 'inOut').tray('pinFront', 0.5, 1);
  b.stow('pinFront', 0, [0.5, 0.95]);
  b.arrow('out', [[255, 285]], [0, 0.46]);
});

// 09 Handguard is pulled forward off the barrel.
t.segment({ id: 'handguard', kind: 'step', duration: 3.4, focus: ['handguard'] }, (b) => {
  b.by('handguard', 0.62, { x: -275 }, 'inOut').tray('handguard', 0.64, 1);
  b.arrow('line', [[60, 206], [-60, 206]], [0, 0.6]);
});

// 10 Operating rod: pull back against its spring, swing it aside, lift it out forwards.
t.segment({ id: 'gas-return', kind: 'step', duration: 3.6, focus: ['opRod'] }, (b) => {
  b.to('opRod', 0.22, { x: 10, c: 10 }, 'inOut').to('opRod', 0.36, { r: -6, s: 1.03 }, 'inOut')
    .to('opRod', 0.56, { x: -30, c: 0, r: -8 }, 'inOut').tray('opRod', 0.58, 1);
  b.arrow('line', [[110, 214], [140, 214]], [0, 0.22]);
  b.arrow('arc', [[96, 222], [82, 236], [92, 252]], [0.2, 0.38]);
  b.arrow('line', [[150, 214], [100, 214]], [0.36, 0.56]);
});

// 11 Gas piston is drawn backwards out of the gas block.
t.segment({ id: 'piston', kind: 'step', duration: 2.6, focus: ['piston'] }, (b) => {
  b.by('piston', 0.45, { x: 36 }, 'inOut').tray('piston', 0.48, 1);
  b.arrow('line', [[70, 218], [120, 218]], [0, 0.45]);
});

// 12 Flash hider is unscrewed off the muzzle thread.
t.segment({ id: 'flash-hider', kind: 'step', duration: 3.2, focus: ['flashHider'] }, (b) => {
  b.to('flashHider', 0.62, { spin: 4, x: -14 }, 'inOut').tray('flashHider', 0.64, 1);
  b.arrow('arc', [[22, 236], [4, 262], [22, 288]], [0, 0.62]);
});

// 13–16 Bolt group on the mat. Carrier parts move relative to the carrier.
t.segment({ id: 'firing-pin-retainer', kind: 'step', duration: 2.8, focus: ['retainer'] }, (b) => {
  b.to('retainer', 0.45, { z: 1 }, 'inOut').tray('retainer', 0.5, 1);
  b.arrow('out', [[355, 257]], [0, 0.46], 'carrier');
});

t.segment({ id: 'firing-pin', kind: 'step', duration: 2.8, focus: ['firingPin'], xray: { carrier: [0, 0.58] } }, (b) => {
  b.by('firingPin', 0.56, { x: 150 }, 'inOut').tray('firingPin', 0.58, 1);
  b.arrow('line', [[380, 244], [440, 244]], [0, 0.55], 'carrier');
});

t.segment({ id: 'bolt-pin', kind: 'step', duration: 3.0, focus: ['camPin'], xray: { carrier: [0, 0.3] } }, (b) => {
  b.by('boltHead', 0.2, { x: -4 }, 'inOut').by('camPin', 0.2, { x: -4 }, 'inOut');
  b.to('camPin', 0.58, { z: 1 }, 'inOut').tray('camPin', 0.6, 1);
  b.arrow('line', [[262, 238], [246, 238]], [0, 0.2], 'carrier');
  b.arrow('out', [[291, 259]], [0.2, 0.58], 'carrier');
});

t.segment({ id: 'bolt', kind: 'step', duration: 2.8, focus: ['boltHead'], xray: { carrier: [0, 0.52] } }, (b) => {
  b.by('boltHead', 0.5, { x: -72 }, 'inOut').tray('boltHead', 0.52, 1);
  b.arrow('line', [[240, 240], [180, 240]], [0, 0.5], 'carrier');
});

export const disassembly = t.segments;

// Assembly ends with a function check: cycle the bolt by hand.
export const check = t.standalone({ id: 'check', kind: 'check', duration: 3, focus: ['carrier'], xray: { receiver: [0.02, 0.98] } }, (b) => {
  b.hold('carrier', 0.14).by('carrier', 0.36, { x: 58 }, 'out').hold('carrier', 0.5).by('carrier', 0.66, { x: -58 }, 'in')
    .hold('carrier', 0.74).by('carrier', 0.84, { x: 20 }, 'out').by('carrier', 0.94, { x: -20 }, 'in');
  b.arrow('line', [[222, 170], [288, 170]], [0.12, 0.38]).arrow('line', [[288, 170], [222, 170]], [0.48, 0.68]);
});
