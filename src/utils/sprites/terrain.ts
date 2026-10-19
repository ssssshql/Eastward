import { Px, pick } from './pixel';
import { ramp, RGB } from './color';
import { fbm, hash2 } from '../noise';
import { TILE } from '../engine/constants';
import type { Season, World } from '../../types/game';
import { paintInterior } from './interiorGround';

export const GRASS: Record<Season, string> = { spring: '#5cbc4a', summer: '#3aa84c', autumn: '#c0a23a', winter: '#e3ebf2' };
const GRASS_ALT: Record<Season, string> = { spring: '#9fd45a', summer: '#62c24a', autumn: '#e0862e', winter: '#7f9a72' };
const GRASS_DEEP: Record<Season, string> = { spring: '#3a9a4a', summer: '#2a8a4a', autumn: '#a0702e', winter: '#c6d4e0' };
const PATH: Record<Season, string> = { spring: '#b5835a', summer: '#b5835a', autumn: '#a8744e', winter: '#b9aeb0' };
const COBBLE = '#9a94a0';
const SAND = '#dfc48c';
const FOAM: RGB = [236, 246, 240];
const DEEP_SHADOW: RGB = [14, 30, 48];
const BANK_DEPTH = 6;

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

function clampI(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function bladeLi(x: number, y: number, seed: number): number {
  for (let k = 0; k < 2; k++) {
    const cx = x >> 2;
    const cy = (y >> 2) - k;
    const h = hash2(cx, cy, seed + 91);
    if (h > 0.46) continue;
    const bx = cx * 4 + Math.floor(hash2(cx, cy, seed + 92) * 4);
    const by = cy * 4 + Math.floor(hash2(cx, cy, seed + 93) * 3);
    const dx = x - bx;
    const dy = y - by;
    if (dy === 0 && dx === 0) return 4.9;
    if (dy === 1 && (dx === 0 || dx === (h < 0.23 ? -1 : 1))) return 3.9;
    if (dy === 2 && (dx === 0 || dx === (h < 0.23 ? -1 : 1))) return 1.1;
  }
  return -1;
}

/** Paints the whole static terrain per-pixel from smooth fields, so edges are organic rather than tiled. */
export function buildGround(world: World, season: Season): HTMLCanvasElement {
  if (world.indoor) return paintInterior(world);
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
  const cobble = ramp(season === 'winter' ? '#b8b6c4' : COBBLE, 6, 0.62, 0.42);
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
  const beach = world.id === 'beach';
  const grass = ramp(GRASS[season], 6, 0.6, 0.45);
  const alt = ramp(GRASS_ALT[season], 6, 0.58, 0.45);
  const deep = ramp(GRASS_DEEP[season], 6, 0.6, 0.42);
  const path = ramp(PATH[season], 6, 0.55, 0.45);
  const sand = ramp(SAND, 6, 0.45, 0.4);
  const plank = ramp('#9b6b46', 6, 0.65, 0.45);
  const mud = ramp('#6b5440', 5, 0.5, 0.3);
  const earth = ramp('#7a5238', 6, 0.7, 0.42);
  const seed = world.seed % 9973;
  const p = new Px(W, H);

  const wvA = new Float32Array(W * H);
  const nzA = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    const fy = (y + 0.5) / TILE - 0.5;
    for (let x = 0; x < W; x++) {
      const fx = (x + 0.5) / TILE - 0.5;
      const nz = fbm(x * 0.085, y * 0.085, seed, 3) - 0.5;
      nzA[y * W + x] = nz;
      wvA[y * W + x] = sample(fw, fx, fy) + nz * 0.75;
    }
  }
  const isWaterPx = (x: number, y: number) => y < 0 ? true : wvA[y * W + x] > 0.5;

  const ao = new Float32Array(W * H);
  for (const s of world.structures) {
    const bottom = (s.y + s.h) * TILE;
    for (let d = 0; d < 6; d++) {
      const yy = bottom + d;
      if (yy >= H) break;
      for (let x = Math.max(0, s.x * TILE - 4); x < Math.min(W, (s.x + s.w) * TILE + 4); x++) ao[yy * W + x] = Math.max(ao[yy * W + x], (6 - d) * 0.32);
    }
  }

  for (let y = 0; y < H; y++) {
    const ty = y / TILE | 0;
    const ly = y - ty * TILE;
    const fy = (y + 0.5) / TILE - 0.5;
    for (let x = 0; x < W; x++) {
      const tx = x / TILE | 0;
      const lx = x - tx * TILE;
      const g = world.ground[ty * world.w + tx];
      const pi = y * W + x;

      if (g === 'dock') {
        const up = groundAt(tx, ty - 1) !== 'dock';
        const down = groundAt(tx, ty + 1) !== 'dock';
        let li = 2.8 + (hash2(Math.floor(x / 4), ty, seed + 5) - 0.5) * 1.3 + (hash2(x, y, seed + 6) - 0.5) * 0.5;
        if (x % 4 === 3) li = 0.9;
        if (up && ly < 2) li = ly === 0 ? 0.4 : 4.6;
        if (down && ly > 12) li = ly === 15 ? 0.2 : ly === 13 ? 1.6 : 1.0;
        if (lx === 8 && (up && ly === 2 || down && ly === 12)) li = 5;
        p.set(x, y, pick(plank, li));
        continue;
      }

      const fx = (x + 0.5) / TILE - 0.5;
      const nz = nzA[pi];
      const wv = wvA[pi];
      if (wv > 0.5) {
        const dep = wv - 0.5;
        if (groundAt(tx, ty - 1) === 'dock' && ly < 6) {
          p.set(x, y, DEEP_SHADOW, 0.55 - ly * 0.08);
          continue;
        }
        let k = 0;
        for (let d = 1; d <= BANK_DEPTH + 4; d++) {
          if (!isWaterPx(x, y - d)) {
            k = d;
            break;
          }
        }
        const landAbove = k > 0 ? groundAt(tx, Math.floor((y - k) / TILE)) : 'water';
        if (beach && k > 0 && landAbove === 'sand') {
          // Gentle sloping beach: a foam line, then shallow sand showing through the sea.
          if (k === 1) p.set(x, y, FOAM, 0.9);else
          if (k === 2) p.set(x, y, FOAM, 0.45);else
          if (k <= 6) p.set(x, y, sand[3], 0.55 - (k - 3) * 0.12);
          continue;
        }
        if (k > 0 && k <= BANK_DEPTH && landAbove !== 'dock') {
          let li: number;
          let c: RGB;
          if (k === 1) {
            c = landAbove === 'sand' ? pick(sand, 4.4) : winter ? [244, 248, 252] : pick(grass, 4.6);
          } else if (k === 2) {
            c = landAbove === 'sand' ? pick(sand, 3) : winter ? [214, 224, 234] : pick(deep, 1.6);
          } else {
            li = 3.1 - (k - 3) * 0.55 + (hash2(x >> 1, 3, seed + 61) - 0.5) * 1.1;
            if (k === BANK_DEPTH) li = 0.6;
            if (hash2(x, y, seed + 62) < 0.06) li += 1.2;
            c = pick(earth, li);
          }
          p.set(x, y, c);
          continue;
        }
        if (k === BANK_DEPTH + 1 && landAbove !== 'dock') {
          p.set(x, y, FOAM, 0.6);
          continue;
        }
        if (k > BANK_DEPTH + 1 && landAbove !== 'dock') {
          p.set(x, y, DEEP_SHADOW, 0.32 - (k - BANK_DEPTH - 2) * 0.08);
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
        let li = 2.8 + (hash2(cx, row, seed + 31) - 0.5) * 1.6 + (hash2(x, y, seed + 32) - 0.5) * 0.4;
        if (ex === 0 || ey === 0) li = 0.7;else
        if (ex === 1 || ey === 1) li += 1.1;else
        if (ex === 7 || ey === 5) li -= 0.9;
        if (cv < 0.58) li -= 1;
        li -= ao[pi];
        c = pick(cobble, li);
        if ((ex === 0 || ey === 0) && season !== 'winter' && hash2(x, y, seed + 33) < 0.22) c = pick(grass, 1.5);
      } else if (sv > 0.5) {
        let li = 2.6 + Math.sin(y * 0.6 + fbm(x * 0.04, y * 0.04, seed + 3, 2) * 9) * 0.7 + (hash2(x, y, seed) - 0.5) * 0.8;
        if (wv > 0.4) li -= 1.3;
        if (winter && hash2(x, y, seed + 4) < 0.5) li += 1.2;
        if (hash2(x >> 1, y >> 1, seed + 8) < 0.03) li = 4.8;
        li -= ao[pi];
        c = pick(sand, li);
      } else if (pv > 0.5) {
        let li = 2.6 + (fbm(x * 0.22, y * 0.22, seed + 7, 2) - 0.5) * 3 + (hash2(x, y, seed + 1) - 0.5) * 0.9;
        if (pv < 0.57) li -= 0.9;
        const pcx = x >> 2;
        const pcy = y >> 2;
        if (hash2(pcx, pcy, seed + 50) < 0.13) {
          const px0 = pcx * 4 + 1;
          const py0 = pcy * 4 + 1;
          if (x === px0 || x === px0 + 1) {
            if (y === py0) li = 4.7;else
            if (y === py0 + 1) li = 3.5;else
            if (y === py0 + 2) li = 0.7;
          }
        }
        li -= ao[pi];
        c = pick(path, li);
        if (pv < 0.6 && !winter && hash2(x, y, seed + 51) < 0.35) {
          const b = bladeLi(x, y, seed);
          c = pick(grass, b >= 0 ? b : 2.4);
        }
      } else {
        const patch = fbm(x * 0.022, y * 0.022, seed + 11, 2);
        const shade = fbm(x * 0.04, y * 0.04, seed + 17, 2);
        const pal = winter ? patch < 0.36 ? alt : grass : patch > 0.64 ? alt : shade < 0.36 ? deep : grass;
        let li = 2.5 + (fbm(x * 0.05, y * 0.05, seed + 5, 2) - 0.5) * 2.6 + (hash2(x, y, seed) - 0.5) * 0.7;
        if (!winter) {
          const b = bladeLi(x, y, seed);
          if (b >= 0) li = b + (patch - 0.5) * 0.6;
          if (hash2(x, y, seed + 78) < 0.012) li = 0.6;
        } else if (hash2(x, y, seed + 79) < 0.006) li = 5.4;
        if (pv > 0.38 || cv > 0.38) li -= 1.3;
        if (wv > 0.4) li -= (wv - 0.4) * 14;
        li -= ao[pi];
        c = pick(pal, li);
        if (wv > 0.46 && !winter) c = pick(mud, 1 + hash2(x, y, seed + 3) * 1.5);
      }
      p.set(x, y, c);
    }
  }
  return p.canvas();
}

/** Deep teal water with drifting caustic dashes; reflections are composited on top at runtime. */
export function buildWaterFrames(season: Season): HTMLCanvasElement[] {
  const pal = ramp(season === 'winter' ? '#5f8aa6' : '#236a86', 7, 0.6, 0.55);
  const frames: HTMLCanvasElement[] = [];
  for (let f = 0; f < 16; f++) {
    const t = f / 16 * Math.PI * 2;
    const p = new Px(32, 32);
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const X = x / 32 * Math.PI * 2;
        const Y = y / 32 * Math.PI * 2;
        const v = Math.sin(X + Math.sin(Y * 2 + t) * 0.8 + t) * 0.6 + Math.sin(Y * 3 - X + t * 2) * 0.4 + Math.sin(X * 2 + Y + t) * 0.25;
        let li = 2.3 + v * 0.7;
        if (v > 0.98) li = 4.4;
        if (v > 1.12) li = 5.6;
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