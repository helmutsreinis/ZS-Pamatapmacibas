export const html = (value: string): string => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character] ?? character);

export type IconName = 'arrow' | 'play' | 'pause' | 'check' | 'layers' | 'target' | 'book' | 'prev' | 'next' | 'flag' | 'rifle' | 'drill' | 'print' | 'lock' | 'ammo' | 'kit';

export function icon(name: IconName): string {
  const paths: Record<IconName, string> = {
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    play: '<path d="m8 5 11 7-11 7z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 18l9 5 9-5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 1v5m0 12v5M1 12h5m12 0h5"/>',
    book: '<path d="M4 4h7a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H4zM20 4h-3a3 3 0 0 0-3 3v14a3 3 0 0 1 3-3h3z"/>',
    prev: '<path d="M15 5 8 12l7 7"/>',
    next: '<path d="m9 5 7 7-7 7"/>',
    flag: '<path d="M5 21V4m0 0h11l-2 4 2 4H5"/>',
    rifle: '<path d="M2 11h13l2-2h5v3h-4l-1 2H9l-1 4H5l1-4H2z"/>',
    drill: '<circle cx="12" cy="5" r="2"/><path d="M12 7v7m-4-5 4 2 4-2m-6 12 2-7 2 7"/>',
    print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    ammo: '<path d="M12 2c2 2 3 4.5 3 7H9c0-2.5 1-5 3-7Z"/><path d="M9 9h6v11.5a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5z"/><path d="M9 18h6"/>',
    kit: '<path d="M9 6V4.5a3 3 0 0 1 6 0V6"/><rect x="5" y="6" width="14" height="15" rx="3"/><path d="M9 13h6v4H9zM5 11h14"/>',
  };
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}

/** A page of the site: its markup, and what to wire up once it is in the document. */
export type View = {
  html: string;
  /** Returns a clean-up function, called before the next page replaces this one. */
  mount?: () => (() => void) | void;
};

/** What views may ask of the application shell. */
export type AppContext = {
  /** Re-render the current page (after internal state changes). */
  refresh: () => void;
  reducedMotion: boolean;
};

export const scrollBehavior = (reducedMotion: boolean): ScrollBehavior => (reducedMotion ? 'auto' : 'smooth');

/** Shared page header: kicker line, big title (may contain <em>), lead paragraph. */
export function pageIntro(options: { kicker: string; side?: string; title: string; lead: string; className?: string; extra?: string; photo?: string }): string {
  const photo = options.photo ? ` has-photo" style="--intro-photo:url('${options.photo}')` : '';
  return `<section class="page-intro ${options.className ?? ''}${photo}"><div class="intro-overline"><span class="kicker">${options.kicker}</span>${options.side ? `<span>${options.side}</span>` : ''}</div><h1>${options.title}</h1><p>${options.lead}</p>${options.extra ?? ''}</section>`;
}

/** Modal yes/no question in the site's style; resolves to true when confirmed. */
export function confirmDialog(options: { kicker: string; title: string; text: string; confirm: string; cancel: string }): Promise<boolean> {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'confirm-dialog';
    dialog.setAttribute('aria-labelledby', 'confirm-title');
    dialog.innerHTML = `<div class="dialog-symbol" aria-hidden="true">?</div><span class="kicker">${options.kicker}</span><h2 id="confirm-title">${options.title}</h2><p>${options.text}</p><div class="dialog-actions"><button type="button" class="button button-outline" data-answer="no">${html(options.cancel)}</button><button type="button" class="button button-primary" data-answer="yes">${html(options.confirm)} ${icon('arrow')}</button></div>`;
    document.body.append(dialog);
    const done = (value: boolean) => {
      if (dialog.open) dialog.close();
      dialog.remove();
      resolve(value);
    };
    dialog.querySelector('[data-answer="no"]')?.addEventListener('click', () => done(false));
    dialog.querySelector('[data-answer="yes"]')?.addEventListener('click', () => done(true));
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); done(false); });
    dialog.addEventListener('click', (event) => { if (event.target === dialog) done(false); });
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>('[data-answer="yes"]')?.focus();
  });
}

let toastTimer = 0;

/** Short status message at the bottom of the screen (announced politely). */
export function toast(message: string): void {
  let element = document.querySelector<HTMLElement>('#toast');
  if (!element) {
    element = document.createElement('div');
    element.id = 'toast';
    element.className = 'toast';
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
    document.body.append(element);
  }
  element.textContent = message;
  element.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => element?.classList.remove('show'), 2200);
}

/** Module tabs under the page intro: "Mācību režīms | Pašpārbaude", etc. */
export function moduleTabs(label: string, tabs: { label: string; href: string; active: boolean }[]): string {
  return `<nav class="module-tabs" aria-label="${html(label)}"><span class="module-tabs-label">${html(label)}</span>${tabs.map((tab) => `<a href="${tab.href}" class="module-tab ${tab.active ? 'active' : ''}" ${tab.active ? 'aria-current="page"' : ''}>${html(tab.label)}</a>`).join('')}</nav>`;
}
