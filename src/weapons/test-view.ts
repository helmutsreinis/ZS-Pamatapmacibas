import { pad, plural } from '../lv';
import { staticScene, timelineLength, type Scene } from '../scene/engine';
import { partThumb } from '../scene/thumb';
import { html, icon, pageIntro, scrollBehavior, type AppContext, type View } from '../ui/dom';
import { weaponTabs } from './learn-view';
import { makeQuestions, scoreAnswers, scoreOrder, shuffle, type Question } from './quiz';
import type { Step, WeaponModule } from './types';

type TestState = { stage: 'order' | 'questions' | 'done'; order: string[]; questions: Question[]; answers: Record<string, string>; index: number; notice: boolean };
const tests = new Map<string, TestState>();

function newTest(weapon: WeaponModule): TestState {
  const order = shuffle(weapon.steps.map((step) => step.id));
  if (order.every((id, index) => id === weapon.steps[index].id)) [order[0], order[1]] = [order[1], order[0]];
  const state: TestState = { stage: 'order', order, questions: makeQuestions(weapon.steps), answers: {}, index: 0, notice: false };
  tests.set(weapon.id, state);
  return state;
}

const remainingText = (count: number) => (count === 0 ? 'Visi jautājumi ir atbildēti' : `Vēl ${count} ${plural(count, 'neatbildēts jautājums', 'neatbildēti jautājumi')}`);

function header(weapon: WeaponModule, part: 1 | 2 | 3): string {
  const titles = { 1: 'PAREIZĀ <em>SECĪBA.</em>', 2: 'KATRAS DETAĻAS <em>UZDEVUMS.</em>', 3: 'TAVS <em>PĀRSKATS.</em>' };
  const leads = {
    1: `Sakārto visas ${weapon.steps.length} darbības pareizajā izjaukšanas secībā. Pirms pārejas uz jautājumiem apstiprini savu atbildi.`,
    2: 'Katrai detaļai izvēlies tās galveno funkciju. Atbilžu secība ir sajaukta, un skaidrojumi būs redzami testa beigās.',
    3: 'Abas testa daļas ir pabeigtas. Zemāk vari salīdzināt savu secību ar pareizo un pārskatīt katras detaļas funkciju.',
  };
  const steps = `<div class="test-steps"><span class="${part === 1 ? 'current' : 'done'}">01 <b>SECĪBA</b></span><i></i><span class="${part === 2 ? 'current' : part === 3 ? 'done' : ''}">02 <b>FUNKCIJAS</b></span><i></i><span class="${part === 3 ? 'current' : ''}">03 <b>REZULTĀTI</b></span></div>`;
  return pageIntro({ kicker: `${weapon.name} · PAŠPĀRBAUDE`, side: 'DIVAS DAĻAS · ATBILDES PĒC PABEIGŠANAS', className: 'test-intro', title: titles[part], lead: leads[part], extra: steps + weaponTabs(weapon, 'test'), photo: weapon.photo });
}

export function weaponTestView(weapon: WeaponModule, app: AppContext): View {
  const state = tests.get(weapon.id) ?? newTest(weapon);
  const byId = (id: string): Step => {
    const step = weapon.steps.find((candidate) => candidate.id === id);
    if (!step) throw new Error(`Nezināms posms: ${id}`);
    return step;
  };
  const go = () => { app.refresh(); window.scrollTo({ top: 0, behavior: scrollBehavior(app.reducedMotion) }); };

  if (state.stage === 'order') {
    const item = (id: string, index: number) => {
      const step = byId(id);
      return `<li class="order-item" draggable="true" data-order-id="${id}"><span class="drag-handle" aria-hidden="true">⠿</span><span class="order-position">${pad(index + 1)}</span><strong>${html(step.label)}</strong><span class="order-movers"><button type="button" class="move-button" data-move="up" data-id="${id}" aria-label="${html(step.label)}: uz augšu" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" class="move-button" data-move="down" data-id="${id}" aria-label="${html(step.label)}: uz leju" ${index === state.order.length - 1 ? 'disabled' : ''}>↓</button></span></li>`;
    };
    const markup = `${header(weapon, 1)}<section class="test-layout"><div class="order-panel panel"><div class="panel-heading"><div><span class="kicker">01 / 02</span><h2>SAKĀRTO POSMUS</h2></div><span class="panel-hint">VELC VAI IZMANTO ↑ ↓</span></div><p class="order-instruction">Pārvelc kartītes vēlamajā vietā. Ar tastatūru izmanto katras rindas pogas “Uz augšu” un “Uz leju”.</p><ol class="order-list" id="order-list">${state.order.map(item).join('')}</ol><div class="test-actions"><span>PAREIZĀS ATBILDES BŪS REDZAMAS PĒC ABĀM DAĻĀM</span><button type="button" class="button button-primary" id="submit-order">Iesniegt secību ${icon('arrow')}</button></div></div><aside class="test-aside"><div class="aside-visual"><div class="aside-scene" data-layout-scene></div><span>${weapon.name} · DETAĻAS PĒC NEPILNĀS IZJAUKŠANAS</span></div><div class="tip-card"><span class="kicker">KĀ VĒRTĒ</span><h3>VIENA GALĪGĀ SECĪBA</h3><p>Pēc apstiprināšanas secību vairs nevar mainīt. Par katru posmu pareizajā vietā saņem vienu punktu.</p></div></aside></section><dialog id="order-dialog" class="confirm-dialog"><div class="dialog-symbol">?</div><span class="kicker">APSTIPRINĀJUMS</span><h2>VAI ŠĪ IR GALĪGĀ ATBILDE?</h2><p>Pēc iesniegšanas secību vairs nevarēs mainīt. Pareizā secība būs redzama pēc otrās daļas pabeigšanas.</p><div class="dialog-actions"><button type="button" class="button button-outline" id="cancel-order">Vēl pārbaudīt</button><button type="button" class="button button-primary" id="confirm-order">Jā, iesniegt ${icon('arrow')}</button></div></dialog>`;
    const mount = () => {
      let scene: Scene | undefined;
      const host = document.querySelector<HTMLElement>('[data-layout-scene]');
      if (host) scene = staticScene(host, weapon.scene, { uid: `layout-${weapon.id}`, camera: 'overview', time: timelineLength(weapon.scene), ariaLabel: `Izjaukta ${weapon.name} detaļas uz paklāja` });
      const refreshList = (focusId?: string, direction?: string) => {
        const list = document.querySelector<HTMLOListElement>('#order-list');
        if (!list) return;
        list.innerHTML = state.order.map(item).join('');
        bindItems();
        if (focusId && direction) {
          const target = list.querySelector<HTMLButtonElement>(`[data-id="${focusId}"][data-move="${direction}"]`);
          (target && !target.disabled ? target : list.querySelector<HTMLButtonElement>(`[data-id="${focusId}"]:not(:disabled)`))?.focus();
        }
      };
      const move = (id: string, destination: number) => {
        const from = state.order.indexOf(id);
        if (from < 0 || destination < 0 || destination >= state.order.length || from === destination) return;
        state.order.splice(from, 1);
        state.order.splice(destination, 0, id);
        refreshList(id, destination < from ? 'up' : 'down');
      };
      const bindItems = () => {
        document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach((button) => button.addEventListener('click', () => move(button.dataset.id ?? '', state.order.indexOf(button.dataset.id ?? '') + (button.dataset.move === 'up' ? -1 : 1))));
        document.querySelectorAll<HTMLElement>('.order-item').forEach((row) => {
          row.addEventListener('dragstart', (event) => { event.dataTransfer?.setData('text/plain', row.dataset.orderId ?? ''); row.classList.add('dragging'); });
          row.addEventListener('dragend', () => row.classList.remove('dragging'));
          row.addEventListener('dragover', (event) => { event.preventDefault(); row.classList.add('drag-over'); });
          row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
          row.addEventListener('drop', (event) => {
            event.preventDefault(); row.classList.remove('drag-over');
            move(event.dataTransfer?.getData('text/plain') ?? '', state.order.indexOf(row.dataset.orderId ?? ''));
          });
        });
      };
      bindItems();
      const dialog = document.querySelector<HTMLDialogElement>('#order-dialog');
      document.querySelector('#submit-order')?.addEventListener('click', () => dialog?.showModal());
      document.querySelector('#cancel-order')?.addEventListener('click', () => dialog?.close());
      document.querySelector('#confirm-order')?.addEventListener('click', () => { dialog?.close(); state.stage = 'questions'; go(); });
      dialog?.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
      return () => scene?.destroy();
    };
    return { html: markup, mount };
  }

  if (state.stage === 'questions') {
    const question = state.questions[state.index];
    const step = byId(question.stepId);
    const selected = state.answers[question.stepId];
    const answered = Object.keys(state.answers).length;
    const unanswered = state.questions.length - answered;
    const markup = `${header(weapon, 2)}<section class="question-layout"><div class="question-panel panel"><div class="question-top"><span class="kicker">02 / 02 · JAUTĀJUMS ${pad(state.index + 1)} NO ${state.questions.length}</span><span id="answered-count">ATBILDĒTI: ${answered} NO ${state.questions.length}</span></div><div class="question-visual"><div class="question-scene" data-step-scene></div><div class="question-thumb">${partThumb(weapon.scene, weapon.stepParts[step.id] ?? [], step.part)}</div></div><div class="question-body"><span class="question-part-tag">${html(question.part.toLocaleUpperCase('lv-LV'))}</span><h2>KĀDA IR <em>${step.plural ? 'ŠO DETAĻU' : 'ŠĪS DETAĻAS'}</em> GALVENĀ FUNKCIJA?</h2><fieldset class="choices"><legend class="sr-only">Izvēlies vienu atbildi</legend>${question.choices.map((choice, index) => `<label class="choice ${selected === choice ? 'selected' : ''}"><input type="radio" name="answer" value="${index}" ${selected === choice ? 'checked' : ''}/><span class="choice-letter">${String.fromCharCode(65 + index)}</span><span>${html(choice)}</span><span class="choice-indicator"></span></label>`).join('')}</fieldset>${state.notice && unanswered > 0 ? `<p class="answer-notice" role="alert">Lai redzētu rezultātus, atbildi uz visiem jautājumiem. ${remainingText(unanswered)}.</p>` : ''}</div><div class="question-nav"><button type="button" class="button button-outline" id="question-prev" ${state.index === 0 ? 'disabled' : ''}>← Iepriekšējais</button><div class="question-dots" aria-label="Jautājumu progress">${state.questions.map((item, index) => `<button type="button" data-jump="${index}" class="${index === state.index ? 'active' : ''} ${state.answers[item.stepId] ? 'answered' : ''}" aria-label="${index + 1}. jautājums${state.answers[item.stepId] ? ', atbildēts' : ''}" aria-current="${index === state.index ? 'step' : 'false'}"></button>`).join('')}</div><button type="button" class="button button-primary" id="question-next">${state.index === state.questions.length - 1 ? 'Skatīt rezultātus' : 'Nākamais'} ${icon('arrow')}</button></div></div><aside class="question-side"><div class="side-summary panel"><span class="kicker">TESTA PROGRESS</span><div class="big-progress"><strong>${pad(state.index + 1)}</strong><span>/ ${state.questions.length}</span></div><div class="side-progress-track"><div style="width:${answered / state.questions.length * 100}%"></div></div><p>Izvēlētās atbildes var mainīt līdz otrās daļas pabeigšanai.</p><p class="remaining" id="remaining-count">${remainingText(unanswered)}</p></div><div class="side-quote"><span>!</span><p>Atbildes un skaidrojumi būs redzami tikai kopējā rezultātu pārskatā.</p></div></aside></section>`;
    const mount = () => {
      let scene: Scene | undefined;
      const host = document.querySelector<HTMLElement>('[data-step-scene]');
      const index = weapon.steps.indexOf(step) + 1;
      if (host) {
        scene = staticScene(host, weapon.scene, { uid: `step-${weapon.id}`, time: index + 0.0005, highlight: weapon.stepParts[step.id] ?? [], ariaLabel: `${step.part} ierocī` });
        scene.frameSegment(index);
      }
      document.querySelectorAll<HTMLInputElement>('input[name="answer"]').forEach((input) => input.addEventListener('change', () => {
        state.answers[question.stepId] = question.choices[Number(input.value)];
        document.querySelectorAll('.choice').forEach((choice) => choice.classList.toggle('selected', choice.querySelector('input') === input));
        const count = Object.keys(state.answers).length;
        const answeredText = document.querySelector('#answered-count');
        if (answeredText) answeredText.textContent = `ATBILDĒTI: ${count} NO ${state.questions.length}`;
        const remaining = document.querySelector('#remaining-count');
        if (remaining) remaining.textContent = remainingText(state.questions.length - count);
        const fill = document.querySelector<HTMLElement>('.side-progress-track > div');
        if (fill) fill.style.width = `${count / state.questions.length * 100}%`;
        const dot = document.querySelector<HTMLButtonElement>(`[data-jump="${state.index}"]`);
        dot?.classList.add('answered');
        dot?.setAttribute('aria-label', `${state.index + 1}. jautājums, atbildēts`);
        if (count === state.questions.length) document.querySelector('.answer-notice')?.remove();
      }));
      const jump = (target: number) => { state.index = target; go(); };
      document.querySelector('#question-prev')?.addEventListener('click', () => jump(state.index - 1));
      document.querySelector('#question-next')?.addEventListener('click', () => {
        if (state.index < state.questions.length - 1) { jump(state.index + 1); return; }
        const missing = state.questions.findIndex((item) => !state.answers[item.stepId]);
        if (missing >= 0) {
          state.notice = true;
          state.index = missing;
          app.refresh();
          document.querySelector<HTMLElement>('.question-body')?.scrollIntoView({ behavior: scrollBehavior(app.reducedMotion) });
          return;
        }
        state.stage = 'done';
        go();
      });
      document.querySelectorAll<HTMLButtonElement>('[data-jump]').forEach((button) => button.addEventListener('click', () => jump(Number(button.dataset.jump))));
      return () => scene?.destroy();
    };
    return { html: markup, mount };
  }

  const { steps } = weapon;
  const orderScore = scoreOrder(state.order, steps);
  const questionScore = scoreAnswers(state.questions, state.answers);
  const termNotes = steps.filter((step) => step.term);
  const markup = `${header(weapon, 3)}<section class="results-summary"><div class="result-stat"><span>01 / SECĪBA</span><strong>${orderScore}<small> / ${steps.length}</small></strong><p>${plural(orderScore, 'Posms', 'Posmi')} pareizajā vietā</p></div><div class="result-stat"><span>02 / DETAĻU FUNKCIJAS</span><strong>${questionScore}<small> / ${state.questions.length}</small></strong><p>${plural(questionScore, 'Pareiza atbilde', 'Pareizas atbildes')}</p></div><div class="result-action"><span class="kicker">TURPINI MĀCĪTIES</span><p>Pārskati kļūdas vai atkārto mācību režīmu savā tempā.</p><a class="button button-primary" href="#/${weapon.id}/macibas">Atvērt mācību režīmu ${icon('arrow')}</a><button type="button" class="text-button" id="new-test">SĀKT JAUNU TESTU ↗</button></div></section><section class="result-section"><div class="section-heading compact"><div><span class="kicker">01 / SECĪBA</span><h2>POSMU SALĪDZINĀJUMS</h2></div><p>Zaļš – posms ir pareizajā vietā, dzeltens – posms jāpārvieto.</p></div><div class="result-order-list">${steps.map((step, index) => { const userStep = byId(state.order[index]); const correct = step.id === userStep.id; return `<div class="result-order-row ${correct ? 'correct' : 'incorrect'}"><span class="result-index">${pad(index + 1)}</span><div><small>TAVA ATBILDE</small><strong>${html(userStep.label)}</strong></div><span class="result-symbol">${correct ? '✓' : '↗'}</span><div><small>PAREIZĀ ATBILDE</small><strong>${html(step.label)}</strong></div></div>`; }).join('')}</div></section><section class="result-section"><div class="section-heading compact"><div><span class="kicker">02 / DETAĻU FUNKCIJAS</span><h2>ATBILDES UN SKAIDROJUMI</h2></div><p>Katras detaļas funkcija ar skaidrojumu un avotu.</p></div><div class="result-question-grid">${state.questions.map((question, index) => { const step = byId(question.stepId); const correct = state.answers[question.stepId] === question.correct; return `<article class="result-question ${correct ? 'correct' : 'incorrect'}"><div class="result-question-thumb">${partThumb(weapon.scene, weapon.stepParts[step.id] ?? [], step.part)}</div><div class="result-question-top"><span>${pad(index + 1)} / ${html(question.part)}</span><b>${correct ? 'PAREIZI' : 'JĀATKĀRTO'}</b></div><h3>${html(question.correct)}</h3>${!correct ? `<p class="your-answer"><b>Tava atbilde:</b> ${html(state.answers[question.stepId] ?? 'Nav atbildes')}</p>` : ''}<p>${html(question.explanation)}</p><a href="${step.source}" target="_blank" rel="noopener noreferrer">${html(step.sourceName)} ↗</a></article>`; }).join('')}</div></section>${termNotes.length ? `<section class="review-banner"><div><span class="kicker">INSTRUKTORAM</span><h2>TERMINOLOĢIJAS PIEZĪMES</h2><p>${termNotes.length} ${plural(termNotes.length, 'kursa termins ir salīdzināts', 'kursa termini ir salīdzināti')} ar oficiālās rokasgrāmatas nosaukumiem. Pirms oficiālas lietošanas tos saskaņo ar kursa materiāliem.</p></div><button type="button" class="button button-outline" id="show-review" aria-expanded="false" aria-controls="review-list">Skatīt piezīmes ${icon('arrow')}</button></section><div class="review-list hidden" id="review-list">${termNotes.map((step) => `<p><b>${html(step.part)}:</b> ${html(step.term ?? '')}</p>`).join('')}</div>` : ''}`;
  const mount = () => {
    document.querySelector('#new-test')?.addEventListener('click', () => { newTest(weapon); go(); });
    const button = document.querySelector<HTMLButtonElement>('#show-review');
    button?.addEventListener('click', () => {
      const open = document.querySelector('#review-list')?.classList.toggle('hidden') === false;
      button.setAttribute('aria-expanded', String(open));
    });
  };
  return { html: markup, mount };
}
