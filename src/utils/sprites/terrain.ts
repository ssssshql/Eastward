import { Px, pick } from './pixel';
import { ramp, RGB } from './color';
import { fbm, hash2 } from '../noise';
import { TILE } from '../engine/constants';
import type { Season, World } from '../../types/game';

export const GRASS: Record<Season, string> = { spring: '#5cbc4a', summer: '#3aa84c', autumn: '#c0a23a', winter: '#e3ebf2' };
const GRASS_ALT: Record<Season, string> = { spring: '#9fd45a', summer: '#62c24a', autumn: '#e0862e', winter: '#7f9a72' };
const PATH: Record<Season, string> = { spring: '#b5835a', summer: '#b5835a', autumn: '#a8744e', winter: '#b9aeb0' };
const COBBLE = '#9a94a0';

function paintMine(world: World): HTMLCanvasElement {
  const W = world.w * TILE;
  const H = world.h * TILE;
  const p = new Px(W, H);
  const floorP = ramp('#5a4a62', 6, 0.6, 0.35);
  const top = ramp('#2c2538', 5, 0.5, 0.3);
  const face = ramp('#43384f', 6, 0.6, 0.4);
  const seed = world.seed % 9973;
  const gAt = (x: number, y: number) => x < 0 || y < 0 || x >= world.w || y >= world.h ? 'wall' : world.ground[y * world.w + x];
  for (let y = 0; y < H; y++) {
    const ty = y / TILE | 0;
    const ly = y - ty * TILE;
    for (let x = 0; x < W; x++) {
      const tx = x / TILE | 0;
      const g = gAt(tx, ty);
      if (g === 'wall') {
        const below = gAt(tx, ty + 1) !== 'wall';
        if (below && ly >= 7) {
          let li = 2.6 - (ly - 7) * 0.12 + (hash2(Math.floor(x / 3), ty, seed) - 0.5) * 1.4 + (hash2(x, y, seed + 1) - 0.5) * 0.4;
          if (ly === 15) li = 0.3;
          if (x % 7 === 0) li -= 0.8;
          p.set(x, y, pick(face, li));
        } else {
          let li = 1.6 + (fbm(x * 0.12, y * 0.12, seed, 2) - 0.5) * 2.4 + (hash2(x, y, seed + 2) - 0.5) * 0.6;
          if (below && ly === 6) li = 4;
          if (gAt(tx, ty - 1) !== 'wall' && ly === 0) li = 3.2;
          p.set(x, y, pick(top, li));
        }
        continue;
      }
      let li = 2.4 + (fbm(x * 0.07, y * 0.07, seed + 3, 3) - 0.5) * 2.4 + (hash2(x, y, seed + 4) - 0.5) * 0.8;
      if (gAt(tx, ty - 1) === 'wall' && ly < 4) li -= (4 - ly) * 0.55;
      if (hash2(x, y, seed + 5) < 0.012) li = 5;else
      if (hash2(x, y - 1, seed + 5) < 0.012) li = 0.5;
      if (Math.abs(Math.sin(x * 0.11 + fbm(x * 0.03, y * 0.03, seed, 2) * 9) * Math.cos(y * 0.09)) < 0.015) li = 0.6;
      p.set(x, y, pick(floorP, li));
    }
  }
  return p.canvas();
}
const SAND = '#dfc48c';
const FOAM: RGB = [236, 246, 240];
const DEEP_SHADOW: RGB = [18, 34, 52];

function clampI(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Paints the whole static terrain per-pixel from smooth fields, so edges are organic rather than tiled. */
export function buildGround(world: World, season: Season): HTMLCanvasElement {
  if (world.dark) return paintMine(world);
  const W = world.w * TILE;
  const H = world.h * TILE;
  const n = world.w * world.h;
  const fw = new Float32Array(n);
  const fs = new Float32Array(n);
  const fp = new Float32Array(n);
  const fc = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const g = world.ground[i];
    fw[i] = g === 'water' || g === 'dock' ? 1 : 0;
    fs[i] = g === 'sand' ? 1 : 0;
    fp[i] = g === 'path' || g === 'dock' ? 1 : 0;
    fc[i] = g === 'cobble' ? 1 : 0;
  }
  const cobble = ramp(season === 'winter' ? '#b8b6c4' : COBBLE, 6, 0.6, 0.4);
  const at = (f: Float32Array, x: number, y: number) => f[clampI(y, 0, world.h - 1) * world.w + clampI(x, 0, world.w - 1)];
  const sample = (f: Float32Array, fx: number, fy: number): number => {
    const tx = Math.floor(fx);
    const ty = Math.floor(fy);
    let ax = fx - tx;
    let ay = fy - ty;
    ax = ax * ax * (3 - 2 * ax);
    ay = ay * ay * (3 - 2 * ay);
    const a = at(f, tx, ty);
    const b = at(f, tx + 1, ty);
    const c = at(f, tx, ty + 1);
    const e = at(f, tx + 1, ty + 1);
    return a + (b - a) * ax + (c - a) * ay + (a - b - c + e) * ax * ay;
  };
  const groundAt = (tx: number, ty: number) => world.ground[clampI(ty, 0, world.h - 1) * world.w + clampI(tx, 0, world.w - 1)];

  const winter = season === 'winter';
  const grass = ramp(GRASS[season], 6, 0.55, 0.42);
  const alt = ramp(GRASS_ALT[season], 6, 0.55, 0.42);
  const path = ramp(PATH[season], 6, 0.5, 0.42);
  const sand = ramp(SAND, 6, 0.42, 0.38);
  const plank = ramp('#9b6b46', 6, 0.62, 0.42);
  const mud = ramp('#6b5440', 5, 0.5, 0.3);
  const seed = world.seed % 9973;
  const p = new Px(W, H);

  for (let y = 0; y < H; y++) {
    const ty = y / TILE | 0;
    const ly = y - ty * TILE;
    const fy = (y + 0.5) / TILE - 0.5;
    for (let x = 0; x < W; x++) {
      const tx = x / TILE | 0;
      const lx = x - tx * TILE;
      const g = world.ground[ty * world.w + tx];

      if (g === 'dock') {
        const up = groundAt(tx, ty - 1) !== 'dock';
        const down = groundAt(tx, ty + 1) !== 'dock';
        let li = 2.8 + (hash2(Math.floor(x / 4), ty, seed + 5) - 0.5) * 1.3 + (hash2(x, y, seed + 6) - 0.5) * 0.5;
        if (x % 4 === 3) li = 0.9;
        if (up && ly < 2) li = ly === 0 ? 0.4 : 4.6;
        if (down && ly > 13) li = ly === 15 ? 0.2 : 1.2;
        if (lx === 8 && (up && ly === 2 || down && ly === 13)) li = 5;
        p.set(x, y, pick(plank, li));
        continue;
      }

      const fx = (x + 0.5) / TILE - 0.5;
      const nz = fbm(x * 0.085, y * 0.085, seed, 3) - 0.5;
      const wv = sample(fw, fx, fy) + nz * 0.75;
      if (wv > 0.5) {
        const dep = wv - 0.5;
        if (groundAt(tx, ty - 1) === 'dock' && ly < 5) {
          p.set(x, y, DEEP_SHADOW, 0.5 - ly * 0.09);
          continue;
        }
        if (dep < 0.045) p.set(x, y, FOAM, winter ? 0.85 : 0.72);else
        if (dep < 0.17) p.set(x, y, sand[3], 0.42 * (1 - (dep - 0.045) / 0.125));
        continue;
      }

      const sv = sample(fs, fx, fy) + nz * 0.8;
      const pv = sample(fp, fx, fy) + nz * 0.6;
      const cv = sample(fc, fx, fy) + nz * 0.35;
      let c: RGB;
      if (cv > 0.5) {
        const row = Math.floor(y / 6);
        const off = row % 2 * 4;
        const cx = Math.floor((x + off) / 8);
        const ex = (x + off) % 8;
        const ey = y % 6;
        let li = 2.7 + (hash2(cx, row, seed + 31) - 0.5) * 1.6 + (hash2(x, y, seed + 32) - 0.5) * 0.4;
        if (ex === 0 || ey === 0) li = 0.7;else
        if (ex === 1 || ey === 1) li += 0.9;else
        if (ex === 7 || ey === 5) li -= 0.8;
        if (cv < 0.58) li -= 1;
        c = pick(cobble, li);
        if ((ex === 0 || ey === 0) && season !== 'winter' && hash2(x, y, seed + 33) < 0.18) c = pick(grass, 1.5);
      } else if (sv > 0.5) {
        let li = 2.6 + Math.sin(y * 0.6 + fbm(x * 0.04, y * 0.04, seed + 3, 2) * 9) * 0.7 + (hash2(x, y, seed) - 0.5) * 0.8;
        if (wv > 0.4) li -= 1.3;
        if (winter && hash2(x, y, seed + 4) < 0.5) li += 1.2;
        c = pick(sand, li);
      } else if (pv > 0.5) {
        let li = 2.6 + (fbm(x * 0.22, y * 0.22, seed + 7, 2) - 0.5) * 3 + (hash2(x, y, seed + 1) - 0.5) * 0.9;
        if (pv < 0.57) li -= 0.9;
        if (hash2(x, y, seed + 2) < 0.012) li = 5;else
        if (hash2(x, y - 1, seed + 2) < 0.012) li = 0.6;
        c = pick(path, li);
      } else {
        const patch = fbm(x * 0.022, y * 0.022, seed + 11, 2);
        const pal = winter ? patch < 0.36 ? alt : grass : patch > 0.63 ? alt : grass;
        let li = 2.5 + (fbm(x * 0.05, y * 0.05, seed + 5, 2) - 0.5) * 3.2 + (hash2(x, y, seed) - 0.5) * 1.1;
        if (!winter) {
          if (hash2(x, y, seed + 77) < 0.035) li = 5;else
          if (hash2(x, y - 1, seed + 77) < 0.035) li = 3.8;else
          if (hash2(x, y, seed + 78) < 0.018) li = 0.6;
        } else if (hash2(x, y, seed + 79) < 0.006) li = 5.4;
        if (pv > 0.38 || cv > 0.38) li -= 1.3;
        if (wv > 0.4) li -= (wv - 0.4) * 14;
        c = pick(pal, li);
        if (wv > 0.46 && !winter) c = pick(mud, 1 + hash2(x, y, seed + 3) * 1.5);
      }
      p.set(x, y, c);
    }
  }
  return p.canvas();
}

export function buildWaterFrames(season: Season): HTMLCanvasElement[] {
  const pal = ramp(season === 'winter' ? '#6f97b2' : '#2f6c8a', 6, 0.55, 0.5);
  const frames: HTMLCanvasElement[] = [];
  for (let f = 0; f < 16; f++) {
    const t = f / 16 * Math.PI * 2;
    const p = new Px(32, 32);
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const X = x / 32 * Math.PI * 2;
        const Y = y / 32 * Math.PI * 2;
        const v = Math.sin(X + Math.sin(Y * 2 + t) * 0.8 + t) * 0.6 + Math.sin(Y * 3 - X + t * 2) * 0.4 + Math.sin(X * 2 + Y + t) * 0.25;
        let li = 2.1 + v * 0.9;
        if (v > 0.95) li = 4.6;
        if (hash2(x, y, f) > 0.996) li = 5.5;
        p.set(x, y, pick(pal, li));
      }
    }
    frames.push(p.canvas());
  }
  return frames;
}

function cut(x: number, y: number, cx: number, cy: number, sx: number, sy: number): boolean {
  const dx = x + 0.5 - cx;
  const dy = y + 0.5 - cy;
  if (dx * sx <= 0 || dy * sy <= 0) return false;
  return dx * dx + dy * dy > 6.25;
}

function soilTile(m: number, pal: RGB[], wet: boolean): HTMLCanvasElement {
  const p = new Px(16, 16);
  const N = m & 1;
  const E = m & 2;
  const S = m & 4;
  const Wd = m & 8;
  const l = Wd ? 0 : 1;
  const r = E ? 15 : 14;
  const t = N ? 0 : 1;
  const b = S ? 15 : 14;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (x < l || x > r || y < t || y > b) continue;
      if (!N && !Wd && cut(x, y, l + 2.5, t + 2.5, -1, -1)) continue;
      if (!N && !E && cut(x, y, r - 1.5, t + 2.5, 1, -1)) continue;
      if (!S && !Wd && cut(x, y, l + 2.5, b - 1.5, -1, 1)) continue;
      if (!S && !E && cut(x, y, r - 1.5, b - 1.5, 1, 1)) continue;
      let li = 2.6 + (hash2(x, y, m * 7 + 3) - 0.5) * 1.0;
      const fr = y % 4;
      if (fr === 0) li -= 0.9;else
      if (fr === 1) li += 0.5;
      if (!N && y === t) li += 1.2;
      if (!S && y === b) li -= 1.6;
      if (!Wd && x === l) li += 0.4;
      if (!E && x === r) li -= 0.7;
      if (hash2(x, y, 91) < 0.05) li += 1.4;
      p.set(x, y, pick(pal, li));
      if (wet && hash2(x, y, 123) > 0.965) p.set(x, y, [150, 180, 205], 0.55);
    }
  }
  return p.canvas();
}

export function buildSoil(): {dry: HTMLCanvasElement[];wet: HTMLCanvasElement[];} {
  const dryP = ramp('#76523a', 6, 0.55, 0.38);
  const wetP = ramp('#4a3329', 6, 0.5, 0.3);
  const dry: HTMLCanvasElement[] = [];
  const wet: HTMLCanvasElement[] = [];
  for (let m = 0; m < 16; m++) {
    dry.push(soilTile(m, dryP, false));
    wet.push(soilTile(m, wetP, true));
  }
  return { dry, wet };
}