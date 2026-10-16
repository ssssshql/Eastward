export type RGB = [number, number, number];

// Cinematic grading baked into every ramp: teal-navy shadows, warm golden highlights.
const SHADOW: RGB = [16, 30, 52];
const LIGHT: RGB = [255, 232, 176];

export function hex(h: string): RGB {
  const n = parseInt(h.slice(1), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Hue-shifted ramp: shadows drift toward violet, highlights toward warm cream. */
export function ramp(base: string, n = 5, dark = 0.62, light = 0.5): RGB[] {
  const b = hex(base);
  const out: RGB[] = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1) * 2 - 1;
    out.push(u < 0 ? mix(b, SHADOW, -u * dark) : mix(b, LIGHT, u * light));
  }
  return out;
}

export function darken(c: RGB, k: number): RGB {
  return mix(c, SHADOW, k);
}

export function mixHex(a: string, b: string, t: number): string {
  const c = mix(hex(a), hex(b), t);
  return '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}