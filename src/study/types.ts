/**
 * A study module: chapters of explanations with photos and diagrams, plus a question bank.
 * Munīcija and Ekipējums are study modules; they share the chapter page, the tests and the hub card.
 */

/** Where a picture comes from; shown under the picture and in the site footer. */
export type Credit = {
  /** Author or owner, e.g. "Ministru kabinets" or a Wikimedia Commons user. */
  author: string;
  /** Where the picture was published, e.g. "Wikimedia Commons", or "kursa materiāls". */
  source: string;
  /** Page of the picture; course material has none. */
  url?: string;
  licence: string;
  licenceUrl?: string;
  /** What was changed, e.g. "izgriezts un samazināts". */
  changes?: string;
};

/** A numbered marker on a photo. Coordinates are in the photo's pixels. */
export type Spot = {
  id: string;
  x: number;
  y: number;
  /** Where the numbered marker sits when it points at (x, y) with a leader line (dense details). */
  mx?: number;
  my?: number;
  label: string;
  text: string;
  /** Asked as "what is marked here?" in the tests (default: yes). */
  quiz?: boolean;
};

/** A line drawn over a photo, e.g. a dimension line (photo pixels). */
export type Line = { x1: number; y1: number; x2: number; y2: number; label?: string; kind?: 'dimension' | 'leader' };

export type Figure = {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  credit: Credit;
  spots: Spot[];
  lines?: Line[];
  /** Question asked for every marker, e.g. "Kā sauc attēlā ar marķieri norādīto patronas daļu?". */
  quiz?: string;
};

export type Picture = { src: string; width: number; height: number; alt: string; credit: Credit };

/** A card in a grid, e.g. one cartridge type or one piece of equipment. */
export type Card = {
  id: string;
  title: string;
  kicker?: string;
  picture?: Picture;
  /** Colour marking, e.g. the painted tip of a cartridge. */
  swatch?: { colours: string[]; label: string };
  facts?: { label: string; value: string }[];
  text: string;
};

export type Block =
  | { kind: 'text'; paragraphs: string[] }
  | { kind: 'figure'; figure: Figure }
  | { kind: 'cards'; title?: string; cards: Card[] }
  | { kind: 'table'; caption: string; head: string[]; rows: string[][] }
  /** Numbered steps in a fixed order, e.g. how a bag is packed. */
  | { kind: 'sequence'; title: string; lead?: string; items: { title: string; text: string; tag?: string }[]; note?: string }
  | { kind: 'callout'; tone: 'safety' | 'note' | 'course'; title: string; text: string }
  | { kind: 'list'; title: string; items: string[]; note?: string }
  /** A designation split into its parts, e.g. "5,56 × 45 mm NATO". */
  | { kind: 'decode'; title: string; parts: { value: string; label: string; text: string }[] };

export type StudyChapter = {
  /** "01", "02" … – also the route (#/municija/tema-02) and the exam topic. */
  number: string;
  title: string;
  lead: string;
  blocks: Block[];
  /** Keys of `StudyModule.sources`. */
  sources: string[];
};

export type StudyQuestion = {
  id: string;
  /** Chapter number the question belongs to. */
  chapter: string;
  prompt: string;
  correct: string;
  wrong: [string, string, string];
  explanation: string;
  /** Key of `StudyModule.sources`. */
  source: string;
};

export type StudySource = { label: string; short: string; url?: string };

export type StudyModule = {
  id: string;
  name: string;
  /** Name in the genitive, for "Munīcijas pārbaude", "Ekipējuma pārbaude". */
  genitive: string;
  /** Hub card and page kicker, e.g. "MUNĪCIJA". */
  kicker: string;
  /** Page title; may contain <em>. */
  title: string;
  lead: string;
  summary: string;
  chapters: StudyChapter[];
  questions: StudyQuestion[];
  sources: Record<string, StudySource>;
  /** Shown next to the test set-up form. */
  notice: string;
  codePrefix: string;
};
