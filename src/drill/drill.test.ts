import { describe, expect, it } from 'vitest';
import { chapters, drillQuestions, drillSource } from './index';

describe('drill question bank', () => {
  it('has ten chapters of ten questions with unique ids', () => {
    expect(chapters).toHaveLength(10);
    for (const chapter of chapters) expect(chapter.questions, chapter.title).toHaveLength(10);
    expect(new Set(drillQuestions.map((question) => question.id)).size).toBe(100);
    expect(chapters.map((chapter) => chapter.number)).toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
  });

  it('gives every question one correct and three different wrong answers', () => {
    for (const question of drillQuestions) {
      expect(question.wrong, question.id).toHaveLength(3);
      expect(new Set([question.correct, ...question.wrong]).size, question.id).toBe(4);
      for (const text of [question.prompt, question.correct, question.explanation, ...question.wrong]) expect(text.trim(), question.id).not.toBe('');
    }
  });

  it('refers each question to the page of its chapter', () => {
    for (const chapter of chapters) {
      for (const question of chapter.questions) {
        expect(question.page, question.id).toBe(Number(chapter.number));
        expect(question.id.startsWith(`${chapter.number}-`), question.id).toBe(true);
      }
    }
  });

  it('uses Latvian typography: en dashes, no double spaces, questions end with a question mark', () => {
    for (const question of drillQuestions) {
      const texts = [question.prompt, question.correct, question.explanation, ...question.wrong];
      for (const text of texts) {
        expect(text, question.id).not.toMatch(/—/);
        expect(text, question.id).not.toMatch(/ {2,}|\s[,.;:?!]/);
      }
      expect(question.prompt, question.id).toMatch(/\?$/);
    }
    for (const chapter of chapters) expect(chapter.title).not.toMatch(/[—–]/);
  });

  it('offers every chapter as an exam topic', () => {
    expect(drillSource.topics.map((topic) => topic.key)).toEqual(chapters.map((chapter) => chapter.key));
    const pool = drillSource.questions();
    expect(pool).toHaveLength(100);
    for (const topic of drillSource.topics) expect(pool.filter((question) => question.topic === topic.key)).toHaveLength(topic.count);
    expect(pool.every((question) => question.ref?.match(/^Mācību materiāla \d+\. lapa$/))).toBe(true);
  });
});
