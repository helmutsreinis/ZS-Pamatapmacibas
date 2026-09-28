import cover from '../../assets/g36-reference-parts.png';
import type { SceneModel } from '../../scene/model';
import type { WeaponModule } from '../types';
import { finalCheck, prep, sources, steps, technical, theory } from './content';
import { SLING, assetUrl, partById, parts, sprites, stockHoles } from './parts';
import { MAT, TRAY, check, disassembly } from './timeline';

const scene: SceneModel = {
  id: 'g36',
  sprites,
  parts,
  partById,
  url: assetUrl,
  matTexture: assetUrl('mat-texture.png'),
  disassembly,
  check,
  tray: TRAY,
  mat: MAT,
  body: { x: 0, y: 176, w: 726, h: 320 },
  pinOut: [-Math.SQRT1_2, Math.SQRT1_2],
  pinDepth: 0.55,
  sling: SLING,
  // The three storage holes near the butt of the stock, seen close up while the pins are removed.
  stash: {
    kicker: 'Ieteikums', title: 'Laides uzglabāšanas atveres', sprite: 'stock',
    view: { x: 650, y: 297, w: 64, h: 50 }, holes: stockHoles, pin: { side: 'pin', end: 'pin-end' },
  },
};

export const g36: WeaponModule = {
  id: 'g36',
  name: 'G36',
  title: 'Triecienšautene G36',
  technical,
  view: 'SKATS NO KREISĀS PUSES',
  steps,
  prep,
  finalCheck,
  scene,
  stepParts: {
    prep: ['magazine'], check: ['carrier'],
    sling: ['sling'], stock: ['stock'], 'rear-pins': ['pinRear', 'pinCentre'], 'trigger-group': ['grip'],
    'bolt-return': ['recoil'], carrier: ['carrier'], magwell: ['magwell'], 'front-pin': ['pinFront'],
    handguard: ['handguard'], 'gas-return': ['opRod'], piston: ['piston'], 'flash-hider': ['flashHider'],
    'firing-pin-retainer': ['retainer'], 'firing-pin': ['firingPin'], 'bolt-pin': ['camPin'], bolt: ['boltHead'],
  },
  lookAlike: [['rear-pins', 'front-pin', 'firing-pin-retainer', 'bolt-pin']],
  theory,
  note: 'Aizmugurējā, centrālā un priekšējā tapa animācijā noliktas uz paklāja tikai uzskatāmībai. Ieteicams tās uzglabāt laides trīs uzglabāšanas atverēs.',
  sources: [
    { label: 'Bundesvēra rokasgrāmata A2-222/0-0-4741', short: 'Bundesvēra rokasgrāmata', url: sources.bw },
    { label: 'Heckler & Koch · G36 tehniskie dati', short: 'HK ražotāja dati', url: sources.hkTechnical },
    { label: 'HKParts · G36 detaļu katalogs', short: 'HKParts detaļu katalogs', url: sources.hkParts },
  ],
  credit: { text: 'Laides fotoattēls: Pierre Courtejoie / DVIDS, publiskais īpašums', url: 'https://commons.wikimedia.org/wiki/File:German_Army_-_HK_G36K_A4_-_EOtech_holographic_sight_-_red_dot_magnifier_G33%E2%84%A2.webp' },
  cover,
};
