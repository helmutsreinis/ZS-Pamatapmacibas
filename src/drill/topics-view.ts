import { examInProgress, startTraining } from '../exam/view';
import { pad, plural, upper } from '../lv';
import { confirmDialog, html, icon, pageIntro, type View } from '../ui/dom';
import { chapters, drillQuestions, type DrillQuestion } from './index';
import { drillTabs } from './tabs';

/** Flash-card mode hides the answers until the reader opens them. */
const study = { cards: false, revealed: new Set<string>() };

const leadText = (count: number) => (study.cards
  ? 'Kartīšu režīms: vispirms atbildi pats, tad atver pareizo atbildi un skaidrojumu.'
  : `${count} ${plural(count, 'jautājums', 'jautājumi')} ar pareizo atbildi un skaidrojumu. Kartīšu režīmā atbildes ir paslēptas – mēģini atbildēt pats.`);

function fact(question: DrillQuestion, index: number): string {
  const hidden = study.cards && !study.revealed.has(question.id);
  return `<li class="fact ${hidden ? 'is-hidden' : ''}" data-fact="${question.id}"><span class="fact-number">${pad(index + 1)}</span><div class="fact-body"><h3>${html(question.prompt)}</h3><div class="fact-answer" id="fact-${question.id}"><p class="fact-correct">${html(question.correct)}</p><p class="fact-explain">${html(question.explanation)}</p></div><button type="button" class="text-button fact-reveal" aria-controls="fact-${question.id}" aria-expanded="${!hidden}">${hidden ? 'Rādīt atbildi' : 'Paslēpt atbildi'}</button></div></li>`;
}

export function drillView(number?: string): View {
  const chapter = chapters.find((item) => item.number === number) ?? chapters[0];
  const index = chapters.indexOf(chapter);
  const prev = chapters[index - 1], next = chapters[index + 1];
  const total = drillQuestions.length;
  const pager = (target: typeof chapter | undefined, direction: 'prev' | 'next') => target
    ? `<a class="chapter-page ${direction}" href="#/ierinda/tema-${target.number}">${direction === 'prev' ? icon('prev') : ''}<span><small>${direction === 'prev' ? 'IEPRIEKŠĒJĀ TĒMA' : 'NĀKAMĀ TĒMA'}</small><b>${target.number} · ${html(target.title)}</b></span>${direction === 'next' ? icon('next') : ''}</a>`
    : '<span></span>';

  const markup = `${pageIntro({
      kicker: 'IERINDAS MĀCĪBA · TĒMAS',
      side: `${chapters.length} ${upper(plural(chapters.length, 'tēma', 'tēmas'))} · ${total} ${upper(plural(total, 'jautājums', 'jautājumi'))}`,
      title: 'IERINDAS <em>MĀCĪBA.</em>',
      lead: 'Katrā tēmā apkopoti galvenie jēdzieni un noteikumi no ierindas mācību materiāla – ar skaidrojumu un atsauci uz lapu. Izlasi tēmu, tad pārbaudi sevi tēmas treniņā vai pilnā pārbaudē.',
      className: 'drill-intro',
      extra: drillTabs('topics'),
    })}
    <section class="drill-layout">
      <nav class="chapter-nav panel" aria-label="Ierindas tēmas">
        <span class="kicker">TĒMAS</span>
        <ol>${chapters.map((item) => `<li><a class="chapter-link ${item === chapter ? 'active' : ''}" href="#/ierinda/tema-${item.number}" ${item === chapter ? 'aria-current="page"' : ''}><span class="chapter-number">${item.number}</span><span class="chapter-name">${html(item.title)}</span></a></li>`).join('')}</ol>
        <a class="button button-outline chapter-nav-test" href="#/ierinda/parbaude">Visu tēmu pārbaude ${icon('arrow')}</a>
      </nav>
      <article class="chapter panel" aria-labelledby="chapter-title">
        <header class="chapter-head">
          <div><span class="kicker">TĒMA ${chapter.number} / ${pad(chapters.length)} · MĀCĪBU MATERIĀLA ${chapter.page}. LAPA</span><h2 id="chapter-title">${html(chapter.title)}</h2></div>
          <button type="button" class="mini-button" id="study-cards" aria-pressed="${study.cards}">${icon('layers')} Kartīšu režīms</button>
        </header>
        <p class="chapter-lead" id="chapter-lead">${leadText(chapter.questions.length)}</p>
        <ol class="fact-list ${study.cards ? 'cards' : ''}" id="fact-list">${chapter.questions.map(fact).join('')}</ol>
        <div class="chapter-train"><div><span class="kicker">PĀRBAUDI SEVI</span><p>Visi tēmas jautājumi mācību režīmā: jautājumu un atbilžu secība ir sajaukta, skaidrojums parādās uzreiz pēc atbildes.</p></div><button type="button" class="button button-primary" id="chapter-train">${icon('target')} Trenēties ar šo tēmu</button></div>
        <footer class="chapter-foot">${pager(prev, 'prev')}${pager(next, 'next')}</footer>
      </article>
    </section>`;

  const mount = () => {
    const list = document.querySelector<HTMLElement>('#fact-list');
    const paintFact = (item: HTMLElement) => {
      const id = item.dataset.fact ?? '';
      const hidden = study.cards && !study.revealed.has(id);
      item.classList.toggle('is-hidden', hidden);
      const button = item.querySelector<HTMLButtonElement>('.fact-reveal');
      if (button) {
        button.textContent = hidden ? 'Rādīt atbildi' : 'Paslēpt atbildi';
        button.setAttribute('aria-expanded', String(!hidden));
      }
    };
    list?.querySelectorAll<HTMLElement>('.fact').forEach((item) => item.querySelector('.fact-reveal')?.addEventListener('click', () => {
      const id = item.dataset.fact ?? '';
      if (study.revealed.has(id)) study.revealed.delete(id); else study.revealed.add(id);
      paintFact(item);
    }));
    const cards = document.querySelector<HTMLButtonElement>('#study-cards');
    cards?.addEventListener('click', () => {
      study.cards = !study.cards;
      study.revealed.clear();
      cards.setAttribute('aria-pressed', String(study.cards));
      list?.classList.toggle('cards', study.cards);
      list?.querySelectorAll<HTMLElement>('.fact').forEach(paintFact);
      const lead = document.querySelector('#chapter-lead');
      if (lead) lead.textContent = leadText(chapter.questions.length);
    });
    document.querySelector('#chapter-train')?.addEventListener('click', async () => {
      if (examInProgress('ierinda')) {
        const ok = await confirmDialog({
          kicker: 'IESĀKTA PĀRBAUDE', title: 'SĀKT TRENIŅU?',
          text: 'Ierindas pārbaude jau ir sākta. Ja sāksi treniņu, iesāktās pārbaudes atbildes tiks zaudētas.',
          confirm: 'Sākt treniņu', cancel: 'Atcelt',
        });
        if (!ok) return;
      }
      startTraining('ierinda', [chapter.key]);
      location.hash = '#/ierinda/parbaude';
    });
  };
  return { html: markup, mount };
}
