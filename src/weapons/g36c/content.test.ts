import { describe, expect, it } from 'vitest';
import { plural } from '../../lv';
import { finalCheck, prep, steps } from './content';

const texts = [...steps.flatMap((step) => [step.label, step.assemblyLabel, step.part, step.function, step.explanation, step.action, step.assemblyAction, step.hint, step.assemblyHint, step.tip ?? '', step.assemblyTip ?? '', step.term ?? '']),
  prep.label, prep.action, prep.explanation, finalCheck.label, finalCheck.action, finalCheck.explanation];

describe('Latvian content', () => {
  it('describes every step in both directions', () => {
    for (const step of steps) {
      for (const field of ['label', 'assemblyLabel', 'part', 'function', 'explanation', 'action', 'assemblyAction', 'hint', 'assemblyHint'] as const) {
        expect(step[field].trim(), `${step.id}.${field}`).not.toBe('');
      }
    }
    expect(new Set(steps.map((step) => step.function)).size).toBe(steps.length);
  });

  it('uses the agreed spellings', () => {
    const all = texts.join('\n');
    expect(all).not.toMatch(/pistolveida/i);
    expect(all).not.toMatch(/\d\.\d/);            // decimal comma, e.g. 5,56
    expect(all).not.toMatch(/ {2,}|\s[,.;:]/);     // no double spaces or space before punctuation
    expect(all).not.toMatch(/shēmatisk/i);
  });

  it('writes sentences with a capital letter and final full stop', () => {
    for (const step of steps) {
      for (const sentence of [step.function, step.explanation, step.action, step.assemblyAction]) {
        expect(sentence, step.id).toMatch(/^[A-ZĀČĒĢĪĶĻŅŠŪŽ].*[.]$/u);
      }
    }
  });

  it('agrees nouns with numbers', () => {
    expect(plural(1, 'jautājums', 'jautājumi')).toBe('jautājums');
    expect(plural(21, 'jautājums', 'jautājumi')).toBe('jautājums');
    expect(plural(11, 'jautājums', 'jautājumi')).toBe('jautājumi');
    expect(plural(16, 'jautājums', 'jautājumi')).toBe('jautājumi');
    expect(plural(0, 'jautājums', 'jautājumi')).toBe('jautājumi');
  });
});
