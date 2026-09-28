import { modules } from '../modules';
import { html } from './dom';

export const SITE_NAME = 'Mācību centrs';

const emblem = `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 4 54 12v17c0 14-8.9 25.1-22 31C18.9 54.1 10 43 10 29V12L32 4Z" stroke="currentColor" stroke-width="3"/><path d="m19 24 13-8 13 8-13 8-13-8Z" fill="currentColor"/><path d="m19 35 13 8 13-8" stroke="#d8cfad" stroke-width="3"/></svg>`;

/** Header links: home, every ready module, and the combined test. */
function navLinks(section: string): string {
  const links = [
    { key: 'home', label: 'Sākums', href: '#/' },
    ...modules.filter((module) => module.status === 'ready').map((module) => ({ key: module.id, label: module.title, href: module.links[0]?.href ?? '#/' })),
    { key: 'kopeja', label: 'Kopējā pārbaude', href: '#/parbaude' },
  ];
  return links.map((link) => `<a class="nav-link ${section === link.key ? 'active' : ''}" href="${link.href}" ${section === link.key ? 'aria-current="page"' : ''}>${html(link.label)}</a>`).join('');
}

export function shell(section: string, main: string): string {
  return `
    <a class="skip-link" href="#main-content">Pāriet uz saturu</a>
    <div class="topline"><span>MĀCĪBU MATERIĀLS · IEROČU UZBŪVE UN IERINDA</span><span class="topline-right">LATVIEŠU VALODĀ · BEZ REĢISTRĀCIJAS</span></div>
    <header class="site-header">
      <a class="brand" href="#/" aria-label="${SITE_NAME}: uz sākumlapu"><span class="brand-mark">${emblem}</span><span class="brand-copy"><strong>${SITE_NAME.toLocaleUpperCase('lv-LV')}</strong><small>IEROČI · IERINDA · PĀRBAUDE</small></span></a>
      <nav class="main-nav" aria-label="Galvenā navigācija">${navLinks(section)}</nav>
      <div class="header-chip"><span class="status-dot"></span> PAŠMĀCĪBAS RĪKS</div>
    </header>
    <main id="main-content" tabindex="-1">${main}</main>
    <footer class="site-footer">
      <div><span class="footer-kicker">${SITE_NAME.toLocaleUpperCase('lv-LV')} / NEOFICIĀLS PAŠMĀCĪBAS RĪKS</span><p>G36 kustības atbilst Bundesvēra rokasgrāmatai A2-222/0-0-4741, AK-4 secība – Jaunsarga rokasgrāmatai, kustības – G3 dienesta instrukcijai ZDv 3/13. Ierindas jautājumi veidoti no iesniegtā ierindas mācību materiāla. Praktiskās darbības ar ieroci veic tikai instruktora vadībā un ar izlādētu ieroci.</p><p class="footer-credit">AK-4 detaļu fotoattēli: lago4096, retušējis Auge=mit, <a href="https://commons.wikimedia.org/wiki/File:G3A3_disassembled_mod.jpg" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.lv" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>; izgriezti, pagriezti un mērogoti. G36 laide: Pierre Courtejoie, <a href="https://commons.wikimedia.org/wiki/File:German_Army_-_HK_G36K_A4_-_EOtech_holographic_sight_-_red_dot_magnifier_G33%E2%84%A2.webp" target="_blank" rel="noopener noreferrer">DVIDS</a>, publiskais īpašums.</p></div>
      <div class="footer-links">${modules.filter((module) => module.status === 'ready' && module.group === 'weapon').map((module) => `<a href="#/${module.id}/macibas">${html(module.title)} mācību režīms</a>`).join('')}<a href="#/ierinda">Ierindas tēmas</a><a href="#/parbaude">Kopējā pārbaude</a></div>
    </footer>`;
}
