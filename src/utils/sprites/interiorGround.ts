import { Px, pick } from './pixel';
import { ramp, RGB } from './color';
import { hash2 } from '../noise';
import { TILE } from '../engine/constants';
import type { InteriorStyle, Rug, World } from '../../types/game';

export const BACK_ROWS = 3;

const FALLBACK: InteriorStyle = { wall: '#c99a6e', trim: '#7a4e32', floor: '#b47a4a', floorKind: 'plank', pattern: 'stripe' };

function wallpaper(st: InteriorStyle, x: number, y: number): number {
  switch (st.pattern) {
    case 'stripe':
      return (x % 10 < 5 ? 2.8 : 2.3) + (x % 10 === 0 ? -0.6 : 0);
    case 'diamond':{
        const a = (x + y) % 12;
        const b = (x - y + 1200) % 12;
        if (a === 0 || b === 0) return 1.9;
        if (a === 6 && b === 6) return 3.8;
        return 2.6;
      }
    case 'plank':{
        let li = 2.6 + (hash2(Math.floor(x / 7), 1, 17) - 0.5) * 0.9 + (hash2(x, y >> 2, 18) - 0.5) * 0.3;
        if (x % 7 === 6) li = 1.2;
        if (x % 7 === 0) li += 0.6;
        return li;
      }
    case 'brick':{
        const row = Math.floor(y / 4);
        const off = row % 2 * 4;
        let li = 2.6 + (hash2(Math.floor((x + off) / 8), row, 19) - 0.5) * 1.1;
        if ((x + off) % 8 === 0 || y % 4 === 3) li = 1.2;
        return li;
      }
    case 'stone':{
        const row = Math.floor(y / 7);
        const off = row % 2 * 6;
        const cell = Math.floor((x + off) / 12);
        let li = 2.5 + (hash2(cell, row, 23) - 0.5) * 1.4;
        if ((x + off) % 12 === 0 || y % 7 === 6) li = 0.9;else
        if ((x + off) % 12 === 1 || y % 7 === 0) li += 0.8;
        return li;
      }
  }
}

function floorLi(st: InteriorStyle, x: number, y: number): number {
  switch (st.floorKind) {
    case 'plank':{
        const row = Math.floor(y / 6);
        const seam = Math.floor(hash2(row, 7, 31) * 40);
        let li = 2.6 + (hash2(Math.floor((x + seam) / 40), row, 32) - 0.5) * 1.0 + Math.sin(x * 0.35 + row * 3) * 0.18 + (hash2(x, y, 33) - 0.5) * 0.3;
        if (y % 6 === 5) li = 1.0;
        if (y % 6 === 0) li += 0.7;
        if ((x + seam) % 40 === 0) li = 1.1;
        if (hash2(x >> 1, row, 34) < 0.01) li = 1.4;
        return li;
      }
    case 'stone':{
        const row = Math.floor(y / 10);
        const off = row % 2 * 7;
        const cell = Math.floor((x + off) / 14);
        let li = 2.6 + (hash2(cell, row, 41) - 0.5) * 1.3 + (hash2(x, y, 42) - 0.5) * 0.4;
        if ((x + off) % 14 === 0 || y % 10 === 9) li = 0.9;else
        if ((x + off) % 14 === 1 || y % 10 === 0) li += 0.9;
        return li;
      }
    case 'hay':{
        let li = 2.2 + (hash2(x >> 2, y >> 2, 51) - 0.5) * 0.8 + (hash2(x, y, 52) - 0.5) * 0.5;
        const h = hash2(x, y >> 1, 53);
        if (h < 0.12) li = 4.2;else
        if (h < 0.18) li = 3.4;
        return li;
      }
  }
}

function paintRug(p: Px, r: Rug): void {
  const field = ramp(r.color, 6, 0.6, 0.42);
  const bord = ramp(r.border, 5, 0.55, 0.4);
  const x0 = r.x * TILE + 2;
  const y0 = r.y * TILE + 2;
  const w = r.w * TILE - 4;
  const h = r.h * TILE - 4;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const edge = Math.min(x, y, w - 1 - x, h - 1 - y);
      let c: RGB;
      if (edge === 0) c = pick(field, 0.6);else
      if (edge <= 3) c = pick(bord, edge === 2 ? 3.6 : 2.2);else
      {
        const cx = w / 2;
        const cy = h / 2;
        const d = Math.abs(x + 0.5 - cx) / (w / 2) + Math.abs(y + 0.5 - cy) / (h / 2);
        let li = 2.4 + (hash2(x >> 1, y >> 1, 61) - 0.5) * 0.4;
        if (Math.abs(d - 0.55) < 0.05) li = 4;
        if (d < 0.2) li = 3.6;
        if ((x + y) % 6 === 0 && d > 0.7) li = 1.6;
        c = pick(field, li);
      }
      p.set(x0 + x, y0 + y, c);
    }
    if (y % 2 === 0) {
      p.set(x0 - 1, y0 + y, bord[4]);
      p.set(x0 + w, y0 + y, bord[4]);
    }
  }
}

/** Interior shell: tall wallpapered back wall with wainscot, dark wall tops, and a textured floor. */
export function paintInterior(world: World): HTMLCanvasElement {
  const st = world.style ?? FALLBACK;
  const W = world.w * TILE;
  const H = world.h * TILE;
  const p = new Px(W, H);
  const wallP = ramp(st.wall, 6, 0.6, 0.42);
  const trimP = ramp(st.trim, 6, 0.62, 0.42);
  const floorP = ramp(st.floor, 6, 0.62, 0.44);
  const topP = ramp('#2e2436', 5, 0.55, 0.3);
  const backH = BACK_ROWS * TILE;
  const wainTop = backH - 15;
  const gAt = (tx: number, ty: number) => tx < 0 || ty < 0 || tx >= world.w || ty >= world.h ? 'wall' : world.ground[ty * world.w + tx];

  for (let y = 0; y < H; y++) {
    const ty = y / TILE | 0;
    const ly = y - ty * TILE;
    for (let x = 0; x < W; x++) {
      const tx = x / TILE | 0;
      const lx = x - tx * TILE;
      const g = gAt(tx, ty);
      const inner = tx > 0 && tx < world.w - 1;
      if (ty < BACK_ROWS && inner) {
        let c: RGB;
        if (y < 3) c = pick(trimP, y === 2 ? 3.8 : 1.2);else
        if (y < 5) c = pick(trimP, y === 3 ? 2.4 : 1.0);else
        if (y < wainTop) {
          let li = wallpaper(st, x, y) + (hash2(x >> 2, y >> 2, 71) - 0.5) * 0.25;
          if (y < 9) li -= (9 - y) * 0.3;
          c = pick(wallP, li);
        } else if (y < wainTop + 2) c = pick(trimP, y === wainTop ? 4.2 : 2.6);else
        if (y < backH - 2) {
          const px = (x - TILE) % 16;
          let li = 2.4 + (hash2(Math.floor(x / 16), 2, 72) - 0.5) * 0.4;
          if (px === 0 || px === 15) li = 1.4;
          if (px === 2 && y > wainTop + 3 && y < backH - 4) li = 3.4;
          if (px === 13 && y > wainTop + 3 && y < backH - 4) li = 1.6;
          if (y === wainTop + 3 && px > 1 && px < 14) li = 3.4;
          if (y === backH - 4 && px > 1 && px < 14) li = 1.6;
          c = pick(trimP, li);
        } else c = pick(trimP, y === backH - 2 ? 1.2 : 0.6);
        if (tx === 1 && lx < 3) c = pick(wallP, 1);
        if (tx === world.w - 2 && lx > 12) c = pick(wallP, 0.8);
        p.set(x, y, c);
        continue;
      }
      if (g === 'wall') {
        let li = 1.6 + (hash2(x >> 2, y >> 2, 81) - 0.5) * 0.6;
        if (gAt(tx, ty - 1) !== 'wall' && ty > 0 && ly < 2) li = ly === 0 ? 4 : 2.8;
        if (gAt(tx + 1, ty) !== 'wall' && lx > 13 && ty >= BACK_ROWS) li = lx === 15 ? 3.4 : 2.6;
        if (gAt(tx - 1, ty) !== 'wall' && lx < 2 && ty >= BACK_ROWS) li = lx === 0 ? 3.4 : 2.6;
        p.set(x, y, pick(topP, li));
        continue;
      }
      let li = floorLi(st, x, y);
      const dBack = y - backH;
      if (dBack < 8) li -= (8 - dBack) * 0.28;
      if (tx === 1 && lx < 4) li -= (4 - lx) * 0.3;
      if (tx === world.w - 2 && lx > 11) li -= (lx - 11) * 0.3;
      p.set(x, y, pick(floorP, li));
    }
  }
  for (const r of world.rugs) paintRug(p, r);
  for (const wp of world.warps) {
    const mat = ramp('#8a5a3a', 5, 0.5, 0.4);
    for (let y = 0; y < 10; y++) for (let x = 0; x < 14; x++) {
      const yy = (wp.y - 1) * TILE + 6 + y;
      const li = (x + y) % 3 === 0 ? 1.4 : 2.6 + (y === 0 ? 1 : 0);
      p.set(wp.x * TILE + 1 + x, yy, pick(mat, li));
    }
  }
  return p.canvas();
}