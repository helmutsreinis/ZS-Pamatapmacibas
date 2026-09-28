import type { ExamQuestion, QuestionSource, Topic } from '../exam/model';
import { capitalise, pad } from '../lv';
import { shuffle, type Random } from '../random';
import type { Step, WeaponModule } from './types';

/** Hints that are an action rather than a direction; those steps get no direction question. */
const NOT_A_DIRECTION = ['atāķē', 'noskrūvē', 'uzskrūvē'];

/** A step's movement as an answer: "Uz kreiso pusi", "Pagriežas uz leju". */
const direction = (step: Step) => capitalise(step.direction ?? step.hint);

function pick<T>(items: T[], count: number, random?: Random): T[] {
  return shuffle(items, random).slice(0, count);
}

/**
 * Exam questions generated from a weapon's step content: part functions, recognising a
 * part from its photo, the direction each part moves, and the order of the steps; plus the
 * weapon's theory questions (technical data, operation).
 */
export function weaponQuestionSource(weapon: WeaponModule): QuestionSource {
  const { steps } = weapon;
  const topic = (key: string, label: string, count: number): Topic => ({ key: `${weapon.id}:${key}`, module: weapon.id, label: `${weapon.name} · ${label}`, count });
  const directional = steps.filter((step) => !NOT_A_DIRECTION.some((word) => step.hint.startsWith(word)));
  const topics = [
    topic('functions', 'Detaļu funkcijas', steps.length),
    topic('photos', 'Detaļu atpazīšana', steps.length),
    topic('directions', 'Izjaukšanas virzieni', directional.length),
    topic('order', 'Izjaukšanas secība', steps.length - 1),
    ...(weapon.theory?.length ? [topic('theory', 'Tehniskie dati un darbība', weapon.theory.length)] : []),
  ];
  const ref = (source: string) => `${weapon.name} · ${source}`;
  const alike = (id: string) => new Set(weapon.lookAlike.filter((group) => group.includes(id)).flat());

  const questions = (random?: Random): ExamQuestion[] => {
    const out: ExamQuestion[] = [];
    steps.forEach((step, index) => {
      const media = { weapon: weapon.id, stepId: step.id, label: 'Detaļas fotoattēls' };
      const others = steps.filter((other) => other.id !== step.id);
      out.push({
        id: `${weapon.id}:function:${step.id}`, module: weapon.id, topic: topics[0].key,
        prompt: `Kāda ir ${step.plural ? 'detaļu' : 'detaļas'} “${step.part}” galvenā funkcija?`,
        correct: step.function, wrong: pick(others.map((other) => other.function), 3, random),
        explanation: step.explanation, ref: ref(step.sourceName), media,
      });
      const similar = alike(step.id);
      out.push({
        id: `${weapon.id}:photo:${step.id}`, module: weapon.id, topic: topics[1].key,
        prompt: step.plural ? 'Kā sauc attēlā redzamās detaļas?' : 'Kā sauc attēlā redzamo detaļu?',
        correct: step.part, wrong: pick(others.filter((other) => !similar.has(other.id)).map((other) => other.part), 3, random),
        explanation: `${step.part}: ${step.function.charAt(0).toLocaleLowerCase('lv-LV')}${step.function.slice(1)}`, ref: ref(step.sourceName), media,
      });
      if (directional.includes(step)) {
        const answer = direction(step);
        const others = [...new Set(directional.map(direction))].filter((text) => text !== answer);
        out.push({
          id: `${weapon.id}:direction:${step.id}`, module: weapon.id, topic: topics[2].key,
          prompt: `Kurā virzienā izjaukšanas laikā kustas ${step.plural ? 'detaļas' : 'detaļa'} “${step.part}”?`,
          correct: answer, wrong: pick(others, 3, random),
          explanation: step.action, ref: ref(step.sourceName), media,
        });
      }
      const next = steps[index + 1];
      if (next) {
        out.push({
          id: `${weapon.id}:order:${step.id}`, module: weapon.id, topic: topics[3].key,
          prompt: `Kurš posms izjaukšanā seko tūlīt pēc posma “${step.label}”?`,
          correct: next.label, wrong: pick(steps.filter((other) => other !== step && other !== next).map((other) => other.label), 3, random),
          explanation: `${pad(index + 1)}. posms ir “${step.label}”, ${pad(index + 2)}. posms – “${next.label}”.`, ref: ref('kursa secība'),
        });
      }
    });
    for (const item of weapon.theory ?? []) {
      out.push({
        id: `${weapon.id}:theory:${item.id}`, module: weapon.id, topic: `${weapon.id}:theory`,
        prompt: item.prompt, correct: item.correct, wrong: item.wrong, explanation: item.explanation, ref: ref(item.sourceName),
      });
    }
    return out;
  };

  return { module: weapon.id, name: weapon.name, topics, questions };
}
