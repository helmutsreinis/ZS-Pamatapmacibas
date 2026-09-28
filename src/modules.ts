import { drillSource } from './drill';
import type { QuestionSource } from './exam/model';
import { plural, upper } from './lv';
import { ak4 } from './weapons/ak4';
import { g36c } from './weapons/g36c';
import { weaponQuestionSource } from './weapons/questions';
import type { WeaponModule } from './weapons/types';

/**
 * Everything the hub offers. A weapon becomes available by adding its WeaponModule
 * (content, photo sprites and timeline) to `weapons` and a `ready` card.
 */
export type ModuleCard = {
  id: string;
  group: 'weapon' | 'drill';
  status: 'ready' | 'planned';
  kicker: string;
  title: string;
  summary: string;
  facts: { value: string; label: string }[];
  links: { label: string; href: string; primary?: boolean }[];
};

export const weapons: Record<string, WeaponModule> = { g36c, ak4 };

const questionCount = (source: QuestionSource) => source.topics.reduce((sum, topic) => sum + topic.count, 0);
const questionsFact = (source: QuestionSource) => {
  const total = questionCount(source);
  return { value: String(total), label: upper(plural(total, 'jautājums', 'jautājumi')) };
};
/** One question source per weapon, shared by the hub cards and the combined exam. */
const weaponSources = Object.values(weapons).map(weaponQuestionSource);
const sourceOf = (weapon: WeaponModule) => weaponSources.find((source) => source.module === weapon.id)!;

export const modules: ModuleCard[] = [
  {
    id: 'g36c', group: 'weapon', status: 'ready', kicker: 'TRIECIENŠAUTENE', title: 'G36C',
    summary: 'Nepilnā izjaukšana un salikšana ar reālu detaļu fotoattēliem. Katra kustība atbilst Bundesvēra rokasgrāmatai.',
    facts: [{ value: String(g36c.steps.length), label: 'POSMI' }, { value: '2', label: 'VIRZIENI' }, questionsFact(sourceOf(g36c))],
    links: [{ label: 'Mācību režīms', href: '#/g36c/macibas', primary: true }, { label: 'Pašpārbaude', href: '#/g36c/parbaude' }],
  },
  {
    id: 'ak4', group: 'weapon', status: 'ready', kicker: 'TRIECIENŠAUTENE', title: 'AK-4',
    summary: 'Nepilnā izjaukšana un salikšana ar reālu detaļu fotoattēliem Jaunsarga rokasgrāmatas secībā; kustības atbilst G3 dienesta instrukcijai.',
    facts: [{ value: String(ak4.steps.length), label: 'POSMI' }, { value: '2', label: 'VIRZIENI' }, questionsFact(sourceOf(ak4))],
    links: [{ label: 'Mācību režīms', href: '#/ak4/macibas', primary: true }, { label: 'Pašpārbaude', href: '#/ak4/parbaude' }],
  },
  {
    id: 'ierinda', group: 'drill', status: 'ready', kicker: 'IERINDAS MĀCĪBA', title: 'Ierinda',
    summary: 'Jēdzieni, pienākumi, stājas, komandas, soļošana un sveicināšana – desmit tēmas ar skaidrojumiem un pārbaudi.',
    facts: [{ value: String(drillSource.topics.length), label: 'TĒMAS' }, questionsFact(drillSource), { value: '2', label: 'REŽĪMI' }],
    links: [{ label: 'Tēmas', href: '#/ierinda', primary: true }, { label: 'Pārbaude', href: '#/ierinda/parbaude' }],
  },
];

export type ExamKind = 'ierinda' | 'kopeja';

export type ExamDefinition = {
  kind: ExamKind;
  kicker: string;
  title: string;
  lead: string;
  /** Where the questions come from, shown next to the set-up form. */
  notice: string;
  codePrefix: string;
  sources: QuestionSource[];
  defaults: { count: number | 'all'; pass: number };
};

export const exams: Record<ExamKind, ExamDefinition> = {
  ierinda: {
    kind: 'ierinda', kicker: 'IERINDAS MĀCĪBA · PĀRBAUDE', title: 'IERINDAS <em>PĀRBAUDE.</em>',
    lead: 'Izvēlies tēmas, jautājumu skaitu un režīmu. Pārbaudes režīmā atbildes redzēsi pēc iesniegšanas, mācību režīmā – uzreiz.',
    notice: 'Šis ir neoficiāls pašpārbaudes rīks, kas veidots no iesniegtā desmit lappušu ierindas mācību materiāla. Praktiskos paņēmienus apgūst instruktora vadībā.',
    codePrefix: 'IA', sources: [drillSource], defaults: { count: 40, pass: 80 },
  },
  kopeja: {
    kind: 'kopeja', kicker: 'KOPĒJĀ ZINĀŠANU PĀRBAUDE', title: 'VISAS <em>ZINĀŠANAS.</em>',
    lead: 'Viens tests par visiem moduļiem: ieroču detaļām, to funkcijām, izjaukšanas secību un tehniskajiem datiem, kā arī ierindas mācību. Jautājumi tiek sadalīti proporcionāli izvēlētajām tēmām.',
    notice: 'Ieroču jautājumi veidoti no moduļu mācību satura – detaļu funkcijām, fotoattēliem, kustību virzieniem, izjaukšanas secības un tehniskajiem datiem, ierindas jautājumi – no ierindas mācību materiāla. Praktiskās darbības ar ieroci veic tikai instruktora vadībā.',
    codePrefix: 'KP', sources: [...weaponSources, drillSource], defaults: { count: 60, pass: 80 },
  },
};
