import { Px } from './pixel';
import { ramp, RGB } from './color';

const EYE: RGB = [24, 18, 32];
const WHITE: RGB = [255, 255, 255];

export interface CreatureFrames {
  right: HTMLCanvasElement[];
  left: HTMLCanvasElement[];
}

function both(ps: Px[]): CreatureFrames {
  return { right: ps.map((p) => p.canvas()), left: ps.map((p) => p.flipX().canvas()) };
}

export function buildSlime(color: string): HTMLCanvasElement[] {
  const pal = ramp(color, 6, 0.6, 0.55);
  return [0, 1].map((f) => {
    const p = new Px(20, 16);
    const rx = f ? 8 : 7;
    const ry = f ? 4.6 : 5.6;
    const cy = f ? 10.6 : 9.6;
    p.ball(10, cy, rx, ry, pal, 0.15);
    p.ball(7.5, cy - ry * 0.45, 1.8, 1.2, [pal[5], pal[5], pal[5]], 0);
    p.rect(7, Math.round(cy), 1, 2, EYE);
    p.rect(12, Math.round(cy), 1, 2, EYE);
    p.set(7, Math.round(cy), WHITE, 0.6);
    p.set(12, Math.round(cy), WHITE, 0.6);
    p.outline(0.7);
    return p.canvas();
  });
}

export function buildBat(): HTMLCanvasElement[] {
  const body = ramp('#5a3a7a', 5, 0.6, 0.45);
  const wing = ramp('#3a2a58', 5, 0.6, 0.45);
  return [0, 1].map((f) => {
    const p = new Px(22, 14);
    for (let s = 0; s < 8; s++) {
      const up = f ? -1 : 1;
      const y = 6 + up * (s * 0.55) - (s % 3 === 2 ? -1 : 0);
      for (let k = 0; k < 3 - Math.floor(s / 3); k++) {
        p.set(10 - 2 - s, y + k, wing[2 - Math.min(2, k)]);
        p.set(11 + 2 + s, y + k, wing[2 - Math.min(2, k)]);
      }
    }
    p.ball(11, 7, 3.2, 3.2, body, 0.2);
    p.set(9, 3, body[2]);
    p.set(13, 3, body[2]);
    p.set(10, 7, [255, 80, 90]);
    p.set(12, 7, [255, 80, 90]);
    p.outline(0.7);
    return p.canvas();
  });
}

export function buildChicken(): CreatureFrames {
  const body = ramp('#f6f1e6', 5, 0.45, 0.25);
  const red = ramp('#ff4a3a', 4);
  const orange: RGB = [255, 170, 60];
  const frames = [0, 1].map((f) => {
    const p = new Px(16, 16);
    p.ball(7.5, 10, 5, 4, body, 0.15);
    p.ball(3.5, 7.5, 2, 2.4, body, 0.2);
    p.ball(11.5, 6, 2.6, 2.6, body, 0.25);
    p.set(12, 3, red[2]);
    p.set(13, 3, red[3]);
    p.set(12, 2, red[2]);
    p.set(11, 9, red[1]);
    p.set(14, 6, orange);
    p.set(15, 6, orange);
    p.set(12, 5, EYE);
    p.set(6, 14 - f, orange);
    p.set(9, 13 + f, orange);
    p.set(6, 15 - f, orange);
    p.set(9, 14, orange);
    p.outline(0.6);
    return p;
  });
  return both(frames);
}

export function buildCow(): CreatureFrames {
  const body = ramp('#f2eee6', 5, 0.45, 0.25);
  const spot = ramp('#5a3a2a', 4, 0.5, 0.3);
  const pink = ramp('#f0a8a0', 3);
  const frames = [0, 1].map((f) => {
    const p = new Px(32, 24);
    const legs = f ? [[8, 0], [11, 1], [19, 1], [22, 0]] : [[8, 1], [11, 0], [19, 0], [22, 1]];
    for (const [lx, up] of legs) p.box(lx, 16, 2, 6 - up, spot);
    p.ball(15, 12, 11, 6.5, body, 0.1);
    for (const [sx, sy, sr] of [[10, 10, 3], [17, 13, 2.6], [20, 9, 2.2]]) {
      p.ball(sx, sy, sr, sr * 0.8, spot, 0.2, (x, y) => {
        const dx = (x + 0.5 - 15) / 11;
        const dy = (y + 0.5 - 12) / 6.5;
        return dx * dx + dy * dy <= 1;
      });
    }
    p.ball(27, 9, 4.2, 3.8, body, 0.2);
    p.ball(29, 11, 2.4, 1.8, pink, 0.2);
    p.set(27, 8, EYE);
    p.set(24, 5, spot[3]);
    p.set(25, 4, spot[3]);
    p.set(3, 10, spot[1]);
    p.set(2, 11, spot[1]);
    p.set(2, 12, spot[2]);
    p.outline(0.6);
    return p;
  });
  return both(frames);
}