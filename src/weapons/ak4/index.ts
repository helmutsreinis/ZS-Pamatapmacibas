import photo from '../../assets/ak4-reference-cover.jpg';
import type { SceneModel } from '../../scene/model';
import type { WeaponModule } from '../types';
import { finalCheck, prep, sources, steps, technical, theory } from './content';
import { assetUrl, partById, parts, sprites } from './parts';
import { MAT, TRAY, check, disassembly } from './timeline';

const scene: SceneModel = {
  id: 'ak4',
  sprites,
  parts,
  partById,
  url: assetUrl,
  matTexture: assetUrl('mat-texture.png'),
  disassembly,
  check,
  tray: TRAY,
  mat: MAT,
  body: { x: 30, y: 72, w: 1305, h: 290 },
  pinOut: [-Math.SQRT1_2, Math.SQRT1_2],
  pinDepth: 0.55,
  cameraMin: 560,
};

export const ak4: WeaponModule = {
  id: 'ak4',
  name: 'AK-4',
  title: 'Triecienšautene AK-4',
  technical,
  view: 'SKATS NO KREISĀS PUSES',
  steps,
  prep,
  finalCheck,
  scene,
  stepParts: {
    prep: ['magazine'], check: ['carrier'],
    stock: ['stock'], carrier: ['carrier'], grip: ['grip'], handguard: ['handguard'], selector: ['selector'],
    trigger: ['trigger'], bolt: ['boltHead', 'lockingPiece'], 'firing-pin': ['firingPin', 'firingSpring'],
  },
  lookAlike: [],
  sources: [
    { label: 'Jaunsarga rokasgrāmata, 12. nodaļa (AK-4)', short: 'Jaunsarga rokasgrāmata', url: sources.handbook },
    { label: 'Bundesvēra ZDv 3/13 “Das Gewehr G3”', short: 'Bundesvēra ZDv 3/13', url: sources.zdv },
    { label: 'Mācību prezentācija “Triecienšautene AK-4 (G-3)”', short: 'AK-4 mācību prezentācija', url: sources.course },
  ],
  theory,
  photo,
  cover: photo,
  credit: { text: 'Detaļu fotoattēli: lago4096, retušējis Auge=mit, Wikimedia Commons, CC BY-SA 4.0', url: sources.photo },
};
