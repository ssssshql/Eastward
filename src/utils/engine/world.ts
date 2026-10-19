import type { Ground, MapId, ObjKind, Structure, StructureKind, Weather, World, WorldObject } from '../../types/game';
import { FARM_RECT, TILE } from './constants';

export const ENTERABLE: StructureKind[] = ['house', 'coop', 'store', 'smith', 'tavern', 'cottage'];

export function inBounds(w: World, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < w.w && y < w.h;
}

export function inFarm(x: number, y: number): boolean {
  return x >= FARM_RECT.x && y >= FARM_RECT.y && x < FARM_RECT.x + FARM_RECT.w && y < FARM_RECT.y + FARM_RECT.h;
}

export function makeObj(kind: ObjKind, variant = 0, hp = 1): WorldObject {
  return { kind, variant, hp, shake: 0, age: 0 };
}

export function emptyWorld(id: MapId, name: string, w: number, h: number, seed: number, dark: boolean, fill: Ground): World {
  const n = w * h;
  return {
    id,
    name,
    dark,
    indoor: false,
    floor: 0,
    w,
    h,
    seed,
    ground: new Array<Ground>(n).fill(fill),
    tilled: new Uint8Array(n),
    watered: new Uint8Array(n),
    objects: new Array<WorldObject | null>(n).fill(null),
    crops: new Array(n).fill(null),
    structures: [],
    warps: [],
    blocked: new Int16Array(n).fill(-1),
    decor: [],
    rugs: []
  };
}

export function isSolid(w: World, x: number, y: number): boolean {
  if (!inBounds(w, x, y)) return true;
  const i = y * w.w + x;
  const g = w.ground[i];
  if (g === 'water' || g === 'wall') return true;
  if (w.blocked[i] >= 0) return true;
  const o = w.objects[i];
  return !!o && o.kind !== 'weed' && o.kind !== 'ladder';
}

export function isWater(w: World, x: number, y: number): boolean {
  return inBounds(w, x, y) && w.ground[y * w.w + x] === 'water';
}

export function rebuildBlocked(w: World): void {
  w.blocked.fill(-1);
  w.structures.forEach((s, si) => {
    if (s.walk) return;
    for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) if (inBounds(w, x, y)) w.blocked[y * w.w + x] = si;
  });
}

export function addStructure(w: World, s: Structure, ground: Ground = 'grass'): void {
  w.structures.push(s);
  for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) if (inBounds(w, x, y)) w.ground[y * w.w + x] = ground;
  rebuildBlocked(w);
}

export function warpAt(w: World, x: number, y: number) {
  return w.warps.find((wp) => x >= wp.x && x < wp.x + wp.w && y >= wp.y && y < wp.y + wp.h) ?? null;
}

export function nearStructure(w: World, x: number, y: number, pad: number): boolean {
  return w.structures.some((s) => x >= s.x - pad && x < s.x + s.w + pad && y >= s.y - pad && y < s.y + s.h + pad + 1);
}

export function interiorKey(s: Structure): string {
  return s.kind === 'cottage' ? `cottage${s.variant ?? 0}` : s.kind;
}

/** The door sits centred on the front wall; these are the footprint tiles that count as "the door". */
export function isDoorTile(s: Structure, x: number, y: number): boolean {
  if (!ENTERABLE.includes(s.kind) || y !== s.y + s.h - 1) return false;
  const half = s.w * TILE / 2;
  const lx = x - s.x;
  return lx >= Math.floor((half - 6) / TILE) && lx <= Math.floor((half + 5) / TILE);
}

export function scatterDecor(world: World, r: () => number, flowerChance: number, tuftChance = 0.5): void {
  for (let y = 0; y < world.h; y++) {
    for (let x = 0; x < world.w; x++) {
      const i = y * world.w + x;
      if (world.ground[i] !== 'grass' || world.objects[i] || world.blocked[i] >= 0) continue;
      const tufts = r() < tuftChance ? 1 + Math.floor(r() * 3) : 0;
      for (let k = 0; k < tufts; k++) world.decor.push({ x: x * 16 + 2 + r() * 12, y: y * 16 + 4 + r() * 11, kind: 'tuft', variant: Math.floor(r() * 4) });
      if (r() < flowerChance) world.decor.push({ x: x * 16 + 3 + r() * 10, y: y * 16 + 5 + r() * 9, kind: 'flower', variant: Math.floor(r() * 6) });
    }
  }
}

/** Overnight simulation for the farm: growth, drying, regrowth, processing and debris. */
export function advanceNight(world: World, weather: Weather, r: () => number): number {
  const n = world.w * world.h;
  let processed = 0;
  for (let i = 0; i < n; i++) {
    const c = world.crops[i];
    if (c) {
      if (world.watered[i]) c.age++;
    } else if (world.tilled[i] && !world.watered[i] && r() < 0.12) {
      world.tilled[i] = 0;
    }
    const o = world.objects[i];
    if (!o) continue;
    if (o.kind === 'stump') {
      o.age++;
      if (o.age >= 5 && !inFarm(i % world.w, Math.floor(i / world.w))) world.objects[i] = makeObj('tree', o.variant, 5);
    } else if (o.kind === 'jar' && o.item && !o.ready) {
      o.ready = true;
      processed++;
    }
  }
  world.watered.fill(0);
  if (weather === 'rain') for (let i = 0; i < n; i++) if (world.tilled[i]) world.watered[i] = 1;
  for (let i = 0; i < n; i++) {
    const o = world.objects[i];
    if (!o || o.kind !== 'sprinkler') continue;
    const x = i % world.w;
    const y = Math.floor(i / world.w);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!inBounds(world, x + dx, y + dy)) continue;
        const j = (y + dy) * world.w + x + dx;
        if (world.tilled[j]) world.watered[j] = 1;
      }
    }
  }
  const spawn = (count: number, make: () => WorldObject) => {
    for (let k = 0; k < count; k++) {
      const x = FARM_RECT.x + Math.floor(r() * FARM_RECT.w);
      const y = FARM_RECT.y + Math.floor(r() * FARM_RECT.h);
      const i = y * world.w + x;
      if (world.ground[i] === 'grass' && !world.objects[i] && !world.tilled[i] && !world.crops[i] && world.blocked[i] < 0) world.objects[i] = make();
    }
  };
  spawn(6, () => makeObj('weed', Math.floor(r() * 3), 1));
  spawn(2, () => makeObj('rock', r() < 0.25 ? 3 : Math.floor(r() * 3), 2));
  return processed;
}