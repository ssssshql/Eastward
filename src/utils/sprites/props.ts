import { Px, pick } from './pixel';
import { ramp, RGB } from './color';
import { hash2 } from '../noise';
import type { Season } from '../../types/game';

const SNOW = ramp('#f1f6fb', 4, 0.25, 0.2);

export function buildJar(): HTMLCanvasElement {
  const p = new Px(16, 22);
  const glaze = ramp('#3f8f9a', 6, 0.6, 0.5);
  const wood = ramp('#9b6b46', 4);
  p.ball(8, 14, 6.2, 6.5, glaze, 0.15);
  p.box(5, 5, 6, 3, glaze);
  p.box(4, 3, 8, 2, wood);
  p.rect(4, 13, 12, 1, glaze[1]);
  p.outline(0.65);
  return p.canvas();
}

export function buildLadder(up: boolean): HTMLCanvasElement {
  const p = new Px(16, 16);
  const wood = ramp('#a8744c', 5);
  if (!up) {
    const hole: RGB[] = [[8, 6, 14], [12, 9, 20], [18, 14, 28], [26, 20, 36], [32, 26, 44]];
    p.ball(8, 9, 7, 5, hole, -0.6);
  }
  for (let y = up ? 0 : 5; y < 16; y++) {
    p.set(4, y, wood[3]);
    p.set(11, y, wood[1]);
    if (y % 4 === 1) for (let x = 5; x < 11; x++) p.set(x, y, wood[2]);
  }
  p.outline(0.6);
  return p.canvas();
}

export function buildBrazier(): HTMLCanvasElement {
  const p = new Px(14, 20);
  const iron = ramp('#4a4558', 5, 0.5, 0.4);
  p.line(3, 19, 5, 11, iron[1]);
  p.line(10, 19, 8, 11, iron[1]);
  p.ball(7, 10, 5.5, 2.6, iron, 0.2);
  const ember: RGB[] = [[255, 120, 40], [255, 160, 60], [255, 200, 90], [255, 230, 150], [255, 250, 210]];
  p.ball(7, 9, 4, 1.2, ember, 0.3);
  p.outline(0.6);
  return p.canvas();
}

export function buildCrystal(variant: number): HTMLCanvasElement {
  const p = new Px(18, 22);
  const pal = ramp(variant ? '#5ef0e0' : '#c08cff', 6, 0.55, 0.65);
  const shards: [number, number, number][] = [[6, 6, 2.2], [10, 2, 2.8], [13, 9, 1.8]];
  for (const [cx, top, w] of shards) {
    for (let y = top; y <= 19; y++) {
      const t = (y - top) / (19 - top);
      const hw = w * Math.min(1, t * 3);
      for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) p.set(x, y, pick(pal, x < cx ? 4.6 : x > cx ? 1.6 : 3.4) as RGB);
    }
  }
  p.ball(9, 19.5, 6, 1.6, ramp('#3a3048', 4), 0);
  p.outline(0.55);
  return p.canvas();
}

export function buildBoard(season: Season): HTMLCanvasElement {
  const p = new Px(32, 30);
  const wood = ramp('#8a5a3a', 6, 0.6, 0.42);
  const paper: RGB[] = [[244, 236, 214], [255, 214, 140], [190, 230, 240]];
  for (const x of [4, 26]) for (let y = 8; y <= 28; y++) p.box(x, y, 2, 1, wood);
  for (let y = 4; y <= 20; y++) {
    for (let x = 2; x <= 29; x++) {
      let li = 2.6 + ((y - 4) % 4 === 3 ? -1 : 0) + (hash2(x, y, 3) - 0.5) * 0.4;
      if (y === 4) li = 4.5;
      if (y === 20) li = 0.6;
      p.set(x, y, pick(wood, li));
    }
  }
  const notes: [number, number, number][] = [[5, 7, 0], [12, 6, 1], [19, 8, 2], [9, 13, 1], [21, 13, 0]];
  for (const [x, y, c] of notes) {
    p.rect(x, y, 6, 6, paper[c]);
    p.rect(x + 1, y + 2, 4, 1, [120, 100, 90]);
    p.rect(x + 1, y + 4, 3, 1, [120, 100, 90]);
    p.set(x + 3, y, [220, 60, 50]);
  }
  for (let x = 1; x <= 30; x++) {
    p.set(x, 2, season === 'winter' ? SNOW[3] : wood[1]);
    p.set(x, 3, wood[4]);
  }
  p.outline(0.6);
  return p.canvas();
}

export function buildFountain(season: Season): HTMLCanvasElement {
  const p = new Px(64, 56);
  const stone = ramp('#b5b0bc', 6, 0.6, 0.4);
  const water = ramp(season === 'winter' ? '#8ab4d0' : '#3a9ec2', 6, 0.55, 0.55);
  for (let y = 20; y <= 54; y++) {
    for (let x = 1; x <= 62; x++) {
      const dx = (x + 0.5 - 32) / 30.5;
      const dy = (y + 0.5 - 38) / 15;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1) continue;
      if (d > 0.8) {
        let li = 2.6 - dy * 1.6 + (hash2(Math.floor(Math.atan2(dy, dx) * 8), 1, 4) - 0.5) * 0.8;
        if (d > 0.96) li -= 1.2;
        p.set(x, y, pick(stone, li));
      } else {
        const wave = Math.sin(x * 0.5 + y * 0.3) + Math.sin(x * 0.2 - y * 0.7);
        let li = 2.2 + dy * 0.8 + wave * 0.4;
        if (dy < -0.55) li -= 1.2;
        p.set(x, y, pick(water, li));
      }
    }
  }
  for (let y = 12; y <= 40; y++) p.box(28, y, 8, 1, stone);
  p.ball(32, 12, 10, 4, stone, 0.2);
  p.ball(32, 11, 7.5, 2.4, water, 0.3);
  p.ball(32, 4, 2.4, 3.5, stone, 0.3);
  p.outline(0.6);
  return p.canvas();
}

export function buildCave(): HTMLCanvasElement {
  const p = new Px(96, 64);
  const rock = ramp('#6e6878', 6, 0.7, 0.45);
  const wood = ramp('#8a5a3a', 5);
  for (let y = 2; y < 62; y++) {
    for (let x = 1; x < 95; x++) {
      const dx = (x + 0.5 - 48) / 46;
      const dy = (y + 0.5 - 46) / 44;
      const bump = Math.sin(x * 0.35) * 0.04 + Math.sin(x * 0.11 + 2) * 0.06;
      if (dx * dx + dy * dy > 1 + bump || y > 61) continue;
      const cell = hash2(Math.floor(x / 9), Math.floor((y + Math.floor(x / 9) % 2 * 4) / 8), 7);
      let li = 3 - y / 64 * 1.8 + (cell - 0.5) * 1.6 - dx * 0.8;
      if ((x % 9 === 0 || (y + Math.floor(x / 9) % 2 * 4) % 8 === 0) && cell > 0.3) li -= 1.1;
      p.set(x, y, pick(rock, li));
    }
  }
  for (let y = 26; y < 64; y++) {
    for (let x = 30; x < 66; x++) {
      const dx = (x + 0.5 - 48) / 16;
      const dy = (y + 0.5 - 64) / 36;
      if (dx * dx + dy * dy > 1) continue;
      const depth = 1 - Math.sqrt(dx * dx + dy * dy);
      p.set(x, y, [10 + depth * 4, 8 + depth * 4, 16 + depth * 6]);
    }
  }
  for (let y = 26; y < 64; y++) {
    p.box(30, y, 3, 1, wood);
    p.box(63, y, 3, 1, wood);
  }
  for (let x = 28; x < 68; x++) {
    p.set(x, 25, wood[3]);
    p.set(x, 26, wood[2]);
    p.set(x, 27, wood[1]);
  }
  p.box(46, 28, 4, 5, ramp('#ffcf6a', 4, 0.3, 0.5));
  p.outline(0.6);
  return p.canvas();
}