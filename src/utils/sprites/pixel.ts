import { RGB, darken } from './color';

export function pick(pal: RGB[], li: number): RGB {
  const i = Math.round(li);
  return pal[i < 0 ? 0 : i >= pal.length ? pal.length - 1 : i];
}

/** A tiny software pixel buffer used to paint every procedural sprite. */
export class Px {
  readonly w: number;
  readonly h: number;
  readonly d: Uint8ClampedArray;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.d = new Uint8ClampedArray(w * h * 4);
  }

  set(x: number, y: number, c: RGB, a = 1): void {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    if (xi < 0 || yi < 0 || xi >= this.w || yi >= this.h || a <= 0) return;
    const i = (yi * this.w + xi) * 4;
    const d = this.d;
    if (a >= 1 || d[i + 3] === 0) {
      d[i] = c[0];
      d[i + 1] = c[1];
      d[i + 2] = c[2];
      d[i + 3] = Math.round(Math.min(1, a) * 255);
      return;
    }
    const da = d[i + 3] / 255;
    const oa = a + da * (1 - a);
    for (let k = 0; k < 3; k++) d[i + k] = (c[k] * a + d[i + k] * da * (1 - a)) / oa;
    d[i + 3] = oa * 255;
  }

  alpha(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[(y * this.w + x) * 4 + 3];
  }

  rgb(x: number, y: number): RGB {
    const i = (y * this.w + x) * 4;
    return [this.d[i], this.d[i + 1], this.d[i + 2]];
  }

  rect(x: number, y: number, w: number, h: number, c: RGB, a = 1): void {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) this.set(x + xx, y + yy, c, a);
  }

  /** Shaded box lit from the upper-left. */
  box(x0: number, y0: number, w: number, h: number, pal: RGB[]): void {
    const mid = (pal.length - 1) / 2;
    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) {
        const u = (xx + 0.5) / w;
        let li = mid;
        if (u < 0.34) li = mid + 1;else
        if (u > 0.7) li = mid - 1;
        if (yy === 0) li += 0.6;
        if (yy === h - 1 && h > 1) li -= 0.8;
        this.set(x0 + xx, y0 + yy, pick(pal, li));
      }
    }
  }

  /** Shaded ellipse with a spherical normal. */
  ball(cx: number, cy: number, rx: number, ry: number, pal: RGB[], bias = 0, clip?: (x: number, y: number) => boolean): void {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        const d2 = nx * nx + ny * ny;
        if (d2 > 1) continue;
        if (clip && !clip(x, y)) continue;
        const nz = Math.sqrt(1 - d2);
        const li = -nx * 0.45 - ny * 0.62 + nz * 0.6 + bias;
        let idx = Math.floor((li + 0.55) / 1.5 * pal.length);
        idx = idx < 0 ? 0 : idx >= pal.length ? pal.length - 1 : idx;
        this.set(x, y, pal[idx]);
      }
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, c: RGB, a = 1): void {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 1.5));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.set(x0 + (x1 - x0) * t + 0.5, y0 + (y1 - y0) * t + 0.5, c, a);
    }
  }

  /** Selective outline: each edge pixel takes a darkened version of the color it borders. */
  outline(k = 0.6): void {
    const adds: [number, number, RGB][] = [];
    const N = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.alpha(x, y) >= 128) continue;
        for (const [dx, dy] of N) {
          if (this.alpha(x + dx, y + dy) >= 200) {
            adds.push([x, y, darken(this.rgb(x + dx, y + dy), k)]);
            break;
          }
        }
      }
    }
    for (const [x, y, c] of adds) this.set(x, y, c, 1);
  }

  flipX(): Px {
    const p = new Px(this.w, this.h);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const s = (y * this.w + x) * 4;
        const t = (y * this.w + (this.w - 1 - x)) * 4;
        for (let k = 0; k < 4; k++) p.d[t + k] = this.d[s + k];
      }
    }
    return p;
  }

  canvas(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.w;
    c.height = this.h;
    const ctx = c.getContext('2d');
    if (ctx) {
      const img = ctx.createImageData(this.w, this.h);
      img.data.set(this.d);
      ctx.putImageData(img, 0, 0);
    }
    return c;
  }
}