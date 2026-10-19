import { Px } from './pixel';
import { ramp, darken, RGB } from './color';
import type { Dir, NpcDef } from '../../types/game';

export type CharPalette = NpcDef['palette'];

export const PLAYER_PALETTE: CharPalette = { skin: '#f1c09a', hair: '#8a4a2e', shirt: '#f2ead8', over: '#2f6fae', boot: '#4c3024', scarf: '#ff5a3c', style: 'short' };
export const WANDERER_PALETTE: CharPalette = { skin: '#d8a07a', hair: '#6a5e58', shirt: '#9a8a62', over: '#5a4a3a', boot: '#3a2a22', scarf: '#7a8a5a', style: 'long' };
export const BARKEEP_PALETTE: CharPalette = { skin: '#e8b48c', hair: '#5a3424', shirt: '#f2e6cc', over: '#7a2a34', boot: '#2a2228', scarf: '#e0a050', style: 'short' };

interface Ramps {
  SKIN: RGB[];
  HAIR: RGB[];
  SHIRT: RGB[];
  OVER: RGB[];
  BOOT: RGB[];
  SCARF: RGB[];
  style: CharPalette['style'];
}

const EYE: RGB = [30, 24, 40];
const BLUSH: RGB = [255, 130, 120];
const BRASS: RGB = [240, 196, 96];

function front(p: Px, f: number, back: boolean, R: Ramps): void {
  const { SKIN, HAIR, SHIRT, OVER, BOOT, SCARF } = R;
  const by = f === 0 ? 0 : 1;
  const lUp = f === 2 ? 1 : 0;
  const rUp = f === 1 ? 1 : 0;
  p.box(7, 20, 2, 4 - lUp, OVER);
  p.box(11, 20, 2, 4 - rUp, OVER);
  p.box(6, 24 - lUp, 3, 2, BOOT);
  p.box(11, 24 - rUp, 3, 2, BOOT);
  const sw = f === 1 ? 1 : f === 2 ? -1 : 0;
  if (R.style === 'long') {
    p.box(5, 10 + by, 2, 6, HAIR);
    p.box(13, 10 + by, 2, 6, HAIR);
  }
  p.box(4, 14 + by, 2, 5 + sw, SHIRT);
  p.box(4, 19 + by + sw, 2, 1, SKIN);
  p.box(14, 14 + by, 2, 5 - sw, SHIRT);
  p.box(14, 19 + by - sw, 2, 1, SKIN);
  p.box(6, 13 + by, 8, 3, SHIRT);
  p.box(6, 16 + by, 8, 5, OVER);
  if (!back) {
    p.box(7, 14 + by, 6, 2, OVER);
    p.set(7, 13 + by, OVER[3]);
    p.set(12, 13 + by, OVER[3]);
    p.set(7, 16 + by, BRASS);
    p.set(12, 16 + by, BRASS);
  } else {
    p.set(8, 14 + by, OVER[2]);
    p.set(11, 14 + by, OVER[2]);
    p.set(9, 15 + by, OVER[2]);
    p.set(10, 15 + by, OVER[2]);
  }
  p.box(6, 12 + by, 8, 2, SCARF);
  if (!back) {
    p.set(11, 14 + by, SCARF[2]);
    p.set(12, 15 + by, SCARF[1]);
  } else {
    p.set(9, 14 + by, SCARF[2]);
    p.set(10, 14 + by, SCARF[2]);
  }
  p.ball(10, 8 + by, 4.7, 4.5, SKIN, 0.35);
  if (back) {
    p.ball(10, 7.6 + by, 5.1, 4.8, HAIR, 0.2);
    if (R.style === 'long') p.box(6, 11 + by, 8, 3, HAIR);
  } else {
    p.ball(10, 6.4 + by, 5.2, 4.3, HAIR, 0.25, (x, y) => y < 7 + by || (x < 7 || x > 12) && y < 10 + by || y < 8 + by && (x < 8 || x > 11));
    p.rect(8, 9 + by, 1, 2, EYE);
    p.rect(11, 9 + by, 1, 2, EYE);
    p.set(8, 9 + by, [255, 255, 255], 0.45);
    p.set(11, 9 + by, [255, 255, 255], 0.45);
    p.set(7, 11 + by, BLUSH, 0.6);
    p.set(12, 11 + by, BLUSH, 0.6);
  }
  // Crown highlight that reads as a crisp rim light.
  p.set(8, 3 + by, HAIR[4]);
  p.set(9, 3 + by, HAIR[4]);
  if (R.style === 'bun') p.ball(10, 2.4 + by, 2.4, 2, HAIR, 0.3);
}

function side(p: Px, f: number, R: Ramps): void {
  const { SKIN, HAIR, SHIRT, OVER, BOOT, SCARF } = R;
  const by = f === 0 ? 0 : 1;
  if (f === 0) {
    p.box(8, 20, 3, 4, OVER);
    p.box(8, 24, 4, 2, BOOT);
  } else {
    const fwd = f === 1;
    const nearX = fwd ? 11 : 7;
    const farX = fwd ? 7 : 11;
    p.box(farX, 20, 2, 4, OVER.map((c) => darken(c, 0.22)));
    p.box(farX, 24, 3, 2, BOOT.map((c) => darken(c, 0.22)));
    p.box(nearX, 20, 2, 4, OVER);
    p.box(nearX, 24, 3, 2, BOOT);
  }
  if (R.style === 'long') p.box(7, 10 + by, 3, 6, HAIR);
  p.box(7, 13 + by, 6, 3, SHIRT);
  p.box(7, 16 + by, 6, 5, OVER);
  p.box(11, 14 + by, 2, 2, OVER);
  const ax = f === 1 ? 8 : f === 2 ? 10 : 9;
  p.box(ax, 14 + by, 2, 5, SHIRT);
  p.box(ax, 19 + by, 2, 1, SKIN);
  p.box(7, 12 + by, 6, 2, SCARF);
  p.set(6, 13 + by, SCARF[2]);
  p.set(5, 14 + by - (f === 0 ? 0 : 1), SCARF[1]);
  p.ball(10.5, 8 + by, 4.5, 4.5, SKIN, 0.35);
  p.ball(10, 7.2 + by, 5, 4.7, HAIR, 0.25, (x, y) => x < 10 || y < 7 + by && x < 14);
  p.rect(13, 9 + by, 1, 2, EYE);
  p.set(13, 11 + by, BLUSH, 0.6);
  p.set(10, 9 + by, SKIN[1]);
  p.set(9, 3 + by, HAIR[4]);
  if (R.style === 'bun') p.ball(8, 3 + by, 2.4, 2, HAIR, 0.3);
}

export function buildCharacterFrames(pal: CharPalette): Record<Dir, HTMLCanvasElement[]> {
  const R: Ramps = {
    SKIN: ramp(pal.skin, 5, 0.5, 0.4),
    HAIR: ramp(pal.hair, 5, 0.65, 0.45),
    SHIRT: ramp(pal.shirt, 5, 0.5, 0.35),
    OVER: ramp(pal.over, 5, 0.6, 0.45),
    BOOT: ramp(pal.boot, 5, 0.6, 0.4),
    SCARF: ramp(pal.scarf, 5, 0.55, 0.4),
    style: pal.style
  };
  const make = (fn: (p: Px) => void): Px => {
    const p = new Px(20, 28);
    fn(p);
    p.outline(0.86);
    return p;
  };
  const frames = [0, 1, 2];
  const right = frames.map((f) => make((p) => side(p, f, R)));
  return {
    down: frames.map((f) => make((p) => front(p, f, false, R)).canvas()),
    up: frames.map((f) => make((p) => front(p, f, true, R)).canvas()),
    right: right.map((p) => p.canvas()),
    left: right.map((p) => p.flipX().canvas())
  };
}