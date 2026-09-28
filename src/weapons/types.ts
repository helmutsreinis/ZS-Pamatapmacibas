import type { SceneModel } from '../scene/model';

/** One step of a weapon's field strip, in the course order. */
export type Step = {
  id: string;
  /** Disassembly action as supplied for the course; this is also the order-test answer key. */
  label: string;
  assemblyLabel: string;
  part: string;
  /** The part name covers two parts (changes the question wording). */
  plural?: boolean;
  function: string;
  explanation: string;
  /** Short direction shown next to the part on the stage. */
  hint: string;
  /** The direction as an exam answer, when the stage hint is phrased as a command. */
  direction?: string;
  assemblyHint: string;
  /** How the part moves during disassembly. */
  action: string;
  /** How the part moves during assembly. */
  assemblyAction: string;
  tip?: string;
  assemblyTip?: string;
  /** Recommended practice shown as "IETEIKUMS" (e.g. where to keep removed pins). */
  advice?: string;
  assemblyAdvice?: string;
  /** Terminology note for the instructor: the term in the official manual. */
  term?: string;
  source: string;
  sourceName: string;
};

/** Unscored stage before disassembly (safety check) or after assembly (function check). */
export type Stage = { id: 'prep' | 'check'; label: string; part: string; hint: string; action: string; explanation: string; source: string; sourceName: string };

/** A theory question about the weapon (technical data, how it works), with its source. */
export type TheoryQuestion = { id: string; prompt: string; correct: string; wrong: string[]; explanation: string; source: string; sourceName: string };

export type WeaponModule = {
  id: string;
  name: string;
  title: string;
  technical: { calibre: string; length: string; barrel: string; source: string; sourceName: string };
  /** Technical data and operation, asked in the exams next to the questions built from the steps. */
  theory?: TheoryQuestion[];
  /** Background photo for the module's page headers (the site default when absent). */
  photo?: string;
  /** Photo of the field-stripped parts, shown with the sources on the hub. */
  cover?: string;
  /** Credit for photos that require attribution. */
  credit?: { text: string; url: string };
  /** Extra note next to the learning stage (what the animation simplifies). */
  note?: string;
  /** Which side of the weapon the pictures show, e.g. "SKATS NO KREISĀS PUSES". */
  view: string;
  steps: Step[];
  prep: Stage;
  finalCheck: Stage;
  scene: SceneModel;
  /** Parts shown for each step (part card, questions); `prep` and `check` included. */
  stepParts: Record<string, string[]>;
  /** Steps whose parts look alike in a photo; never offered as each other's distractor. */
  lookAlike: string[][];
  /** Where the module's content comes from; `short` is the name on the hub. */
  sources: { label: string; short: string; url: string }[];
};
