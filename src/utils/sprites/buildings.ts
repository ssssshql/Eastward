import { Px, pick } from './pixel';
import { ramp, RGB } from './color';
import { hash2 } from '../noise';
import type { Season } from '../../types/game';

const TRIM = ramp('#f3e6cc', 5, 0.45, 0.3);
const SNOW = ramp('#f1f6fb', 4, 0.25, 0.2);
const BRASS: RGB = [240, 196, 96];
const FLOWERS: RGB[] = [[255, 140, 170], [255, 210, 70], [250, 245, 236], [255, 110, 80]];

export interface BuildingSprite {
  canvas: HTMLCanvasElement;
  windows: [number, number][];
  chimney: [number, number] | null;
  door: [number, number];
}

interface BuildingOpts {
  tilesW: number;
  wallH: number;
  roofH: number;
  wall: string;
  roof: string;
  door: string;
  stone?: boolean;
  windows: number[];
  chimney?: number | null;
  sign?: string | null;
  awning?: [string, string] | null;
}

function windowAt(p: Px, x0: number, y0: number, lit: boolean, season: Season, awning: [string, string] | null): void {
  const glass = lit ? ramp('#ffc35a', 5, 0.3, 0.55) : ramp('#5f9cc4', 5, 0.6, 0.5);
  p.box(x0 - 1, y0 - 1, 18, 18, TRIM);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const li = lit ? 3.4 - y * 0.08 : 1.3 + ((x - y + 40) % 11 < 3 ? 2.4 : 0) + y * 0.05;
      p.set(x0 + x, y0 + y, pick(glass, li));
    }
  }
  p.rect(x0 + 7, y0, 2, 16, TRIM[2]);
  p.rect(x0, y0 + 7, 16, 2, TRIM[2]);
  p.box(x0 - 2, y0 + 16, 20, 2, TRIM);
  if (awning) {
    const a = ramp(awning[0], 4, 0.5, 0.3);
    const b = ramp(awning[1], 4, 0.5, 0.3);
    for (let y = 0; y < 6; y++) for (let x = -3; x < 19; x++) {
      if (y === 5 && (x + 3) % 4 > 1) continue;
      p.set(x0 + x, y0 - 6 + y, pick(Math.floor((x + 3) / 4) % 2 ? a : b, 2.6 - y * 0.25));
    }
  }
  p.box(x0 - 1, y0 + 18, 18, 3, ramp('#8a5a3a', 5));
  if (season !== 'winter') {
    const leafy = ramp('#4fae45', 3);
    for (let i = 0; i < 6; i++) p.ball(x0 + 1.5 + i * 2.8, y0 + 17.5, 1.3, 1.3, leafy);
    for (let i = 0; i < 5; i++) p.set(x0 + 2 + i * 3, y0 + 16 + i % 2, FLOWERS[i % FLOWERS.length]);
  } else p.rect(x0 - 1, y0 + 17, 18, 1, SNOW[3]);
}

export function buildBuilding(o: BuildingOpts, season: Season, lit: boolean): BuildingSprite {
  const W = o.tilesW * 16;
  const roofTop = 8;
  const roofBottom = roofTop + o.roofH;
  const wallTop = roofBottom - 4;
  const wallBottom = wallTop + o.wallH;
  const H = wallBottom + 7;
  const p = new Px(W, H);
  const wall = ramp(o.wall, 6, 0.6, 0.45);
  const roof = ramp(o.roof, 6, 0.65, 0.45);
  const stone = ramp('#8d8a93', 5, 0.55, 0.4);
  const door = ramp(o.door, 5, 0.6, 0.4);
  const brick = ramp('#9a5a48', 5, 0.6, 0.4);
  let chimney: [number, number] | null = null;

  if (o.chimney != null) {
    const cx = o.chimney;
    for (let y = 1; y <= roofTop + 16; y++) {
      for (let x = cx; x < cx + 8; x++) {
        const row = Math.floor(y / 3);
        let li = 2.5 + (x < cx + 2 ? 0.8 : x > cx + 5 ? -0.8 : 0);
        if (y % 3 === 2 || (x + row % 2 * 2) % 4 === 0) li -= 1.3;
        if (y <= 2) li = 1;
        p.set(x, y, pick(brick, li));
      }
    }
    if (season === 'winter') p.rect(cx, 0, 8, 1, SNOW[3]);
    chimney = [cx + 4, 1];
  }

  for (let y = wallTop; y <= wallBottom; y++) {
    const board = Math.floor((y - wallTop) / 4);
    for (let x = 4; x < W - 4; x++) {
      let li: number;
      if (o.stone) {
        const row = Math.floor((y - wallTop) / 5);
        const off = row % 2 * 5;
        li = 2.5 + (hash2(Math.floor((x + off) / 10), row, 13) - 0.5) * 1.5;
        if ((x + off) % 10 === 0 || (y - wallTop) % 5 === 4) li = 0.8;
      } else {
        li = 2.6 + (hash2(Math.floor((x + board * 7) / 12), board, 3) - 0.5) * 1 + (hash2(x, y, 4) - 0.5) * 0.4;
        if ((y - wallTop) % 4 === 3) li = 0.9;
      }
      if (y < wallTop + 8) li -= (wallTop + 8 - y) * 0.32;
      if (x <= 5) li = 3.8;
      if (x >= W - 6) li = 1.1;
      p.set(x, y, pick(wall, li));
    }
  }
  for (let y = wallBottom - 1; y <= wallBottom + 4; y++) {
    const row = Math.floor((y - wallBottom + 1) / 3);
    for (let x = 2; x < W - 2; x++) {
      const off = row % 2 * 4;
      let li = 2.4 + (hash2(Math.floor((x + off) / 8), row, 5) - 0.5) * 1.4;
      if ((x + off) % 8 === 0 || (y - wallBottom + 1) % 3 === 2) li = 0.8;
      p.set(x, y, pick(stone, li));
    }
  }
  const inset = Math.round(o.tilesW * 2.3);
  for (let y = roofTop; y <= roofBottom; y++) {
    const t = (y - roofTop) / o.roofH;
    const xl = Math.round(inset - (inset - 1) * t);
    const xr = Math.round(W - 1 - inset + (inset - 1) * t);
    const row = Math.floor((y - roofTop) / 5);
    const ly = (y - roofTop) % 5;
    const off = row % 2 * 4;
    for (let x = xl; x <= xr; x++) {
      const sc = (x + off) % 8;
      let li = 3.6 - t * 1.6 + (hash2(Math.floor((x + off) / 8), row, 9) - 0.5) * 0.9;
      if (ly === 4) li -= 1.4;
      if (sc === 0 && ly < 4) li -= 0.6;
      if (x === xl || x === xr) li -= 1.2;
      if (y >= roofBottom - 1) li = 0.5;
      let c = pick(roof, li);
      if (season === 'winter' && ly < 3 && y < roofBottom - 1 && hash2(x, y, 12) < 0.8) c = pick(SNOW, 3 - ly);
      p.set(x, y, c);
    }
  }
  for (let x = inset - 1; x <= W - inset; x++) {
    p.set(x, roofTop - 2, season === 'winter' ? SNOW[3] : roof[2]);
    p.set(x, roofTop - 1, season === 'winter' ? SNOW[2] : roof[1]);
  }

  const winY = wallTop + 9;
  const windows: [number, number][] = [];
  for (const wx of o.windows) {
    windowAt(p, wx, winY, lit, season, o.awning ?? null);
    windows.push([wx + 8, winY + 8]);
  }
  const dx = Math.round(W / 2) - 8;
  const doorTop = wallBottom - 26;
  p.box(dx, doorTop - 2, 16, 28, TRIM);
  for (let y = doorTop; y <= wallBottom; y++) {
    for (let x = dx + 2; x <= dx + 13; x++) {
      let li = 2.3 + ((x - dx - 2) % 4 === 3 ? -1.2 : 0) + (hash2(x, y, 7) - 0.5) * 0.4;
      if (y === doorTop) li -= 0.8;
      p.set(x, y, pick(door, li));
    }
  }
  p.box(dx + 5, doorTop + 3, 6, 5, lit ? ramp('#ffc35a', 5, 0.3, 0.55) : ramp('#5f9cc4', 5));
  p.set(dx + 11, doorTop + 13, BRASS);
  p.box(dx - 2, wallBottom + 1, 20, 3, ramp('#a7a3ad', 5));
  if (o.sign) {
    const sg = ramp(o.sign, 5, 0.5, 0.4);
    p.box(dx - 4, doorTop - 12, 24, 8, ramp('#6a4630', 4));
    p.box(dx - 3, doorTop - 11, 22, 6, sg);
    p.rect(dx + 2, doorTop - 9, 12, 1, sg[4]);
    p.rect(dx + 4, doorTop - 7, 8, 1, sg[4]);
  }
  p.outline(0.6);
  return { canvas: p.canvas(), windows, chimney, door: [dx + 8, doorTop + 10] };
}

export function buildingForKind(kind: string, variant: number, season: Season, lit: boolean): BuildingSprite {
  switch (kind) {
    case 'house':
      return buildBuilding({ tilesW: 5, wallH: 40, roofH: 42, wall: '#c48a56', roof: '#d0503f', door: '#76452f', windows: [13, 51], chimney: 56 }, season, lit);
    case 'coop':
      return buildBuilding({ tilesW: 4, wallH: 36, roofH: 30, wall: '#c24a3a', roof: '#5a4a52', door: '#f0e2c4', windows: [8], chimney: null }, season, lit);
    case 'store':
      return buildBuilding({ tilesW: 6, wallH: 42, roofH: 44, wall: '#f0dcb4', roof: '#2f8f8a', door: '#5a3a28', windows: [10, 70], chimney: 72, sign: '#ffcf5a', awning: ['#2f8f8a', '#f6ecd8'] }, season, lit);
    case 'smith':
      return buildBuilding({ tilesW: 5, wallH: 40, roofH: 38, wall: '#7a7480', roof: '#3a3442', door: '#4a2e22', windows: [10], chimney: 60, stone: true, sign: '#c0c8d6' }, season, lit);
    case 'tavern':
      return buildBuilding({ tilesW: 6, wallH: 56, roofH: 48, wall: '#a8683e', roof: '#8a2f3a', door: '#4a2a1e', windows: [8, 72], chimney: 18, sign: '#ff9a3a' }, season, lit);
    default:{
        const roofs = ['#d06a3a', '#4a7ad0', '#7a5ad0', '#3a9a6a'];
        const walls = ['#efe0c4', '#e8d0b0', '#f2e6d6', '#dcc8a8'];
        return buildBuilding({ tilesW: 4, wallH: 36, roofH: 34, wall: walls[variant % 4], roof: roofs[variant % 4], door: '#6a4030', windows: [6], chimney: variant % 2 ? 44 : 10 }, season, lit);
      }
  }
}

export function buildCart(season: Season, lit: boolean): HTMLCanvasElement {
  const p = new Px(66, 64);
  const wood = ramp('#a8744c', 6, 0.6, 0.42);
  const dark = ramp('#6a4630', 5, 0.6, 0.35);
  const cream = ramp('#f6ecd8', 5, 0.4, 0.25);
  const red = ramp('#e0503a', 5, 0.55, 0.4);
  for (let y = 12; y <= 40; y++) {
    p.box(6, y, 2, 1, dark);
    p.box(58, y, 2, 1, dark);
  }
  for (let y = 36; y <= 55; y++) {
    for (let x = 3; x <= 62; x++) {
      const board = Math.floor((y - 36) / 4);
      let li = 2.6 + (hash2(Math.floor(x / 10) + board, board, 21) - 0.5) * 0.9;
      if ((y - 36) % 4 === 3) li = 0.9;
      if (y <= 37) li = 4.4;
      p.set(x, y, pick(wood, li));
    }
  }
  const crates: [number, string][] = [[9, '#ff8a1f'], [25, '#ff3d5a'], [41, '#b04f9a']];
  for (const [cx, col] of crates) {
    p.box(cx, 30, 14, 6, dark);
    const fr = ramp(col, 4, 0.5, 0.4);
    for (let i = 0; i < 4; i++) p.ball(cx + 2.5 + i * 3, 29.5, 1.8, 1.6, fr, 0.2);
  }
  for (const wx of [13, 52]) {
    for (let y = 50; y <= 63; y++) {
      for (let x = wx - 7; x <= wx + 7; x++) {
        const d = Math.hypot(x + 0.5 - wx, y + 0.5 - 56.5);
        if (d > 6.5) continue;
        p.set(x, y, d > 5.2 ? dark[0] : d < 1.4 ? dark[3] : dark[1]);
      }
    }
  }
  for (let y = 6; y <= 27; y++) {
    for (let x = 1; x <= 64; x++) {
      const stripe = Math.floor((x - 1) / 8) % 2;
      const lx = (x - 1) % 8 - 3.5;
      if (y > 23 && lx * lx + (y - 23) * (y - 23) * 1.6 > 16) continue;
      let li = 3.2 - (y - 6) * 0.07 + (lx < -2 ? 0.4 : lx > 2 ? -0.5 : 0);
      if (y <= 7) li = 1;
      let c = pick(stripe ? red : cream, li);
      if (season === 'winter' && y <= 9 && hash2(x, y, 4) < 0.75) c = SNOW[3];
      p.set(x, y, c);
    }
  }
  p.box(30, 29, 5, 5, lit ? ramp('#ffd27a', 5, 0.35, 0.5) : ramp('#8aa0ad', 5));
  p.outline(0.6);
  return p.canvas();
}

export function buildBin(season: Season): HTMLCanvasElement {
  const p = new Px(32, 24);
  const wood = ramp('#a8744c', 6, 0.6, 0.42);
  const metal = ramp('#7f8592', 5);
  for (let y = 9; y <= 22; y++) for (let x = 2; x <= 29; x++) p.set(x, y, pick(wood, 2.5 + ((x - 2) % 5 === 4 ? -1.1 : 0) - (y === 22 ? 1 : 0)));
  for (let y = 3; y <= 9; y++) {
    for (let x = 1; x <= 30; x++) {
      let c = pick(wood, y === 3 ? 4.2 : y === 9 ? 0.8 : 3.4 - (y - 3) * 0.2);
      if (season === 'winter' && y <= 5) c = SNOW[3 - (y - 3)];
      p.set(x, y, c);
    }
  }
  for (const bx of [6, 24]) for (let y = 3; y <= 22; y++) p.box(bx, y, 2, 1, metal);
  p.box(14, 8, 4, 4, ramp('#e0b85c', 4));
  p.outline(0.6);
  return p.canvas();
}

export function buildLamp(lit: boolean): HTMLCanvasElement {
  const p = new Px(12, 34);
  const iron = ramp('#3b3a48', 5, 0.5, 0.4);
  for (let y = 11; y <= 31; y++) p.box(5, y, 2, 1, iron);
  p.box(3, 30, 6, 3, iron);
  p.box(2, 3, 8, 8, iron);
  p.box(3, 4, 6, 6, lit ? ramp('#ffd889', 5, 0.3, 0.6) : ramp('#8aa0ad', 5));
  p.rect(5, 4, 2, 6, iron[2]);
  p.rect(3, 1, 6, 2, iron[1]);
  p.set(5, 0, iron[3]);
  p.outline(0.6);
  return p.canvas();
}