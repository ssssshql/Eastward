import { Px, pick } from './pixel';
import { ramp, RGB } from './color';
import { hash2 } from '../noise';
import { DARK, done, FIRE, FurnitureSprite, IRON, light, planks, WOOD } from './furniture';

type Goods = 'store' | 'smith' | 'bar';

const GLASS = ['#e8401f', '#f5c22e', '#8fe06a', '#9ff0ff', '#d82d4a', '#f08a20'];
const STRAW = ramp('#e0c070', 6, 0.55, 0.45);

function counter(tiles: number, goods: Goods): FurnitureSprite {
  const w = tiles * 16;
  const p = new Px(w, 32);
  const top = goods === 'bar' ? ramp('#7a4a30', 6, 0.6, 0.45) : WOOD;
  for (let y = 8; y <= 13; y++) for (let x = 0; x < w; x++) p.set(x, y, pick(top, y === 8 ? 4.6 : 3.4 - (y - 8) * 0.2 + (hash2(x >> 3, y, 2) - 0.5) * 0.5));
  for (let y = 14; y < 32; y++) {
    for (let x = 0; x < w; x++) {
      const px = x % 16;
      let li = 2.2 + (hash2(x >> 4, 3, 4) - 0.5) * 0.4;
      if (px === 0) li = 1;
      if (px > 2 && px < 13 && y > 16 && y < 29) {
        li = 1.8;
        if (px === 3 || y === 17) li = 1.2;
        if (px === 12 || y === 28) li = 2.8;
      }
      if (y === 14) li = 1;
      if (y >= 30) li = 0.8;
      p.set(x, y, pick(DARK, li));
    }
  }
  if (goods === 'store') {
    p.box(w - 16, 1, 12, 8, ramp('#c8a050', 5, 0.55, 0.45));
    p.rect(w - 14, 3, 8, 2, [40, 60, 50]);
    p.rect(w - 14, 3, 3, 1, [120, 255, 160]);
    for (let i = 0; i < 3; i++) {
      const col = ramp(GLASS[i], 4, 0.5, 0.4);
      p.box(5 + i * 7, 2, 5, 7, ramp('#e8f0f4', 4, 0.4, 0.2));
      p.box(6 + i * 7, 4, 3, 4, col);
      p.rect(5 + i * 7, 1, 5, 1, [196, 85, 63]);
    }
    p.ball(w / 2 + 2, 7, 5, 2.4, ramp('#b88450', 4), 0.2);
    for (let i = 0; i < 4; i++) p.ball(w / 2 - 1 + i * 2, 5.5, 1.4, 1.4, ramp(i % 2 ? '#e2463f' : '#f5c22e', 3), 0.3);
  } else if (goods === 'smith') {
    for (let i = 0; i < 3; i++) {
      const col = ramp(['#f08a4a', '#c8d4e2', '#ffcf3a'][i], 4, 0.55, 0.5);
      for (let y = 5; y <= 8; y++) for (let x = 4 + i * 9 + (8 - y); x <= 10 + i * 9 - (8 - y) * 0; x++) p.set(x, y, col[y === 5 ? 3 : 2]);
    }
    p.line(w - 18, 7, w - 6, 3, IRON[3]);
    p.line(w - 18, 8, w - 6, 5, IRON[1]);
    p.box(w - 9, 1, 5, 4, IRON);
  } else {
    for (let i = 0; i < 3; i++) {
      const mx = 6 + i * 18;
      p.box(mx, 3, 5, 6, ramp('#e0a040', 4, 0.5, 0.4));
      p.rect(mx, 2, 5, 2, [250, 246, 234]);
      p.set(mx + 5, 5, [200, 140, 50]);
    }
    p.box(w - 14, 0, 3, 9, ramp('#3a7a4a', 4, 0.5, 0.45));
    p.rect(w - 13, 0, 1, 2, [220, 200, 160]);
  }
  return done(p);
}

function shelf(kind: 'goods' | 'produce' | 'bar'): FurnitureSprite {
  const p = new Px(48, 42);
  p.box(0, 0, 48, 42, DARK);
  for (let y = 3; y < 40; y++) for (let x = 2; x < 46; x++) p.set(x, y, pick(DARK, 0.9 + (hash2(x >> 3, y >> 3, 3) - 0.5) * 0.3));
  for (const sy of [3, 16, 29]) {
    for (let x = 3; x < 45;) {
      const r = hash2(x, sy, 7);
      if (kind === 'bar') {
        const col = ramp(GLASS[Math.floor(r * GLASS.length)], 4, 0.55, 0.45);
        const h = 7 + Math.floor(hash2(x, sy, 8) * 3);
        for (let y = 0; y < h; y++) for (let xx = 0; xx < 3; xx++) p.set(x + xx, sy + 11 - y, pick(col, y > h - 3 ? 1 : xx === 0 ? 3.4 : 2));
        p.set(x + 1, sy + 11 - h, [220, 200, 160]);
        x += 4;
      } else if (kind === 'produce') {
        const col = ramp(['#e2463f', '#f5c22e', '#7bdc5a', '#ff8a1f', '#f6f0e4'][Math.floor(r * 5)], 4, 0.55, 0.45);
        p.box(x, sy + 6, 10, 6, WOOD);
        for (let i = 0; i < 4; i++) p.ball(x + 1.5 + i * 2.4, sy + 5.5 - i % 2, 1.6, 1.5, col, 0.3);
        x += 11;
      } else {
        if (r < 0.5) {
          const col = ramp(GLASS[Math.floor(hash2(x, sy, 9) * GLASS.length)], 4, 0.5, 0.4);
          p.box(x, sy + 4, 5, 8, ramp('#e8f0f4', 4, 0.4, 0.2));
          p.box(x + 1, sy + 7, 3, 4, col);
          p.rect(x, sy + 3, 5, 1, [196, 85, 63]);
          x += 6;
        } else {
          const cloth = ramp('#d9c3a0', 4, 0.55, 0.4);
          p.ball(x + 3, sy + 8.5, 3.2, 3.4, cloth, 0.1);
          p.rect(x + 2, sy + 4, 3, 2, cloth[1]);
          p.set(x + 3, sy + 8, [90, 160, 80]);
          x += 7;
        }
      }
    }
    planks(p, 1, sy + 12, 46, 2, WOOD, 3.4);
  }
  planks(p, 0, 0, 48, 3, WOOD, 3.6);
  return done(p);
}

function forge(): FurnitureSprite {
  const p = new Px(32, 40);
  const brick = ramp('#8a4a3a', 6, 0.62, 0.42);
  for (let y = 0; y < 18; y++) {
    const hw = 8 + y * 0.45;
    for (let x = Math.floor(16 - hw); x <= Math.ceil(16 + hw); x++) p.set(x, y, pick(IRON, 2.6 - (x - 16) / hw * 1.2 + (y === 17 ? -1.4 : 0)));
  }
  for (let y = 18; y < 40; y++) {
    for (let x = 0; x < 32; x++) {
      const row = Math.floor(y / 4);
      const off = row % 2 * 4;
      let li = 2.6 + (hash2(Math.floor((x + off) / 8), row, 6) - 0.5) * 1.2;
      if ((x + off) % 8 === 0 || y % 4 === 3) li = 1;
      p.set(x, y, pick(brick, li));
    }
  }
  for (let y = 24; y < 34; y++) for (let x = 7; x < 25; x++) p.set(x, y, y < 28 ? [30, 18, 20] : FIRE[1 + Math.floor(hash2(x, y, 2) * 4)]);
  p.rect(6, 23, 20, 1, IRON[1]);
  return done(p, [light(16, 30, 76, 0.95, 'warm', true)]);
}

function anvil(): FurnitureSprite {
  const p = new Px(18, 16);
  p.box(5, 8, 8, 8, WOOD);
  for (let y = 2; y < 8; y++) {
    const x0 = y < 5 ? 1 + (5 - y) : 3;
    const x1 = y < 4 ? 17 : 14;
    for (let x = x0; x <= x1; x++) p.set(x, y, pick(IRON, y === 2 ? 4.2 : 2.4 - (y - 3) * 0.3));
  }
  p.set(4, 2, IRON[4]);
  return done(p);
}

function toolrack(): FurnitureSprite {
  const p = new Px(32, 20);
  planks(p, 0, 2, 32, 5, WOOD, 3);
  p.line(5, 6, 5, 18, DARK[2]);
  p.box(3, 14, 5, 4, IRON);
  p.line(13, 6, 11, 18, IRON[2]);
  p.line(15, 6, 17, 18, IRON[2]);
  p.box(22, 6, 7, 10, ramp('#c0c8d6', 4, 0.5, 0.4));
  for (let y = 7; y < 16; y += 2) p.set(22, y, IRON[1]);
  p.rect(24, 4, 3, 2, DARK[2]);
  return done(p);
}

function kegs(): FurnitureSprite {
  const p = new Px(32, 34);
  const face = ramp('#c8925a', 5, 0.55, 0.45);
  planks(p, 0, 30, 32, 4, DARK, 2.4);
  const ends: [number, number][] = [[8, 22], [24, 22], [16, 9]];
  for (const [cx, cy] of ends) {
    p.ball(cx, cy, 8, 8, WOOD, 0.1);
    p.ball(cx, cy, 6, 6, face, 0.2);
    for (let a = 0; a < 6; a++) p.set(cx + Math.cos(a) * 3, cy + Math.sin(a) * 3, face[1]);
    p.box(cx - 1, cy + 3, 3, 3, IRON);
  }
  return done(p);
}

function hay(): FurnitureSprite {
  const p = new Px(32, 20);
  for (const bx of [0, 16]) {
    for (let y = 3; y < 20; y++) for (let x = bx; x < bx + 16; x++) {
      let li = 2.8 + (hash2(x, y >> 1, 3) - 0.5) * 1.4;
      if (y === 3) li = 4.4;
      if (x === bx) li += 0.6;
      if (x === bx + 15) li -= 1;
      if (y === 19) li = 1;
      if (y === 8 || y === 14) li = 0.9;
      p.set(x, y, pick(STRAW, li));
    }
  }
  for (let i = 0; i < 8; i++) p.set(4 + i * 3, 2 - i % 2, STRAW[4]);
  return done(p);
}

function trough(): FurnitureSprite {
  const p = new Px(32, 14);
  for (let y = 2; y < 14; y++) for (let x = 0; x < 32; x++) {
    const edge = x < 2 || x > 29 || y < 4 || y > 11;
    const c: RGB = edge ? pick(WOOD, y < 4 ? 4 : 2.2) : pick(STRAW, 2.4 + (hash2(x, y, 4) - 0.5) * 2);
    p.set(x, y, c);
  }
  for (const lx of [3, 26]) p.box(lx, 12, 3, 2, DARK);
  return done(p);
}

function nest(): FurnitureSprite {
  const p = new Px(16, 12);
  p.ball(8, 7, 7, 4, STRAW, 0.1);
  p.ball(8, 6.5, 4.5, 2.2, ramp('#8a6a3a', 4), -0.3);
  p.ball(8, 5.5, 2.2, 2.6, ramp('#f6eee0', 4, 0.45, 0.3), 0.2);
  for (let i = 0; i < 6; i++) p.set(2 + i * 2.4, 4 + i % 2 * 6, STRAW[4]);
  return done(p);
}

export function buildWorkFurniture(): Record<string, FurnitureSprite> {
  return {
    counter_store: counter(4, 'store'),
    counter_smith: counter(3, 'smith'),
    counter_bar: counter(4, 'bar'),
    shelfGoods: shelf('goods'),
    shelfProduce: shelf('produce'),
    shelfBar: shelf('bar'),
    forge: forge(),
    anvil: anvil(),
    toolrack: toolrack(),
    kegs: kegs(),
    hay: hay(),
    trough: trough(),
    nest: nest()
  };
}