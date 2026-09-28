import { describe, expect, it } from 'vitest';
import { weapons } from '../modules';
import { weaponQuestionSource } from './questions';

describe.each(Object.values(weapons))('$name exam questions', (weapon) => {
  const source = weaponQuestionSource(weapon);
  let seed = 11;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const questions = source.questions(random);

  it('generates as many questions as each topic announces, with unique ids', () => {
    for (const topic of source.topics) expect(questions.filter((question) => question.topic === topic.key), topic.key).toHaveLength(topic.count);
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length);
  });

  it('offers three distinct wrong answers that differ from the correct one', () => {
    for (const question of questions) {
      expect(question.wrong, question.id).toHaveLength(3);
      expect(new Set([question.correct, ...question.wrong]).size, question.id).toBe(4);
      expect(question.prompt, question.id).toMatch(/\?$/);
    }
  });

  it('states directions as movements, not as commands', () => {
    for (const question of questions.filter((item) => item.id.includes(':direction:'))) {
      for (const text of [question.correct, ...question.wrong]) expect(text, question.id).not.toMatch(/^(Pagriez|Atāķē|Noskrūvē|Uzskrūvē|Izņem|Nospied|Pavelc) /);
    }
  });

  it('names every part differently, so a photo has one right name', () => {
    expect(new Set(weapon.steps.map((step) => step.part)).size).toBe(weapon.steps.length);
  });

  it('never offers a look-alike part as the wrong answer to a photo', () => {
    for (const group of weapon.lookAlike) {
      const names = weapon.steps.filter((step) => group.includes(step.id)).map((step) => step.part);
      for (const id of group) {
        const question = questions.find((item) => item.id === `${weapon.id}:photo:${id}`);
        expect(question, id).toBeDefined();
        for (const wrong of question?.wrong ?? []) expect(names, `${id}: ${wrong}`).not.toContain(wrong);
      }
    }
  });

  it('shows a photo of the part for part questions but not for order and theory questions', () => {
    for (const question of questions) {
      if (question.id.includes(':order:') || question.id.includes(':theory:')) expect(question.media, question.id).toBeUndefined();
      else expect(weapon.stepParts[question.media?.stepId ?? '']?.length, question.id).toBeGreaterThan(0);
    }
  });
});
