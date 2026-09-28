import { drillSource } from './drill';
import { drillTabs } from './drill/tabs';
import type { QuestionSource } from './exam/model';
import { plural, upper } from './lv';
import { ammo } from './study/ammo';
import { kit } from './study/kit';
import { pictureCount } from './study/blocks';
import { studyQuestionSource } from './study/questions';
import { studyTabs } from './study/tabs';
import type { StudyModule } from './study/types';
import { ak4 } from './weapons/ak4';
import { g36 } from './weapons/g36';
import { weaponQuestionSource } from './weapons/questions';
import type { WeaponModule } from './weapons/types';

/**
 * Everything the hub offers. A weapon becomes available by adding its WeaponModule
 * (content, photo sprites and timeline) to `weapons` and a `ready` card; a study module
 * (chapters with photos and a question bank) by adding it to `studies` and a card.
 */
export type ModuleCard = {
  id: string;
  group: 'weapon' | 'drill' | 'study';
  status: 'ready' | 'planned';
  kicker: string;
  title: string;
  summary: string;
  facts: { value: string; label: string }[];
  links: { label: string; href: string; primary?: boolean }[];
};

export const weapons: Record<string, WeaponModule> = { g36, ak4 };

/** Study modules, keyed by their route id (#/municija, #/ekipejums). */
export const studies: Record<string, StudyModule> = { [ammo.id]: ammo, [kit.id]: kit };

const questionCount = (source: QuestionSource) => source.topics.reduce((sum, topic) => sum + topic.count, 0);
const questionsFact = (source: QuestionSource) => {
  const total = questionCount(source);
  return { value: String(total), label: upper(plural(total, 'jautājums', 'jautājumi')) };
};
/** One question source per weapon, shared by the hub cards and the combined exam. */
const weaponSources = Object.values(weapons).map(weaponQuestionSource);
const sourceOf = (weapon: WeaponModule) => weaponSources.find((source) => source.module === weapon.id)!;
const studySources = Object.values(studies).map(studyQuestionSource);
const studySourceOf = (study: StudyModule) => studySources.find((source) => source.module === study.id)!;

const studyCard = (study: StudyModule): ModuleCard => ({
  id: study.id, group: 'study', status: 'ready', kicker: study.kicker, title: study.name, summary: study.summary,
  facts: [
    { value: String(study.chapters.length), label: upper(plural(study.chapters.length, 'tēma', 'tēmas')) },
    questionsFact(studySourceOf(study)),
    { value: String(pictureCount(study)), label: upper(plural(pictureCount(study), 'attēls', 'attēli')) },
  ],
  links: [{ label: 'Tēmas', href: `#/${study.id}`, primary: true }, { label: 'Pārbaude', href: `#/${study.id}/parbaude` }],
});

export const modules: ModuleCard[] = [
  {
    id: 'g36', group: 'weapon', status: 'ready', kicker: 'TRIECIENŠAUTENE', title: 'G36',
    summary: 'Nepilnā izjaukšana un salikšana ar reālu detaļu fotoattēliem. Katra kustība atbilst Bundesvēra rokasgrāmatai.',
    facts: [{ value: String(g36.steps.length), label: 'POSMI' }, { value: '2', label: 'VIRZIENI' }, questionsFact(sourceOf(g36))],
    links: [{ label: 'Mācību režīms', href: '#/g36/macibas', primary: true }, { label: 'Pašpārbaude', href: '#/g36/parbaude' }],
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
  studyCard(ammo),
  studyCard(kit),
];

/** 'ierinda', 'kopeja' or the id of a study module. */
export type ExamKind = string;

export type ExamDefinition = {
  kind: ExamKind;
  kicker: string;
  title: string;
  /** Browser tab title. */
  pageTitle: string;
  lead: string;
  /** Where the questions come from, shown next to the set-up form. */
  notice: string;
  codePrefix: string;
  sources: QuestionSource[];
  defaults: { count: number | 'all'; pass: number };
  /** The module's tabs, shown under the test's page header. */
  tabs?: (active: 'topics' | 'test') => string;
};

const studyExam = (study: StudyModule): ExamDefinition => ({
  kind: study.id, kicker: `${study.kicker} · PĀRBAUDE`, title: `${upper(study.genitive)} <em>PĀRBAUDE.</em>`, pageTitle: `${study.genitive} pārbaude`,
  lead: 'Izvēlies tēmas, jautājumu skaitu un režīmu. Pārbaudes režīmā atbildes redzēsi pēc iesniegšanas, mācību režīmā – uzreiz.',
  notice: study.notice, codePrefix: study.codePrefix, sources: [studySourceOf(study)], defaults: { count: 20, pass: 80 },
  tabs: (active) => studyTabs(study, active),
});

export const exams: Record<ExamKind, ExamDefinition> = {
  ierinda: {
    kind: 'ierinda', kicker: 'IERINDAS MĀCĪBA · PĀRBAUDE', title: 'IERINDAS <em>PĀRBAUDE.</em>', pageTitle: 'Ierindas pārbaude',
    lead: 'Izvēlies tēmas, jautājumu skaitu un režīmu. Pārbaudes režīmā atbildes redzēsi pēc iesniegšanas, mācību režīmā – uzreiz.',
    notice: 'Šis ir neoficiāls pašpārbaudes rīks, kas veidots no iesniegtā desmit lappušu ierindas mācību materiāla. Praktiskos paņēmienus apgūst instruktora vadībā.',
    codePrefix: 'IA', sources: [drillSource], defaults: { count: 40, pass: 80 }, tabs: drillTabs,
  },
  ...Object.fromEntries(Object.values(studies).map((study) => [study.id, studyExam(study)])),
  kopeja: {
    kind: 'kopeja', kicker: 'KOPĒJĀ ZINĀŠANU PĀRBAUDE', title: 'VISAS <em>ZINĀŠANAS.</em>', pageTitle: 'Kopējā pārbaude',
    lead: 'Viens tests par visiem moduļiem: ieroču detaļām, to funkcijām, izjaukšanas secību un tehniskajiem datiem, ierindas mācību, munīciju un ekipējumu. Jautājumi tiek sadalīti proporcionāli izvēlētajām tēmām.',
    notice: 'Ieroču jautājumi veidoti no moduļu mācību satura – detaļu funkcijām, fotoattēliem, kustību virzieniem, izjaukšanas secības un tehniskajiem datiem, ierindas jautājumi – no ierindas mācību materiāla, munīcijas un ekipējuma jautājumi – no šo moduļu tēmām un to avotiem. Praktiskās darbības ar ieroci un munīciju veic tikai instruktora vadībā.',
    codePrefix: 'KP', sources: [...weaponSources, drillSource, ...studySources], defaults: { count: 60, pass: 80 },
  },
};
