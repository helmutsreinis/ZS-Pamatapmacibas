import { photoLibrary } from '../photos';
import type { Credit, Figure } from '../types';
import sizes from './assets/images.json';

const photo = photoLibrary(import.meta.glob<string>('./assets/*.jpg', { eager: true, query: '?url', import: 'default' }), sizes);

/** Course material supplied by the trainee (tools/study-sources/). */
export const courseCredit = (author: string, licence: string, changes: string): Credit => ({ author, source: 'kursa materiāls', licence, changes });

const poster = photo('uniform-poster.jpg');
/** Positions below are in the pixels of the original 1122 px wide poster. */
const k = poster.width / 1122;
const at = (x: number, y: number, mx: number, my: number) => ({ x: Math.round(x * k), y: Math.round(y * k), mx: Math.round(mx * k), my: Math.round(my * k) });

/**
 * Pocket contents on the course poster. Left and right are the soldier's own (the photo's
 * right is his left). The drawing shows no lower-leg pockets, so those markers point to
 * where they are on the trousers.
 */
export const pocketFigure: Figure = {
  id: 'pockets', ...poster,
  alt: 'Zīmēts karavīrs kaujas formas tērpā no priekšpuses, ar karoga uzšuvi uz labās piedurknes',
  caption: 'Kabatu saturs pēc kursa kārtības. Kreisā un labā puse ir paša karavīra puses – attēlā karavīra kreisā puse ir pa labi. Apakšstilba kabatu vietas zīmējumā norādītas aptuveni.',
  credit: courseCredit('kursa dalībnieks', 'izmantots ar autora atļauju', 'pievienoti marķieri'),
  quiz: 'Kas pēc kursa kārtības glabājas attēlā norādītajā kabatā?',
  spots: [
    { id: 'compass', ...at(730, 420, 905, 360), label: 'Kompass', text: 'Kreisās piedurknes kabatā.' },
    { id: 'notebook', ...at(392, 440, 215, 400), label: 'Pierakstu blociņš ar pildspalvu', text: 'Labās piedurknes kabatā. Pildspalva paliek kabatā – formas tērpa ārpusē to piestiprināt aizliegts.' },
    { id: 'id-card', ...at(645, 440, 905, 480), label: 'Apliecība', text: 'Jakas kreisajā krūšu kabatā. Zemessargam, pildot dienesta pienākumus, dienesta apliecībai jābūt klāt.' },
    { id: 'gloves', ...at(690, 850, 905, 820), label: 'Taktiskie cimdi un balaklava', text: 'Kreisajā augšstilba kabatā: taktiskie cimdi un balaklava (šalle).' },
    { id: 'free', ...at(432, 850, 215, 820), label: 'Pēc izvēles – atkarībā no uzdevuma', text: 'Labā augšstilba kabata ir brīva – tās saturu nosaka uzdevums.' },
    { id: 'medkit', ...at(705, 1040, 905, 1060), label: 'Medpakete', text: 'Kreisajā bikšu apakšstilba kabatā – visiem vienā vietā, tāpēc biedrs to atrod bez meklēšanas.' },
    { id: 'reflector', ...at(415, 1040, 215, 1060), label: 'Atstarotājs un salvetes', text: 'Labajā bikšu apakšstilba kabatā. Tumsā atstarotāju valkā transporta kustības pusē.' },
  ],
};

const rucksack = photo('rucksack-course.jpg');

/** The course's packing order for the 3-day bag; the markers are numbered in that order. */
export const threeDayFigure: Figure = {
  id: 'three-day-bag', ...rucksack,
  alt: 'Liela olīvkrāsas militārā mugursoma no priekšpuses: vāka kabata, galvenais nodalījums, divas sānu kabatas un apakšējais nodalījums',
  caption: '3 dienu somas kārtošanas secība pēc kursa materiāla. Numuri rāda secību un vietu somā.',
  credit: courseCredit('Tasmanian Tiger (ražotāja foto)', 'pirms publicēšanas pārbaudi tiesības', 'noņemti numuri un logotips, pievienoti marķieri'),
  quiz: 'Kas pēc kursa kārtības jāliek attēlā norādītajā mugursomas vietā?',
  spots: [
    { id: 'bottom', x: 257, y: 470, label: 'Sapiera lāpsta, guļammaiss un striķis', text: 'Somas apakšējā nodalījumā: sapiera lāpsta, guļammaiss un olīvkrāsas striķis – vismaz 10 m.' },
    { id: 'patrol', x: 325, y: 304, label: 'Patruļsoma', text: 'Patruļsomu pievieno mugursomai ārpusē.' },
    { id: 'side-a', x: 168, y: 283, label: 'Sausās ēdienreizes, zeķes un higiēnas preces', text: 'Sānu kabatā (attēlā pa kreisi): sausās ēdienreizes (vairāku dienu devas), sausas zeķes, higiēnas preces un citas lietas, kas ātri nepieciešamas.' },
    { id: 'side-b', x: 416, y: 261, label: 'Pēc izvēles – parasti ūdens', text: 'Otrā sānu kabatā (attēlā pa labi) – pēc brīvas izvēles; visbiežāk tur liek nepieciešamo ūdeni.' },
    { id: 'boots', x: 311, y: 405, label: 'Zābaki ūdensdrošā maisā', text: 'Galvenā nodalījuma apakšā: rezerves zābaku pāris ūdensdrošā maisā.' },
    { id: 'uniform', x: 311, y: 354, label: 'Rezerves formas tērps', text: 'Galvenajā nodalījumā virs zābakiem.' },
    { id: 'fleece', x: 308, y: 227, label: 'Silta laika jaka („lācītis”)', text: 'Galvenajā nodalījumā virs rezerves formas tērpa.' },
    { id: 'goretex', x: 301, y: 155, label: 'Gore-Tex jaka un bikses', text: 'Galvenā nodalījuma augšā: lietainam laikam, lai tās ātri paņemtu, ja laikapstākļi strauji mainās.' },
    { id: 'lid', x: 287, y: 35, label: 'Katliņš, ēdamrīki, salvetes, papīrs', text: 'Augšējā vāka kabatā: ēdiena katliņš, ēdamrīki, salvetes un tualetes papīrs.' },
  ],
};
