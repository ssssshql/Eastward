import type { CropDef, ItemDef } from '../types/game';
import { items } from '../data/items';
import { crops } from '../data/crops';

const itemMap = new Map<string, ItemDef>(items.map((i) => [i.id, i]));
const cropMap = new Map<string, CropDef>(crops.map((c) => [c.id, c]));

export function getItem(id: string): ItemDef {
  return itemMap.get(id) ?? { id, name: id, kind: 'resource', sell: 0, desc: '' };
}

export function getCrop(id: string): CropDef {
  return cropMap.get(id) ?? crops[0];
}

export function isSellable(id: string): boolean {
  const d = getItem(id);
  return d.kind !== 'tool' && d.sell > 0;
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60 / 10) * 10;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}