/** Uniform integer in [0, max), from the browser's crypto generator when available. */
export function randomInt(max: number): number {
  if (max <= 1) return 0;
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    const range = 0x100000000;
    const limit = Math.floor(range / max) * max;
    const buffer = new Uint32Array(1);
    let value: number;
    do { cryptoApi.getRandomValues(buffer); value = buffer[0]; } while (value >= limit);
    return value % max;
  }
  return Math.floor(Math.random() * max);
}

export type Random = () => number;

/** Default source for shuffles: a float in [0, 1) backed by `randomInt`. */
export const secureRandom: Random = () => randomInt(0x100000000) / 0x100000000;

export function shuffle<T>(items: readonly T[], random: Random = secureRandom): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
