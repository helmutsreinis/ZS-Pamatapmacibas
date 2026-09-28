import { exams, modules, studies, weapons, type ModuleCard } from '../modules';
import { plural, upper } from '../lv';
import { staticScene } from '../scene/engine';
import type { Scene } from '../scene/engine';
import { html, icon, scrollBehavior, type AppContext, type View } from './dom';

function moduleCard(card: ModuleCard): string {
  const ready = card.status === 'ready';
  return `<article class="module-card module-${card.id} ${ready ? '' : 'is-planned'}" aria-labelledby="card-${card.id}">
    <div class="module-card-top"><span class="kicker">${card.kicker}</span><span class="status-badge ${ready ? 'ready' : 'planned'}">${ready ? 'PIEEJAMS' : 'DRĪZUMĀ'}</span></div>
    <h3 id="card-${card.id}">${html(card.title)}</h3>
    <p>${html(card.summary)}</p>
    <div class="module-facts">${card.facts.map((fact) => `<span><b>${fact.value}</b>${fact.label}</span>`).join('')}</div>
    <div class="module-actions">${ready
      ? card.links.map((link) => `<a class="button ${link.primary ? 'button-primary' : 'button-outline'}" href="${link.href}">${html(link.label)} ${link.primary ? icon('arrow') : ''}</a>`).join('')
      : `<span class="planned-note">${icon('lock')} Modulis tiek sagatavots</span>`}</div>
  </article>`;
}

export function homeView(app: AppContext): View {
  const ready = modules.filter((module) => module.status === 'ready');
  const planned = modules.length - ready.length;
  const full = exams.kopeja;
  const totalQuestions = full.sources.reduce((sum, source) => sum + source.topics.reduce((n, topic) => n + topic.count, 0), 0);
  const weaponCards = modules.filter((module) => module.group === 'weapon');
  const drillCards = modules.filter((module) => module.group === 'drill');
  const studyCards = modules.filter((module) => module.group === 'study');
  const readyWeapons = Object.values(weapons).filter((weapon) => ready.some((card) => card.id === weapon.id));
  const covers = readyWeapons.filter((weapon) => weapon.cover);
  const sourceGroups: { name: string; items: { text: string; url?: string }[] }[] = [
    ...readyWeapons.map((weapon) => ({ name: weapon.name, items: weapon.sources.map((source) => ({ text: source.short, url: source.url })) })),
    { name: 'Ierinda', items: [{ text: 'Ierindas mācību materiāls' }] },
    ...Object.values(studies).map((study) => ({ name: study.name, items: Object.values(study.sources).map((source) => ({ text: source.short, url: source.url })) })),
  ];
  const markup = `<section class="hero" aria-labelledby="hero-title">
    <div class="hero-photo" aria-hidden="true"></div><div class="hero-grid" aria-hidden="true"></div>
    <div class="hero-inner">
      <div class="hero-copy"><div class="eyebrow"><span class="eyebrow-line"></span> INTERAKTĪVA MĀCĪBU VIDE</div>
        <h1 id="hero-title">IZPROTI.<br><em>TRENĒJIES.</em><br>PĀRBAUDI.</h1>
        <p>Ieroču uzbūve ar animētu izjaukšanu un reāliem detaļu fotoattēliem, ierindas mācības tēmas, munīcija, ekipējums un pašpārbaude – vienuviet. Viss darbojas pārlūkā bez konta un bez datu nosūtīšanas.</p>
        <div class="hero-actions"><button class="button button-primary" type="button" data-scroll="modules">Izvēlēties moduli ${icon('arrow')}</button><a class="button button-outline" href="#/parbaude">Kopējā pārbaude</a></div>
        <div class="hero-meta"><span><b>${ready.length}</b>${upper(plural(ready.length, 'pieejams modulis', 'pieejami moduļi'))}</span><span><b>${totalQuestions}</b>${upper(plural(totalQuestions, 'jautājums', 'jautājumi'))}</span>${planned ? `<span><b>${planned}</b>${upper(plural(planned, 'modulis drīzumā', 'moduļi drīzumā'))}</span>` : `<span><b>${readyWeapons.length}</b>${upper(plural(readyWeapons.length, 'ierocis', 'ieroči'))}</span>`}</div>
      </div>
      <div class="hero-cards" style="--count:${readyWeapons.length}">${readyWeapons.map((weapon, index) => `<a class="hero-plate hero-card" href="#/${weapon.id}/macibas" style="--i:${index};--z:${readyWeapons.length - index}" aria-label="${html(weapon.title)}: skatīt animāciju"><div class="plate-top"><span>${weapon.name} · ${weapon.view}</span><span>${weapon.technical.calibre}</span></div><div class="hero-scene" data-hero-scene="${weapon.id}"></div><div class="plate-bottom"><span>${weapon.steps.length} ${upper(plural(weapon.steps.length, 'posms', 'posmi'))} · NEPILNĀ IZJAUKŠANA</span><span class="plate-link">SKATĪT ANIMĀCIJU →</span></div></a>`).join('')}</div>
    </div>
  </section>
  <section class="home-section" id="modules" aria-labelledby="modules-title"><div class="section-heading"><div><span class="kicker">MODUĻI</span><h2 id="modules-title">IZVĒLIES, KO MĀCĪTIES</h2></div><p>Katram modulim ir mācību daļa un pašpārbaude. Kopējā pārbaude apvieno visus pieejamos moduļus.</p></div>
    <div class="module-groups"><div class="module-group module-group-weapons"><h3 class="module-group-title">${icon('rifle')} IEROČU UZBŪVE</h3><div class="module-grid">${weaponCards.map(moduleCard).join('')}</div></div>
    <div class="module-group module-group-drill"><h3 class="module-group-title">${icon('drill')} IERINDAS MĀCĪBA</h3><div class="module-grid">${drillCards.map(moduleCard).join('')}</div></div>
    ${studyCards.length ? `<div class="module-group module-group-study"><h3 class="module-group-title">${icon('ammo')} MUNĪCIJA UN ${icon('kit')} EKIPĒJUMS</h3><div class="module-grid">${studyCards.map(moduleCard).join('')}</div></div>` : ''}</div>
  </section>
  <section class="exam-banner" aria-labelledby="exam-title"><div class="exam-banner-copy"><span class="kicker">KOPĒJĀ ZINĀŠANU PĀRBAUDE</span><h2 id="exam-title">VIENS TESTS – VISI MODUĻI</h2><p>Jautājumi par ieroču detaļām, to funkcijām, kustību virzieniem, izjaukšanas secību un tehniskajiem datiem, ierindas mācību, munīciju un ekipējumu. Izvēlies tēmas, jautājumu skaitu, laika ierobežojumu un nokārtošanas slieksni.</p><a class="button button-primary" href="#/parbaude">Sākt kopējo pārbaudi ${icon('arrow')}</a></div>
    <ul class="exam-sources">${full.sources.map((source) => {
      const count = source.topics.reduce((n, topic) => n + topic.count, 0);
      return `<li><b>${html(source.name)}</b><span>${source.topics.length} ${plural(source.topics.length, 'tēma', 'tēmas')} · ${count} ${plural(count, 'jautājums', 'jautājumi')}</span></li>`;
    }).join('')}</ul>
  </section>
  <section class="overview-section" aria-labelledby="overview-title"><div class="overview-photos" aria-hidden="true">${covers.map((weapon) => `<div class="overview-photo" style="background-image:linear-gradient(90deg,#10191010,#10191020),url('${weapon.cover}')"><span>${html(weapon.name)}</span></div>`).join('')}</div>
    <div class="overview-copy"><span class="kicker">SATURS UN AVOTI</span><h2 id="overview-title">MĀCĪBAS, KAS BALSTĀS UZ OFICIĀLIEM AVOTIEM.</h2><p>Ieroču moduļos detaļas izgrieztas no reāliem izjaukšanas fotoattēliem, un to kustības atkārto dienesta rokasgrāmatās aprakstītās darbības. Ierindas jautājumi veidoti no desmit lappušu ierindas mācību materiāla, munīcijas un ekipējuma tēmas – no normatīvajiem aktiem, rokasgrāmatām un ražotāju datiem, kas norādīti katrā tēmā. Pirms oficiālas lietošanas saturu pārbauda instruktors.</p>
      <dl class="source-list">${sourceGroups.map((group) => `<div><dt>${html(group.name)}</dt><dd>${group.items.map((item) => (item.url ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${html(item.text)}</a>` : `<span>${html(item.text)}</span>`)).join('')}</dd></div>`).join('')}</dl>
      <button class="button button-light" type="button" data-scroll="modules">Izvēlēties moduli ${icon('arrow')}</button></div></section>`;

  return {
    html: markup,
    mount: () => {
      // One picture per card; the first weapon in the registry lies on top of the fan.
      const scenes: Scene[] = [];
      document.querySelectorAll<HTMLElement>('[data-hero-scene]').forEach((host) => {
        const weapon = weapons[host.dataset.heroScene ?? ''];
        if (weapon) scenes.push(staticScene(host, weapon.scene, { uid: `hero-${weapon.id}`, camera: 'rifle', ariaLabel: `${weapon.title}, salikta, ${weapon.view.toLocaleLowerCase('lv-LV')}` }));
      });
      document.querySelectorAll('[data-scroll="modules"]').forEach((button) => button.addEventListener('click', () => {
        document.querySelector('#modules')?.scrollIntoView({ behavior: scrollBehavior(app.reducedMotion) });
      }));
      return () => scenes.forEach((scene) => scene.destroy());
    },
  };
}
