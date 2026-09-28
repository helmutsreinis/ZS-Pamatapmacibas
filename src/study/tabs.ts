import { moduleTabs } from '../ui/dom';
import type { StudyModule } from './types';

export function studyTabs(module: StudyModule, active: 'topics' | 'test'): string {
  return moduleTabs(module.name, [
    { label: 'Tēmas', href: `#/${module.id}`, active: active === 'topics' },
    { label: 'Pārbaude', href: `#/${module.id}/parbaude`, active: active === 'test' },
  ]);
}
