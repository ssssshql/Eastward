import { Px, pick } from './pixel';
import { ramp, RGB } from './color';
import type { CropDef, CropShape } from '../../types/game';

function leaf(p: Px, x0: number, y0: number, ang: number, len: number, wid: number, pal: RGB[]): void {
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  for (let s = 0; s <= len; s += 0.4) {
    const t = s / len;
    const hw = wid * Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.9));
    for (let k = -hw; k <= hw; k += 0.4) {
      const x = x0 + dx * s - dy * k;
      const y = y0 + dy * s + dx * k;
      let li = 2.2 + t * 1.2 + (k < 0 ? 0.8 : -0.5);
      if (Math.abs(k) < 0.45 && t > 0.1 && t < 0.85) li -= 1.1;
      p.set(x, y, pick(pal, li));
    }
  }
}

function stem(p: Px, x0: number, y0: number, h: number, bend: number, pal: RGB[]): void {
  for (let s = 0; s <= h; s += 0.5) {
    const t = s / h;
    p.set(x0 + bend * t * t, y0 - s, pal[1]);
  }
}

function drawStage(p: Px, shape: CropShape, s: number, L: RGB[], F: RGB[], A: RGB[]): void {
  const bx = 11;
  const by = 31;
  if (s === 0) {
    p.set(bx - 2, by, F[1]);
    p.set(bx + 1, by - 1, F[2]);
    p.set(bx + 2, by, F[1]);
    p.set(bx, by - 1, L[3]);
    return;
  }
  if (s === 1) {
    stem(p, bx, by, 3, 0, L);
    leaf(p, bx, by - 3, -2.5, 3.5, 1.3, L);
    leaf(p, bx, by - 3, -0.65, 3.5, 1.3, L);
    return;
  }
  if (s === 2) {
    stem(p, bx, by, 6, 0.5, L);
    leaf(p, bx, by - 2, -2.7, 5, 1.8, L);
    leaf(p, bx, by - 2, -0.45, 5, 1.8, L);
    leaf(p, bx, by - 5, -2.1, 4, 1.5, L);
    leaf(p, bx, by - 5, -1.0, 4, 1.5, L);
    return;
  }
  const mature = s === 4;
  switch (shape) {
    case 'root':{
        const angs = [-2.6, -2.1, -1.57, -1.05, -0.55];
        if (mature) p.ball(bx, by - 1.5, 4.2, 3.6, F, 0.1);
        angs.forEach((a, i) => leaf(p, bx, by - (mature ? 4 : 1), a, mature ? 8 : 6 + i % 2, 1.8, L));
        p.ball(bx, by - (mature ? 3.4 : 0.5), mature ? 3.4 : 2.6, mature ? 1.6 : 1.4, A, 0.2);
        break;
      }
    case 'berry':{
        const angs = [-2.9, -2.4, -1.9, -1.4, -0.9, -0.4, -1.6];
        angs.forEach((a, i) => leaf(p, bx, by - 1 - i % 3, a, 6 + i % 2 * 2, 2.2, L));
        const pts: [number, number][] = [[-4, -6], [3, -8], [0, -11], [5, -4], [-2, -3]];
        for (const [dx, dy] of pts) {
          if (mature) {
            p.ball(bx + dx, by + dy, 1.7, 1.7, F, 0.2);
            p.set(bx + dx - 1, by + dy - 1, F[4]);
          } else p.set(bx + dx, by + dy, L[4]);
        }
        break;
      }
    case 'big':{
        leaf(p, bx, by - 1, -2.8, 8, 3, L);
        leaf(p, bx, by - 1, -0.35, 8, 3, L);
        leaf(p, bx, by - 3, -1.9, 7, 2.6, L);
        if (mature) {
          p.ball(bx, by - 4, 7, 5, F, 0.1);
          for (const rx of [-3, 0, 3]) {
            for (let y = by - 8; y <= by; y++) if (p.alpha(bx + rx, y) > 0 && y > by - 9) p.set(bx + rx, y, F[1], 0.7);
          }
          p.rect(bx, by - 10, 1, 2, L[1]);
        } else p.ball(bx + 2, by - 2, 3, 2.4, L, 0.3);
        break;
      }
    case 'flower':{
        const h = mature ? 17 : 14;
        stem(p, bx, by, h, 0.5, L);
        leaf(p, bx, by - 4, -2.6, 5, 1.8, L);
        leaf(p, bx, by - 8, -0.5, 5, 1.8, L);
        if (mature) {
          for (let a = 0; a < 10; a++) {
            const ang = a / 10 * Math.PI * 2;
            p.ball(bx + Math.cos(ang) * 4.2, by - 19 + Math.sin(ang) * 4.2, 1.9, 1.9, F, 0.1);
          }
          p.ball(bx, by - 19, 2.6, 2.6, A, 0.1);
        } else p.ball(bx, by - 15, 2.2, 2.2, L, 0.3);
        break;
      }
    case 'glow':{
        stem(p, bx, by, mature ? 12 : 10, -0.5, L);
        leaf(p, bx, by - 2, -2.6, 6, 2, L);
        leaf(p, bx, by - 3, -0.5, 6, 2, L);
        leaf(p, bx, by - 7, -2.0, 4, 1.5, L);
        const bells: [number, number][] = [[bx - 4, by - 11], [bx + 3, by - 14], [bx + 5, by - 8]];
        for (const [x, y] of bells) {
          if (mature) {
            p.ball(x, y, 2.4, 2.2, F, 0.3);
            p.set(x - 2, y + 2, F[3]);
            p.set(x, y + 2.5, F[3]);
            p.set(x + 2, y + 2, F[3]);
            p.set(x, y + 1, A[4]);
          } else p.ball(x, y + 1, 1.4, 1.4, F, -0.3);
        }
        break;
      }
  }
}

export function buildCropFrames(def: CropDef): HTMLCanvasElement[] {
  const L = ramp(def.leaf, 5, 0.65, 0.45);
  const F = ramp(def.fruit, 5, 0.6, 0.4);
  const A = ramp(def.accent, 5, 0.6, 0.4);
  const frames: HTMLCanvasElement[] = [];
  for (let s = 0; s < 5; s++) {
    const p = new Px(22, 34);
    drawStage(p, def.shape, s, L, F, A);
    p.outline(0.55);
    frames.push(p.canvas());
  }
  return frames;
}