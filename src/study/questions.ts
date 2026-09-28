import type { ExamQuestion, QuestionSource, Topic } from '../exam/model';
import { shuffle, type Random } from '../random';
import { figuresOf } from './blocks';
import type { Figure, StudyChapter, StudyModule } from './types';

export const topicKey = (module: StudyModule, chapter: StudyChapter) => `${module.id}:${chapter.number}`;

const quizSpots = (figure: Figure) => (figure.quiz ? figure.spots.filter((spot) => spot.quiz !== false) : []);

/** "What is marked here?" – one question per marker of every figure that has a `quiz` prompt. */
function figureQuestions(module: StudyModule, chapter: StudyChapter, random?: Random): ExamQuestion[] {
  return figuresOf(chapter.blocks).flatMap((figure) => {
    const spots = quizSpots(figure);
    return spots.map((spot) => ({
      id: `${module.id}:figure:${figure.id}:${spot.id}`, module: module.id, topic: topicKey(module, chapter),
      prompt: figure.quiz!, correct: spot.label,
      wrong: shuffle(spots.filter((other) => other !== spot && other.label !== spot.label).map((other) => other.label), random).slice(0, 3),
      explanation: `${spot.label}. ${spot.text}`.replace(/\*\*/g, ''),
      ref: `${module.name} · ${figure.caption.replace(/\*\*/g, '')}`,
      image: { src: figure.src, width: figure.width, height: figure.height, alt: figure.alt, x: spot.x, y: spot.y, credit: `${figure.credit.author}, ${figure.credit.source}, ${figure.credit.licence}` },
    }));
  });
}

export const chapterQuestionCount = (module: StudyModule, chapter: StudyChapter) =>
  module.questions.filter((question) => question.chapter === chapter.number).length
  + figuresOf(chapter.blocks).reduce((sum, figure) => sum + quizSpots(figure).length, 0);

/** A study module in the tests: one topic per chapter, the question bank plus the marker questions. */
export function studyQuestionSource(module: StudyModule): QuestionSource {
  const topics: Topic[] = module.chapters.map((chapter) => ({
    key: topicKey(module, chapter), module: module.id, label: `${module.name} · ${chapter.title}`, count: chapterQuestionCount(module, chapter),
  }));
  const questions = (random?: Random): ExamQuestion[] => module.chapters.flatMap((chapter) => [
    ...module.questions.filter((question) => question.chapter === chapter.number).map((question) => ({
      id: `${module.id}:${question.id}`, module: module.id, topic: topicKey(module, chapter),
      prompt: question.prompt, correct: question.correct, wrong: [...question.wrong], explanation: question.explanation,
      ref: `${module.name} · ${module.sources[question.source]?.short ?? question.source}`,
    })),
    ...figureQuestions(module, chapter, random),
  ]);
  return { module: module.id, name: module.name, topics, questions };
}
