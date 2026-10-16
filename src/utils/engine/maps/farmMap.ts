import type { Ground, World, WorldObject } from '../../../types/game';
import { FARM_RECT, MAP_H, MAP_NAMES, MAP_W } from '../constants';
import { addStructure, emptyWorld, inBounds, inFarm, makeObj, scatterDecor } from '../world';
import { rng } from '../../noise';

export function createFarm(seed: number): World {
  const w = MAP_W;
  const h = MAP_H;
  const r = rng(seed);
  const world = emptyWorld('farm', MAP_NAMES.farm, w, h, seed, false, 'grass');
  const idx = (x: number, y: number) => y * w + x;
  const setG = (x: number, y: number, g: Ground) => {
    if (inBounds(world, x, y)) world.ground[idx(x, y)] = g;
  };
  const getG = (x: number, y: number): Ground => inBounds(world, x, y) ? world.ground[idx(x, y)] : 'grass';

  const riverX: number[] = [];
  const ph = seed % 7 * 0.9;
  for (let y = 0; y < h; y++) {
    const cx = w - 10 + Math.sin(y * 0.17 + ph) * 2.2 + Math.sin(y * 0.071 + 1.3) * 1.6;
    riverX.push(cx);
    const half = 1.6 + Math.sin(y * 0.29 + 0.5) * 0.5;
    for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) setG(x, y, 'water');
  }
  for (let y = 33; y < h; y++) {
    for (let x = 7; x <= 20; x++) {
      const dx = (x - 13.5) / 4.4;
      const dy = (y - 37.5) / 2.9;
      if (dx * dx + dy * dy + (r() - 0.5) * 0.25 < 1) setG(x, y, 'water');
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (getG(x, y) !== 'grass') continue;
      let near = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (getG(x + dx, y + dy) === 'water') near++;
      if (near > 0 && r() < 0.55 + near * 0.06) setG(x, y, 'sand');
    }
  }
  for (let x = 2; x < w; x++) for (const y of [10, 11]) setG(x, y, getG(x, y) === 'water' ? 'dock' : 'path');
  for (let y = 7; y <= 9; y++) {
    setG(7, y, 'path');
    setG(18, y, 'path');
  }
  setG(18, 12, 'path');

  addStructure(world, { kind: 'house', x: 5, y: 4, w: 5, h: 3 });
  addStructure(world, { kind: 'coop', x: 16, y: 4, w: 4, h: 3 });
  addStructure(world, { kind: 'bin', x: 10, y: 6, w: 2, h: 1 });
  world.warps.push({ x: w - 1, y: 10, w: 1, h: 2, to: 'town', tx: 1, ty: 15, dir: 'right' });

  const free = (x: number, y: number) => inBounds(world, x, y) && world.blocked[idx(x, y)] < 0 && !world.objects[idx(x, y)];
  const put = (x: number, y: number, o: WorldObject) => {
    if (free(x, y) && getG(x, y) === 'grass') world.objects[idx(x, y)] = o;
  };
  put(9, 9, makeObj('lamp'));
  put(22, 9, makeObj('lamp'));
  put(13, 9, makeObj('jar'));

  for (let y = FARM_RECT.y; y < FARM_RECT.y + FARM_RECT.h; y++) {
    for (let x = FARM_RECT.x; x < FARM_RECT.x + FARM_RECT.w; x++) {
      if (getG(x, y) !== 'grass') continue;
      const v = r();
      if (v < 0.1) put(x, y, makeObj('weed', Math.floor(r() * 3), 1));else
      if (v < 0.145) put(x, y, makeObj('rock', Math.floor(r() * 3), 2));else
      if (v < 0.16) put(x, y, makeObj('stump', Math.floor(r() * 9), 3));else
      if (v < 0.168) put(x, y, makeObj('tree', Math.floor(r() * 9), 5));
    }
  }
  for (let k = 0; k < 5; k++) put(FARM_RECT.x + Math.floor(r() * FARM_RECT.w), FARM_RECT.y + Math.floor(r() * FARM_RECT.h), makeObj('rock', 3, 4));

  const clear = (x: number, y: number) => x >= 3 && x <= 13 && y >= 2 && y <= 9 || x >= 14 && x <= 27 && y >= 2 && y <= 12;
  const nearPath = (x: number, y: number) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => {
    const g = getG(x + dx, y + dy);
    return g === 'path' || g === 'dock';
  });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (getG(x, y) !== 'grass' || !free(x, y) || inFarm(x, y) || clear(x, y) || nearPath(x, y)) continue;
      const edge = Math.min(x, y, w - 1 - x, h - 1 - y);
      const east = x > riverX[y] + 2;
      const dense = edge < 2 ? 0.75 : edge < 4 ? 0.45 : east ? 0.34 : 0.12;
      const v = r();
      if (v < dense) {
        const type = r() < 0.55 ? 0 : r() < 0.7 ? 1 : 2;
        put(x, y, makeObj('tree', type * 3 + Math.floor(r() * 3), 5));
      } else if (v < dense + 0.035) put(x, y, makeObj('bush', Math.floor(r() * 2), 2));else
      if (v < dense + 0.05) put(x, y, makeObj('rock', Math.floor(r() * 3), 2));
    }
  }
  scatterDecor(world, r, 0.09);
  return world;
}