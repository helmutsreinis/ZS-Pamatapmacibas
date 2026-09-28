import { describe, expect, it } from 'vitest';
import { drawQuestions, scoreSession, testCode, type ExamQuestion } from './model';

const make = (topic: string, count: number): ExamQuestion[] => Array.from({ length: count }, (_, index) => ({
  id: `${topic}-${index}`, module: topic.split(':')[0], topic, prompt: `Jautājums ${index}?`, correct: 'Pareizi', wrong: ['Nē 1', 'Nē 2', 'Nē 3'], explanation: 'Skaidrojums.',
}));
const pool = [...make('m:a', 10), ...make('m:b', 30), ...make('n:c', 60)];

/** Deterministic generator so the draws are repeatable. */
function seeded(seed = 7) {
  let state = seed;
  return () => { state = (state * 16807) % 2147483647; return state / 2147483647; };
}

describe('drawing questions', () => {
  it('takes the requested number of distinct questions in proportion to the topics', () => {
    const drawn = drawQuestions(pool, { topics: ['m:a', 'm:b', 'n:c'], count: 20 }, seeded());
    expect(drawn).toHaveLength(20);
    expect(new Set(drawn.map((question) => question.id)).size).toBe(20);
    const per = (topic: string) => drawn.filter((question) => question.topic === topic).length;
    expect([per('m:a'), per('m:b'), per('n:c')]).toEqual([2, 6, 12]);
  });

  it('gives every chosen topic at least one question when there is room', () => {
    const drawn = drawQuestions([...make('x:small', 1), ...make('x:big', 99)], { topics: ['x:small', 'x:big'], count: 10 }, seeded());
    expect(drawn).toHaveLength(10);
    expect(drawn.filter((question) => question.topic === 'x:small')).toHaveLength(1);
  });

  it('uses only the chosen topics and never more questions than there are', () => {
    const drawn = drawQuestions(pool, { topics: ['m:a'], count: 40 }, seeded());
    expect(drawn).toHaveLength(10);
    expect(drawn.every((question) => question.topic === 'm:a')).toBe(true);
    expect(drawQuestions(pool, { topics: ['m:a', 'm:b'], count: 'all' }, seeded())).toHaveLength(40);
    expect(drawQuestions(pool, { topics: [], count: 20 }, seeded())).toHaveLength(0);
  });

  it('shuffles four answers with exactly one correct', () => {
    const drawn = drawQuestions(pool, { topics: ['n:c'], count: 'all' }, seeded(3));
    const positions = new Set<number>();
    for (const question of drawn) {
      expect(question.options).toHaveLength(4);
      expect(question.options.filter((option) => option.correct)).toHaveLength(1);
      expect(question.options.find((option) => option.correct)?.text).toBe(question.correct);
      positions.add(question.options.findIndex((option) => option.correct));
    }
    expect(positions.size).toBe(4);
  });
});

describe('scoring', () => {
  it('counts correct, wrong and unanswered questions against the pass mark, per topic and module', () => {
    const drawn = drawQuestions(pool, { topics: ['m:a', 'n:c'], count: 10 }, seeded());
    const answers = new Map<string, number>();
    drawn.forEach((question, index) => {
      if (index < 7) answers.set(question.id, question.options.findIndex((option) => option.correct));
      else if (index < 9) answers.set(question.id, question.options.findIndex((option) => !option.correct));
    });
    const result = scoreSession(drawn, answers, 80);
    expect(result).toMatchObject({ correct: 7, wrong: 2, unanswered: 1, total: 10, percent: 70, passed: false });
    expect(scoreSession(drawn, answers, 70).passed).toBe(true);
    const topicTotal = [...result.byTopic.values()].reduce((sum, entry) => sum + entry.total, 0);
    expect(topicTotal).toBe(10);
    expect([...result.byModule.keys()].sort()).toEqual(['m', 'n']);
    expect([...result.byModule.values()].reduce((sum, entry) => sum + entry.correct, 0)).toBe(7);
  });

  it('scores an empty answer sheet as zero without failing', () => {
    const drawn = drawQuestions(pool, { topics: ['m:a'], count: 5 }, seeded());
    expect(scoreSession(drawn, new Map(), 80)).toMatchObject({ correct: 0, unanswered: 5, percent: 0, passed: false });
  });

  it('makes test codes from a prefix, the date and four digits', () => {
    expect(testCode('KP', new Date(2026, 8, 28), () => 0.0421)).toBe('KP-20260928-0421');
    expect(testCode('IA', new Date(2026, 0, 5), () => 0.99999)).toBe('IA-20260105-9999');
  });
});
