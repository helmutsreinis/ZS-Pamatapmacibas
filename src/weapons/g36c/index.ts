import cover from '../../assets/g36-reference-parts.png';
import type { SceneModel } from '../../scene/model';
import type { WeaponModule } from '../types';
import { finalCheck, prep, sources, steps, technical, theory } from './content';
import { SLING, assetUrl, partById, parts, sprites } from './parts';
import { MAT, TRAY, check, disassembly } from './timeline';

const scene: SceneModel = {
  id: 'g36c',
  sprites,
  parts,
  partById,
  url: assetUrl,
  matTexture: assetUrl('mat-texture.png'),
  disassembly,
  check,
  tray: TRAY,
  mat: MAT,
  body: { x: 0, y: 176, w: 740, h: 320 },
  pinOut: [-Math.SQRT1_2, Math.SQRT1_2],
  pinDepth: 0.55,
  sling: SLING,
};

export const g36c: WeaponModule = {
  id: 'g36c',
  name: 'G36C',
  title: 'Triecienšautene G36C',
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
  sources: [
    { label: 'Bundesvēra rokasgrāmata A2-222/0-0-4741', short: 'Bundesvēra rokasgrāmata', url: sources.bw },
    { label: 'Heckler & Koch · G36 tehniskie dati', short: 'HK ražotāja dati', url: sources.hkTechnical },
    { label: 'HKParts · G36 detaļu katalogs', short: 'HKParts detaļu katalogs', url: sources.hkParts },
  ],
  cover,
};
