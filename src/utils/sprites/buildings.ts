import { Px, pick } from './pixel';
import { ramp, RGB } from './color';
import { hash2 } from '../noise';
import type { Season } from '../../types/game';
import { drawClutter, Clutter } from './clutter';

const SNOW = ramp('#f1f6fb', 4, 0.25, 0.2);
const IRON = ramp('#3b3a48', 5, 0.5, 0.4);
const STONE = ramp('#9a96a2', 6, 0.62, 0.42);
const BRASS: RGB = [240, 196, 96];
const FLOWERS: RGB[] = [[255, 120, 150], [255, 206, 70], [250, 245, 236], [255, 110, 80], [180, 140, 255]];
const MOSS: RGB = [96, 140, 70];

/** Horizontal margin around the footprint where porch props and barrels live. */
export const PAD = 10;

export interface BuildingSprite {
  canvas: HTMLCanvasElement;
  windows: [number, number][];
  chimney: [number, number] | null;
  door: [number, number];
  lamps: [number, number][];
}

type WallKind = 'plaster' | 'stone' | 'planks' | 'brick';

interface Spec {
  tilesW: number;
  wallH: number;
  roofH: number;
  wall: string;
  wallKind: WallKind;
  timber: string | null;
  roof: string;
  door: string;
  trim: string;
  shutter: string | null;
  windows: number[];
  chimney: number | null;
  sign?: string | null;
  awning?: [string, string] | null;
  dormer?: boolean;
  ivy?: boolean;
  left: Clutter[];
  right: Clutter[];
}

interface Layout {
  W: number;
  H: number;
  x0: number;
  x1: number;
  roofTop: number;
  roofBottom: number;
  wallTop: number;
  wallBottom: number;
  cx: number;
  doorTop: number;
}

function layout(s: Spec): Layout {
  const roofTop = 10;
  const roofBottom = roofTop + s.roofH;
  const wallTop = roofBottom - 1;
  const wallBottom = wallTop + s.wallH;
  const x0 = PAD;
  const x1 = PAD + s.tilesW * 16 - 1;
  return { W: s.tilesW * 16 + PAD * 2, H: wallBottom + 7, x0, x1, roofTop, roofBottom, wallTop, wallBottom, cx: x0 + s.tilesW * 8, doorTop: wallBottom - 25 };
}

const COTTAGE_ROOFS = ['#d06a3a', '#4a7ad0', '#7a5ad0', '#3a9a6a'];
const COTTAGE_WALLS = ['#efe0c4', '#e8d0b0', '#f2e6d6', '#dcc8a8'];

function specFor(kind: string, variant: number): Spec {
  switch (kind) {
    case 'house':
      return { tilesW: 5, wallH: 40, roofH: 40, wall: '#ecd9b6', wallKind: 'plaster', timber: '#6a4630', roof: '#c8503a', door: '#7a4a30', trim: '#f3e6cc', shutter: '#3f7f8a', windows: [6, 58], chimney: 58, dormer: true, ivy: true, left: ['firewood', 'pot'], right: ['pot', 'barrel'] };
    case 'coop':
      return { tilesW: 4, wallH: 34, roofH: 28, wall: '#b8483a', wallKind: 'planks', timber: null, roof: '#5a4a52', door: '#f0e2c4', trim: '#f0e2c4', shutter: null, windows: [], chimney: null, left: ['sack'], right: ['bucket', 'crate'] };
    case 'store':
      return { tilesW: 6, wallH: 42, roofH: 40, wall: '#f0dcb4', wallKind: 'plaster', timber: '#5a3a28', roof: '#2f8f8a', door: '#5a3a28', trim: '#f6ecd8', shutter: null, windows: [6, 74], chimney: 74, sign: '#ffcf5a', awning: ['#2f8f8a', '#f6ecd8'], left: ['crate', 'sack'], right: ['crate', 'barrel'] };
    case 'smith':
      return { tilesW: 5, wallH: 40, roofH: 36, wall: '#8a8490', wallKind: 'stone', timber: null, roof: '#3a3442', door: '#4a2e22', trim: '#c0b8b0', shutter: '#6b3a28', windows: [6], chimney: 60, sign: '#c0c8d6', left: ['firewood'], right: ['bucket', 'barrel'] };
    case 'tavern':
      return { tilesW: 6, wallH: 52, roofH: 44, wall: '#a8583e', wallKind: 'brick', timber: '#4a2a1e', roof: '#8a2f3a', door: '#4a2a1e', trim: '#e8d0a8', shutter: '#2f5a3a', windows: [6, 74], chimney: 14, sign: '#ff9a3a', dormer: true, left: ['barrel', 'barrel'], right: ['crate', 'barrel'] };
    default:{
        const v = variant % 4;
        return {
          tilesW: 4,
          wallH: 34,
          roofH: 32,
          wall: COTTAGE_WALLS[v],
          wallKind: 'plaster',
          timber: v % 2 ? '#6a4630' : null,
          roof: COTTAGE_ROOFS[v],
          door: '#6a4030',
          trim: '#f3e6cc',
          shutter: null,
          windows: [4, 44],
          chimney: v % 2 ? 46 : 8,
          ivy: v % 2 === 1,
          left: v === 2 ? ['bucket'] : ['pot'],
          right: v === 1 ? ['firewood'] : v === 3 ? ['crate'] : ['pot']
        };
      }
  }
}

/** Chimney mouth relative to the structure's footprint: [x from left edge, height above footprint bottom]. */
export function chimneyOf(kind: string, variant: number): [number, number] | null {
  if (!['house', 'coop', 'store', 'smith', 'tavern', 'cottage'].includes(kind)) return null;
  const s = specFor(kind, variant);
  if (s.chimney == null) return null;
  const L = layout(s);
  return [s.chimney + 4, L.H - 3];
}

// ---------- pieces ----------

function paintChimney(p: Px, s: Spec, L: Layout, season: Season): [number, number] | null {
  if (s.chimney == null) return null;
  const cx = L.x0 + s.chimney;
  const brick = ramp('#9a5a48', 5, 0.62, 0.42);
  for (let y = 3; y <= L.roofTop + 18; y++) {
    for (let x = cx; x < cx + 8; x++) {
      const row = Math.floor(y / 3);
      let li = 2.5 + (x < cx + 2 ? 0.9 : x > cx + 5 ? -0.9 : 0);
      if (y % 3 === 2 || (x + row % 2 * 2) % 4 === 0) li -= 1.3;
      p.set(x, y, pick(brick, li));
    }
  }
  for (let x = cx - 1; x < cx + 9; x++) {
    p.set(x, 1, STONE[4]);
    p.set(x, 2, STONE[2]);
    p.set(x, 3, STONE[1]);
  }
  for (let x = cx + 1; x < cx + 7; x++) p.set(x, 0, [30, 26, 36]);
  if (season === 'winter') p.rect(cx - 1, 0, 10, 1, SNOW[3]);
  return [cx + 4, 1];
}

function roofTile(p: Px, x: number, y: number, rows: number, row: number, lx: number, ly: number, roof: RGB[], season: Season, t: number): void {
  let li = 3.4 - t * 1.3 + (hash2(Math.floor(x / 6) + row * 3, row, 9) - 0.5) * 0.8;
  if (ly === 4) li = 0.7;else
  if (ly === 3 && (lx === 0 || lx === 5)) li = 1.0;else
  if (ly === 0 && lx > 0 && lx < 4) li += 1.1;
  if (lx === 0 && ly < 3) li -= 0.5;
  let c = pick(roof, li);
  const moss = hash2(Math.floor(x / 6), row, 77);
  if (season !== 'winter' && moss < 0.05 && ly < 4) c = [c[0] * 0.55 + MOSS[0] * 0.45, c[1] * 0.55 + MOSS[1] * 0.45, c[2] * 0.55 + MOSS[2] * 0.45];
  if (season === 'winter' && ly < 2 && row < rows * 0.75 && hash2(x, y, 12) < 0.85) c = pick(SNOW, 3 - ly);
  p.set(x, y, c);
}

function paintRoof(p: Px, s: Spec, L: Layout, season: Season): void {
  const roof = ramp(s.roof, 7, 0.68, 0.48);
  const fascia = ramp(s.timber ?? '#5a3a28', 5, 0.6, 0.4);
  const inset = Math.round(s.tilesW * 2.6);
  const rows = Math.ceil(s.roofH / 5);
  for (let y = L.roofTop; y <= L.roofBottom; y++) {
    const t = (y - L.roofTop) / s.roofH;
    const xl = Math.round(L.x0 + inset - (inset + 3) * t);
    const xr = Math.round(L.x1 - inset + (inset + 3) * t);
    const row = Math.floor((y - L.roofTop) / 5);
    const ly = (y - L.roofTop) % 5;
    const off = row % 2 * 3;
    for (let x = xl; x <= xr; x++) {
      if (y >= L.roofBottom - 2) {
        p.set(x, y, pick(fascia, y === L.roofBottom - 2 ? 3.2 : y === L.roofBottom - 1 ? 1.8 : 0.6));
        continue;
      }
      if (x <= xl + 1 || x >= xr - 1) {
        p.set(x, y, pick(fascia, x === xl || x === xr ? 0.8 : 2.4));
        continue;
      }
      roofTile(p, x, y, rows, row, (x - L.x0 + off + 60) % 6, ly, roof, season, t);
    }
  }
  // Rounded ridge cap.
  const rl = L.x0 + inset - 2;
  const rr = L.x1 - inset + 2;
  for (let x = rl; x <= rr; x++) {
    const seg = (x - rl) % 7 === 0;
    p.set(x, L.roofTop - 3, season === 'winter' ? SNOW[3] : roof[seg ? 3 : 5]);
    p.set(x, L.roofTop - 2, season === 'winter' ? SNOW[2] : roof[seg ? 2 : 4]);
    p.set(x, L.roofTop - 1, roof[seg ? 0 : 2]);
  }
  if (s.dormer) paintDormer(p, s, L, roof, season);
}

function paintDormer(p: Px, s: Spec, L: Layout, roof: RGB[], season: Season): void {
  const cx = L.cx;
  const top = L.roofTop + Math.round(s.roofH * 0.28);
  const wall = ramp(s.wall, 5, 0.6, 0.4);
  const trim = ramp(s.trim, 5, 0.45, 0.3);
  for (let y = top + 6; y <= top + 18; y++) for (let x = cx - 8; x <= cx + 7; x++) p.set(x, y, pick(wall, x < cx - 5 ? 3.4 : x > cx + 4 ? 1.4 : 2.4));
  p.box(cx - 5, top + 8, 10, 9, trim);
  for (let y = top + 9; y <= top + 15; y++) for (let x = cx - 4; x <= cx + 3; x++) p.set(x, y, [70, 96, 130]);
  p.rect(cx - 1, top + 9, 1, 7, trim[2]);
  for (let y = 0; y <= 7; y++) {
    for (let x = cx - 10 + y; x <= cx + 9 - y; x++) {
      const yy = top + 7 - y;
      p.set(x, yy, season === 'winter' && y > 4 ? SNOW[3] : pick(roof, 3.6 - (7 - y) * 0.2 - (x === cx - 10 + y || x === cx + 9 - y ? 1.4 : 0)));
    }
  }
  p.rect(cx - 9, top + 18, 18, 1, roof[1]);
}

function paintWall(p: Px, s: Spec, L: Layout): void {
  const wall = ramp(s.wall, 7, 0.62, 0.45);
  const timber = s.timber ? ramp(s.timber, 5, 0.6, 0.42) : null;
  for (let y = L.wallTop; y <= L.wallBottom; y++) {
    const wy = y - L.wallTop;
    for (let x = L.x0; x <= L.x1; x++) {
      let li: number;
      switch (s.wallKind) {
        case 'stone':{
            const row = Math.floor(wy / 6);
            const off = row % 2 * 5;
            const cell = Math.floor((x + off) / (9 + Math.floor(hash2(row, 1, 5) * 4)));
            li = 3 + (hash2(cell, row, 13) - 0.5) * 1.6;
            if ((x + off) % 10 === 0 || wy % 6 === 5) li = 0.9;else
            if (wy % 6 === 0) li += 0.9;
            break;
          }
        case 'planks':{
            const board = Math.floor((x - L.x0) / 5);
            li = 3 + (hash2(board, 3, 4) - 0.5) * 1 + (hash2(x, y >> 1, 4) - 0.5) * 0.4;
            if ((x - L.x0) % 5 === 4) li = 1;
            if ((x - L.x0) % 5 === 0) li += 0.6;
            if ((wy === 3 || wy === s.wallH - 4) && (x - L.x0) % 5 === 2) li = 0.6;
            break;
          }
        case 'brick':{
            const row = Math.floor(wy / 4);
            const off = row % 2 * 4;
            li = 3 + (hash2(Math.floor((x + off) / 8), row, 21) - 0.5) * 1.2;
            if ((x + off) % 8 === 0 || wy % 4 === 3) li = 1.2;
            break;
          }
        default:
          li = 3.2 + (hash2(x >> 1, y >> 1, 3) - 0.5) * 0.5 + (hash2(x >> 3, y >> 3, 5) - 0.5) * 0.4;
          if (hash2(x, y, 6) < 0.008) li = 1.8;
      }
      // Eaves shadow and grime
      if (wy < 6) li -= (6 - wy) * 0.42;
      if (y > L.wallBottom - 6) li -= 0.5 + (hash2(x, y, 8) < 0.2 ? 0.6 : 0);
      if (x <= L.x0 + 1) li += 0.8;
      if (x >= L.x1 - 1) li -= 1;
      p.set(x, y, pick(wall, li));
    }
  }
  if (!timber) return;
  const beam = (x: number, y: number, li: number) => p.set(x, y, pick(timber, li));
  for (let y = L.wallTop + 3; y <= L.wallBottom; y++) {
    for (let k = 0; k < 3; k++) {
      beam(L.x0 + k, y, k === 0 ? 3.6 : 2.2 - k * 0.4);
      beam(L.x1 - k, y, k === 0 ? 0.8 : 1.8);
    }
  }
  for (let x = L.x0; x <= L.x1; x++) {
    beam(x, L.wallTop + 3, 3.4);
    beam(x, L.wallTop + 4, 2);
    beam(x, L.wallTop + 5, 1);
  }
  // Diagonal braces near the corners (Tudor framing).
  const bh = Math.min(14, s.wallH - 18);
  for (let i = 0; i <= bh; i++) {
    for (let k = 0; k < 2; k++) {
      beam(L.x0 + 3 + i * 0.6 + k, L.wallTop + 6 + i, k ? 1.4 : 2.6);
      beam(L.x1 - 3 - i * 0.6 - k, L.wallTop + 6 + i, k ? 1.0 : 2.0);
    }
  }
}

function paintFoundation(p: Px, L: Layout): void {
  for (let y = L.wallBottom + 1; y <= L.H - 2; y++) {
    const row = Math.floor((y - L.wallBottom - 1) / 3);
    for (let x = L.x0 - 1; x <= L.x1 + 1; x++) {
      const off = row % 2 * 4;
      let li = 2.6 + (hash2(Math.floor((x + off) / 7), row, 5) - 0.5) * 1.4;
      if ((x + off) % 7 === 0 || (y - L.wallBottom - 1) % 3 === 2) li = 0.8;
      if (y === L.wallBottom + 1) li = 4.2;
      if (x === L.x0 - 1) li += 0.6;
      if (x === L.x1 + 1) li -= 0.8;
      p.set(x, y, pick(STONE, li));
    }
  }
}

function windowAt(p: Px, s: Spec, x0: number, y0: number, lit: boolean, season: Season): void {
  const trim = ramp(s.trim, 5, 0.5, 0.3);
  const glass = lit ? ramp('#ffbe5a', 6, 0.35, 0.6) : ramp('#5a94bc', 6, 0.65, 0.5);
  const curtain = lit ? ramp('#f08a4a', 4, 0.5, 0.4) : ramp('#e8d7b8', 4, 0.5, 0.3);
  if (s.shutter) {
    const sh = ramp(s.shutter, 5, 0.6, 0.42);
    for (const sx of [x0 - 6, x0 + 17]) {
      for (let y = -1; y <= 16; y++) {
        for (let x = 0; x < 5; x++) {
          let li = 2.6 + (x === 0 ? 0.8 : x === 4 ? -0.9 : 0);
          if ((y + 1) % 3 === 0) li = 1.2;
          p.set(sx + x, y0 + y, pick(sh, li));
        }
      }
    }
  }
  p.box(x0 - 2, y0 - 2, 20, 20, trim);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let li = lit ? 3.8 - y * 0.08 : 1.4 + ((x - y + 40) % 13 < 3 ? 2.6 : 0) + y * 0.05;
      if (!lit && y < 3) li -= 0.6;
      let c = pick(glass, li);
      const cur = x < 3 ? 2 - x : x > 12 ? x - 13 : -1;
      if (cur >= 0 && y < 15) c = pick(curtain, 2.6 - cur + (y % 4 === 0 ? -0.6 : 0));
      p.set(x0 + x, y0 + y, c);
    }
  }
  p.rect(x0 + 7, y0, 2, 16, trim[3]);
  p.rect(x0, y0 + 7, 16, 2, trim[3]);
  p.rect(x0 + 8, y0, 1, 16, trim[1]);
  p.rect(x0, y0 + 8, 16, 1, trim[1]);
  p.box(x0 - 3, y0 + 16, 22, 2, trim);
  if (s.awning) {
    const a = ramp(s.awning[0], 4, 0.55, 0.3);
    const b = ramp(s.awning[1], 4, 0.5, 0.3);
    for (let y = 0; y < 7; y++) {
      for (let x = -4; x < 20; x++) {
        if (y === 6 && (x + 4) % 4 > 1) continue;
        let c = pick(Math.floor((x + 4) / 4) % 2 ? a : b, 2.8 - y * 0.25);
        if (season === 'winter' && y < 2) c = SNOW[3];
        p.set(x0 + x, y0 - 8 + y, c);
      }
    }
  }
  const box = ramp('#8a5a3a', 5, 0.6, 0.4);
  p.box(x0 - 1, y0 + 18, 18, 4, box);
  if (season !== 'winter') {
    const leafy = ramp('#4fae45', 4, 0.6, 0.4);
    for (let i = 0; i < 7; i++) p.ball(x0 + 0.5 + i * 2.6, y0 + 18, 1.5, 1.4, leafy);
    for (let i = 0; i < 6; i++) p.set(x0 + 1 + i * 3, y0 + 16 + i % 2, FLOWERS[(i + x0) % FLOWERS.length]);
  } else p.rect(x0 - 1, y0 + 17, 18, 2, SNOW[3]);
}

function paintDoor(p: Px, s: Spec, L: Layout, lit: boolean, season: Season, lamps: [number, number][]): void {
  const door = ramp(s.door, 6, 0.62, 0.42);
  const trim = ramp(s.trim, 5, 0.5, 0.3);
  const cx = L.cx;
  const dx = cx - 8;
  const top = L.doorTop;
  const arch = (x: number, y: number, r: number) => {
    const ax = x + 0.5 - cx;
    const ay = y + 0.5 - (top + r);
    return y >= top + r || ax * ax + ay * ay <= r * r * 1.0;
  };
  for (let y = top - 3; y <= L.wallBottom; y++) for (let x = dx - 3; x <= dx + 18; x++) if (arch(x, y, 11)) p.set(x, y, pick(STONE, x < dx ? 3.8 : x > dx + 15 ? 1.6 : 2.6));
  for (let y = top; y <= L.wallBottom; y++) {
    for (let x = dx; x <= dx + 15; x++) {
      if (!arch(x, y, 8)) continue;
      let li = 2.6 + ((x - dx) % 4 === 3 ? -1.3 : (x - dx) % 4 === 0 ? 0.5 : 0) + (hash2(x, y, 7) - 0.5) * 0.4;
      if (y === top + 9 || y === L.wallBottom - 6) li = 0.9;
      p.set(x, y, pick(door, li));
    }
  }
  for (const by of [top + 9, L.wallBottom - 6]) {
    p.rect(dx + 1, by, 14, 1, IRON[1]);
    for (const rx of [dx + 2, dx + 7, dx + 12]) p.set(rx, by, IRON[4]);
  }
  const glow = lit ? ramp('#ffc35a', 5, 0.3, 0.6) : ramp('#5f8cb0', 5, 0.6, 0.5);
  for (let y = top + 2; y <= top + 6; y++) for (let x = cx - 3; x <= cx + 2; x++) if (arch(x, y, 5)) p.set(x, y, pick(glow, lit ? 3.4 : 1.6 + (x === cx - 3 ? 2 : 0)));
  p.rect(cx - 1, top + 2, 1, 5, door[1]);
  p.set(cx + 5, top + 15, BRASS);
  p.set(cx + 5, top + 16, [180, 130, 60]);
  // Pent roof over the door
  const roof = ramp(s.awning ? s.awning[0] : s.roof, 5, 0.62, 0.42);
  for (let y = 0; y < 6; y++) {
    for (let x = cx - 14 - Math.floor(y / 2); x <= cx + 13 + Math.floor(y / 2); x++) {
      let c = pick(roof, y === 5 ? 0.6 : 3.4 - y * 0.3 - ((x + y) % 5 === 0 ? 0.9 : 0));
      if (season === 'winter' && y < 2) c = SNOW[3 - y];
      p.set(x, top - 9 + y, c);
    }
  }
  const wood = ramp(s.timber ?? '#6a4630', 4, 0.6, 0.4);
  for (let i = 0; i < 5; i++) {
    p.set(cx - 13 + i, top - 3 + i, wood[2]);
    p.set(cx + 12 - i, top - 3 + i, wood[1]);
  }
  // Steps
  for (let y = L.wallBottom + 1; y <= L.H - 2; y++) {
    const w = y < L.wallBottom + 3 ? 11 : 13;
    for (let x = cx - w; x < cx + w; x++) {
      let li = y === L.wallBottom + 1 || y === L.wallBottom + 3 ? 4.4 : 2.4;
      if (y === L.wallBottom + 2 || y === L.H - 2) li = 1.2;
      if (x === cx - w) li += 0.6;
      p.set(x, y, pick(STONE, li));
    }
  }
  // Wall lantern
  const lx = cx + 15;
  const ly = top + 1;
  p.line(lx - 2, ly - 2, lx + 1, ly - 2, IRON[1]);
  p.rect(lx, ly - 1, 1, 2, IRON[1]);
  p.box(lx - 2, ly + 1, 5, 7, IRON);
  p.rect(lx - 1, ly + 2, 3, 4, lit ? [255, 222, 130] : [150, 170, 180]);
  if (lit) p.set(lx, ly + 3, [255, 250, 210]);
  lamps.push([lx, ly + 4]);
  void trim;
}

function paintSign(p: Px, s: Spec, L: Layout): void {
  if (!s.sign) return;
  const sg = ramp(s.sign, 5, 0.55, 0.4);
  const wood = ramp('#5a3a28', 4, 0.6, 0.4);
  if (s.wallH >= 48) {
    const y0 = L.doorTop - 21;
    p.box(L.cx - 16, y0, 32, 10, wood);
    p.box(L.cx - 15, y0 + 1, 30, 8, sg);
    for (let i = 0; i < 5; i++) p.rect(L.cx - 11 + i * 5, y0 + 3, 3, 4, sg[0]);
    return;
  }
  const ax = L.cx - 12;
  const ay = L.doorTop - 5;
  p.line(ax - 9, ay, ax, ay, IRON[1]);
  p.set(ax - 1, ay + 1, IRON[2]);
  p.rect(ax - 8, ay + 1, 1, 2, IRON[2]);
  p.rect(ax - 2, ay + 1, 1, 2, IRON[2]);
  p.box(ax - 10, ay + 3, 10, 11, wood);
  p.box(ax - 9, ay + 4, 8, 9, sg);
  p.rect(ax - 7, ay + 6, 4, 1, sg[0]);
  p.rect(ax - 7, ay + 9, 4, 1, sg[0]);
}

function paintPipe(p: Px, L: Layout): void {
  const x = L.x1 - 4;
  const m = ramp('#7a8494', 5, 0.55, 0.4);
  for (let y = L.roofBottom - 1; y <= L.wallBottom + 3; y++) {
    p.set(x, y, m[3]);
    p.set(x + 1, y, m[1]);
    if ((y - L.roofBottom) % 10 === 0) p.rect(x - 1, y, 4, 1, m[0]);
  }
  p.rect(x - 2, L.wallBottom + 3, 4, 2, m[2]);
}

function paintIvy(p: Px, L: Layout, seed: number): void {
  const leaf = ramp('#3f8a3a', 5, 0.6, 0.45);
  for (let v = 0; v < 3; v++) {
    let x = L.x0 + 3 + v * 3;
    for (let y = L.wallBottom; y > L.wallBottom - 18 - v * 4; y--) {
      x += hash2(v, y, seed) < 0.3 ? 1 : hash2(v, y, seed + 1) < 0.3 ? -1 : 0;
      p.set(x, y, leaf[1]);
      if (hash2(x, y, seed + 2) < 0.5) {
        p.set(x + 1, y, leaf[3]);
        p.set(x - 1, y - 1, leaf[2]);
      }
    }
  }
}

function buildFromSpec(s: Spec, season: Season, lit: boolean): BuildingSprite {
  const L = layout(s);
  const p = new Px(L.W, L.H);
  const lamps: [number, number][] = [];
  const chimney = paintChimney(p, s, L, season);
  paintWall(p, s, L);
  paintRoof(p, s, L, season);
  paintFoundation(p, L);
  const windows: [number, number][] = [];
  const winY = L.wallTop + 11;
  for (const wx of s.windows) {
    windowAt(p, s, L.x0 + wx, winY, lit, season);
    windows.push([L.x0 + wx + 8, winY + 8]);
  }
  if (s.ivy) paintIvy(p, L, s.tilesW * 7 + s.wallH);
  if (s.wallKind !== 'planks') paintPipe(p, L);
  paintDoor(p, s, L, lit, season, lamps);
  paintSign(p, s, L);
  drawClutter(p, s.left, 1, L.H - 1, 1, season);
  drawClutter(p, s.right, L.W - 2, L.H - 1, -1, season);
  p.outline(0.82);
  return { canvas: p.canvas(), windows, chimney, door: [L.cx, L.doorTop + 10], lamps };
}

export function buildingForKind(kind: string, variant: number, season: Season, lit: boolean): BuildingSprite {
  return buildFromSpec(specFor(kind, variant), season, lit);
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
  p.outline(0.78);
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
  p.outline(0.78);
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
  p.outline(0.78);
  return p.canvas();
}