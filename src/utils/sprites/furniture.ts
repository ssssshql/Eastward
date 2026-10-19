import { Px, pick } from './pixel';
import { ramp, RGB } from './color';
import { hash2 } from '../noise';
import { buildWorkFurniture } from './furnitureWork';

export interface FurnitureLight {
  x: number;
  y: number;
  r: number;
  a: number;
  kind: 'warm' | 'cool' | 'green' | 'violet';
  flicker: boolean;
}

export interface FurnitureSprite {
  img: HTMLCanvasElement;
  night: HTMLCanvasElement | null;
  lights: FurnitureLight[];
}

export const WOOD = ramp('#a06a42', 6, 0.62, 0.45);
export const DARK = ramp('#6a4430', 6, 0.62, 0.42);
export const IRON = ramp('#45424f', 5, 0.55, 0.4);
export const STONE = ramp('#a09aa6', 6, 0.62, 0.42);
export const FIRE: RGB[] = [[190, 50, 30], [250, 100, 40], [255, 160, 60], [255, 215, 110], [255, 248, 200]];
const SHEET = ramp('#f2ead8', 5, 0.42, 0.25);
const BOOKS = ['#c8503a', '#3f7fb0', '#e0a040', '#5a8a4a', '#8a4a9a', '#e8d7b8', '#2f6f6a'];

export function light(x: number, y: number, r: number, a: number, kind: FurnitureLight['kind'] = 'warm', flicker = false): FurnitureLight {
  return { x, y, r, a, kind, flicker };
}

export function done(p: Px, lights: FurnitureLight[] = [], night: Px | null = null): FurnitureSprite {
  p.outline(0.82);
  if (night) night.outline(0.82);
  return { img: p.canvas(), night: night ? night.canvas() : null, lights };
}

/** Horizontal planks lit from above. */
export function planks(p: Px, x0: number, y0: number, w: number, h: number, pal: RGB[], base = 2.6): void {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let li = base + (hash2(x0 + x >> 3, y0 + y, 5) - 0.5) * 0.6;
      if (y % 4 === 3) li -= 1.2;
      if (y === 0) li += 1.2;
      if (x === 0) li += 0.5;
      if (x === w - 1) li -= 0.8;
      p.set(x0 + x, y0 + y, pick(pal, li));
    }
  }
}

export function flames(p: Px, cx: number, by: number, w: number, h: number): void {
  for (let y = 0; y < h; y++) {
    const t = y / h;
    const hw = w * (1 - t * 0.85) * (0.8 + Math.sin(y * 1.7) * 0.2);
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
      const u = Math.abs(x + 0.5 - cx) / Math.max(1, hw);
      const li = 4.2 - u * 2.4 - t * 1.6;
      p.set(x, by - y, FIRE[Math.max(0, Math.min(4, Math.round(li)))]);
    }
  }
}

function bed(quilt: string): FurnitureSprite {
  const p = new Px(32, 40);
  const Q = ramp(quilt, 6, 0.62, 0.45);
  p.box(0, 1, 3, 15, DARK);
  p.box(29, 1, 3, 15, DARK);
  p.ball(1.5, 1.5, 2, 1.6, WOOD, 0.3);
  p.ball(30.5, 1.5, 2, 1.6, WOOD, 0.3);
  planks(p, 3, 3, 26, 10, WOOD, 2.8);
  p.rect(5, 5, 22, 1, WOOD[1]);
  p.rect(5, 10, 22, 1, WOOD[4]);
  p.box(2, 12, 28, 24, SHEET);
  p.ball(9.5, 15.5, 5.5, 3, SHEET, 0.3);
  p.ball(22.5, 15.5, 5.5, 3, SHEET, 0.3);
  for (let y = 19; y <= 35; y++) {
    for (let x = 2; x <= 29; x++) {
      const cell = (x - 2 >> 2) + (y - 19 >> 2);
      let li = 2.6 + (cell % 2 ? 0.7 : -0.2);
      if ((y - 19) % 4 === 0 || (x - 2) % 4 === 0) li = 1.4;
      if (y <= 20) li = y === 19 ? 4.6 : 3.8;
      if (x === 2) li += 0.6;
      if (x === 29) li -= 0.9;
      p.set(x, y, pick(y <= 20 ? SHEET : Q, li));
    }
  }
  p.box(1, 34, 30, 5, DARK);
  p.rect(2, 34, 28, 1, DARK[4]);
  return done(p);
}

function table(): FurnitureSprite {
  const p = new Px(32, 26);
  for (const lx of [2, 27]) p.box(lx, 14, 3, 12, DARK);
  for (let y = 4; y <= 12; y++) {
    for (let x = 0; x <= 31; x++) {
      let li = 3.4 + (hash2(x >> 3, y, 5) - 0.5) * 0.6 - (y - 4) * 0.1;
      if (y === 4) li = 4.6;
      if ((x + y % 2 * 3) % 11 === 0) li -= 0.6;
      p.set(x, y, pick(WOOD, li));
    }
  }
  for (let x = 0; x <= 31; x++) {
    p.set(x, 13, WOOD[1]);
    p.set(x, 14, WOOD[0]);
  }
  const cloth = ramp('#e8d7b8', 4, 0.45, 0.3);
  for (let y = 4; y <= 15; y++) for (let x = 11; x <= 20; x++) p.set(x, y, pick(cloth, (x === 11 || x === 20 ? 1.4 : 2.6) + (y > 13 ? -0.8 : 0)));
  p.ball(16, 4, 2.6, 3, ramp('#4a7ac0', 4, 0.5, 0.4), 0.2);
  p.set(15, 0, [255, 140, 160]);
  p.set(17, 0, [255, 210, 80]);
  p.set(16, 1, [90, 160, 80]);
  p.ball(6, 7, 3, 1.4, ramp('#f2ead8', 4, 0.4, 0.3), 0.3);
  p.ball(6, 6.5, 1.4, 0.8, ramp('#e0a040', 3), 0.2);
  return done(p);
}

function tableRound(): FurnitureSprite {
  const p = new Px(32, 24);
  p.box(14, 13, 4, 9, DARK);
  p.ball(16, 22, 7, 1.8, DARK, 0);
  for (let y = 2; y <= 14; y++) {
    for (let x = 0; x <= 31; x++) {
      const dx = (x + 0.5 - 16) / 15.5;
      const dy = (y + 0.5 - 8) / 6;
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      let li = 3.4 - dy * 0.8 + (hash2(x >> 2, y, 6) - 0.5) * 0.5;
      if (d > 0.82 && dy > 0) li = 1.2;
      if (d > 0.82 && dy <= 0) li = 4.4;
      p.set(x, y, pick(WOOD, li));
    }
  }
  const glass = ramp('#e0a040', 4, 0.5, 0.4);
  for (const [mx, my] of [[8, 4], [21, 6]]) {
    p.box(mx, my, 4, 5, glass);
    p.rect(mx, my - 1, 4, 2, [250, 246, 234]);
    p.set(mx + 4, my + 2, glass[1]);
  }
  p.ball(15, 10, 3, 1.3, SHEET, 0.3);
  return done(p);
}

function stool(): FurnitureSprite {
  const p = new Px(14, 14);
  for (const lx of [2, 10]) p.box(lx, 6, 2, 8, DARK);
  p.ball(7, 5, 6.2, 3.2, WOOD, 0.2);
  p.rect(2, 7, 10, 1, WOOD[1]);
  return done(p);
}

function bookshelf(): FurnitureSprite {
  const p = new Px(32, 44);
  p.box(0, 0, 32, 44, DARK);
  for (let y = 4; y < 42; y++) for (let x = 2; x < 30; x++) p.set(x, y, pick(DARK, 0.8 + (hash2(x >> 2, y >> 3, 9) - 0.5) * 0.4));
  for (const sy of [4, 16, 28]) {
    let x = 3;
    let i = 0;
    while (x < 28) {
      const w = 2 + Math.floor(hash2(x, sy, 11) * 2);
      const h = 7 + Math.floor(hash2(x, sy, 12) * 4);
      const col = ramp(BOOKS[Math.floor(hash2(x, sy, 13) * BOOKS.length)], 4, 0.55, 0.4);
      if (hash2(x, sy, 14) < 0.12) {
        x += 2;
        continue;
      }
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) p.set(x + xx, sy + 11 - yy, pick(col, xx === 0 ? 3 : 2));
      p.set(x, sy + 11 - h + 2, col[3]);
      x += w + (i++ % 4 === 3 ? 1 : 0);
    }
    planks(p, 1, sy + 11, 30, 2, WOOD, 3.4);
  }
  planks(p, 0, 0, 32, 3, WOOD, 3.6);
  return done(p);
}

function stove(): FurnitureSprite {
  const p = new Px(16, 30);
  for (let y = 0; y < 13; y++) p.box(6, y, 4, 1, IRON);
  p.rect(5, 3, 6, 1, IRON[0]);
  p.box(1, 12, 14, 18, IRON);
  p.rect(1, 12, 14, 1, IRON[4]);
  p.box(3, 19, 10, 7, IRON);
  for (let y = 21; y <= 24; y++) for (let x = 5; x <= 10; x++) p.set(x, y, FIRE[2 + ((x + y) % 3 === 0 ? 1 : 0)]);
  p.rect(4, 17, 2, 1, [240, 196, 96]);
  p.rect(10, 17, 2, 1, [240, 196, 96]);
  p.ball(8, 11, 4.5, 2.6, ramp('#c8743a', 5, 0.55, 0.45), 0.2);
  p.set(6, 7, [240, 240, 240]);
  p.set(8, 6, [240, 240, 240]);
  return done(p, [light(8, 22, 38, 0.6, 'warm', true)]);
}

function fireplace(): FurnitureSprite {
  const p = new Px(32, 42);
  for (let y = 0; y < 8; y++) for (let x = 6; x < 26; x++) p.set(x, y, pick(STONE, 2.2 + (x < 8 ? 1 : x > 23 ? -0.8 : 0) + (hash2(x >> 2, y >> 2, 3) - 0.5)));
  for (let y = 8; y < 42; y++) {
    for (let x = 0; x < 32; x++) {
      const row = Math.floor(y / 5);
      const off = row % 2 * 4;
      let li = 2.8 + (hash2(Math.floor((x + off) / 8), row, 4) - 0.5) * 1.2;
      if ((x + off) % 8 === 0 || y % 5 === 4) li = 1.1;
      if (x < 2) li += 0.8;
      if (x > 29) li -= 0.8;
      p.set(x, y, pick(STONE, li));
    }
  }
  planks(p, 0, 8, 32, 4, WOOD, 3.4);
  for (let y = 18; y < 42; y++) {
    for (let x = 7; x < 25; x++) {
      const ax = x + 0.5 - 16;
      const ay = y + 0.5 - 27;
      if (y < 27 && ax * ax + ay * ay > 81) continue;
      p.set(x, y, [22 + (y - 18), 16 + (y - 18) * 0.5, 22]);
    }
  }
  p.rect(9, 38, 14, 2, DARK[1]);
  flames(p, 12, 37, 3.2, 10);
  flames(p, 19, 37, 3.6, 12);
  flames(p, 16, 37, 2.4, 8);
  p.box(4, 4, 3, 4, ramp('#f2ead8', 4));
  p.set(5, 2, FIRE[3]);
  p.set(5, 3, FIRE[4]);
  p.ball(25, 5.5, 2.2, 2.2, ramp('#3f8f9a', 4), 0.2);
  return done(p, [light(16, 33, 84, 0.9, 'warm', true)]);
}

function lampStand(): FurnitureSprite {
  const p = new Px(12, 30);
  p.ball(6, 28, 4.5, 1.6, DARK, 0.1);
  p.box(5, 10, 2, 18, DARK);
  const shade = ramp('#f2d8a0', 5, 0.4, 0.55);
  for (let y = 2; y <= 10; y++) {
    const hw = 3 + (y - 2) * 0.35;
    for (let x = Math.floor(6 - hw); x <= Math.ceil(6 + hw) - 1; x++) p.set(x, y, pick(shade, y === 10 ? 2 : 4.2 - (x - 6 + hw) * 0.18));
  }
  return done(p, [light(6, 8, 58, 0.82)]);
}

function plant(): FurnitureSprite {
  const p = new Px(16, 26);
  const clay = ramp('#c0603a', 5, 0.6, 0.42);
  for (let y = 17; y <= 25; y++) {
    const inset = y > 22 ? 1 : 0;
    for (let x = 3 + inset; x <= 12 - inset; x++) p.set(x, y, pick(clay, y === 17 ? 4.2 : 2.6 - (x - 7.5) * 0.3));
  }
  const leaf = ramp('#3f9a4a', 6, 0.62, 0.5);
  const fronds: [number, number][] = [[-2.6, 9], [-2.2, 11], [-1.57, 13], [-0.95, 11], [-0.5, 9], [-1.9, 8], [-1.25, 8]];
  for (const [a, len] of fronds) {
    for (let s = 0; s <= len; s += 0.5) {
      const t = s / len;
      const x = 8 + Math.cos(a) * s;
      const y = 17 + Math.sin(a) * s + t * t * 3;
      const hw = 1.6 * Math.sin(Math.PI * t);
      for (let k = -hw; k <= hw; k += 0.5) p.set(x + k * 0.4, y + k, pick(leaf, 2.4 + t * 1.6 + (k < 0 ? 0.8 : -0.4)));
    }
  }
  return done(p);
}

function barrel(): FurnitureSprite {
  const p = new Px(14, 20);
  for (let y = 1; y < 20; y++) {
    const bulge = y > 3 && y < 17 ? 1 : 0;
    for (let x = 1 - bulge; x < 13 + bulge; x++) {
      const u = (x + 0.5 - 7) / 7;
      const hoop = y === 4 || y === 15;
      p.set(x, y, hoop ? pick(IRON, 2.4 - u * 1.4) : pick(WOOD, 3 - u * 2 + ((x + 1) % 4 === 0 ? -0.8 : 0)));
    }
  }
  p.ball(7, 2, 6, 1.6, WOOD, 0.5);
  return done(p);
}

function crate(): FurnitureSprite {
  const p = new Px(16, 16);
  for (let y = 1; y < 16; y++) for (let x = 0; x < 16; x++) {
    let li = 2.8 + (x === 0 ? 0.8 : x === 15 ? -1 : 0);
    if (y === 1) li = 4.4;
    if (y === 15) li = 1;
    if (Math.abs(x - (y - 1) * 16 / 15) < 1.2 || x < 2 || x > 13 || y < 3) li -= 0.9;
    p.set(x, y, pick(WOOD, li));
  }
  return done(p);
}

function sack(): FurnitureSprite {
  const p = new Px(14, 16);
  const cloth = ramp('#c8a878', 6, 0.58, 0.4);
  p.ball(7, 10, 6.4, 5.6, cloth, 0.1);
  p.ball(7, 4, 3, 2, cloth, 0.25);
  p.rect(5, 5, 5, 1, cloth[0]);
  p.ball(7, 3, 2, 1, ramp('#e8c870', 4), 0.3);
  return done(p);
}

function windowFrame(night: boolean): Px {
  const p = new Px(20, 22);
  const trim = ramp('#f0e2c4', 5, 0.5, 0.3);
  const sky = night ? ramp('#2a3a6a', 5, 0.5, 0.4) : ramp('#8ac8e8', 5, 0.5, 0.55);
  const cur = ramp(night ? '#a85a6a' : '#e88a9a', 4, 0.55, 0.4);
  p.box(0, 0, 20, 19, trim);
  for (let y = 2; y < 17; y++) for (let x = 2; x < 18; x++) {
    let li = night ? 1.4 + (hash2(x, y, 3) < 0.03 ? 3 : 0) : 3.4 - y * 0.08 + ((x - y + 30) % 9 < 2 ? 1 : 0);
    if (!night && y > 12) li = 2.2 + (hash2(x >> 1, 0, 4) - 0.5);
    p.set(x, y, pick(night ? sky : y > 12 ? ramp('#5aa848', 5, 0.55, 0.4) : sky, li));
  }
  if (night) p.ball(13, 6, 2, 2, ramp('#fff6d8', 3, 0.2, 0.2), 0.3);
  p.rect(9, 2, 2, 15, trim[3]);
  p.rect(2, 9, 16, 2, trim[3]);
  for (let y = 0; y < 18; y++) {
    const w = y < 10 ? 4 : 3 - Math.floor((y - 10) / 4);
    for (let x = 0; x < w; x++) {
      p.set(x, y, pick(cur, 2.6 - x * 0.5 + (y % 3 === 0 ? -0.6 : 0)));
      p.set(19 - x, y, pick(cur, 1.8 + x * 0.3 + (y % 3 === 0 ? -0.6 : 0)));
    }
  }
  p.box(-1, 18, 22, 4, trim);
  p.ball(4, 18, 2, 1.4, ramp('#4fae45', 4), 0.2);
  p.set(4, 16, [255, 120, 150]);
  return p;
}

function painting(): FurnitureSprite {
  const p = new Px(20, 16);
  const gold = ramp('#d8a040', 5, 0.55, 0.5);
  p.box(0, 0, 20, 16, gold);
  for (let y = 2; y < 14; y++) for (let x = 2; x < 18; x++) {
    const hill = 9 + Math.sin(x * 0.5) * 1.5;
    let c: RGB = y < hill ? [138 + y * 6, 190 + y * 3, 220] : [86, 150 - (y - 9) * 6, 80];
    if (y > hill + 2 && x > 10) c = [60, 120, 160];
    if ((x - 14) * (x - 14) + (y - 5) * (y - 5) < 4) c = [255, 226, 150];
    p.set(x, y, c);
  }
  return done(p);
}

function clock(): FurnitureSprite {
  const p = new Px(10, 20);
  p.box(0, 0, 10, 20, DARK);
  p.ball(5, 5, 3.6, 3.6, ramp('#f6ecd8', 4, 0.4, 0.2), 0.3);
  p.line(5, 5, 5, 3, [40, 30, 40]);
  p.line(5, 5, 7, 5, [40, 30, 40]);
  p.rect(3, 10, 4, 8, [30, 22, 28]);
  p.rect(5, 10, 1, 5, [240, 196, 96]);
  p.ball(5, 15.5, 1.4, 1.4, ramp('#f0c060', 3), 0.3);
  return done(p);
}

function aquarium(): FurnitureSprite {
  const p = new Px(32, 32);
  planks(p, 0, 22, 32, 10, DARK, 2.6);
  const water = ramp('#3aa8b8', 6, 0.55, 0.55);
  for (let y = 3; y < 22; y++) for (let x = 1; x < 31; x++) {
    let li = 2.6 - (y - 3) * 0.06 + (Math.sin(x * 0.6 + y * 0.3) > 0.85 ? 1.4 : 0);
    if (x < 3) li += 1.4;
    if (y < 5) li = 4.6;
    p.set(x, y, pick(water, li));
  }
  for (let x = 4; x < 28; x += 3) for (let y = 21; y > 21 - (3 + Math.floor(hash2(x, 1, 2) * 9)); y--) p.set(x + y % 2, y, [70, 160, 80]);
  for (let x = 1; x < 31; x++) p.set(x, 21, [200, 180, 130]);
  for (const [fx, fy, col] of [[10, 10, [255, 130, 60]], [20, 14, [255, 200, 70]], [15, 7, [255, 110, 90]]] as [number, number, RGB][]) {
    p.rect(fx, fy, 3, 2, col);
    p.set(fx + 3, fy, col);
    p.set(fx + 3, fy + 1, col);
  }
  p.set(24, 8, [230, 250, 255]);
  p.set(25, 5, [230, 250, 255]);
  p.rect(0, 2, 32, 1, IRON[3]);
  return done(p, [light(16, 12, 40, 0.45, 'cool')]);
}

function easel(): FurnitureSprite {
  const p = new Px(16, 30);
  p.line(3, 29, 7, 3, DARK[2]);
  p.line(12, 29, 8, 3, DARK[1]);
  p.line(8, 29, 8, 16, DARK[1]);
  for (let y = 4; y < 18; y++) for (let x = 1; x < 15; x++) {
    let c: RGB = y < 10 ? [200, 218, 230] : [150, 186, 160];
    if (y > 9 && y < 12) c = [234, 236, 240];
    if (Math.abs(x - 10 + y * 0.2) < 1 && y < 11) c = [240, 210, 160];
    p.set(x, y, c);
  }
  p.rect(1, 17, 14, 2, WOOD[2]);
  return done(p);
}

export function buildFurnitureSet(): Record<string, FurnitureSprite> {
  const winDay = windowFrame(false);
  const winNight = windowFrame(true);
  return {
    bed_player: bed('#3f7fb0'),
    bed_vera: bed('#ff7a59'),
    bed_gu: bed('#c23b2b'),
    bed_man: bed('#4fd0c0'),
    bed_qing: bed('#9a6ad8'),
    table: table(),
    tableRound: tableRound(),
    stool: stool(),
    bookshelf: bookshelf(),
    stove: stove(),
    fireplace: fireplace(),
    lampStand: lampStand(),
    plant: plant(),
    barrel: barrel(),
    crate: crate(),
    sack: sack(),
    window: done(winDay, [], winNight),
    painting: painting(),
    clock: clock(),
    aquarium: aquarium(),
    easel: easel(),
    ...buildWorkFurniture()
  };
}