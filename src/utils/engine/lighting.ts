import type { Weather } from '../../types/game';

export type V3 = [number, number, number];

const KEYS: [number, V3][] = [
[5, [0.32, 0.34, 0.6]],
[6, [0.62, 0.58, 0.8]],
[7.5, [0.98, 0.94, 0.92]],
[12, [1.04, 1.02, 0.98]],
[16.5, [1.02, 0.96, 0.88]],
[18, [1.06, 0.8, 0.62]],
[19.2, [0.74, 0.52, 0.66]],
[20.5, [0.38, 0.37, 0.64]],
[22, [0.27, 0.29, 0.53]],
[26, [0.22, 0.25, 0.48]]];


function smooth(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function ambientAt(minutes: number, weather: Weather): {ambient: V3;night: number;} {
  const h = minutes / 60;
  let a: V3 = KEYS[KEYS.length - 1][1];
  if (h <= KEYS[0][0]) a = KEYS[0][1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [h0, c0] = KEYS[i];
    const [h1, c1] = KEYS[i + 1];
    if (h >= h0 && h <= h1) {
      const t = (h - h0) / (h1 - h0);
      a = [c0[0] + (c1[0] - c0[0]) * t, c0[1] + (c1[1] - c0[1]) * t, c0[2] + (c1[2] - c0[2]) * t];
      break;
    }
  }
  const night = h < 12 ? 1 - smooth(5.6, 7.4, h) : smooth(18.4, 20.8, h);
  if (weather === 'rain') a = [a[0] * 0.78, a[1] * 0.82, a[2] * 0.92];
  if (weather === 'snow') a = [a[0] * 0.95, a[1] * 0.97, a[2] * 1.03];
  return { ambient: a, night };
}