import { html } from '../ui/dom';
import type { Credit, Figure, Line, Picture } from './types';

/** Escape text and turn **bold** into <b>; the only markup study texts use. */
export const rich = (text: string): string => html(text).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

const percent = (value: number, total: number) => `${((value / total) * 100).toFixed(2)}%`;

const link = (text: string, url?: string) => (url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${html(text)}</a>` : html(text));

export function creditLine(credit: Credit): string {
  const changes = credit.changes ? `; ${html(credit.changes)}` : '';
  return `<span class="study-credit">${html(credit.author)}, ${link(credit.source, credit.url)}, ${link(credit.licence, credit.licenceUrl)}${changes}</span>`;
}

/** A photo without markers (cards, question pictures). */
export function pictureMarkup(picture: Picture, className = 'study-picture'): string {
  return `<img class="${className}" src="${picture.src}" width="${picture.width}" height="${picture.height}" alt="${html(picture.alt)}" loading="lazy" decoding="async">`;
}

/**
 * Dimension lines get end ticks and a label beside their middle; leaders are plain lines.
 * Every stroke is drawn twice – a light halo under a dark line – so it reads on light and dark photos.
 */
function lineMarkup(line: Line, figure: Figure): string {
  const dx = line.x2 - line.x1, dy = line.y2 - line.y1;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length, ny = dx / length;
  const tick = figure.width * 0.012;
  const segments: [number, number, number, number][] = [[line.x1, line.y1, line.x2, line.y2]];
  if (line.kind !== 'leader') {
    for (const [x, y] of [[line.x1, line.y1], [line.x2, line.y2]]) segments.push([x - nx * tick, y - ny * tick, x + nx * tick, y + ny * tick]);
  }
  const draw = (className: string) => segments.map(([x1, y1, x2, y2]) => `<line class="${className}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`).join('');
  const size = figure.width * 0.026;
  const offset = size * 0.95;
  const label = line.label
    ? `<text x="${((line.x1 + line.x2) / 2 + nx * offset).toFixed(1)}" y="${((line.y1 + line.y2) / 2 + ny * offset).toFixed(1)}" font-size="${size.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${html(line.label)}</text>`
    : '';
  return `<g class="figure-line ${line.kind ?? 'dimension'}">${draw('halo')}${draw('stroke')}${label}</g>`;
}

/** A photo with numbered markers, a legend and a description of the chosen marker. */
export function figureMarkup(figure: Figure): string {
  const dot = Math.max(figure.width, figure.height) * 0.007;
  const leaders = figure.spots.filter((spot) => spot.mx !== undefined && spot.my !== undefined)
    .map((spot) => `<g class="figure-leader" data-leader="${spot.id}"><line x1="${spot.mx}" y1="${spot.my}" x2="${spot.x}" y2="${spot.y}"/><circle cx="${spot.x}" cy="${spot.y}" r="${dot.toFixed(1)}"/></g>`).join('');
  const overlay = (figure.lines ?? []).map((line) => lineMarkup(line, figure)).join('') + leaders;
  const lines = overlay ? `<svg class="figure-lines" viewBox="0 0 ${figure.width} ${figure.height}" aria-hidden="true">${overlay}</svg>` : '';
  const spots = figure.spots.map((spot, index) => `<button type="button" class="figure-spot" data-spot="${spot.id}" style="left:${percent(spot.mx ?? spot.x, figure.width)};top:${percent(spot.my ?? spot.y, figure.height)}" aria-label="${index + 1}. ${html(spot.label)}" aria-pressed="false">${index + 1}</button>`).join('');
  const legend = figure.spots.map((spot, index) => `<li><button type="button" class="figure-key" data-spot="${spot.id}" aria-pressed="false"><b>${index + 1}</b><span class="figure-key-label">${html(spot.label)}</span><span class="figure-key-hidden" aria-hidden="true">?</span></button></li>`).join('');
  const portrait = figure.height > figure.width * 1.05;
  return `<figure class="study-figure ${portrait ? 'is-portrait' : ''}" data-figure="${figure.id}">
    <div class="figure-body">
      <div class="figure-stage" style="aspect-ratio:${figure.width} / ${figure.height};max-width:${Math.round(figure.width * 1.7)}px">${pictureMarkup(figure, 'figure-photo')}${lines}${spots}</div>
      <div class="figure-side">
        <div class="figure-tools"><span class="kicker">${figure.spots.length} ${figure.spots.length === 1 ? 'MARĶIERIS' : 'MARĶIERI'}</span><button type="button" class="mini-button" data-figure-hide aria-pressed="false">Slēpt nosaukumus</button></div>
        <ol class="figure-legend">${legend}</ol>
        <div class="figure-detail" aria-live="polite"><p class="figure-detail-hint">Izvēlies numuru attēlā vai sarakstā, lai redzētu skaidrojumu.</p></div>
      </div>
    </div>
    <figcaption>${rich(figure.caption)} ${creditLine(figure.credit)}</figcaption>
  </figure>`;
}

/**
 * Wire up the figures inside `root`: choosing a marker (on the photo or in the legend) shows its
 * description. With the names hidden the legend shows only numbers; a chosen marker reveals its name.
 */
export function mountFigures(root: ParentNode, figures: Figure[]): void {
  for (const figure of figures) {
    const element = root.querySelector<HTMLElement>(`[data-figure="${figure.id}"]`);
    if (!element) continue;
    const detail = element.querySelector<HTMLElement>('.figure-detail');
    const revealed = new Set<string>();
    let current: string | null = null;
    const paint = () => {
      const hidden = element.classList.contains('is-hidden');
      element.querySelectorAll<HTMLButtonElement>('[data-spot]').forEach((button) => {
        const id = button.dataset.spot ?? '';
        const on = id === current;
        button.classList.toggle('active', on);
        button.setAttribute('aria-pressed', String(on));
        button.classList.toggle('is-revealed', revealed.has(id));
        if (button.classList.contains('figure-spot')) {
          const index = figure.spots.findIndex((item) => item.id === id);
          const named = !hidden || revealed.has(id);
          button.setAttribute('aria-label', `${index + 1}.${named ? ` ${figure.spots[index]?.label ?? ''}` : ' marķieris'}`);
        }
      });
      element.querySelectorAll<SVGGElement>('[data-leader]').forEach((leader) => leader.classList.toggle('active', leader.dataset.leader === current));
      const spot = figure.spots.find((item) => item.id === current);
      if (!detail) return;
      if (!spot) {
        detail.innerHTML = `<p class="figure-detail-hint">${hidden ? 'Nosaukumi paslēpti: izvēlies numuru, nosauc to pats un tad pārbaudi skaidrojumu.' : 'Izvēlies numuru attēlā vai sarakstā, lai redzētu skaidrojumu.'}</p>`;
        return;
      }
      const number = figure.spots.indexOf(spot) + 1;
      detail.innerHTML = `<span class="figure-detail-number">${number}</span><div><h4>${html(spot.label)}</h4><p>${rich(spot.text)}</p></div>`;
    };
    element.querySelectorAll<HTMLButtonElement>('[data-spot]').forEach((button) => button.addEventListener('click', () => {
      const id = button.dataset.spot ?? '';
      current = current === id ? null : id;
      if (current) revealed.add(current);
      paint();
    }));
    const hide = element.querySelector<HTMLButtonElement>('[data-figure-hide]');
    hide?.addEventListener('click', () => {
      const on = !element.classList.contains('is-hidden');
      element.classList.toggle('is-hidden', on);
      hide.setAttribute('aria-pressed', String(on));
      hide.textContent = on ? 'Rādīt nosaukumus' : 'Slēpt nosaukumus';
      revealed.clear();
      current = null;
      paint();
    });
  }
}
