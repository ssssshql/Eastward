import { Px, pick } from './pixel';
import { ramp } from './color';
import { hash2 } from '../noise';
import type { Season } from '../../types/game';

export type Clutter = 'barrel' | 'crate' | 'pot' | 'firewood' | 'bucket' | 'sack';

const WIDTH: Record<Clutter, number> = { barrel: 9, crate: 10, pot: 8, firewood: 12, bucket: 7, sack: 8 };
const SNOW = ramp('#f1f6fb', 4, 0.25, 0.2);
const WOOD = ramp('#9a6440', 6, 0.62, 0.42);
const IRON = ramp('#4a4858', 5, 0.55, 0.4);

/** Paints one porch prop with its bottom-left at (x, bottom). */
export function paintClutter(p: Px, kind: Clutter, x: number, bottom: number, season: Season): void {
  const winter = season === 'winter';
  switch (kind) {
    case 'barrel':{
        const h = 11;
        for (let y = 0; y < h; y++) {
          const bulge = y > 1 && y < h - 2 ? 1 : 0;
          for (let xx = -bulge; xx < 9 + bulge; xx++) {
            const u = (xx + 0.5 - 4.5) / 5;
            let li = 3 - u * 2;
            if (y === 2 || y === h - 3) li = 0.8;
            p.set(x + xx, bottom - h + 1 + y, pick(y === 2 || y === h - 3 ? IRON : WOOD, y === 2 || y === h - 3 ? 2 - u : li));
          }
        }
        for (let xx = 1; xx < 8; xx++) p.set(x + xx, bottom - h + 1, winter ? SNOW[3] : WOOD[4]);
        break;
      }
    case 'crate':{
        const h = 9;
        for (let y = 0; y < h; y++) for (let xx = 0; xx < 10; xx++) {
          let li = 2.8 + (xx === 0 ? 0.8 : xx === 9 ? -1 : 0);
          if (y === 0) li = 4.2;
          if (y === h - 1) li = 1;
          if (Math.abs(xx - y * 10 / h) < 1 || xx === 1 || xx === 8) li -= 0.9;
          p.set(x + xx, bottom - h + 1 + y, pick(WOOD, li));
        }
        if (winter) p.rect(x, bottom - h + 1, 10, 1, SNOW[3]);
        break;
      }
    case 'pot':{
        const clay = ramp('#c8643a', 5, 0.6, 0.42);
        for (let y = 0; y < 5; y++) for (let xx = y > 2 ? 1 : 0; xx < (y > 2 ? 7 : 8); xx++) p.set(x + xx, bottom - 4 + y, pick(clay, y === 0 ? 4 : 2.6 - (xx - 3.5) * 0.35));
        if (!winter) {
          const leaf = ramp(hash2(x, bottom, 3) < 0.5 ? '#4fae45' : '#3f9a5a', 5, 0.62, 0.5);
          p.ball(x + 4, bottom - 7, 4.4, 3.4, leaf, 0.2);
          p.set(x + 2, bottom - 9, [255, 120, 150]);
          p.set(x + 5, bottom - 10, [255, 206, 70]);
          p.set(x + 6, bottom - 7, [250, 245, 236]);
        } else p.ball(x + 4, bottom - 5, 3.6, 1.4, SNOW, 0.3);
        break;
      }
    case 'firewood':{
        const end = ramp('#d8a873', 4, 0.5, 0.35);
        for (let r = 0; r < 3; r++) {
          const n = 3 - (r === 2 ? 1 : 0);
          for (let i = 0; i < n; i++) {
            const cx = x + 2 + i * 4 + (r === 2 ? 2 : 0);
            const cy = bottom - 1 - r * 3;
            p.ball(cx, cy, 2, 1.7, WOOD, 0.1);
            p.set(cx, cy, end[2]);
            p.set(cx - 1, cy - 1, end[3]);
          }
        }
        if (winter) p.rect(x + 2, bottom - 9, 8, 1, SNOW[3]);
        break;
      }
    case 'bucket':{
        const m = ramp('#8a96a6', 5, 0.55, 0.45);
        for (let y = 0; y < 6; y++) for (let xx = y > 3 ? 1 : 0; xx < (y > 3 ? 6 : 7); xx++) p.set(x + xx, bottom - 5 + y, pick(m, y === 0 ? 4 : 2.8 - (xx - 3) * 0.4 - (y === 2 ? 1 : 0)));
        p.line(x, bottom - 6, x + 3, bottom - 8, IRON[2]);
        p.line(x + 3, bottom - 8, x + 6, bottom - 6, IRON[2]);
        break;
      }
    case 'sack':{
        const cloth = ramp('#c8a878', 5, 0.55, 0.4);
        p.ball(x + 4, bottom - 3.5, 4, 4, cloth, 0.1);
        p.ball(x + 4, bottom - 8, 2, 1.6, cloth, 0.2);
        p.rect(x + 3, bottom - 7, 3, 1, cloth[0]);
        if (winter) p.rect(x + 2, bottom - 9, 4, 1, SNOW[3]);
        break;
      }
  }
}

/** Lays a row of props outward from a building edge: dir 1 goes right from x, -1 goes left. */
export function drawClutter(p: Px, list: Clutter[], x: number, bottom: number, dir: 1 | -1, season: Season): void {
  let cur = x;
  for (const k of list) {
    const w = WIDTH[k];
    const left = dir === 1 ? cur : cur - w + 1;
    paintClutter(p, k, left, bottom, season);
    cur += dir * (w + 1);
  }
}