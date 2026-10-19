import type { Ground, World } from '../../../types/game';
import { MAP_NAMES, MAP_W, TOWN_H, TOWN_W } from '../constants';
import { addStructure, emptyWorld, inBounds, makeObj, nearStructure, scatterDecor } from '../world';
import { rng } from '../../noise';

export const TOWN_HUB: [number, number] = [24, 21];
/** Beach column the town's southern road arrives at. */
export const BEACH_TOWN_X = 47;

export function createTown(seed: number): World {
  const w = TOWN_W;
  const h = TOWN_H;
  const r = rng(seed * 3 + 17);
  const world = emptyWorld('town', MAP_NAMES.town, w, h, seed + 101, false, 'grass');
  const idx = (x: number, y: number) => y * w + x;
  const setG = (x: number, y: number, g: Ground) => {
    if (inBounds(world, x, y)) world.ground[idx(x, y)] = g;
  };
  const getG = (x: number, y: number): Ground => inBounds(world, x, y) ? world.ground[idx(x, y)] : 'grass';
  const rect = (x0: number, y0: number, x1: number, y1: number, g: Ground) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setG(x, y, g);
  };

  for (let y = 24; y < h; y++) {
    for (let x = 32; x < w; x++) {
      const dx = (x - 40.5) / 6;
      const dy = (y - 30.5) / 3.8;
      if (dx * dx + dy * dy + (r() - 0.5) * 0.2 < 1) setG(x, y, 'water');
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (getG(x, y) !== 'grass') continue;
      let near = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (getG(x + dx, y + dy) === 'water') near++;
      if (near > 0 && r() < 0.6) setG(x, y, 'sand');
    }
  }

  rect(12, 12, 35, 24, 'cobble');
  for (const [cx, cy] of [[12, 12], [35, 12], [12, 24], [35, 24]]) setG(cx, cy, 'grass');
  rect(0, 15, 11, 16, 'path');
  rect(23, 4, 24, 11, 'path');
  rect(15, 11, 16, 11, 'path');
  rect(30, 11, 30, 11, 'path');
  rect(36, 18, 41, 19, 'cobble');
  rect(5, 24, 11, 24, 'path');
  rect(5, 24, 5, 30, 'path');
  rect(18, 25, 18, 31, 'path');
  rect(29, 25, 29, 31, 'path');
  rect(35, 22, 36, 25, 'path');
  // Southern road to the beach.
  rect(12, 24, 13, h - 1, 'path');

  addStructure(world, { kind: 'store', x: 13, y: 8, w: 6, h: 3 });
  addStructure(world, { kind: 'smith', x: 28, y: 8, w: 5, h: 3 });
  addStructure(world, { kind: 'tavern', x: 36, y: 14, w: 6, h: 4 });
  addStructure(world, { kind: 'cottage', x: 3, y: 21, w: 4, h: 3, variant: 0 });
  addStructure(world, { kind: 'cottage', x: 3, y: 28, w: 4, h: 3, variant: 1 });
  addStructure(world, { kind: 'cottage', x: 16, y: 29, w: 4, h: 3, variant: 2 });
  addStructure(world, { kind: 'cottage', x: 27, y: 29, w: 4, h: 3, variant: 3 });
  addStructure(world, { kind: 'board', x: 20, y: 11, w: 2, h: 1 }, 'cobble');
  addStructure(world, { kind: 'fountain', x: 22, y: 16, w: 4, h: 3 }, 'cobble');
  addStructure(world, { kind: 'cart', x: 14, y: 19, w: 4, h: 2 }, 'cobble');
  addStructure(world, { kind: 'cave', x: 21, y: 1, w: 6, h: 3 });

  world.warps.push({ x: 0, y: 15, w: 1, h: 2, to: 'farm', tx: MAP_W - 2, ty: 10, dir: 'left' });
  world.warps.push({ x: 23, y: 4, w: 2, h: 1, to: 'mine', tx: 0, ty: 0, dir: 'up' });
  world.warps.push({ x: 12, y: h - 1, w: 2, h: 1, to: 'beach', tx: BEACH_TOWN_X, ty: 1, dir: 'down' });

  for (const [x, y] of [[13, 13], [34, 13], [13, 23], [34, 23], [20, 15], [27, 15], [22, 10], [8, 16], [37, 21], [14, 30]]) {
    if (world.blocked[idx(x, y)] < 0 && getG(x, y) !== 'path') world.objects[idx(x, y)] = makeObj('lamp');
  }

  const nearRoad = (x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const g = getG(x + dx, y + dy);
      if (g === 'path' || g === 'cobble') return true;
    }
    return false;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y);
      if (getG(x, y) !== 'grass' || world.objects[i] || world.blocked[i] >= 0 || nearRoad(x, y) || nearStructure(world, x, y, 1)) continue;
      const edge = Math.min(x, y, w - 1 - x, h - 1 - y);
      const dense = edge < 2 ? 0.7 : edge < 3 ? 0.35 : 0.06;
      const v = r();
      if (v < dense) world.objects[i] = makeObj('tree', (r() < 0.5 ? 0 : r() < 0.5 ? 2 : 1) * 3 + Math.floor(r() * 3), 5);else
      if (v < dense + 0.05) world.objects[i] = makeObj('bush', Math.floor(r() * 2), 2);
    }
  }
  scatterDecor(world, r, 0.2, 0.45);
  return world;
}