import { describe, expect, it } from 'vitest';
import { studies } from '../modules';
import { figuresOf } from './blocks';
import { studyQuestionSource } from './questions';

const modules = Object.values(studies);

/** Latvian typography used on the site: en dashes, no double spaces or spaces before punctuation. */
function expectTypography(text: string, where: string) {
  expect(text, where).not.toMatch(/—/);
  // A space before a dot is fine only in inch calibres such as ".223".
  expect(text, where).not.toMatch(/ {2,}|\s[,;:?!]|\s\.(?!\d)/);
  expect(text.trim(), where).toBe(text);
  expect(text, where).not.toBe('');
}

describe.each(modules)('$name study module', (module) => {
  const figures = module.chapters.flatMap((chapter) => figuresOf(chapter.blocks));

  it('numbers its chapters 01, 02 … and cites known sources', () => {
    expect(module.chapters.map((chapter) => chapter.number)).toEqual(module.chapters.map((_, index) => String(index + 1).padStart(2, '0')));
    for (const chapter of module.chapters) {
      expect(chapter.blocks.length, chapter.title).toBeGreaterThan(0);
      for (const key of chapter.sources) expect(module.sources[key], `${chapter.number}: ${key}`).toBeDefined();
      expectTypography(chapter.title, chapter.number);
      expectTypography(chapter.lead, chapter.number);
    }
  });

  it('gives every question one correct and three different wrong answers from a known source', () => {
    const ids = module.questions.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
    const chapters = new Set(module.chapters.map((chapter) => chapter.number));
    for (const question of module.questions) {
      expect(chapters.has(question.chapter), question.id).toBe(true);
      expect(module.sources[question.source], `${question.id}: ${question.source}`).toBeDefined();
      expect(new Set([question.correct, ...question.wrong]).size, question.id).toBe(4);
      for (const text of [question.prompt, question.correct, question.explanation, ...question.wrong]) expectTypography(text, question.id);
      expect(question.prompt, question.id).toMatch(/\?$/);
    }
  });

  it('does not give the answer away by its length', () => {
    const longest = module.questions.filter((question) => question.wrong.every((wrong) => question.correct.length > wrong.length));
    expect(longest.length / module.questions.length, longest.map((question) => question.id).join(', ')).toBeLessThanOrEqual(0.4);
    const far = module.questions.filter((question) => question.correct.length > 1.6 * Math.max(...question.wrong.map((wrong) => wrong.length)));
    expect(far.map((question) => question.id)).toEqual([]);
  });

  it('places every figure marker on its photo, with unique ids and a credit', () => {
    expect(new Set(figures.map((figure) => figure.id)).size).toBe(figures.length);
    for (const figure of figures) {
      expect(new Set(figure.spots.map((spot) => spot.id)).size, figure.id).toBe(figure.spots.length);
      for (const spot of figure.spots) {
        expect(spot.x, `${figure.id}/${spot.id}`).toBeGreaterThanOrEqual(0);
        expect(spot.x, `${figure.id}/${spot.id}`).toBeLessThanOrEqual(figure.width);
        expect(spot.y, `${figure.id}/${spot.id}`).toBeGreaterThanOrEqual(0);
        expect(spot.y, `${figure.id}/${spot.id}`).toBeLessThanOrEqual(figure.height);
        if (spot.mx !== undefined || spot.my !== undefined) {
          expect(spot.mx !== undefined && spot.my !== undefined, `${figure.id}/${spot.id}: both mx and my`).toBe(true);
          expect(spot.mx! >= 0 && spot.mx! <= figure.width && spot.my! >= 0 && spot.my! <= figure.height, `${figure.id}/${spot.id}: marker on the photo`).toBe(true);
        }
        expectTypography(spot.label, `${figure.id}/${spot.id}`);
        expectTypography(spot.text, `${figure.id}/${spot.id}`);
      }
      for (const line of figure.lines ?? []) {
        for (const [x, y] of [[line.x1, line.y1], [line.x2, line.y2]]) {
          expect(x >= 0 && x <= figure.width && y >= 0 && y <= figure.height, `${figure.id} line`).toBe(true);
        }
      }
      for (const field of ['author', 'source', 'licence'] as const) expect(figure.credit[field], `${figure.id}: ${field}`).toBeTruthy();
      if (figure.credit.url !== undefined) expect(figure.credit.url, `${figure.id}: url`).toMatch(/^https?:\/\//);
      expectTypography(figure.caption, figure.id);
      expectTypography(figure.alt, figure.id);
      if (figure.quiz) {
        const labels = figure.spots.filter((spot) => spot.quiz !== false).map((spot) => spot.label);
        expect(new Set(labels).size, figure.id).toBe(labels.length);
        expect(labels.length, figure.id).toBeGreaterThanOrEqual(4);
        expect(figure.quiz, figure.id).toMatch(/\?$/);
      }
    }
  });

  it('credits every card picture', () => {
    for (const chapter of module.chapters) {
      for (const block of chapter.blocks) {
        if (block.kind !== 'cards') continue;
        for (const card of block.cards) {
          expectTypography(card.title, card.id);
          expectTypography(card.text, card.id);
          if (card.picture) for (const field of ['author', 'source', 'licence'] as const) expect(card.picture.credit[field], `${card.id}: ${field}`).toBeTruthy();
        }
      }
    }
  });

  it('offers one exam topic per chapter with as many questions as the pool holds', () => {
    const source = studyQuestionSource(module);
    const pool = source.questions();
    expect(source.topics.map((topic) => topic.key)).toEqual(module.chapters.map((chapter) => `${module.id}:${chapter.number}`));
    for (const topic of source.topics) {
      expect(topic.count, topic.label).toBeGreaterThan(0);
      expect(pool.filter((question) => question.topic === topic.key), topic.label).toHaveLength(topic.count);
    }
    expect(new Set(pool.map((question) => question.id)).size).toBe(pool.length);
    for (const question of pool) {
      expect(question.wrong, question.id).toHaveLength(3);
      expect(new Set([question.correct, ...question.wrong]).size, question.id).toBe(4);
    }
  });
});
