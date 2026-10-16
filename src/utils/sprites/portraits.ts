import { getShared } from './bank';

const cache = new Map<string, string>();

export function getPortraitUrl(npcId: string): string {
  let u = cache.get(npcId);
  if (!u) {
    const frames = getShared().npcs[npcId];
    u = frames ? frames.down[0].toDataURL() : '';
    cache.set(npcId, u);
  }
  return u;
}