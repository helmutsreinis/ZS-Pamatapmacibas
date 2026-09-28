import { describe, expect, it } from 'vitest';
import { weapons } from '../modules';

const SENTENCE = /^[A-ZĀČĒĢĪĶĻŅŠŪŽ].*[.]$/u;

describe.each(Object.values(weapons))('$name Latvian content', (weapon) => {
  const { steps, prep, finalCheck, theory = [] } = weapon;
  const texts = [
    ...steps.flatMap((step) => [step.label, step.assemblyLabel, step.part, step.function, step.explanation, step.action, step.assemblyAction,
      step.hint, step.assemblyHint, step.direction ?? '', step.tip ?? '', step.assemblyTip ?? '', step.term ?? '']),
    prep.label, prep.action, prep.explanation, finalCheck.label, finalCheck.action, finalCheck.explanation,
    ...theory.flatMap((item) => [item.prompt, item.correct, ...item.wrong, item.explanation]),
  ];

  it('describes every step in both directions, with a different function for every part', () => {
    for (const step of steps) {
      for (const field of ['label', 'assemblyLabel', 'part', 'function', 'explanation', 'action', 'assemblyAction', 'hint', 'assemblyHint'] as const) {
        expect(step[field].trim(), `${step.id}.${field}`).not.toBe('');
      }
    }
    expect(new Set(steps.map((step) => step.function)).size).toBe(steps.length);
    expect(new Set(steps.map((step) => step.part)).size).toBe(steps.length);
  });

  it('uses the agreed spellings and typography', () => {
    const all = texts.join('\n');
    expect(all).not.toMatch(/pistolveida|shēmatisk|\bsānis\b/i);
    expect(all).not.toMatch(/\d\.\d/);             // decimal comma, e.g. 7,62 and 4,5 kg
    expect(all).not.toMatch(/ {2,}|\s[,.;:?]/);     // no double spaces or space before punctuation
    expect(all).not.toMatch(/—/);                    // Latvian uses the en dash
  });

  it('writes sentences with a capital letter and a final full stop', () => {
    for (const step of steps) {
      for (const sentence of [step.function, step.explanation, step.action, step.assemblyAction, step.tip, step.assemblyTip]) {
        if (sentence) expect(sentence, step.id).toMatch(SENTENCE);
      }
    }
    for (const stage of [prep, finalCheck]) for (const sentence of [stage.action, stage.explanation]) expect(sentence, stage.id).toMatch(SENTENCE);
  });

  it('asks theory questions with one right and three different wrong answers and a source', () => {
    expect(new Set(theory.map((item) => item.id)).size).toBe(theory.length);
    for (const item of theory) {
      expect(item.prompt, item.id).toMatch(/^[A-ZĀČĒĢĪĶĻŅŠŪŽ].*\?$/u);
      expect(item.wrong, item.id).toHaveLength(3);
      expect(new Set([item.correct, ...item.wrong]).size, item.id).toBe(4);
      expect(item.explanation, item.id).toMatch(SENTENCE);
      expect(item.source, item.id).toMatch(/^https?:\/\//);
      expect(item.sourceName.trim(), item.id).not.toBe('');
    }
  });
});
