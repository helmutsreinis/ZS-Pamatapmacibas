import { describe, expect, it } from 'vitest';
import { steps } from './g36c/content';
import { makeQuestions, scoreAnswers, scoreOrder, shuffle } from './quiz';

describe('quiz rules', () => {
  it('shuffles without changing the original list or losing an item', () => {
    const original = steps.map((step) => step.id);
    const result = shuffle(original, () => 0);
    expect(result).toHaveLength(16);
    expect(new Set(result).size).toBe(16);
    expect(original).toEqual(steps.map((step) => step.id));
    expect(result).not.toEqual(original);
  });

  it('asks every distinct part once with one correct answer among five unique choices', () => {
    const questions = makeQuestions(steps, () => 0.36);
    expect(questions).toHaveLength(16);
    expect(new Set(questions.map((question) => question.stepId)).size).toBe(16);
    for (const question of questions) {
      expect(question.choices).toHaveLength(5);
      expect(new Set(question.choices).size).toBe(5);
      expect(question.choices.filter((choice) => choice === question.correct)).toHaveLength(1);
    }
  });

  it('scores only exact order positions and actual selected functions', () => {
    const ordered = steps.map((step) => step.id);
    expect(scoreOrder(ordered, steps)).toBe(16);
    const swapped = [...ordered];
    [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
    expect(scoreOrder(swapped, steps)).toBe(14);
    const questions = makeQuestions(steps, () => 0.52);
    const answers = Object.fromEntries(questions.map((question) => [question.stepId, question.correct]));
    expect(scoreAnswers(questions, answers)).toBe(16);
    answers[questions[0].stepId] = questions[0].choices.find((choice) => choice !== questions[0].correct) ?? '';
    expect(scoreAnswers(questions, answers)).toBe(15);
  });
});
