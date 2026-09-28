import { moduleTabs } from '../ui/dom';

export function drillTabs(active: 'topics' | 'test'): string {
  return moduleTabs('Ierinda', [
    { label: 'Tēmas', href: '#/ierinda', active: active === 'topics' },
    { label: 'Pārbaude', href: '#/ierinda/parbaude', active: active === 'test' },
  ]);
}
