import { Px } from './pixel';
import { darken, mixHex, ramp, RGB } from './color';
import { getCrop, getItem } from '../items';
import type { CropDef } from '../../types/game';

const WOOD = ramp('#9a6a43', 5, 0.6, 0.4);
const METAL = ramp('#aeb8c4', 5, 0.6, 0.4);
const TEAL = ramp('#4d8f86', 5, 0.6, 0.45);
const BLUE: RGB = [130, 200, 236];
const WHITE: RGB = [250, 248, 240];

function handle(p: Px, x0: number, y0: number, x1: number, y1: number): void {
  p.line(x0 + 1, y0, x1 + 1, y1, WOOD[1]);
  p.line(x0, y0, x1, y1, WOOD[3]);
}

export function drawProduce(p: Px, c: CropDef): void {
  const F = ramp(c.fruit, 5, 0.6, 0.4);
  const A = ramp(c.accent, 5, 0.6, 0.4);
  const L = ramp(c.leaf, 5, 0.6, 0.45);
  switch (c.shape) {
    case 'root':
      p.line(8, 6, 6, 2, L[2]);
      p.line(8, 6, 8, 1, L[3]);
      p.line(8, 6, 11, 2, L[2]);
      p.ball(8, 10, 4.6, 4.2, F, 0.1);
      p.ball(8, 7.8, 3.6, 1.8, A, 0.2);
      break;
    case 'berry':
      p.ball(5.5, 10, 2.8, 2.8, F, 0.1);
      p.ball(10.5, 10.5, 2.8, 2.8, F, 0.1);
      p.ball(8, 6.5, 2.8, 2.8, F, 0.1);
      p.line(7, 3, 10, 2, L[3]);
      p.set(4, 9, F[4]);
      p.set(9, 9, F[4]);
      p.set(7, 5, F[4]);
      break;
    case 'big':
      p.ball(8, 9.5, 6.5, 5, F, 0.1);
      for (const rx of [5, 8, 11]) for (let y = 6; y <= 13; y++) if (p.alpha(rx, y) > 0) p.set(rx, y, F[1], 0.6);
      p.rect(7, 3, 2, 2, L[1]);
      break;
    case 'flower':
      for (let a = 0; a < 10; a++) {
        const ang = a / 10 * Math.PI * 2;
        p.ball(8 + Math.cos(ang) * 4.4, 8 + Math.sin(ang) * 4.4, 2, 2, F, 0.1);
      }
      p.ball(8, 8, 2.8, 2.8, A, 0.1);
      break;
    case 'glow':
      p.line(8, 14, 8, 9, L[2]);
      p.ball(8, 7, 4.2, 3.8, F, 0.2);
      p.set(4, 10, F[3]);
      p.set(8, 11, F[3]);
      p.set(12, 10, F[3]);
      p.set(8, 9, A[4]);
      break;
  }
}

function drawFish(p: Px, color: string): void {
  const C = ramp(color, 5, 0.6, 0.45);
  p.ball(7.5, 8.5, 5.2, 3, C, 0.1);
  for (let y = 5; y <= 12; y++) {
    const k = Math.abs(y - 8.5);
    for (let x = 12; x <= 12 + Math.min(3, 1 + k * 0.8); x++) p.set(x, y, C[k > 2 ? 3 : 2]);
  }
  p.set(7, 5, C[2]);
  p.set(8, 5, C[1]);
  p.set(4, 8, [30, 26, 40]);
  p.set(4, 7, WHITE);
}

export function buildIcon(id: string): HTMLCanvasElement {
  const p = new Px(16, 16);
  const def = getItem(id);
  switch (id) {
    case 'hoe':
      handle(p, 3, 14, 11, 5);
      p.rect(9, 2, 5, 2, METAL[3]);
      p.rect(9, 2, 5, 1, METAL[4]);
      p.rect(12, 4, 2, 3, METAL[2]);
      p.set(13, 6, METAL[1]);
      break;
    case 'axe':
      handle(p, 4, 14, 10, 4);
      p.ball(11, 4.5, 3.2, 2.8, METAL);
      p.rect(13, 2, 1, 5, METAL[4]);
      break;
    case 'pickaxe':
      handle(p, 5, 14, 9, 5);
      for (let t = 0; t <= 1; t += 0.04) {
        const x = 2 + 12 * t;
        const y = 6 - Math.sin(Math.PI * t) * 3.2;
        p.set(x, y, METAL[3]);
        p.set(x, y + 1, METAL[1]);
      }
      break;
    case 'can':
      p.line(4, 7, 5, 4, METAL[1]);
      p.line(5, 4, 9, 4, METAL[1]);
      p.line(9, 4, 10, 7, METAL[1]);
      p.box(3, 7, 8, 7, TEAL);
      p.rect(3, 7, 8, 1, TEAL[4]);
      p.rect(3, 10, 8, 1, TEAL[1]);
      p.line(10, 11, 14, 6, TEAL[2]);
      p.line(10, 12, 14, 7, TEAL[1]);
      p.rect(13, 5, 2, 2, TEAL[3]);
      break;
    case 'rod':
      p.line(2, 14, 13, 2, WOOD[2]);
      p.line(2, 14, 4, 12, [70, 46, 44]);
      p.ball(5, 11.5, 1.6, 1.6, METAL);
      p.line(13, 2, 14, 9, [240, 236, 220]);
      p.set(14, 10, METAL[3]);
      break;
    case 'wood':
      p.box(4, 4, 9, 4, WOOD);
      p.ball(13, 6, 2, 2, ramp('#d8b07a', 4));
      p.box(2, 8, 11, 4, WOOD);
      p.ball(13, 10, 2, 2, ramp('#d8b07a', 4));
      break;
    case 'stone':
      p.ball(8, 10, 5.5, 4, ramp('#8d929f', 5, 0.6, 0.4));
      break;
    case 'quartz':{
        const Q = ramp('#c9a8f5', 5, 0.5, 0.6);
        const shards: [number, number, number][] = [[5, 6, 2], [9, 3, 2.5], [12, 7, 1.6]];
        for (const [cx, top, w] of shards) {
          for (let y = top; y <= 13; y++) {
            const t = (y - top) / (13 - top);
            const hw = w * Math.min(1, t * 2.4);
            for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) p.set(x, y, Q[x < cx ? 4 : x > cx ? 1 : 3]);
          }
        }
        break;
      }
    case 'sprinkler':
      p.ball(8, 13.5, 4.5, 1.6, METAL);
      p.box(6, 7, 4, 6, METAL);
      p.box(5, 5, 6, 2, ramp('#d8a64a', 5));
      p.rect(7, 3, 2, 2, METAL[3]);
      p.set(3, 3, BLUE);
      p.set(13, 3, BLUE);
      p.set(2, 5, BLUE);
      p.set(14, 5, BLUE);
      break;
    case 'lamp':
      p.box(7, 7, 2, 8, ramp('#3b3a48', 5));
      p.rect(5, 14, 6, 1, [50, 48, 62]);
      p.box(5, 2, 6, 5, ramp('#ffd27a', 5, 0.4, 0.5));
      p.rect(5, 1, 6, 1, [50, 48, 62]);
      break;
    case 'ration':
      p.box(3, 6, 10, 7, ramp('#c4553f', 5));
      p.rect(3, 9, 10, 1, ramp('#f1e3c8', 3)[1]);
      p.box(7, 3, 2, 3, ramp('#c4553f', 5));
      break;
    case 'stew':
      p.ball(8, 11, 6, 3.5, ramp('#c9b9a6', 5));
      p.ball(8, 9.5, 4.8, 1.6, ramp('#e0a24a', 5));
      p.set(6, 5, WHITE, 0.6);
      p.set(7, 4, WHITE, 0.5);
      p.set(10, 5, WHITE, 0.6);
      break;
    case 'tart':
      p.ball(8, 10.5, 6, 3.5, ramp('#d9a35a', 5));
      p.ball(6, 9, 1.4, 1.4, ramp('#e2463f', 4));
      p.ball(10, 9, 1.4, 1.4, ramp('#e2463f', 4));
      p.ball(8, 10.5, 1.4, 1.4, ramp('#e2463f', 4));
      break;
    case 'sword':{
        const blade = ramp('#d8e2ee', 5, 0.5, 0.5);
        p.line(4, 12, 13, 3, blade[3]);
        p.line(5, 12, 13, 4, blade[1]);
        p.line(3, 9, 7, 13, ramp('#e0b85c', 4)[2]);
        p.line(2, 14, 4, 12, [90, 56, 40]);
        p.set(14, 2, blade[4]);
        break;
      }
    case 'copper_ore':
    case 'iron_ore':
    case 'gold_ore':{
        const col = id === 'copper_ore' ? '#ff8a3d' : id === 'iron_ore' ? '#d8e6f6' : '#ffd23a';
        p.ball(8, 10, 5.5, 4.2, ramp('#6e6680', 5, 0.6, 0.4));
        const o = ramp(col, 4, 0.5, 0.5);
        for (const [x, y] of [[6, 8], [9, 9], [7, 11], [10, 12], [11, 8]]) {
          p.set(x, y, o[3]);
          p.set(x + 1, y, o[1]);
        }
        break;
      }
    case 'copper_bar':
    case 'iron_bar':
    case 'gold_bar':{
        const col = id === 'copper_bar' ? '#f08a4a' : id === 'iron_bar' ? '#c8d4e2' : '#ffcf3a';
        const B = ramp(col, 5, 0.6, 0.55);
        for (let y = 6; y <= 12; y++) {
          const inset = Math.floor((12 - y) * 0.4);
          for (let x = 2 + inset; x <= 13 - inset; x++) p.set(x, y, B[y === 6 ? 4 : y < 9 ? 3 : y < 12 ? 2 : 1]);
        }
        p.rect(4, 7, 3, 1, B[4]);
        break;
      }
    case 'amethyst':{
        const Q = ramp('#c08cff', 5, 0.5, 0.6);
        for (let y = 2; y <= 14; y++) {
          const hw = y < 7 ? (y - 2) * 0.9 : (14 - y) * 0.6;
          for (let x = Math.floor(8 - hw); x <= Math.ceil(8 + hw); x++) p.set(x, y, Q[x < 8 ? y < 7 ? 4 : 3 : y < 7 ? 2 : 1]);
        }
        break;
      }
    case 'slime':
      p.ball(8, 10, 5.5, 4, ramp('#5ee67a', 5, 0.55, 0.5), 0.2);
      p.set(6, 8, WHITE);
      break;
    case 'bat_wing':{
        const Wc = ramp('#5a3a7a', 4);
        for (let k = 0; k < 10; k++) p.line(3 + k, 4 + Math.abs(k - 4) * 0.6, 3 + k, 11 - k % 3, Wc[k % 2 ? 1 : 2]);
        break;
      }
    case 'egg':
      p.ball(8, 9, 4.2, 5.2, ramp('#f6eee0', 5, 0.45, 0.3), 0.15);
      break;
    case 'milk':
      p.box(5, 5, 6, 9, ramp('#f6f6f2', 5, 0.4, 0.2));
      p.box(6, 2, 4, 3, ramp('#f6f6f2', 5, 0.4, 0.2));
      p.rect(5, 8, 6, 2, ramp('#4a8ad0', 3)[1]);
      break;
    case 'jar':{
        const glaze = ramp('#3f8f9a', 5, 0.6, 0.5);
        p.ball(8, 10, 5.4, 5, glaze, 0.15);
        p.box(5, 3, 6, 2, ramp('#9b6b46', 4));
        break;
      }
    case 'fish_soup':
      p.ball(8, 11, 6, 3.5, ramp('#c9b9a6', 5));
      p.ball(8, 9.5, 4.8, 1.6, ramp('#f0d090', 5));
      p.set(7, 9, ramp('#ff7a3d', 3)[2]);
      p.set(10, 10, [120, 200, 80]);
      p.set(6, 5, WHITE, 0.6);
      p.set(9, 4, WHITE, 0.5);
      break;
    case 'coffee':
      p.box(4, 6, 7, 7, ramp('#f2ece2', 5, 0.4, 0.2));
      p.rect(5, 6, 5, 1, [90, 50, 30]);
      p.line(11, 8, 13, 9, ramp('#f2ece2', 4)[1]);
      p.line(13, 9, 11, 11, ramp('#f2ece2', 4)[1]);
      p.set(6, 3, WHITE, 0.6);
      p.set(8, 2, WHITE, 0.5);
      break;
    default:
      if (def.kind === 'artisan') {
        const glass = ramp('#e8f0f4', 4, 0.4, 0.2);
        const C = ramp(def.color ?? '#e0a24a', 5, 0.55, 0.45);
        p.box(4, 4, 8, 10, glass);
        p.box(5, 7, 6, 6, C);
        p.box(4, 2, 8, 2, ramp('#c4553f', 4));
        p.rect(5, 9, 6, 1, ramp('#f6ecd8', 3)[2]);
      } else if (def.kind === 'seed' && def.cropId) {
        const c = getCrop(def.cropId);
        const cloth = ramp(mixHex('#d9c3a0', c.fruit, 0.35), 5, 0.55, 0.4);
        p.ball(8, 10.5, 5, 4.5, cloth, 0.1);
        p.box(6, 4, 4, 3, cloth);
        p.rect(5, 6, 6, 1, darken(cloth[1], 0.25));
        const L = ramp(c.leaf, 4);
        p.set(7, 10, L[2]);
        p.set(8, 9, L[3]);
        p.set(9, 10, L[2]);
        p.set(8, 11, L[1]);
      } else if (def.kind === 'produce') {
        const c = getCrop(id);
        drawProduce(p, c);
      } else if (def.kind === 'fish') {
        drawFish(p, def.color ?? '#a9c4d6');
      } else {
        p.ball(8, 8, 4, 4, METAL);
      }
  }
  p.outline(0.6);
  return p.canvas();
}