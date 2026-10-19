import type { Ground, World } from '../../../types/game';
import { BEACH_H, BEACH_W, MAP_H, MAP_NAMES, TOWN_H } from '../constants';
import { emptyWorld, inBounds, makeObj, scatterDecor } from '../world';
import { rng } from '../../noise';
import { FARM_SOUTH_X } from './farmMap';
import { BEACH_TOWN_X } from './townMap';

export const PIER_X = 26;

/** Long sandy shore south of the farm and town, with dunes, tide pools and a wooden pier into the sea. */
export function createBeach(seed: number): World {
  const w = BEACH_W;
  const h = BEACH_H;
  const r = rng(seed * 11 + 3);
  const world = emptyWorld('beach', MAP_NAMES.beach, w, h, seed + 307, false, 'sand');
  const idx = (x: number, y: number) => y * w + x;
  const setG = (x: number, y: number, g: Ground) => {
    if (inBounds(world, x, y)) world.ground[idx(x, y)] = g;
  };
  const getG = (x: number, y: number): Ground => inBounds(world, x, y) ? world.ground[idx(x, y)] : 'sand';
  const rect = (x0: number, y0: number, x1: number, y1: number, g: Ground) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setG(x, y, g);
  };
  const ph = seed % 5;

  for (let x = 0; x < w; x++) {
    const dune = 6 + Math.sin(x * 0.27 + ph) * 1.2 + Math.sin(x * 0.11 + 2) * 1;
    const shore = 22 + Math.sin(x * 0.17 + 1 + ph) * 1.4 + Math.sin(x * 0.07) * 1.1;
    for (let y = 0; y < h; y++) {
      if (y < dune) setG(x, y, 'grass');else
      if (y >= shore) setG(x, y, 'water');
    }
  }
  // Tide pools.
  for (const [cx, cy, rx, ry] of [[10, 16, 2.4, 1.4], [42, 15, 2, 1.3], [17, 19, 1.4, 1]] as [number, number, number, number][]) {
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) {
      for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy < 1) setG(x, y, 'water');
      }
    }
  }
  // Roads in from the farm and the town.
  rect(FARM_SOUTH_X, 0, FARM_SOUTH_X + 1, 9, 'path');
  rect(BEACH_TOWN_X, 0, BEACH_TOWN_X + 1, 9, 'path');
  // Pier out into the sea.
  for (let y = 17; y < h - 1; y++) for (const x of [PIER_X, PIER_X + 1]) setG(x, y, 'dock');

  world.warps.push({ x: FARM_SOUTH_X, y: 0, w: 2, h: 1, to: 'farm', tx: FARM_SOUTH_X, ty: MAP_H - 2, dir: 'up' });
  world.warps.push({ x: BEACH_TOWN_X, y: 0, w: 2, h: 1, to: 'town', tx: 12, ty: TOWN_H - 2, dir: 'up' });

  for (const [x, y] of [[PIER_X - 1, 17], [PIER_X + 2, 17], [PIER_X - 1, h - 3], [PIER_X + 2, h - 3]]) {
    if (getG(x, y) === 'sand') world.objects[idx(x, y)] = makeObj('lamp');
  }

  const nearPath = (x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const g = getG(x + dx, y + dy);
      if (g === 'path' || g === 'dock') return true;
    }
    return false;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y);
      const g = getG(x, y);
      if (world.objects[i] || nearPath(x, y)) continue;
      if (g === 'grass') {
        const dense = y < 2 ? 0.8 : y < 4 ? 0.3 : 0.06;
        const v = r();
        if (v < dense) world.objects[i] = makeObj('tree', (r() < 0.6 ? 0 : 1) * 3 + Math.floor(r() * 3), 5);else
        if (v < dense + 0.1) world.objects[i] = makeObj('bush', Math.floor(r() * 2), 2);
      } else if (g === 'sand' && getG(x, y + 1) !== 'water' && r() < 0.012) {
        world.objects[i] = makeObj('rock', Math.floor(r() * 3), 2);
      }
    }
  }
  scatterDecor(world, r, 0.12, 0.55);
  return world;
}