import { examInProgress, startTraining } from '../exam/view';
import { pad, plural, upper } from '../lv';
import { confirmDialog, html, icon, pageIntro, type View } from '../ui/dom';
import { blockMarkup, figuresOf } from './blocks';
import { mountFigures } from './figure';
import { chapterQuestionCount, topicKey } from './questions';
import { studyTabs } from './tabs';
import type { StudyChapter, StudyModule } from './types';

const questionsText = (count: number) => `${count} ${plural(count, 'jautājums', 'jautājumi')}`;

export function studyView(module: StudyModule, number?: string): View {
  const { chapters } = module;
  const chapter = chapters.find((item) => item.number === number) ?? chapters[0];
  const index = chapters.indexOf(chapter);
  const total = chapters.reduce((sum, item) => sum + chapterQuestionCount(module, item), 0);
  const count = chapterQuestionCount(module, chapter);
  const href = (item: StudyChapter) => `#/${module.id}/tema-${item.number}`;
  const pager = (target: StudyChapter | undefined, direction: 'prev' | 'next') => target
    ? `<a class="chapter-page ${direction}" href="${href(target)}">${direction === 'prev' ? icon('prev') : ''}<span><small>${direction === 'prev' ? 'IEPRIEKŠĒJĀ TĒMA' : 'NĀKAMĀ TĒMA'}</small><b>${target.number} · ${html(target.title)}</b></span>${direction === 'next' ? icon('next') : ''}</a>`
    : '<span></span>';
  const sources = chapter.sources.map((key) => module.sources[key]).filter(Boolean);

  const markup = `${pageIntro({
      kicker: `${module.kicker} · TĒMAS`,
      side: `${chapters.length} ${upper(plural(chapters.length, 'tēma', 'tēmas'))} · ${upper(questionsText(total))}`,
      title: module.title,
      lead: module.lead,
      className: `study-intro study-${module.id}`,
      extra: studyTabs(module, 'topics'),
    })}
    <section class="drill-layout study-layout">
      <nav class="chapter-nav panel" aria-label="${html(module.name)}: tēmas">
        <span class="kicker">TĒMAS</span>
        <ol>${chapters.map((item) => `<li><a class="chapter-link ${item === chapter ? 'active' : ''}" href="${href(item)}" ${item === chapter ? 'aria-current="page"' : ''}><span class="chapter-number">${item.number}</span><span class="chapter-name">${html(item.title)}</span></a></li>`).join('')}</ol>
        <a class="button button-outline chapter-nav-test" href="#/${module.id}/parbaude">Visu tēmu pārbaude ${icon('arrow')}</a>
      </nav>
      <article class="chapter panel study-chapter" aria-labelledby="chapter-title">
        <header class="chapter-head"><div><span class="kicker">TĒMA ${chapter.number} / ${pad(chapters.length)} · ${upper(questionsText(count))}</span><h2 id="chapter-title">${html(chapter.title)}</h2></div></header>
        <p class="chapter-lead">${html(chapter.lead)}</p>
        <div class="study-blocks">${chapter.blocks.map(blockMarkup).join('')}</div>
        ${sources.length ? `<footer class="study-sources"><span class="kicker">AVOTI</span><ul>${sources.map((source) => `<li>${source.url ? `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${html(source.label)}</a>` : html(source.label)}</li>`).join('')}</ul></footer>` : ''}
        <div class="chapter-train"><div><span class="kicker">PĀRBAUDI SEVI</span><p>Visi tēmas jautājumi mācību režīmā: jautājumu un atbilžu secība ir sajaukta, skaidrojums parādās uzreiz pēc atbildes.</p></div><button type="button" class="button button-primary" id="chapter-train">${icon('target')} Trenēties ar šo tēmu</button></div>
        <footer class="chapter-foot">${pager(chapters[index - 1], 'prev')}${pager(chapters[index + 1], 'next')}</footer>
      </article>
    </section>`;

  const mount = () => {
    const article = document.querySelector<HTMLElement>('.study-chapter');
    if (article) mountFigures(article, figuresOf(chapter.blocks));
    document.querySelector('#chapter-train')?.addEventListener('click', async () => {
      if (examInProgress(module.id)) {
        const ok = await confirmDialog({
          kicker: 'IESĀKTA PĀRBAUDE', title: 'SĀKT TRENIŅU?',
          text: `${module.genitive} pārbaude jau ir sākta. Ja sāksi treniņu, iesāktās pārbaudes atbildes tiks zaudētas.`,
          confirm: 'Sākt treniņu', cancel: 'Atcelt',
        });
        if (!ok) return;
      }
      startTraining(module.id, [topicKey(module, chapter)]);
      location.hash = `#/${module.id}/parbaude`;
    });
  };
  return { html: markup, mount };
}
