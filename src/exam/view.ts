import { drillTabs } from '../drill/tabs';
import { formatTime, pad, plural, upper } from '../lv';
import { exams, weapons, type ExamDefinition, type ExamKind } from '../modules';
import { secureRandom } from '../random';
import { partThumb } from '../scene/thumb';
import { confirmDialog, html, icon, pageIntro, scrollBehavior, toast, type AppContext, type View } from '../ui/dom';
import { drawQuestions, scoreSession, testCode, type ExamConfig, type SessionQuestion, type Topic } from './model';
import { loadBest, loadPrefs, saveBest, savePrefs } from './store';

const COUNTS: ExamConfig['count'][] = [20, 40, 60, 'all'];
const TIMES = [0, 1200, 1800, 2700, 3600];
const PASSES = [70, 80, 90];
const LETTERS = 'ABCD';
/** Latvian writes the per cent sign after a (non-breaking) space. */
const percent = (value: number) => `${value} %`;
const questionsText = (value: number) => `${value} ${plural(value, 'jautājums', 'jautājumi')}`;
const minutesText = (seconds: number) => `${seconds / 60} ${plural(seconds / 60, 'minūte', 'minūtes')}`;

type Session = {
  config: ExamConfig;
  code: string;
  questions: SessionQuestion[];
  answers: Map<string, number>;
  /** Training mode: answered questions show the explanation and cannot change. */
  locked: Set<string>;
  flagged: Set<string>;
  index: number;
  startedAt: number;
  finishedAt: number | null;
  timedOut: boolean;
  /** Time warnings already shown, in seconds left. */
  warned: Set<number>;
  /** Best exam-mode result before this attempt. */
  best: number;
  showAll: boolean;
};

type Screen = 'setup' | 'test' | 'results';
type ExamState = { screen: Screen; draft: ExamConfig; session: Session | null };
const states = new Map<ExamKind, ExamState>();

const allTopics = (def: ExamDefinition): Topic[] => def.sources.flatMap((source) => source.topics);

function defaults(def: ExamDefinition): ExamConfig {
  return { topics: allTopics(def).map((topic) => topic.key), count: def.defaults.count, mode: 'exam', time: 0, pass: def.defaults.pass, candidate: '' };
}

/** Saved preferences, keeping only what the form still offers; topics added since start selected. */
function restore(def: ExamDefinition): ExamConfig {
  const base = defaults(def);
  const saved = loadPrefs(def.kind);
  if (!saved) return base;
  const strings = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);
  const kept = new Set(strings(saved.topics));
  const seen = new Set(strings(saved.seen));
  const topics = base.topics.filter((key) => kept.has(key) || !seen.has(key));
  return {
    topics: topics.length ? topics : base.topics,
    count: COUNTS.includes(saved.count as ExamConfig['count']) ? (saved.count as ExamConfig['count']) : base.count,
    mode: saved.mode === 'training' ? 'training' : 'exam',
    time: TIMES.includes(Number(saved.time)) ? Number(saved.time) : base.time,
    pass: PASSES.includes(Number(saved.pass)) ? Number(saved.pass) : base.pass,
    candidate: typeof saved.candidate === 'string' ? saved.candidate.slice(0, 60) : '',
  };
}

function stateFor(kind: ExamKind): ExamState {
  let state = states.get(kind);
  if (!state) {
    state = { screen: 'setup', draft: restore(exams[kind]), session: null };
    states.set(kind, state);
  }
  return state;
}

function begin(kind: ExamKind, config: ExamConfig): void {
  const def = exams[kind];
  const state = stateFor(kind);
  const pool = def.sources.flatMap((source) => source.questions(secureRandom));
  state.session = {
    config: { ...config, topics: [...config.topics] }, code: testCode(def.codePrefix, new Date(), secureRandom),
    questions: drawQuestions(pool, config, secureRandom), answers: new Map(), locked: new Set(), flagged: new Set(),
    index: 0, startedAt: Date.now(), finishedAt: null, timedOut: false, warned: new Set(), best: loadBest(kind), showAll: false,
  };
  state.screen = 'test';
}

/** A test of this kind is under way and has at least one answer. */
export function examInProgress(kind: ExamKind): boolean {
  const state = states.get(kind);
  return state?.screen === 'test' && !!state.session && !state.session.finishedAt && state.session.answers.size > 0;
}

/** Start a training run on some topics straight away (from a drill chapter, for example). */
export function startTraining(kind: ExamKind, topics: string[]): void {
  const state = stateFor(kind);
  begin(kind, { ...state.draft, topics, count: 'all', mode: 'training', time: 0 });
}

const elapsed = (session: Session) => ((session.finishedAt ?? Date.now()) - session.startedAt) / 1000;
const remaining = (session: Session) => session.config.time - elapsed(session);

function finish(kind: ExamKind, session: Session, timedOut: boolean): void {
  if (session.finishedAt) return;
  session.finishedAt = timedOut ? session.startedAt + session.config.time * 1000 : Date.now();
  session.timedOut = timedOut;
  session.showAll = false;
  if (session.config.mode === 'exam') saveBest(kind, scoreSession(session.questions, session.answers, session.config.pass).percent);
  stateFor(kind).screen = 'results';
}

function intro(def: ExamDefinition, screen: Screen, session: Session | null, title: string, lead: string): string {
  const current = { setup: 1, test: 2, results: 3 }[screen];
  const step = (n: number, label: string) => `<span class="${n === current ? 'current' : n < current ? 'done' : ''}">${pad(n)} <b>${label}</b></span>`;
  const steps = `<div class="test-steps">${step(1, 'KONFIGURĀCIJA')}<i></i>${step(2, 'TESTS')}<i></i>${step(3, 'REZULTĀTI')}</div>`;
  const topics = allTopics(def);
  const total = topics.reduce((sum, topic) => sum + topic.count, 0);
  const side = session && screen !== 'setup'
    ? `TESTA KODS ${session.code}`
    : `${topics.length} ${upper(plural(topics.length, 'tēma', 'tēmas'))} · ${upper(questionsText(total))}`;
  return pageIntro({
    kicker: def.kicker, side, title, lead, className: `exam-intro exam-${def.kind} ${screen === 'setup' ? '' : 'is-compact'}`,
    extra: steps + (def.kind === 'ierinda' ? drillTabs('test') : ''),
  });
}

export function examView(kind: ExamKind, app: AppContext): View {
  const def = exams[kind];
  const state = stateFor(kind);
  const { session } = state;
  if (state.screen === 'test' && session && !session.finishedAt && session.config.time > 0 && remaining(session) <= 0) finish(kind, session, true);
  const go = (screen?: Screen) => {
    if (screen) state.screen = screen;
    app.refresh();
    window.scrollTo({ top: 0, behavior: scrollBehavior(app.reducedMotion) });
  };
  if (state.screen === 'test' && session) return testView(kind, def, session, app, go);
  if (state.screen === 'results' && session) return resultsView(kind, def, session, go);
  return setupView(kind, def, state, go);
}

// ------------------------------------------------------------------ set-up

function setupView(kind: ExamKind, def: ExamDefinition, state: ExamState, go: (screen?: Screen) => void): View {
  const config = state.draft;
  const grouped = def.sources.length > 1;
  const groups = def.sources.map((source) => {
    const total = source.topics.reduce((sum, topic) => sum + topic.count, 0);
    const prefix = `${source.name} · `;
    const head = grouped ? `<div class="topic-group-head"><div><b>${html(source.name)}</b><span>${source.topics.length} ${plural(source.topics.length, 'tēma', 'tēmas')} · ${questionsText(total)}</span></div><button type="button" class="mini-button" data-group-toggle="${source.module}">Atzīmēt visas</button></div>` : '';
    const items = source.topics.map((topic) => `<label class="topic-item"><input type="checkbox" name="topic" value="${topic.key}" data-module="${source.module}" ${config.topics.includes(topic.key) ? 'checked' : ''}/><span>${html(topic.label.startsWith(prefix) ? topic.label.slice(prefix.length) : topic.label)}</span><small>${pad(topic.count)}</small></label>`).join('');
    return `<div class="topic-group">${head}<div class="topic-list">${items}</div></div>`;
  }).join('');
  const select = (id: string, label: string, options: { value: string; text: string }[], value: string) =>
    `<div class="field"><label for="${id}">${label}</label><select id="${id}">${options.map((option) => `<option value="${option.value}" ${option.value === value ? 'selected' : ''}>${option.text}</option>`).join('')}</select></div>`;

  const markup = `${intro(def, 'setup', null, def.title, def.lead)}
    <section class="exam-setup">
      <form class="panel setup-panel" id="exam-form" novalidate>
        <div class="panel-heading"><div><span class="kicker">SAGATAVOŠANA</span><h2>TESTA KONFIGURĀCIJA</h2></div></div>
        <div class="form-grid">
          <div class="field span-2"><label for="exam-candidate">Kandidāta vārds vai izsaukuma signāls (nav obligāts)</label><input id="exam-candidate" type="text" maxlength="60" autocomplete="off" placeholder="Piemēram: ZS Bērziņš" value="${html(config.candidate)}"/></div>
          ${select('exam-count', 'Jautājumu skaits', COUNTS.map((count) => ({ value: String(count), text: count === 'all' ? 'Visi pieejamie' : questionsText(count) })), String(config.count))}
          ${select('exam-mode', 'Režīms', [{ value: 'exam', text: 'Pārbaudes režīms' }, { value: 'training', text: 'Mācību režīms ar tūlītēju skaidrojumu' }], config.mode)}
          ${select('exam-time', 'Laika ierobežojums', TIMES.map((time) => ({ value: String(time), text: time ? minutesText(time) : 'Bez ierobežojuma' })), String(config.time))}
          ${select('exam-pass', 'Nokārtošanas slieksnis', PASSES.map((pass) => ({ value: String(pass), text: percent(pass) })), String(config.pass))}
          <fieldset class="field span-2 topic-field"><legend>Iekļaujamās tēmas</legend>
            <div class="topic-tools"><button type="button" class="mini-button" data-topics="all">Atzīmēt visas</button><button type="button" class="mini-button" data-topics="none">Noņemt visas</button></div>
            ${groups}
          </fieldset>
        </div>
        <div class="start-row"><p class="availability" id="exam-availability" aria-live="polite"></p><button type="submit" class="button button-primary" id="exam-start">Sākt pārbaudi ${icon('arrow')}</button></div>
      </form>
      <aside class="panel briefing">
        <div class="panel-heading"><div><span class="kicker">BRĪFINGS</span><h2>INSTRUKTĀŽA</h2></div></div>
        <ol class="briefing-list">
          <li><b>1</b><span>Katram jautājumam ir viena pareiza atbilde un trīs nepareizi varianti.</span></li>
          <li><b>2</b><span>Jautājumus izvēlas proporcionāli tēmu apjomam; jautājumu un atbilžu secība katrā testā ir cita.</span></li>
          <li><b>3</b><span>Pārbaudes režīmā pareizās atbildes redzēsi tikai pēc iesniegšanas.</span></li>
          <li><b>4</b><span>Mācību režīmā pēc izvēles uzreiz saņemsi skaidrojumu; atbildi pēc tam mainīt nevar.</span></li>
          <li><b>5</b><span>Tastatūra: <kbd>1</kbd>–<kbd>4</kbd> atbilde, <kbd>←</kbd> / <kbd>→</kbd> pāriešana, <kbd>F</kbd> atzīme.</span></li>
        </ol>
        <p class="notice"><strong>Piezīme:</strong> ${html(def.notice)}</p>
      </aside>
    </section>`;

  const mount = () => {
    const form = document.querySelector<HTMLFormElement>('#exam-form');
    if (!form) return;
    const field = <T extends HTMLElement>(id: string) => form.querySelector<T>(`#${id}`);
    const boxes = () => [...form.querySelectorAll<HTMLInputElement>('input[name="topic"]')];
    const read = (): ExamConfig => {
      const count = field<HTMLSelectElement>('exam-count')?.value ?? 'all';
      return {
        topics: boxes().filter((box) => box.checked).map((box) => box.value),
        count: count === 'all' ? 'all' : Number(count),
        mode: field<HTMLSelectElement>('exam-mode')?.value === 'training' ? 'training' : 'exam',
        time: Number(field<HTMLSelectElement>('exam-time')?.value ?? 0),
        pass: Number(field<HTMLSelectElement>('exam-pass')?.value ?? def.defaults.pass),
        candidate: (field<HTMLInputElement>('exam-candidate')?.value ?? '').trim(),
      };
    };
    const update = () => {
      state.draft = read();
      const chosen = new Set(state.draft.topics);
      const available = allTopics(def).filter((topic) => chosen.has(topic.key)).reduce((sum, topic) => sum + topic.count, 0);
      const actual = state.draft.count === 'all' ? available : Math.min(state.draft.count, available);
      const text = field<HTMLElement>('exam-availability');
      if (text) {
        text.textContent = available
          ? `${plural(available, 'Pieejams', 'Pieejami')} ${questionsText(available)}; testā ${plural(actual, 'tiks iekļauts', 'tiks iekļauti')} ${actual}.`
          : 'Nav izvēlēta neviena tēma.';
      }
      const start = field<HTMLButtonElement>('exam-start');
      if (start) start.disabled = available === 0;
      form.querySelectorAll<HTMLButtonElement>('[data-group-toggle]').forEach((button) => {
        const all = boxes().filter((box) => box.dataset.module === button.dataset.groupToggle).every((box) => box.checked);
        button.textContent = all ? 'Noņemt visas' : 'Atzīmēt visas';
      });
    };
    form.addEventListener('change', update);
    form.addEventListener('input', update);
    form.querySelectorAll<HTMLButtonElement>('[data-topics]').forEach((button) => button.addEventListener('click', () => {
      boxes().forEach((box) => { box.checked = button.dataset.topics === 'all'; });
      update();
    }));
    form.querySelectorAll<HTMLButtonElement>('[data-group-toggle]').forEach((button) => button.addEventListener('click', () => {
      const group = boxes().filter((box) => box.dataset.module === button.dataset.groupToggle);
      const check = !group.every((box) => box.checked);
      group.forEach((box) => { box.checked = check; });
      update();
    }));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const config = read();
      if (!config.topics.length) { toast('Izvēlies vismaz vienu tēmu.'); return; }
      savePrefs(kind, config, allTopics(def).map((topic) => topic.key));
      begin(kind, config);
      go();
    });
    update();
  };
  return { html: markup, mount };
}

// ------------------------------------------------------------------ test

function testView(kind: ExamKind, def: ExamDefinition, session: Session, app: AppContext, go: (screen?: Screen) => void): View {
  const { questions, config } = session;
  const topicLabel = new Map(allTopics(def).map((topic) => [topic.key, topic.label]));
  const limitText = config.time ? `laiks – ${minutesText(config.time)}` : 'bez laika ierobežojuma';
  const lead = config.mode === 'exam'
    ? `Pārbaudes režīms · ${questionsText(questions.length)} · ${limitText}. Atbildes var mainīt līdz testa iesniegšanai.`
    : `Mācību režīms · ${questionsText(questions.length)} · ${limitText}. Skaidrojums parādās uzreiz pēc atbildes izvēles.`;
  const markup = `${intro(def, 'test', session, def.title, lead)}
    <section class="exam-layout">
      <aside class="panel exam-side" aria-label="Jautājumu karte">
        <div class="panel-heading"><div><span class="kicker">NAVIGĀCIJA</span><h2>JAUTĀJUMU KARTE</h2></div></div>
        <div class="exam-stats"><div><small>ATBILDĒTI</small><strong id="stat-answered"></strong></div><div><small>ATZĪMĒTI</small><strong id="stat-flagged"></strong></div><div class="exam-code"><small>TESTA KODS</small><span>${session.code}</span></div></div>
        <div class="palette" id="palette">${questions.map((question, index) => `<button type="button" data-goto="${index}" title="${html(topicLabel.get(question.topic) ?? '')}">${index + 1}</button>`).join('')}</div>
        <div class="palette-legend" aria-hidden="true"><span><i class="answered"></i>atbildēts</span><span><i class="flagged"></i>atzīmēts</span><span><i class="current"></i>pašreizējais</span></div>
      </aside>
      <div class="exam-main">
        <div class="exam-status panel"><div class="exam-progress"><div class="exam-progress-track"><div id="exam-progress-fill"></div></div><span id="exam-position" aria-live="polite"></span></div><div class="exam-timer" id="exam-timer"><small>${config.time ? 'ATLIKUŠAIS LAIKS' : 'PAGĀJUŠAIS LAIKS'}</small><strong role="timer"></strong></div></div>
        <article class="panel exam-card" id="exam-card"></article>
      </div>
    </section>`;

  const mount = () => {
    const card = document.querySelector<HTMLElement>('#exam-card');
    if (!card) return;
    const setText = (selector: string, text: string) => { const element = document.querySelector<HTMLElement>(selector); if (element) element.textContent = text; };
    const current = () => questions[session.index];

    const paintAnswers = () => {
      const question = current();
      const chosen = session.answers.get(question.id);
      const locked = session.locked.has(question.id);
      card.querySelectorAll<HTMLButtonElement>('[data-answer]').forEach((button) => {
        const index = Number(button.dataset.answer);
        const option = question.options[index];
        button.classList.toggle('selected', chosen === index);
        button.classList.toggle('correct', locked && option.correct);
        button.classList.toggle('incorrect', locked && chosen === index && !option.correct);
        button.setAttribute('aria-pressed', String(chosen === index));
        button.disabled = locked;
      });
      const feedback = card.querySelector<HTMLElement>('#exam-feedback');
      if (feedback) {
        feedback.classList.toggle('hidden', !locked);
        const right = chosen !== undefined && question.options[chosen]?.correct;
        feedback.classList.toggle('is-wrong', locked && !right);
        const answer = question.options.findIndex((option) => option.correct);
        feedback.innerHTML = locked
          ? `<strong>${right ? 'Pareizi.' : `Nepareizi. Pareizā atbilde – ${LETTERS[answer]}.`}</strong> ${html(question.explanation)}${question.ref ? ` <span class="exam-feedback-ref">${html(question.ref)}</span>` : ''}`
          : '';
      }
    };
    const paintStatus = () => {
      const question = current();
      document.querySelectorAll<HTMLButtonElement>('[data-goto]').forEach((button) => {
        const index = Number(button.dataset.goto);
        const id = questions[index].id;
        const answered = session.answers.has(id), flagged = session.flagged.has(id);
        button.classList.toggle('answered', answered);
        button.classList.toggle('flagged', flagged);
        button.classList.toggle('current', index === session.index);
        button.setAttribute('aria-current', index === session.index ? 'step' : 'false');
        button.setAttribute('aria-label', `${index + 1}. jautājums${answered ? ', atbildēts' : ''}${flagged ? ', atzīmēts' : ''}`);
      });
      setText('#stat-answered', `${session.answers.size} / ${questions.length}`);
      setText('#stat-flagged', String(session.flagged.size));
      setText('#exam-position', `Jautājums ${session.index + 1} no ${questions.length}`);
      const fill = document.querySelector<HTMLElement>('#exam-progress-fill');
      if (fill) fill.style.width = `${((session.index + 1) / questions.length) * 100}%`;
      const flag = card.querySelector<HTMLButtonElement>('#exam-flag');
      if (flag) {
        const on = session.flagged.has(question.id);
        flag.classList.toggle('active', on);
        flag.setAttribute('aria-pressed', String(on));
        flag.innerHTML = `${icon('flag')} ${on ? 'Noņemt atzīmi' : 'Atzīmēt'}`;
      }
    };
    const render = () => {
      const question = current();
      const weapon = question.media ? weapons[question.media.weapon] : undefined;
      const media = weapon && question.media ? `<div class="exam-media">${partThumb(weapon.scene, weapon.stepParts[question.media.stepId] ?? [], question.media.label)}</div>` : '';
      card.innerHTML = `<div class="exam-card-head"><span class="exam-badge">${html(topicLabel.get(question.topic) ?? '')}</span><span class="exam-ref">${pad(session.index + 1)} / ${pad(questions.length)}</span></div>
        <div class="exam-question ${media ? 'has-media' : ''}">${media}<h2 id="exam-prompt">${html(question.prompt)}</h2></div>
        <div class="exam-answers" role="group" aria-labelledby="exam-prompt">${question.options.map((option, index) => `<button type="button" class="exam-answer" data-answer="${index}"><span class="letter" aria-hidden="true">${LETTERS[index]}</span><span class="sr-only">${LETTERS[index]}:</span><span>${html(option.text)}</span></button>`).join('')}</div>
        <div class="exam-feedback hidden" id="exam-feedback" aria-live="polite"></div>
        <div class="exam-nav"><div class="exam-nav-group"><button type="button" class="button button-outline" id="exam-prev" ${session.index === 0 ? 'disabled' : ''}>${icon('prev')} Iepriekšējais</button><button type="button" class="button button-outline" id="exam-next" ${session.index === questions.length - 1 ? 'disabled' : ''}>Nākamais ${icon('next')}</button></div><div class="exam-nav-group"><button type="button" class="button button-outline flag-button" id="exam-flag"></button><button type="button" class="button button-primary" id="exam-finish">Iesniegt testu ${icon('arrow')}</button></div></div>`;
      card.querySelectorAll<HTMLButtonElement>('[data-answer]').forEach((button) => button.addEventListener('click', () => choose(Number(button.dataset.answer))));
      card.querySelector('#exam-prev')?.addEventListener('click', () => move(-1));
      card.querySelector('#exam-next')?.addEventListener('click', () => move(1));
      card.querySelector('#exam-flag')?.addEventListener('click', toggleFlag);
      card.querySelector('#exam-finish')?.addEventListener('click', submit);
      paintAnswers();
      paintStatus();
    };
    const choose = (index: number) => {
      const question = current();
      if (session.locked.has(question.id) || !question.options[index]) return;
      session.answers.set(question.id, index);
      if (config.mode === 'training') session.locked.add(question.id);
      paintAnswers();
      paintStatus();
      if (config.mode === 'exam') toast(`Atbilde saglabāta: ${LETTERS[index]}`);
      else card.querySelector<HTMLButtonElement>(session.index < questions.length - 1 ? '#exam-next' : '#exam-finish')?.focus();
    };
    const move = (delta: number) => {
      const next = Math.max(0, Math.min(questions.length - 1, session.index + delta));
      if (next === session.index) return;
      const focused = document.activeElement?.id;
      session.index = next;
      render();
      if (focused === 'exam-prev' || focused === 'exam-next') {
        const button = card.querySelector<HTMLButtonElement>(`#${focused}`);
        (button && !button.disabled ? button : card.querySelector<HTMLButtonElement>('.exam-answer'))?.focus();
      }
    };
    const toggleFlag = () => {
      const { id } = current();
      if (session.flagged.has(id)) session.flagged.delete(id); else session.flagged.add(id);
      paintStatus();
    };
    const end = (timedOut: boolean) => { finish(kind, session, timedOut); go(); };
    const submit = async () => {
      const unanswered = questions.length - session.answers.size;
      const flagged = session.flagged.size;
      const parts = [
        unanswered ? `${plural(unanswered, 'Nav atbildēts', 'Nav atbildēti')} ${questionsText(unanswered)}.` : 'Visi jautājumi ir atbildēti.',
        flagged ? `${flagged} ${plural(flagged, 'jautājums ir atzīmēts', 'jautājumi ir atzīmēti')} pārskatīšanai.` : '',
        'Pēc iesniegšanas atbildes vairs nevarēs mainīt.',
      ];
      const ok = await confirmDialog({ kicker: 'IESNIEGŠANA', title: 'IESNIEGT TESTU?', text: parts.filter(Boolean).join(' '), confirm: 'Iesniegt', cancel: 'Turpināt testu' });
      if (ok && !session.finishedAt) end(false);
    };
    document.querySelectorAll<HTMLButtonElement>('[data-goto]').forEach((button) => button.addEventListener('click', () => {
      session.index = Number(button.dataset.goto);
      render();
      card.scrollIntoView({ behavior: scrollBehavior(app.reducedMotion), block: 'nearest' });
    }));

    const timer = document.querySelector<HTMLElement>('#exam-timer');
    const tick = () => {
      if (session.finishedAt) return;
      if (config.time) {
        const left = remaining(session);
        if (left <= 0) { end(true); return; }
        for (const mark of [300, 60]) {
          if (left <= mark && !session.warned.has(mark) && config.time > mark) {
            session.warned.add(mark);
            const minutes = mark / 60;
            toast(`${plural(minutes, 'Atlikusi', 'Atlikušas')} ${minutes} ${plural(minutes, 'minūte', 'minūtes')}.`);
          }
        }
        timer?.classList.toggle('urgent', left <= 60);
        setText('#exam-timer strong', formatTime(Math.ceil(left)));
      } else {
        setText('#exam-timer strong', formatTime(elapsed(session)));
      }
    };
    const interval = window.setInterval(tick, 500);
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || document.querySelector('dialog[open]')) return;
      if ((event.target as HTMLElement | null)?.closest('input, select, textarea')) return;
      if (/^[1-4]$/.test(event.key)) { event.preventDefault(); choose(Number(event.key) - 1); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      else if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFlag(); }
    };
    const onLeave = (event: BeforeUnloadEvent) => {
      if (session.finishedAt) return;
      event.preventDefault();
      event.returnValue = '';
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('beforeunload', onLeave);
    render();
    tick();
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('beforeunload', onLeave);
    };
  };
  return { html: markup, mount };
}

// ------------------------------------------------------------------ results

function resultsView(kind: ExamKind, def: ExamDefinition, session: Session, go: (screen?: Screen) => void): View {
  const { config } = session;
  const result = scoreSession(session.questions, session.answers, config.pass);
  const topicLabel = new Map(allTopics(def).map((topic) => [topic.key, topic.label]));
  const best = config.mode === 'exam' ? Math.max(session.best, result.percent) : session.best;
  const started = new Date(session.startedAt);
  const timeSpent = config.time ? Math.min(elapsed(session), config.time) : elapsed(session);
  const summary = `${session.timedOut ? 'Laiks beidzās. ' : ''}Pareizi ${plural(result.correct, 'atbildēts', 'atbildēti')} ${result.correct} no ${result.total} ${plural(result.total, 'jautājuma', 'jautājumiem')}.`;
  const meta = [
    config.candidate || 'Kandidāts nav norādīts',
    `Testa kods ${session.code}`,
    `${started.toLocaleDateString('lv-LV')} ${started.toLocaleTimeString('lv-LV', { hour: '2-digit', minute: '2-digit' })}`,
    config.mode === 'exam' ? 'Pārbaudes režīms' : 'Mācību režīms',
    `Slieksnis ${percent(config.pass)}`,
    `Laiks ${formatTime(timeSpent)}`,
  ];
  const row = (label: string, entry: { correct: number; total: number }, module = false) => {
    const share = Math.round((entry.correct / entry.total) * 100);
    return `<tr class="${module ? 'module-row' : ''}"><th scope="row">${html(label)}</th><td>${entry.correct} / ${entry.total}</td><td><span class="score-bar ${share >= config.pass ? 'good' : 'bad'}" aria-hidden="true"><i style="width:${share}%"></i></span>${percent(share)}</td></tr>`;
  };
  const breakdown = def.sources.map((source) => {
    const total = result.byModule.get(source.module);
    if (!total) return '';
    const prefix = `${source.name} · `;
    const topics = source.topics.map((topic) => {
      const entry = result.byTopic.get(topic.key);
      return entry ? row(topic.label.startsWith(prefix) && def.sources.length > 1 ? topic.label.slice(prefix.length) : topic.label, entry) : '';
    }).join('');
    return (def.sources.length > 1 ? row(source.name, total, true) : '') + topics;
  }).join('');
  const passed = result.passed;
  const markup = `${intro(def, 'results', session, 'TAVS <em>REZULTĀTS.</em>', 'Tests ir iesniegts. Zemāk – rezultāts pa tēmām un atbilžu pārskats ar skaidrojumiem.')}
    <section class="exam-results">
      <div class="panel result-hero ${passed ? 'passed' : 'failed'}">
        <div class="score-ring" style="--score:${result.percent * 3.6}deg" role="img" aria-label="Rezultāts ${percent(result.percent)}"><div><strong>${percent(result.percent)}</strong><small>${result.correct} / ${result.total}</small></div></div>
        <div class="result-copy">
          <span class="kicker">${def.kicker}</span>
          <h2>${passed ? 'PĀRBAUDE NOKĀRTOTA' : 'NEPIECIEŠAMA ATKĀRTOŠANA'}</h2>
          <p class="result-line">${summary}</p>
          <p class="result-meta">${meta.map((item) => `<span>${html(item)}</span>`).join('')}</p>
          <div class="result-actions"><button type="button" class="button button-primary" id="exam-retry">Atkārtot ar citu secību ${icon('arrow')}</button><button type="button" class="button button-outline" id="exam-new">Jauna konfigurācija</button><button type="button" class="button button-outline" id="exam-print">${icon('print')} Drukāt rezultātu</button></div>
        </div>
      </div>
      <div class="result-panels">
        <div class="panel"><div class="panel-heading"><div><span class="kicker">ANALĪZE</span><h2>REZULTĀTS PA TĒMĀM</h2></div></div><div class="table-wrap"><table class="breakdown"><thead><tr><th scope="col">Tēma</th><th scope="col">Pareizi</th><th scope="col">Rezultāts</th></tr></thead><tbody>${breakdown}</tbody></table></div></div>
        <div class="panel"><div class="panel-heading"><div><span class="kicker">STATUSS</span><h2>KOPSAVILKUMS</h2></div></div>
          <ul class="briefing-list result-list"><li><b class="good">✓</b><span>Pareizi: <strong>${result.correct}</strong></span></li><li><b class="bad">×</b><span>Nepareizi: <strong>${result.wrong}</strong></span></li><li><b>—</b><span>Neatbildēti: <strong>${result.unanswered}</strong></span></li><li><b>★</b><span>Labākais rezultāts pārbaudes režīmā šajā pārlūkā: <strong>${best ? percent(best) : 'vēl nav'}</strong></span></li></ul>
        </div>
      </div>
      <div class="panel exam-review-panel"><div class="panel-heading"><div><span class="kicker">PĀRSKATS</span><h2 id="review-title"></h2></div><button type="button" class="mini-button" id="review-toggle" aria-controls="exam-review"></button></div><div class="exam-review" id="exam-review"></div></div>
    </section>`;

  const mount = () => {
    const list = document.querySelector<HTMLElement>('#exam-review');
    const paintReview = () => {
      const rows = result.rows.map((entry, index) => ({ ...entry, index })).filter((entry) => session.showAll || !entry.isCorrect);
      const title = document.querySelector('#review-title');
      if (title) title.textContent = session.showAll ? 'VISAS ATBILDES' : 'KĻŪDU PĀRSKATS';
      const toggle = document.querySelector<HTMLButtonElement>('#review-toggle');
      if (toggle) {
        toggle.textContent = session.showAll ? 'Rādīt tikai kļūdas' : 'Rādīt visas atbildes';
        toggle.setAttribute('aria-pressed', String(session.showAll));
      }
      if (!list) return;
      if (!rows.length) { list.innerHTML = '<p class="empty-review">Nevienas kļūdas – visas atbildes ir pareizas.</p>'; return; }
      list.innerHTML = rows.map(({ question, chosen, isCorrect, index }) => {
        const weapon = question.media ? weapons[question.media.weapon] : undefined;
        const media = weapon && question.media ? `<div class="review-media">${partThumb(weapon.scene, weapon.stepParts[question.media.stepId] ?? [], question.media.label)}</div>` : '';
        return `<details class="review-item ${isCorrect ? 'correct' : 'incorrect'}"><summary><span class="review-mark" aria-label="${isCorrect ? 'Pareizi' : 'Nepareizi'}">${isCorrect ? '✓' : '×'}</span><span class="review-number">${pad(index + 1)}</span><span class="review-prompt">${html(question.prompt)}</span></summary>
          <div class="review-body">${media}<dl><div><dt>Tava atbilde</dt><dd class="${isCorrect ? 'right' : 'wrong'}">${chosen ? html(chosen.text) : 'Nav atbildes'}</dd></div>${isCorrect ? '' : `<div><dt>Pareizā atbilde</dt><dd class="right">${html(question.correct)}</dd></div>`}<div><dt>Skaidrojums</dt><dd>${html(question.explanation)}</dd></div></dl></div><p class="review-ref">${html([topicLabel.get(question.topic), question.ref].filter(Boolean).join(' · '))}</p></details>`;
      }).join('');
    };
    document.querySelector('#review-toggle')?.addEventListener('click', () => { session.showAll = !session.showAll; paintReview(); });
    document.querySelector('#exam-retry')?.addEventListener('click', () => { begin(kind, config); go(); });
    document.querySelector('#exam-new')?.addEventListener('click', () => go('setup'));
    document.querySelector('#exam-print')?.addEventListener('click', () => window.print());
    // Print every reviewed answer expanded, then restore what the reader had open.
    const opened: HTMLDetailsElement[] = [];
    const beforePrint = () => document.querySelectorAll<HTMLDetailsElement>('.review-item:not([open])').forEach((item) => { item.open = true; opened.push(item); });
    const afterPrint = () => opened.splice(0).forEach((item) => { item.open = false; });
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    paintReview();
    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
    };
  };
  return { html: markup, mount };
}
