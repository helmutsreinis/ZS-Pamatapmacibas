/** Latvian text helpers shared by every module. */

/** Number agreement: 1, 21, 31 … take the singular; 11 and everything else the plural. */
export function plural(count: number, one: string, many: string): string {
  return count % 10 === 1 && count % 100 !== 11 ? one : many;
}

/** "1 jautājums", "21 jautājums", "11 jautājumi", "5 jautājumi". */
export function count(value: number, one: string, many: string): string {
  return `${value} ${plural(value, one, many)}`;
}

export const pad = (value: number): string => String(value).padStart(2, '0');

export const upper = (value: string): string => value.toLocaleUpperCase('lv-LV');

export const capitalise = (value: string): string => value.charAt(0).toLocaleUpperCase('lv-LV') + value.slice(1);

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const mm = String(m).padStart(2, '0'), ss = String(sec).padStart(2, '0');
  return h > 0 ? `${String(h).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`;
}
