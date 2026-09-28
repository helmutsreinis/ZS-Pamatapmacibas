import bank from './ierinda-bank.json';
import type { ExamQuestion, QuestionSource } from '../exam/model';

/** A question from the drill-training material, as supplied. */
export type DrillQuestion = { id: string; chapter: string; page: number; prompt: string; correct: string; wrong: string[]; explanation: string };

/** Latvian typography uses the en dash for "domuzīme"; the supplied bank mixes in em dashes. */
const dash = (text: string) => text.replace(/—/g, '–');

export const drillQuestions: DrillQuestion[] = (bank as DrillQuestion[]).map((question) => ({
  ...question,
  prompt: dash(question.prompt), correct: dash(question.correct), wrong: question.wrong.map(dash), explanation: dash(question.explanation),
}));

export type Chapter = { key: string; number: string; title: string; page: number; questions: DrillQuestion[] };

/** "01 — Ierindas pamati" → number "01", title "Ierindas pamati". */
export const chapters: Chapter[] = [...new Set(drillQuestions.map((question) => question.chapter))].map((chapter) => {
  const [number, ...rest] = chapter.split(' — ');
  const questions = drillQuestions.filter((question) => question.chapter === chapter);
  return { key: `ierinda:${number}`, number, title: rest.join(' – '), page: questions[0].page, questions };
});

export const drillSource: QuestionSource = {
  module: 'ierinda',
  name: 'Ierindas mācība',
  topics: chapters.map((chapter) => ({ key: chapter.key, module: 'ierinda', label: `${chapter.number} · ${chapter.title}`, count: chapter.questions.length })),
  questions: (): ExamQuestion[] => drillQuestions.map((question) => ({
    id: `ierinda:${question.id}`, module: 'ierinda', topic: `ierinda:${question.id.slice(0, 2)}`,
    prompt: question.prompt, correct: question.correct, wrong: question.wrong, explanation: question.explanation,
    ref: `Mācību materiāla ${question.page}. lapa`,
  })),
};
