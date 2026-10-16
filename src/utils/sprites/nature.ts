import { Px, pick } from './pixel';
import { ramp, RGB } from './color';
import { hash2, rng, valueNoise } from '../noise';
import { GRASS } from './terrain';
import type { Season } from '../../types/game';

export interface TreeSprite {
  trunk: HTMLCanvasElement;
  canopy: HTMLCanvasElement;
}

const LEAF: Record<Season, string[]> = {
  spring: ['#5fc256', '#4fb35a', '#86cc4c'],
  summer: ['#2f9a4a', '#3d9a3c', '#268a52'],
  autumn: ['#f07a2a', '#e0aa2a', '#d9442a'],
  winter: ['#b9c9d6', '#aebfcc', '#c3d0db']
};
const PINE: Record<Season, string> = { spring: '#2f6f55', summer: '#2a6650', autumn: '#356a4c', winter: '#36605a' };
const BLOSSOM: Record<Season, string> = { spring: '#f2a9c4', summer: '#5ea552', autumn: '#e3a447', winter: '#c3d0db' };
const WEED: Record<Season, string> = { spring: '#6aa84f', summer: '#5c9a45', autumn: '#a88d3e', winter: '#9aa6a8' };
const BARK = '#7b5238';
const SNOW = ramp('#eef4fa', 4, 0.3, 0.2);
const MOSS = ramp('#6f9a4a', 5);

export const LEAF_PARTICLES: Record<Season, string[]> = {
  spring: ['#7cc062', '#5fa653', '#a3d070'],
  summer: ['#4d9a4c', '#3f8a45', '#68ad55'],
  autumn: ['#e08a3c', '#c9a23a', '#c2512f'],
  winter: ['#dfe8f0', '#c8d4de']
};

interface Blob {
  x: number;
  y: number;
  r: number;
  z: number;
}

function paintBlobs(p: Px, blobs: Blob[], pal: RGB[], seed: number): void {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const b of blobs) {
    minY = Math.min(minY, b.y - b.r);
    maxY = Math.max(maxY, b.y + b.r);
  }
  for (let y = Math.max(0, Math.floor(minY)); y < Math.min(p.h, Math.ceil(maxY) + 1); y++) {
    for (let x = 0; x < p.w; x++) {
      let bh = -1e9;
      let nx = 0;
      let ny = 0;
      let nz = 0;
      let hit = false;
      for (const b of blobs) {
        const dx = (x + 0.5 - b.x) / b.r;
        const dy = (y + 0.5 - b.y) / b.r;
        const d2 = dx * dx + dy * dy;
        if (d2 > 1) continue;
        const z = Math.sqrt(1 - d2);
        const h = z * b.r * 0.6 + b.z;
        if (h > bh) {
          bh = h;
          nx = dx;
          ny = dy;
          nz = z;
          hit = true;
        }
      }
      if (!hit) continue;
      let li = nx * -0.5 + ny * -0.68 + nz * 0.53;
      li -= (y - minY) / (maxY - minY) * 0.5;
      li += (hash2(x >> 1, y >> 1, seed) - 0.5) * 0.4 + (valueNoise(x * 0.45, y * 0.45, seed) - 0.5) * 0.5;
      let idx = Math.floor((li + 0.9) / 2 * pal.length);
      idx = idx < 0 ? 0 : idx >= pal.length ? pal.length - 1 : idx;
      p.set(x, y, pal[idx]);
    }
  }
}

function snowCap(p: Px, seed: number): void {
  for (let x = 0; x < p.w; x++) {
    let depth = 0;
    for (let y = 0; y < p.h; y++) {
      if (p.alpha(x, y) > 200) {
        if (depth < 2 + Math.floor(hash2(x, 3, seed) * 2)) p.set(x, y, pick(SNOW, 3 - depth));
        depth++;
      } else depth = 0;
    }
  }
}

function paintTrunk(p: Px, topY: number, seed: number): void {
  const bark = ramp(BARK, 5, 0.6, 0.4);
  const ph = seed % 10 * 0.6;
  for (let y = topY; y <= 61; y++) {
    const t = (y - topY) / (61 - topY);
    let w = 2.6 + t * 1.4;
    if (y > 55) w += (y - 55) * 0.75;
    const cx = 24 + Math.sin(y * 0.18 + ph) * 0.8;
    for (let x = Math.floor(cx - w - 1); x <= Math.ceil(cx + w + 1); x++) {
      const u = (x + 0.5 - cx) / w;
      if (Math.abs(u) > 1) continue;
      let li = 2.4 - u * 1.5 + (hash2(x * 3, Math.floor(y / 3) + x, seed) - 0.5) * 0.7;
      if (hash2(x, Math.floor(y / 4), seed + 1) < 0.2) li -= 1;
      p.set(x, y, pick(bark, li));
    }
  }
}

function paintPine(p: Px, season: Season, seed: number): void {
  const pal = ramp(PINE[season], 6, 0.7, 0.45);
  for (let y = 0; y < 50; y++) {
    for (let x = 0; x < 48; x++) {
      for (let k = 0; k < 4; k++) {
        const apex = 3 + k * 8.5;
        const base = apex + 15 + k * 1.5;
        if (y < apex || y > base) continue;
        const ty = (y - apex) / (base - apex);
        const hw = (3 + k * 3.2) * Math.pow(ty, 0.85) + 1;
        const jag = (hash2(Math.floor(x / 2), k * 13 + Math.floor(y / 3), seed) - 0.5) * 1.8 * ty;
        const dx = x + 0.5 - 24;
        if (Math.abs(dx) > hw + jag) continue;
        const u = dx / hw;
        let li = 2.8 - u * 1.4 + (0.5 - ty) * 1.6 + (hash2(x, y, seed + 3) - 0.5) * 0.9;
        if (ty > 0.88) li -= 1;
        let c = pick(pal, li);
        if (season === 'winter' && ty < 0.45 && hash2(x, y, seed + 4) < 0.85 - ty) c = pick(SNOW, 2 + (u < 0 ? 1 : 0));
        p.set(x, y, c);
        break;
      }
    }
  }
}

export function buildTree(variant: number, season: Season, seed: number): TreeSprite {
  const type = Math.floor(variant / 3);
  const k = variant % 3;
  const r = rng(seed + variant * 977);
  const trunk = new Px(48, 64);
  paintTrunk(trunk, type === 1 ? 44 : 30, seed + variant);
  trunk.outline(0.6);
  const can = new Px(48, 64);
  if (type === 1) {
    paintPine(can, season, seed + variant);
  } else {
    const base = type === 2 ? BLOSSOM[season] : LEAF[season][k];
    const blobs: Blob[] = [{ x: 24, y: 25, r: 13.5, z: 0 }];
    for (let i = 0; i < 10; i++) {
      const a = r() * Math.PI * 2;
      const d = 0.5 + r() * 0.45;
      blobs.push({ x: 24 + Math.cos(a) * 12 * d, y: 22 + Math.sin(a) * 9 * d, r: 6 + r() * 4.5, z: Math.sin(a) * 5 + 2 });
    }
    blobs.push({ x: 20 + r() * 8, y: 12, r: 8.5, z: -3 });
    paintBlobs(can, blobs, ramp(base, 6, 0.7, 0.5), seed + variant);
    if (type === 2 && season !== 'winter') {
      const dot = season === 'spring' ? ramp('#fff1f5', 3, 0.3, 0.2) : season === 'summer' ? ramp('#e2463f', 3, 0.5, 0.4) : ramp('#f0c64a', 3);
      for (let i = 0; i < 26; i++) {
        const x = Math.floor(6 + r() * 36);
        const y = Math.floor(6 + r() * 30);
        if (can.alpha(x, y) < 200) continue;
        can.set(x, y, dot[2]);
        if (season === 'summer') {
          can.set(x + 1, y, dot[1]);
          can.set(x, y + 1, dot[0]);
          can.set(x + 1, y + 1, dot[0]);
        }
      }
    }
    if (season === 'winter') snowCap(can, seed + variant);
  }
  can.outline(0.62);
  return { trunk: trunk.canvas(), canopy: can.canvas() };
}

export function buildStump(variant: number, season: Season): HTMLCanvasElement {
  const p = new Px(16, 16);
  const bark = ramp(BARK, 5, 0.6, 0.4);
  const wood = ramp('#d4a873', 5, 0.5, 0.35);
  for (let y = 7; y <= 13; y++) {
    const flare = y >= 12 ? 1 : 0;
    for (let x = 3 - flare; x <= 12 + flare; x++) {
      const u = (x - 7.5) / 5;
      p.set(x, y, pick(bark, 2.4 - u * 1.4 + (hash2(x, y, variant) - 0.5) * 0.8));
    }
  }
  for (let y = 4; y <= 10; y++) {
    for (let x = 2; x <= 13; x++) {
      const dx = (x + 0.5 - 8) / 5;
      const dy = (y + 0.5 - 7) / 2.4;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1) continue;
      let c = pick(wood, 3 - (d * 3 % 1 < 0.35 ? 1 : 0));
      if (d > 0.82) c = bark[3];
      if (season === 'winter' && d < 0.8 && hash2(x, y, 9) < 0.75) c = SNOW[3];
      p.set(x, y, c);
    }
  }
  p.outline(0.6);
  return p.canvas();
}

export function buildRock(variant: number, season: Season, seed: number): HTMLCanvasElement {
  const p = new Px(18, 16);
  const big = variant === 1;
  const R = variant === 2 ? 4.8 : big ? 6.6 : 5.9;
  const pal = ramp(variant >= 3 ? '#6e6680' : '#8d929f', 6, 0.68, 0.45);
  const cx = 9;
  const cy = 9.6 - (big ? 0.5 : 0);
  const sp = seed % 5 + variant;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 18; x++) {
      const dx = x + 0.5 - cx;
      const dy = (y + 0.5 - cy) * 1.28;
      const d = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      const rr = R + Math.sin(a * 3 + sp) * 0.7 + Math.sin(a * 5 + variant * 2) * 0.35;
      if (d > rr || y > 13) continue;
      const nx = dx / rr;
      const ny = dy / rr;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const facet = Math.floor((a + Math.PI) / (Math.PI / 3));
      let li = (-nx * 0.5 - ny * 0.7 + nz * 0.5) * 2.2 + 2.6 + (hash2(facet, variant, 4) - 0.5) * 0.9 + (hash2(x, y, seed) - 0.5) * 0.4;
      if (y === 13) li -= 1;
      let c = pick(pal, li);
      if (ny < -0.45 && season !== 'winter' && variant < 3 && hash2(x, y, seed + 1) < 0.55) c = pick(MOSS, li - 1);
      if (ny < -0.35 && season === 'winter' && variant < 3) c = pick(SNOW, li - 1);
      p.set(x, y, c);
    }
  }
  if (variant < 2) p.line(cx - 1, cy - 3, cx + 1, cy, pal[1]);
  const ORE: Record<number, string> = { 3: '#b98af0', 4: '#ff8a3d', 5: '#d8e6f6', 6: '#ffd23a', 7: '#46f0d8' };
  if (ORE[variant]) {
    const cr = ramp(ORE[variant], 5, 0.5, 0.6);
    const spots: [number, number][] = variant === 3 || variant === 7 ? [[6, 7], [11, 8], [9, 11]] : [[5, 8], [8, 6], [12, 9], [9, 11], [11, 6]];
    for (const [sx, sy] of spots) {
      p.set(sx, sy - 1, cr[4]);
      p.set(sx, sy, cr[3]);
      p.set(sx + 1, sy, cr[2]);
      p.set(sx, sy + 1, cr[1]);
    }
  }
  p.outline(0.6);
  return p.canvas();
}

export function buildWeed(variant: number, season: Season, seed: number): HTMLCanvasElement {
  const p = new Px(16, 16);
  const r = rng(seed + variant * 31);
  const pal = ramp(WEED[season], 6, 0.65, 0.5);
  const n = 6 + variant;
  const tips: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const bx = 8 + (r() - 0.5) * 9;
    const h = 5 + r() * 7;
    const lean = (r() - 0.5) * 6;
    for (let s = 0; s <= h; s += 0.5) {
      const t = s / h;
      const x = bx + lean * t * t;
      const y = 14.5 - s;
      p.set(x, y, pick(pal, 1 + t * 4));
      if (t < 0.35) p.set(x + 1, y, pick(pal, 0.8 + t * 3));
    }
    tips.push([bx + lean, 14.5 - h]);
  }
  if (variant === 2 && season !== 'winter') {
    const fl = ramp('#f2e6a0', 4);
    for (const [x, y] of tips.slice(0, 2)) p.ball(x, y, 1.3, 1.3, fl);
  }
  p.outline(0.5);
  return p.canvas();
}

export function buildTuft(variant: number, season: Season): HTMLCanvasElement {
  const p = new Px(10, 10);
  const r = rng(variant * 13 + 5);
  const pal = ramp(season === 'winter' ? '#b9b49a' : GRASS[season], 6, 0.55, 0.45);
  const n = 3 + variant % 2;
  for (let i = 0; i < n; i++) {
    const bx = 5 + (r() - 0.5) * 5;
    const h = 3 + r() * 4;
    const lean = (r() - 0.5) * 3;
    for (let s = 0; s <= h; s += 0.5) {
      const t = s / h;
      p.set(bx + lean * t * t, 9.5 - s, pick(pal, 1.2 + t * 3.8));
    }
  }
  return p.canvas();
}

const FLOWER_COLORS = ['#f4f1e8', '#f2a0b8', '#f6cf55', '#9db8f2', '#e5735f', '#c79af0'];

export function buildFlower(variant: number, season: Season): HTMLCanvasElement {
  const p = new Px(7, 9);
  const stem = ramp(season === 'winter' ? '#7d8f7a' : '#4f8f45', 4);
  const col = season === 'winter' ? '#f4f7fb' : season === 'autumn' && variant % 2 === 0 ? '#e0a040' : FLOWER_COLORS[variant % FLOWER_COLORS.length];
  const pet = ramp(col, 4, 0.5, 0.4);
  p.line(3, 8, 3, 4, stem[1]);
  p.set(2, 6, stem[2]);
  p.set(2, 3, pet[2]);
  p.set(4, 3, pet[1]);
  p.set(3, 2, pet[3]);
  p.set(3, 4, pet[1]);
  p.set(3, 3, [246, 214, 90]);
  p.outline(0.5);
  return p.canvas();
}

export function buildBush(variant: number, season: Season, seed: number): HTMLCanvasElement {
  const p = new Px(26, 22);
  const r = rng(seed + 400 + variant);
  const blobs: Blob[] = [{ x: 13, y: 13, r: 8, z: 0 }];
  for (let i = 0; i < 5; i++) {
    const a = r() * Math.PI * 2;
    blobs.push({ x: 13 + Math.cos(a) * 5, y: 12 + Math.sin(a) * 3.5, r: 4 + r() * 2.5, z: Math.sin(a) * 3 });
  }
  paintBlobs(p, blobs, ramp(LEAF[season][variant % 3], 6, 0.7, 0.5), seed + 400 + variant);
  if (season === 'summer' || season === 'autumn') {
    const berry = ramp(season === 'summer' ? '#5a7fd6' : '#d0473f', 3);
    for (let i = 0; i < 6; i++) {
      const x = Math.floor(6 + r() * 14);
      const y = Math.floor(7 + r() * 10);
      if (p.alpha(x, y) > 200) {
        p.set(x, y, berry[2]);
        p.set(x, y + 1, berry[0]);
      }
    }
  }
  if (season === 'winter') snowCap(p, seed + variant);
  p.outline(0.6);
  return p.canvas();
}