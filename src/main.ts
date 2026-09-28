import './style.css';
import './hub.css';
import './study.css';
import assembledPhoto from './assets/g36-reference-assembled.png';
import explodedPhoto from './assets/g36-reference-exploded.png';
import partsPhoto from './assets/g36-reference-parts.png';
import { chapters } from './drill';
import { drillView } from './drill/topics-view';
import { examView } from './exam/view';
import { exams, studies, weapons } from './modules';
import { parseRoute, routeSection, type Route } from './router';
import { studyView } from './study/view';
import type { AppContext, View } from './ui/dom';
import { homeView } from './ui/home';
import { SITE_NAME, shell } from './ui/shell';
import { weaponLearnView } from './weapons/learn-view';
import { weaponTestView } from './weapons/test-view';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Trūkst lietotnes saknes elementa.');

const app: AppContext = {
  refresh: () => render(),
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
};

/** Last hash that was a route; in-page anchors such as the skip link do not change the page. */
let routeHash = location.hash.startsWith('#/') ? location.hash : '#/';
let cleanup: (() => void) | void;

function page(route: Route): { view: View; title: string } {
  switch (route.page) {
    case 'weapon-learn': {
      const weapon = weapons[route.weapon];
      return { view: weaponLearnView(weapon, app), title: `${weapon.name} · Mācību režīms` };
    }
    case 'weapon-test': {
      const weapon = weapons[route.weapon];
      return { view: weaponTestView(weapon, app), title: `${weapon.name} · Pašpārbaude` };
    }
    case 'drill': {
      const chapter = chapters.find((item) => item.number === route.chapter) ?? chapters[0];
      return { view: drillView(chapter.number), title: `Ierinda · ${chapter.title}` };
    }
    case 'study': {
      const study = studies[route.module];
      const chapter = study.chapters.find((item) => item.number === route.chapter) ?? study.chapters[0];
      return { view: studyView(study, chapter.number), title: `${study.name} · ${chapter.title}` };
    }
    case 'exam':
      return { view: examView(route.exam, app), title: exams[route.exam].pageTitle };
    default:
      return { view: homeView(app), title: 'Ieroču uzbūve un ierindas mācība' };
  }
}

function render(): void {
  const route = parseRoute(routeHash, Object.keys(weapons), Object.keys(studies));
  cleanup?.();
  cleanup = undefined;
  // Dialogs opened by the previous page close with it (their promises resolve as "cancel").
  document.querySelectorAll('body > dialog').forEach((dialog) => dialog.dispatchEvent(new Event('cancel')));
  const { view, title } = page(route);
  root!.innerHTML = `<div class="site-shell" style="--hero-photo:url('${assembledPhoto}');--exploded-photo:url('${explodedPhoto}');--parts-photo:url('${partsPhoto}')">${shell(routeSection(route), view.html)}</div>`;
  document.title = `${title} · ${SITE_NAME}`;
  cleanup = view.mount?.();
}

window.addEventListener('hashchange', () => {
  if (!location.hash.startsWith('#/') && location.hash !== '') return;
  routeHash = location.hash || '#/';
  render();
  window.scrollTo({ top: 0 });
  document.querySelector<HTMLElement>('#main-content')?.focus({ preventScroll: true });
});

root.addEventListener('click', (event) => {
  const skip = (event.target as Element | null)?.closest('.skip-link');
  if (!skip) return;
  event.preventDefault();
  document.querySelector<HTMLElement>('#main-content')?.focus();
});

render();
