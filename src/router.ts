/** Hash routes, so the static site works from any folder and every page can be linked. */
export type Route =
  | { page: 'home' }
  | { page: 'weapon-learn'; weapon: string }
  | { page: 'weapon-test'; weapon: string }
  | { page: 'drill'; chapter?: string }
  | { page: 'exam'; exam: 'ierinda' | 'kopeja' };

/** Old weapon ids that still open their module (the G36 module was first published as G36C). */
const ALIASES: Record<string, string> = { g36c: 'g36' };

export function parseRoute(hash: string, weapons: readonly string[]): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [id, second] = parts;
  const first = id && (ALIASES[id] ?? id);
  if (first && weapons.includes(first)) {
    return second === 'parbaude' ? { page: 'weapon-test', weapon: first } : { page: 'weapon-learn', weapon: first };
  }
  if (first === 'ierinda') {
    if (second === 'parbaude') return { page: 'exam', exam: 'ierinda' };
    const chapter = second?.match(/^tema-(\d{2})$/)?.[1];
    return { page: 'drill', chapter };
  }
  if (first === 'parbaude') return { page: 'exam', exam: 'kopeja' };
  return { page: 'home' };
}

export function routeHref(route: Route): string {
  switch (route.page) {
    case 'weapon-learn': return `#/${route.weapon}/macibas`;
    case 'weapon-test': return `#/${route.weapon}/parbaude`;
    case 'drill': return route.chapter ? `#/ierinda/tema-${route.chapter}` : '#/ierinda';
    case 'exam': return route.exam === 'ierinda' ? '#/ierinda/parbaude' : '#/parbaude';
    default: return '#/';
  }
}

/** Top-level section a route belongs to, for the active navigation link. */
export function routeSection(route: Route): string {
  switch (route.page) {
    case 'weapon-learn': case 'weapon-test': return route.weapon;
    case 'drill': return 'ierinda';
    case 'exam': return route.exam === 'ierinda' ? 'ierinda' : 'kopeja';
    default: return 'home';
  }
}
