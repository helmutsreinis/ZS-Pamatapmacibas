import { pad } from '../lv';
import { Scene, activeSegment, timelineLength, type ActiveSegment, type SceneMode } from '../scene/engine';
import { Player, type PlayerState } from '../scene/player';
import { partThumb } from '../scene/thumb';
import { html, icon, moduleTabs, pageIntro, scrollBehavior, type AppContext, type View } from '../ui/dom';
import type { Stage, Step, WeaponModule } from './types';

type LearnState = { mode: SceneMode; time: number; speed: number; follow: boolean };
const states = new Map<string, LearnState>();

function stateFor(weapon: WeaponModule): LearnState {
  let state = states.get(weapon.id);
  if (!state) { state = { mode: 'disassembly', time: 0, speed: 1, follow: true }; states.set(weapon.id, state); }
  return state;
}

/** What one timeline segment means for the page, in either direction. */
type SegmentInfo = { number: string; title: string; hint: string; action: string; part: string; step?: Step; stage?: Stage; thumbId: string };

export function segmentInfo(weapon: WeaponModule, mode: SceneMode, index: number): SegmentInfo {
  const { steps, prep, finalCheck } = weapon;
  if (mode === 'disassembly') {
    if (index === 0) return { number: '00', title: prep.label, hint: prep.hint, action: prep.action, part: prep.part, stage: prep, thumbId: 'prep' };
    const step = steps[index - 1];
    return { number: pad(index), title: step.label, hint: step.hint, action: step.action, part: step.part, step, thumbId: step.id };
  }
  if (index === steps.length) return { number: '✓', title: finalCheck.label, hint: finalCheck.hint, action: finalCheck.action, part: finalCheck.part, stage: finalCheck, thumbId: 'check' };
  const step = steps[steps.length - 1 - index];
  return { number: pad(index + 1), title: step.assemblyLabel, hint: step.assemblyHint, action: step.assemblyAction, part: step.part, step, thumbId: step.id };
}

export function weaponTabs(weapon: WeaponModule, active: 'learn' | 'test'): string {
  return moduleTabs(weapon.name, [
    { label: 'Mācību režīms', href: `#/${weapon.id}/macibas`, active: active === 'learn' },
    { label: 'Pašpārbaude', href: `#/${weapon.id}/parbaude`, active: active === 'test' },
  ]);
}

const modeName = (mode: SceneMode) => (mode === 'disassembly' ? 'IZJAUKŠANA' : 'SALIKŠANA');

export function weaponLearnView(weapon: WeaponModule, app: AppContext): View {
  const state = stateFor(weapon);
  const model = weapon.scene;
  const length = timelineLength(model);
  const total = weapon.steps.length;
  const tiles = Array.from({ length }, (_, index) => segmentInfo(weapon, state.mode, index));
  const segmented = (label: string, id: string, items: { attr: string; value: string; text: string; on: boolean }[], small = false) =>
    `<div><span class="tiny-label" id="${id}">${label}</span><div class="segmented ${small ? 'segmented-small' : ''}" role="group" aria-labelledby="${id}">${items.map((item) => `<button type="button" ${item.attr}="${item.value}" class="${item.on ? 'selected' : ''}" aria-pressed="${item.on}">${item.text}</button>`).join('')}</div></div>`;

  const markup = `${pageIntro({
      kicker: `${weapon.name} · MĀCĪBU REŽĪMS`, side: `${weapon.title.toLocaleUpperCase('lv-LV')} · NEPILNĀ IZJAUKŠANA`, className: 'learn-intro',
      title: 'IZPĒTI KATRU <em>MEZGLU.</em>',
      lead: 'Izvēlies virzienu un seko posmiem. Animācija rāda katras detaļas atrašanās vietu un kustības virzienu; kursa terminoloģiju pārbauda instruktors.',
      extra: weaponTabs(weapon, 'learn'),
      photo: weapon.photo,
    })}
    <section class="learn-layout"><div class="learn-main panel">
      <div class="panel-head">
        ${segmented('DARBĪBAS VIRZIENS', 'mode-label', [
          { attr: 'data-mode', value: 'disassembly', text: 'Izjaukšana', on: state.mode === 'disassembly' },
          { attr: 'data-mode', value: 'assembly', text: 'Salikšana', on: state.mode === 'assembly' }])}
        <div class="head-options">
          ${segmented('ĀTRUMS', 'speed-label', [0.5, 1, 2].map((value) => ({ attr: 'data-speed', value: String(value), text: `${String(value).replace('.', ',')}×`, on: state.speed === value })), true)}
          ${segmented('KAMERA', 'camera-label', [
            { attr: 'data-camera', value: 'follow', text: 'Seko', on: state.follow },
            { attr: 'data-camera', value: 'overview', text: 'Pārskats', on: !state.follow }], true)}
        </div>
      </div>
      <div class="learning-stage" id="learning-stage" tabindex="0" aria-describedby="stage-help"><div class="stage-host" id="stage-host"></div><div class="stage-corner stage-corner-top">${weapon.name}<br>${weapon.technical.calibre}</div><div class="stage-corner stage-corner-bottom">${modeName(state.mode)} · <span id="stage-counter">00</span></div><div class="stage-legend"><span><i class="legend-out">⊙</i> pretī skatītājam</span><span><i class="legend-in">⊗</i> prom no skatītāja</span></div></div>
      <p class="sr-only" id="stage-help">Ar bultiņām pa kreisi un pa labi pārvietojies pa posmiem, ar atstarpi palaid vai aptur animāciju.</p>
      <div class="playback-bar"><div class="playback-title"><span class="tiny-label" id="playback-kicker">PAŠREIZĒJAIS POSMS</span><strong id="playback-step-title" aria-live="polite"></strong></div><div class="playback-controls"><button type="button" class="icon-button" id="learn-prev" aria-label="Iepriekšējais posms">${icon('prev')}</button><button type="button" class="icon-button play-button" id="learn-play" aria-label="Atskaņot animāciju">${icon('play')}</button><button type="button" class="icon-button" id="learn-next" aria-label="Nākamais posms">${icon('next')}</button></div><div class="playback-count"><span id="progress-current">00</span><span>/ ${total}</span></div></div>
      <div class="scrubber"><input type="range" id="scrubber" min="0" max="${length}" step="0.01" value="${state.time}" aria-label="Animācijas laika josla"/><div class="scrubber-ticks" aria-hidden="true">${tiles.map(() => '<i></i>').join('')}</div></div>
    </div><aside class="learn-aside"><div class="part-card panel"><div class="part-card-heading"><span class="kicker" id="part-kicker">DETAĻA</span><span id="part-number">00 / ${total}</span></div><div class="part-thumb" id="part-thumb"></div><h2 id="part-name"></h2><div class="part-fact"><span class="tiny-label">DARBĪBA</span><p class="action-lead" id="part-action"></p></div><div class="part-fact" id="part-function-block"><span class="tiny-label">FUNKCIJA</span><p class="function-lead" id="part-function"></p></div><p id="part-explanation"></p><div id="part-tip" class="tip-note hidden"></div><div id="part-term" class="term-note hidden"></div><a id="part-source" href="#" target="_blank" rel="noopener noreferrer"></a></div>
      <div class="learning-note"><span class="note-icon">i</span><p>Animācija ir mācību palīglīdzeklis, nevis oficiāla rokasgrāmata. Praktisko izjaukšanu veic tikai instruktora vadībā un ar izlādētu ieroci.${weapon.credit ? ` <a class="photo-credit" href="${weapon.credit.url}" target="_blank" rel="noopener noreferrer">${html(weapon.credit.text)} ↗</a>` : ''}</p></div></aside></section>
    <section class="step-section"><div class="section-heading compact"><div><span class="kicker">POSMU PĀRSKATS</span><h2>${state.mode === 'disassembly' ? 'IZJAUKŠANA SOLI PA SOLIM' : 'SALIKŠANA SOLI PA SOLIM'}</h2></div><p>Izvēlies jebkuru posmu, lai to noskatītos no sākuma un izlasītu par attiecīgo detaļu.</p></div><div class="step-grid" id="step-grid">${tiles.map((info, index) => `<button type="button" class="step-tile ${info.stage ? 'step-tile-stage' : ''}" data-learn-step="${index}" aria-label="${html(info.number === '✓' ? info.title : `${info.number}. posms: ${info.title}`)}"><span>${info.number}</span><strong>${html(info.title)}</strong>${icon('arrow')}</button>`).join('')}</div></section>`;

  const mount = () => {
    const host = document.querySelector<HTMLElement>('#stage-host');
    if (!host) return;
    const tags: Record<string, string> = {};
    weapon.steps.forEach((step, index) => {
      for (const id of weapon.stepParts[step.id] ?? []) tags[id] = state.mode === 'disassembly' ? pad(index + 1) : pad(total - index);
    });
    for (const id of weapon.stepParts.prep ?? []) tags[id] = state.mode === 'disassembly' ? '00' : '—';
    const label = (active: ActiveSegment) => {
      const info = segmentInfo(weapon, active.mode, active.index);
      if (info.stage) return { title: info.number === '✓' ? info.title : `${info.number} · ${info.title}`, hint: info.hint };
      return { title: `${info.number} · ${info.part}`, hint: info.hint };
    };
    const scene = new Scene(host, model, { uid: `learn-${weapon.id}`, board: true, boardTags: tags, camera: state.follow ? 'auto' : 'overview', label, ariaLabel: `${weapon.name}, ${weapon.view.toLocaleLowerCase('lv-LV')}` });
    const scrubber = document.querySelector<HTMLInputElement>('#scrubber');
    let lastKey = '';
    const player = new Player({
      length,
      durationOf: (index) => activeSegment(model, state.mode, index + 0.5).segment.duration,
      reducedMotion: app.reducedMotion,
      onFrame: (time) => {
        state.time = time;
        scene.show(state.mode, time);
        if (scrubber && document.activeElement !== scrubber) scrubber.value = String(time);
      },
      onChange: (playerState) => {
        const key = `${Math.ceil(playerState.time - 1e-6)}|${playerState.playing}|${playerState.animating}|${playerState.time === 0}`;
        if (key !== lastKey) { lastKey = key; updateText(weapon, state, playerState); }
      },
    });
    player.setSpeed(state.speed);
    player.seek(state.time);

    const select = (attr: string, button: HTMLButtonElement) => document.querySelectorAll<HTMLButtonElement>(`[${attr}]`).forEach((other) => {
      other.classList.toggle('selected', other === button);
      other.setAttribute('aria-pressed', String(other === button));
    });
    document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => button.addEventListener('click', () => {
      if (state.mode === button.dataset.mode) return;
      state.mode = button.dataset.mode as SceneMode;
      state.time = 0;
      app.refresh();
    }));
    document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach((button) => button.addEventListener('click', () => {
      state.speed = Number(button.dataset.speed);
      player.setSpeed(state.speed);
      select('data-speed', button);
    }));
    document.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach((button) => button.addEventListener('click', () => {
      state.follow = button.dataset.camera === 'follow';
      scene.setCamera(state.follow ? 'auto' : 'overview');
      select('data-camera', button);
    }));
    document.querySelector('#learn-prev')?.addEventListener('click', () => player.previous());
    document.querySelector('#learn-next')?.addEventListener('click', () => player.next());
    document.querySelector('#learn-play')?.addEventListener('click', () => player.toggle());
    scrubber?.addEventListener('input', () => player.seek(Number(scrubber.value)));
    document.querySelectorAll<HTMLButtonElement>('[data-learn-step]').forEach((button) => button.addEventListener('click', () => {
      player.playSegment(Number(button.dataset.learnStep));
      document.querySelector('#learning-stage')?.scrollIntoView({ behavior: scrollBehavior(app.reducedMotion), block: 'center' });
    }));
    document.querySelector<HTMLElement>('#learning-stage')?.addEventListener('keydown', (event) => {
      const actions: Record<string, () => void> = {
        ArrowRight: () => player.next(), ArrowLeft: () => player.previous(), ' ': () => player.toggle(),
        Home: () => player.seek(0), End: () => player.seek(length),
      };
      const action = actions[event.key];
      if (action) { event.preventDefault(); action(); }
    });
    return () => { player.destroy(); scene.destroy(); };
  };

  return { html: markup, mount };
}

function updateText(weapon: WeaponModule, state: LearnState, playerState: PlayerState): void {
  const model = weapon.scene;
  const length = timelineLength(model);
  const total = weapon.steps.length;
  const active = activeSegment(model, state.mode, playerState.time);
  const info = segmentInfo(weapon, state.mode, active.index);
  const started = playerState.time > 1e-6;
  const setText = (selector: string, text: string) => { const element = document.querySelector<HTMLElement>(selector); if (element) element.textContent = text; };
  setText('#playback-kicker', started ? 'PAŠREIZĒJAIS POSMS' : 'NĀKAMAIS POSMS');
  setText('#playback-step-title', info.number === '✓' ? info.title : `${info.number} · ${info.title}`);
  const completed = state.mode === 'disassembly' ? Math.max(0, Math.floor(playerState.time + 1e-6) - 1) : Math.min(total, Math.floor(playerState.time + 1e-6));
  setText('#progress-current', pad(completed));
  setText('#stage-counter', info.stage ? info.number : `${info.number} / ${total}`);
  setText('#part-kicker', info.stage ? 'SAGATAVOŠANA' : 'DETAĻA');
  setText('#part-number', info.stage ? (info.stage.id === 'prep' ? '00' : '✓') : `${info.number} / ${total}`);
  setText('#part-name', info.part);
  setText('#part-action', info.action);
  document.querySelector<HTMLElement>('#part-function-block')?.classList.toggle('hidden', !info.step);
  setText('#part-function', info.step?.function ?? '');
  setText('#part-explanation', info.step?.explanation ?? info.stage?.explanation ?? '');
  const tipText = state.mode === 'disassembly' ? info.step?.tip : info.step?.assemblyTip;
  const tip = document.querySelector<HTMLElement>('#part-tip');
  if (tip) { tip.classList.toggle('hidden', !tipText); tip.textContent = tipText ? `PADOMS: ${tipText}` : ''; }
  const term = document.querySelector<HTMLElement>('#part-term');
  if (term) { term.classList.toggle('hidden', !info.step?.term); term.textContent = info.step?.term ? `TERMINOLOĢIJA: ${info.step.term}` : ''; }
  const source = document.querySelector<HTMLAnchorElement>('#part-source');
  const sourceInfo = info.step ?? info.stage;
  if (source && sourceInfo) { source.href = sourceInfo.source; source.textContent = `AVOTS: ${sourceInfo.sourceName} ↗`; }
  const thumb = document.querySelector<HTMLElement>('#part-thumb');
  if (thumb && thumb.dataset.id !== info.thumbId) { thumb.dataset.id = info.thumbId; thumb.innerHTML = partThumb(model, weapon.stepParts[info.thumbId] ?? [], info.part); }
  document.querySelectorAll<HTMLButtonElement>('[data-learn-step]').forEach((button) => {
    const index = Number(button.dataset.learnStep);
    const current = started && index === active.index;
    button.classList.toggle('active', current);
    button.classList.toggle('completed', playerState.time >= index + 1 - 1e-6);
    button.setAttribute('aria-current', current ? 'step' : 'false');
  });
  const prev = document.querySelector<HTMLButtonElement>('#learn-prev');
  const next = document.querySelector<HTMLButtonElement>('#learn-next');
  if (prev) prev.disabled = playerState.time <= 1e-6;
  if (next) next.disabled = playerState.time >= length - 1e-6;
  const play = document.querySelector<HTMLButtonElement>('#learn-play');
  if (play) {
    play.innerHTML = icon(playerState.playing ? 'pause' : 'play');
    play.setAttribute('aria-label', playerState.playing ? 'Apturēt animāciju' : 'Atskaņot animāciju');
  }
}
