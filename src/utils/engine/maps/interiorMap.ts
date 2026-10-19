import type { MapId, World } from '../../../types/game';
import { rooms } from '../../../data/interiors';
import { emptyWorld, rebuildBlocked } from '../world';
import { BACK_ROWS } from '../../sprites/interiorGround';

/**
 * Builds a walk-in room for a building. The exit door sits in the middle of the front wall and warps
 * back to the tile just below the building's outside door.
 */
export function createInterior(key: string, outside: MapId, exitX: number, exitY: number, seed: number): World {
  const spec = rooms[key] ?? rooms.house;
  const { w, h } = spec;
  const world = emptyWorld('interior', spec.name, w, h, seed + key.length * 97, false, 'floor');
  world.indoor = true;
  world.style = spec.style;
  world.rugs = spec.rugs;
  const idx = (x: number, y: number) => y * w + x;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (y < BACK_ROWS || y === h - 1 || x === 0 || x === w - 1) world.ground[idx(x, y)] = 'wall';
    }
  }
  const door = Math.floor(w / 2);
  world.ground[idx(door, h - 1)] = 'floor';
  world.warps.push({ x: door, y: h - 1, w: 1, h: 1, to: outside, tx: exitX, ty: exitY, dir: 'down' });
  world.spawn = [door, h - 2];
  world.wake = spec.wake ?? [door, h - 3];
  for (const it of spec.items) {
    world.structures.push({ kind: 'furniture', x: it.x, y: it.y, w: it.w, h: it.h, prop: it.prop, use: it.use, label: it.label, note: it.note, npc: it.npc });
  }
  rebuildBlocked(world);
  return world;
}