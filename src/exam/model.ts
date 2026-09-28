import { shuffle, type Random } from '../random';

/** One multiple-choice question from any module, with one correct and three wrong answers. */
export type ExamQuestion = {
  id: string;
  module: string;
  /** Topic key used for selection and the results breakdown. */
  topic: string;
  prompt: string;
  correct: string;
  wrong: string[];
  explanation: string;
  /** Where the answer comes from, e.g. "Mācību materiāla 3. lapa". */
  ref?: string;
  /** Photo of weapon parts shown with the question. */
  media?: { weapon: string; stepId: string; label: string };
  /** Photo shown with the question, with one marker. */
  image?: ExamImage;
};

/** A photo with one marker at (x, y) in its pixels; `credit` is the author and licence line. */
export type ExamImage = { src: string; width: number; height: number; alt: string; x: number; y: number; credit: string };

export type Topic = { key: string; module: string; label: string; count: number };

/** A module's contribution to exams: its topics and a fresh question pool. */
export type QuestionSource = {
  module: string;
  name: string;
  topics: Topic[];
  /** Build the pool; generated questions may pick new distractors every time. */
  questions: (random?: Random) => ExamQuestion[];
};

export type Option = { text: string; correct: boolean };
export type SessionQuestion = ExamQuestion & { options: Option[] };

export type ExamConfig = {
  topics: string[];
  count: number | 'all';
  mode: 'exam' | 'training';
  /** Seconds, 0 = no limit. */
  time: number;
  /** Pass mark in percent. */
  pass: number;
  candidate: string;
};

/**
 * Take `count` questions from the chosen topics, in proportion to the topics' sizes
 * (largest remainder), so every chosen topic is represented. Order and answers are shuffled.
 */
export function drawQuestions(pool: ExamQuestion[], config: Pick<ExamConfig, 'topics' | 'count'>, random?: Random): SessionQuestion[] {
  const chosen = pool.filter((question) => config.topics.includes(question.topic));
  const byTopic = new Map<string, ExamQuestion[]>();
  for (const question of chosen) byTopic.set(question.topic, [...(byTopic.get(question.topic) ?? []), question]);
  const total = chosen.length;
  const wanted = config.count === 'all' ? total : Math.min(config.count, total);
  const groups = [...byTopic.values()];
  const quotas = groups.map((group) => (group.length / Math.max(total, 1)) * wanted);
  const taken = quotas.map((quota, i) => Math.min(groups[i].length, Math.floor(quota)));
  // Give each topic at least one question when there is room for all of them.
  if (wanted >= groups.length) taken.forEach((value, i) => { if (value === 0 && groups[i].length) taken[i] = 1; });
  let remaining = wanted - taken.reduce((sum, value) => sum + value, 0);
  const order = quotas.map((quota, i) => ({ i, rest: quota - Math.floor(quota) })).sort((a, b) => b.rest - a.rest);
  while (remaining > 0) {
    let progressed = false;
    for (const { i } of order) {
      if (remaining > 0 && taken[i] < groups[i].length) { taken[i] += 1; remaining -= 1; progressed = true; }
    }
    if (!progressed) break;
  }
  while (remaining < 0) {
    const i = taken.indexOf(Math.max(...taken));
    taken[i] -= 1;
    remaining += 1;
  }
  const picked = groups.flatMap((group, i) => shuffle(group, random).slice(0, taken[i]));
  return shuffle(picked, random).map((question) => ({
    ...question,
    options: shuffle([{ text: question.correct, correct: true }, ...question.wrong.map((text) => ({ text, correct: false }))], random),
  }));
}

export type Result = {
  correct: number;
  wrong: number;
  unanswered: number;
  total: number;
  percent: number;
  passed: boolean;
  rows: { question: SessionQuestion; chosen: Option | null; isCorrect: boolean }[];
  byTopic: Map<string, { correct: number; total: number }>;
  byModule: Map<string, { correct: number; total: number }>;
};

export function scoreSession(questions: SessionQuestion[], answers: ReadonlyMap<string, number>, pass: number): Result {
  const rows = questions.map((question) => {
    const index = answers.get(question.id);
    const chosen = index === undefined ? null : question.options[index] ?? null;
    return { question, chosen, isCorrect: !!chosen?.correct };
  });
  const tally = (key: (row: typeof rows[number]) => string) => {
    const map = new Map<string, { correct: number; total: number }>();
    for (const row of rows) {
      const entry = map.get(key(row)) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (row.isCorrect) entry.correct += 1;
      map.set(key(row), entry);
    }
    return map;
  };
  const correct = rows.filter((row) => row.isCorrect).length;
  const unanswered = rows.filter((row) => !row.chosen).length;
  const total = rows.length;
  const percent = total ? Math.round((correct / total) * 100) : 0;
  return {
    correct, unanswered, total, percent, wrong: total - correct - unanswered, passed: percent >= pass, rows,
    byTopic: tally((row) => row.question.topic), byModule: tally((row) => row.question.module),
  };
}

export function testCode(prefix: string, now = new Date(), random = Math.random): string {
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `${prefix}-${stamp}-${String(Math.floor(random() * 10000)).padStart(4, '0')}`;
}
