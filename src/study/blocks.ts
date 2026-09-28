import { pad } from '../lv';
import { html } from '../ui/dom';
import { creditLine, figureMarkup, pictureMarkup, rich } from './figure';
import type { Block, Card, Figure, StudyModule } from './types';

function cardMarkup(card: Card): string {
  const picture = card.picture ? `<div class="study-card-photo">${pictureMarkup(card.picture)}</div>` : '';
  const swatch = card.swatch
    ? `<span class="study-swatch"><span class="study-swatch-colours" aria-hidden="true">${card.swatch.colours.map((colour) => `<i style="background:${colour}"></i>`).join('')}</span>${html(card.swatch.label)}</span>`
    : '';
  const facts = card.facts?.length
    ? `<dl class="study-card-facts">${card.facts.map((fact) => `<div><dt>${html(fact.label)}</dt><dd>${rich(fact.value)}</dd></div>`).join('')}</dl>`
    : '';
  const credit = card.picture ? `<p class="study-card-credit">${creditLine(card.picture.credit)}</p>` : '';
  return `<article class="study-card" id="card-${card.id}">${picture}<div class="study-card-body">${card.kicker ? `<span class="kicker">${html(card.kicker)}</span>` : ''}<h4>${html(card.title)}</h4>${swatch}<p>${rich(card.text)}</p>${facts}${credit}</div></article>`;
}

const title = (text?: string) => (text ? `<h3 class="block-title">${html(text)}</h3>` : '');

export function blockMarkup(block: Block): string {
  switch (block.kind) {
    case 'text':
      return `<div class="study-text">${block.paragraphs.map((paragraph) => `<p>${rich(paragraph)}</p>`).join('')}</div>`;
    case 'figure':
      return figureMarkup(block.figure);
    case 'cards':
      return `<section class="study-block">${title(block.title)}<div class="study-cards">${block.cards.map(cardMarkup).join('')}</div></section>`;
    case 'table':
      return `<div class="table-wrap study-table"><table><caption>${html(block.caption)}</caption><thead><tr>${block.head.map((cell) => `<th scope="col">${html(cell)}</th>`).join('')}</tr></thead><tbody>${block.rows.map((row) => `<tr>${row.map((cell, index) => (index === 0 ? `<th scope="row">${rich(cell)}</th>` : `<td>${rich(cell)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
    case 'sequence':
      return `<section class="study-block study-sequence">${title(block.title)}${block.lead ? `<p class="block-lead">${rich(block.lead)}</p>` : ''}<ol>${block.items.map((item, index) => `<li><span class="sequence-number">${pad(index + 1)}</span><div><b>${html(item.title)}</b>${item.tag ? `<span class="sequence-tag">${html(item.tag)}</span>` : ''}<p>${rich(item.text)}</p></div></li>`).join('')}</ol>${block.note ? `<p class="block-note">${rich(block.note)}</p>` : ''}</section>`;
    case 'list':
      return `<section class="study-block study-list">${title(block.title)}<ul>${block.items.map((item) => `<li>${rich(item)}</li>`).join('')}</ul>${block.note ? `<p class="block-note">${rich(block.note)}</p>` : ''}</section>`;
    case 'callout':
      return `<aside class="study-callout tone-${block.tone}"><b>${html(block.title)}</b><p>${rich(block.text)}</p></aside>`;
    case 'decode':
      return `<section class="study-block study-decode">${title(block.title)}<div class="decode-value" aria-hidden="true">${block.parts.map((part) => `<span>${html(part.value)}</span>`).join('')}</div><dl class="decode-parts">${block.parts.map((part) => `<div><dt><span class="decode-chip">${html(part.value)}</span>${html(part.label)}</dt><dd>${rich(part.text)}</dd></div>`).join('')}</dl></section>`;
  }
}

export const figuresOf = (blocks: Block[]): Figure[] => blocks.flatMap((block) => (block.kind === 'figure' ? [block.figure] : []));

/** Number of different photos in a module (figures and card pictures). */
export function pictureCount(module: StudyModule): number {
  const sources = module.chapters.flatMap((chapter) => chapter.blocks.flatMap((block) => {
    if (block.kind === 'figure') return [block.figure.src];
    if (block.kind === 'cards') return block.cards.flatMap((card) => (card.picture ? [card.picture.src] : []));
    return [];
  }));
  return new Set(sources).size;
}
