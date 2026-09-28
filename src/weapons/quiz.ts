import { shuffle } from '../random';
import type { Step } from './types';

export { shuffle };

export type Question = {
  stepId: string;
  part: string;
  correct: string;
  choices: string[];
  explanation: string;
};

export function makeQuestions(steps: readonly Step[], random: () => number = Math.random): Question[] {
  return shuffle(steps, random).map((step) => {
    const distractors = shuffle(
      [...new Set(steps.filter((candidate) => candidate.id !== step.id).map((candidate) => candidate.function))],
      random,
    ).slice(0, 4);
    return {
      stepId: step.id,
      part: step.part,
      correct: step.function,
      choices: shuffle([step.function, ...distractors], random),
      explanation: step.explanation,
    };
  });
}

export function scoreOrder(order: readonly string[], correct: readonly Step[]): number {
  return order.reduce((score, id, index) => score + Number(id === correct[index]?.id), 0);
}

export function scoreAnswers(questions: readonly Question[], answers: Readonly<Record<string, string>>): number {
  return questions.reduce((score, question) => score + Number(answers[question.stepId] === question.correct), 0);
}
