import type { Animal, Crop, Decor, Ground, Request, Stack, Stats, Structure, UpgradeId, Warp, Weather, World, WorldObject } from '../../types/game';
import { MAP_NAMES } from './constants';
import { rebuildBlocked } from './world';

const KEY = 'mistvale-farm-save-v2';

export interface SaveData {
  v: 1;
  seed: number;
  w: number;
  h: number;
  ground: Ground[];
  tilled: number[];
  watered: number[];
  objects: (WorldObject | null)[];
  crops: (Crop | null)[];
  decor: Decor[];
  structures: Structure[];
  warps: Warp[];
  money: number;
  day: number;
  energy: number;
  weather: Weather;
  tomorrow: Weather;
  inv: (Stack | null)[];
  canWater: number;
  canMax: number;
  upgrades: Partial<Record<UpgradeId, number>>;
  stats: Partial<Stats>;
  goalsDone: string[];
  npcs?: {id: string;friendship: number;rewarded: number[];}[];
  animals?: Animal[];
  requests?: Request[];
}

export function writeSave(d: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {

    /* storage unavailable */}
}

export function readSave(): SaveData | null {
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return null;
    const d = JSON.parse(s) as SaveData;
    return d && d.v === 1 ? d : null;
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  try {
    return !!localStorage.getItem(KEY);
  } catch {
    return false;
  }
}

export function worldToSave(w: World): Pick<SaveData, 'seed' | 'w' | 'h' | 'ground' | 'tilled' | 'watered' | 'objects' | 'crops' | 'decor' | 'structures' | 'warps'> {
  return {
    seed: w.seed,
    w: w.w,
    h: w.h,
    ground: w.ground,
    tilled: Array.from(w.tilled),
    watered: Array.from(w.watered),
    objects: w.objects,
    crops: w.crops,
    decor: w.decor,
    structures: w.structures,
    warps: w.warps
  };
}

export function worldFromSave(d: SaveData): World {
  const n = d.w * d.h;
  const world: World = {
    id: 'farm',
    name: MAP_NAMES.farm,
    dark: false,
    indoor: false,
    floor: 0,
    w: d.w,
    h: d.h,
    seed: d.seed,
    ground: d.ground,
    tilled: Uint8Array.from(d.tilled),
    watered: Uint8Array.from(d.watered),
    objects: d.objects,
    crops: d.crops,
    structures: d.structures,
    warps: d.warps ?? [],
    blocked: new Int16Array(n).fill(-1),
    decor: d.decor,
    rugs: []
  };
  rebuildBlocked(world);
  return world;
}