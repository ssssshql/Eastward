import type { Monster, World } from '../../../types/game';
import { MINE_H, MINE_W } from '../constants';
import { emptyWorld, makeObj } from '../world';
import { rng } from '../../noise';

export const MINE_SPAWN: [number, number] = [17, 21];

export function createMine(floor: number, seed: number): {world: World;monsters: Monster[];} {
  const w = MINE_W;
  const h = MINE_H;
  const r = rng(seed + floor * 7919);
  const world = emptyWorld('mine', `幽光矿洞 · 第 ${floor} 层`, w, h, seed + floor * 31, true, 'wall');
  world.floor = floor;
  const idx = (x: number, y: number) => y * w + x;
  let cells = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) cells[idx(x, y)] = r() < 0.56 ? 1 : 0;
  const [sx, sy] = MINE_SPAWN;
  for (let k = 0; k < 4; k++) {
    const next = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && cells[idx(x + dx, y + dy)]) n++;
        next[idx(x, y)] = n >= 5 || cells[idx(x, y)] && n >= 4 ? 1 : 0;
      }
    }
    cells = next;
  }
  for (let y = sy - 2; y <= sy + 2; y++) for (let x = sx - 2; x <= sx + 2; x++) cells[idx(x, y)] = 1;
  for (let y = 3; y <= sy; y++) cells[idx(sx + Math.round(Math.sin(y * 0.4) * 3), y)] = 1;

  const reach = new Uint8Array(w * h);
  const stack: number[] = [idx(sx, sy)];
  reach[idx(sx, sy)] = 1;
  while (stack.length) {
    const i = stack.pop() as number;
    const x = i % w;
    const y = Math.floor(i / w);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const j = idx(x + dx, y + dy);
      if (x + dx > 0 && y + dy > 0 && x + dx < w - 1 && y + dy < h - 1 && cells[j] && !reach[j]) {
        reach[j] = 1;
        stack.push(j);
      }
    }
  }
  const floorTiles: [number, number][] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (reach[idx(x, y)]) {
        world.ground[idx(x, y)] = 'cave';
        floorTiles.push([x, y]);
      }
    }
  }
  world.ground[idx(sx, sy + 1)] = 'cave';
  world.objects[idx(sx, sy + 1)] = makeObj('ladder', 1);
  world.warps.push({ x: sx, y: sy + 1, w: 1, h: 1, to: 'town', tx: 23, ty: 5, dir: 'down' });

  const farFromSpawn = (x: number, y: number, d: number) => Math.abs(x - sx) + Math.abs(y - sy) > d;
  const oreFor = (): number => {
    const v = r();
    if (floor >= 8 && v < 0.07) return 6;
    if (floor >= 4 && v < 0.16) return 5;
    if (v < 0.28) return 4;
    if (v < 0.32) return 3;
    if (floor >= 3 && v < 0.345) return 7;
    return Math.floor(r() * 3);
  };
  for (const [x, y] of floorTiles) {
    if (!farFromSpawn(x, y, 2)) continue;
    if (r() < 0.3) {
      const v = oreFor();
      world.objects[idx(x, y)] = makeObj('rock', v, (v >= 4 ? 3 : 2) + Math.floor(floor / 5));
    }
  }
  const pickEmpty = (minD: number): [number, number] | null => {
    for (let k = 0; k < 60; k++) {
      const [x, y] = floorTiles[Math.floor(r() * floorTiles.length)];
      if (!world.objects[idx(x, y)] && farFromSpawn(x, y, minD)) return [x, y];
    }
    return null;
  };
  for (let k = 0; k < 3; k++) {
    const p = pickEmpty(3);
    if (p) world.objects[idx(p[0], p[1])] = makeObj('crystal', k % 2, 3);
  }
  for (let k = 0; k < 4; k++) {
    const p = pickEmpty(2);
    if (p) world.objects[idx(p[0], p[1])] = makeObj('torch');
  }
  const torchSpawn = idx(sx - 2, sy - 1);
  if (!world.objects[torchSpawn]) world.objects[torchSpawn] = makeObj('torch');

  const monsters: Monster[] = [];
  const count = Math.min(10, 2 + floor);
  for (let k = 0; k < count; k++) {
    const p = pickEmpty(7);
    if (!p) continue;
    const bat = floor >= 4 && r() < 0.4;
    const max = bat ? 16 + floor * 3 : 22 + floor * 4;
    monsters.push({ id: k + 1, kind: bat ? 'bat' : 'slime', x: p[0] * 16 + 8, y: p[1] * 16 + 12, vx: 0, vy: 0, hp: max, max, hurt: 0, cd: r() * 2, seed: r() * 100 });
  }
  return { world, monsters };
}