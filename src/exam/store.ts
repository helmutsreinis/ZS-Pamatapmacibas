import type { ExamConfig } from './model';

/** Browser storage that never throws (private windows, blocked site data). */
const storage = {
  get(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch { /* not available */ }
  },
};

const key = (exam: string, name: string) => `macibu-centrs:${exam}:${name}`;

/** A saved set-up, plus the topics that existed then (new topics start selected). */
export type SavedPrefs = Partial<ExamConfig> & { seen?: string[] };

/** Saved set-up of an exam; values that no longer exist are dropped by the caller. */
export function loadPrefs(exam: string): SavedPrefs | null {
  const raw = storage.get(key(exam, 'prefs'));
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === 'object' ? (value as SavedPrefs) : null;
  } catch {
    return null;
  }
}

export function savePrefs(exam: string, config: ExamConfig, seen: string[]): void {
  storage.set(key(exam, 'prefs'), JSON.stringify({ ...config, seen }));
}

/** Best exam-mode result in this browser, in percent. */
export function loadBest(exam: string): number {
  const value = Number(storage.get(key(exam, 'best')));
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 0;
}

export function saveBest(exam: string, percent: number): void {
  if (percent > loadBest(exam)) storage.set(key(exam, 'best'), String(percent));
}
