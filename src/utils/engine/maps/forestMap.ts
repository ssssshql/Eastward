import type { Ground, World } from '../../../types/game';
import { FOREST_H, FOREST_W, MAP_NAMES } from '../constants';
import { emptyWorld, inBounds, makeObj, scatterDecor } from '../world';
import { rng } from '../../noise';

const PONDS: [number, number, number, number][] = [
[19, 26, 6.6, 4.2],
[38, 31, 3.8, 2.7]];


/** Misty old-growth woods west of the farm: winding trail, a pond with a jetty, and plenty of forage. */
export function createForest(seed: number): World {
  const w = FOREST_W;
  const h = FOREST_H;
  const r = rng(seed * 7 + 29);
  const world = emptyWorld('forest', MAP_NAMES.forest, w, h, seed + 211, false, 'grass');
  const idx = (x: number, y: number) => y * w + x;
  const setG = (x: number, y: number, g: Ground) => {
    if (inBounds(world, x, y)) world.ground[idx(x, y)] = g;
  };
  const getG = (x: number, y: number): Ground => inBounds(world, x, y) ? world.ground[idx(x, y)] : 'grass';
  const rect = (x0: number, y0: number, x1: number, y1: number, g: Ground) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setG(x, y, g);
  };

  for (const [cx, cy, rx, ry] of PONDS) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy + (r() - 0.5) * 0.22 < 1) setG(x, y, 'water');
      }
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (getG(x, y) !== 'grass') continue;
      let near = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (getG(x + dx, y + dy) === 'water') near++;
      if (near > 0 && r() < 0.45) setG(x, y, 'sand');
    }
  }

  // Trail from the farm gate (east edge) winding down to the big pond.
  rect(30, 10, w - 1, 11, 'path');
  rect(30, 12, 31, 18, 'path');
  rect(17, 17, 29, 18, 'path');
  // Jetty out over the pond.
  for (let y = 19; y <= 25; y++) for (const x of [18, 19]) setG(x, y, getG(x, y) === 'water' ? 'dock' : 'path');
  // Side trail to the small pond.
  rect(32, 18, 33, 26, 'path');
  rect(34, 26, 35, 27, 'path');
  // A mossy clearing to the north-west.
  rect(8, 8, 9, 16, 'path');
  rect(10, 16, 16, 17, 'path');

  world.warps.push({ x: w - 1, y: 10, w: 1, h: 2, to: 'farm', tx: 1, ty: 10, dir: 'right' });

  const nearPath = (x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const g = getG(x + dx, y + dy);
      if (g === 'path' || g === 'dock') return true;
    }
    return false;
  };
  const nearPond = (x: number, y: number) => PONDS.some(([cx, cy, rx, ry]) => {
    const dx = (x - cx) / (rx + 2.2);
    const dy = (y - cy) / (ry + 2.2);
    return dx * dx + dy * dy < 1;
  });
  const clearing = (x: number, y: number) => x >= 4 && x <= 13 && y >= 5 && y <= 12;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y);
      if (getG(x, y) !== 'grass' || world.objects[i] || nearPath(x, y)) continue;
      const edge = Math.min(x, y, w - 1 - x, h - 1 - y);
      if (edge >= 3 && (nearPond(x, y) || clearing(x, y))) {
        if (r() < 0.04) world.objects[i] = makeObj('bush', Math.floor(r() * 2), 2);
        continue;
      }
      const dense = edge < 3 ? 0.88 : 0.36;
      const v = r();
      if (v < dense) {
        const pick = r();
        const type = pick < 0.45 ? 1 : pick < 0.9 ? 0 : 2;
        world.objects[i] = makeObj('tree', type * 3 + Math.floor(r() * 3), 6);
      } else if (v < dense + 0.07) world.objects[i] = makeObj('bush', Math.floor(r() * 2), 2);else
      if (v < dense + 0.1) world.objects[i] = makeObj('rock', Math.floor(r() * 3), 2);else
      if (v < dense + 0.12) world.objects[i] = makeObj('stump', Math.floor(r() * 9), 3);
    }
  }
  scatterDecor(world, r, 0.16, 0.6);
  return world;
}

export { FOREST_H };