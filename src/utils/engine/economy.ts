import type { AnimalKind, UpgradeId } from '../../types/game';
import type { FarmGame } from './FarmGame';
import { ANIMAL_CAP, TILE } from './constants';
import { animalOffers, smeltDefs, upgradeDefs } from '../../data/shop';
import { recipes } from '../../data/recipes';
import { getItem, isSellable } from '../items';
import { spawnAnimal } from './entities';

export function buy(g: FarmGame, id: string, qty: number): void {
  const def = getItem(id);
  if (!def.buy) return;
  if (g.money < def.buy * qty) {
    g.toast('金币不够', 'warn');
    return;
  }
  const added = g.addItem(id, qty);
  g.money -= def.buy * added;
}

export function buyAnimal(g: FarmGame, kind: AnimalKind): void {
  const offer = animalOffers.find((o) => o.kind === kind);
  if (!offer) return;
  if (g.animals.filter((a) => a.kind === kind).length >= ANIMAL_CAP[kind]) {
    g.toast('鸡舍已经住满了', 'warn');
    return;
  }
  if (g.money < offer.price) {
    g.toast('金币不够', 'warn');
    return;
  }
  g.money -= offer.price;
  const a = spawnAnimal(g, kind);
  g.toast(`${offer.name}「${a.name}」会在农场的鸡舍旁等你`, 'good');
}

export function nextUpgrade(g: FarmGame, id: UpgradeId) {
  return upgradeDefs.find((u) => u.id === id && u.level === g.upgrades[id] + 1) ?? null;
}

export function upgrade(g: FarmGame, id: UpgradeId): void {
  const u = nextUpgrade(g, id);
  if (!u) return;
  if (g.money < u.price || !u.bars.every((b) => g.countItem(b.id) >= b.qty)) {
    g.toast('金币或材料不够', 'warn');
    return;
  }
  g.money -= u.price;
  u.bars.forEach((b) => g.consumeItem(b.id, b.qty));
  g.upgrades[id] = u.level;
  if (id === 'can') {
    g.canMax = 80;
    g.canWater = 80;
  }
  g.toast(`老顾把它打磨成了「${u.name}」！`, 'good');
}

export function smelt(g: FarmGame, ore: string): void {
  const s = smeltDefs.find((d) => d.ore === ore);
  if (!s) return;
  if (g.countItem(ore) < s.qty || g.countItem('wood') < 1) {
    g.toast(`需要 ${s.qty} 块${getItem(ore).name}和 1 份木材`, 'warn');
    return;
  }
  g.consumeItem(ore, s.qty);
  g.consumeItem('wood', 1);
  g.addItem(s.bar, 1);
}

export function craft(g: FarmGame, recipeId: string): void {
  const r = recipes.find((x) => x.id === recipeId);
  if (!r) return;
  if (!r.inputs.every((s) => g.countItem(s.id) >= s.qty)) {
    g.toast('材料不足', 'warn');
    return;
  }
  r.inputs.forEach((s) => g.consumeItem(s.id, s.qty));
  g.addItem(r.output, r.qty);
  g.stats.crafted++;
  g.checkGoals();
}

export function shipSlot(g: FarmGame, slot: number): void {
  const st = g.inv[slot];
  if (!st || !isSellable(st.id)) {
    g.toast('手持想要出售的物品，再与出货箱互动', 'info');
    return;
  }
  g.shipped.push({ ...st });
  g.inv[slot] = null;
  g.toast(`放入出货箱：${getItem(st.id).name} ×${st.qty}，明早结算`, 'good');
  const bin = g.farm.structures.find((s) => s.kind === 'bin');
  if (bin) g.particles.burst('spark', bin.x * TILE + 16, bin.y * TILE + 2, 8, ['#fff3c4', '#ffd66b'], { speed: 20, up: 40 });
  g.dirty = true;
}

export function eatSlot(g: FarmGame, slot: number): void {
  const st = g.inv[slot];
  if (!st) return;
  const def = getItem(st.id);
  if (def.kind !== 'food') return;
  if (g.energy >= g.maxEnergy && g.hp >= g.maxHp && !def.buff) {
    g.toast('现在还不饿', 'info');
    return;
  }
  g.energy = Math.min(g.maxEnergy, g.energy + (def.energy ?? 0));
  g.hp = Math.min(g.maxHp, g.hp + (def.hp ?? 0));
  if (def.buff === 'speed') g.speedBuff = true;
  g.removeFromSlot(slot, 1);
  g.toast(`${def.name} 真好吃！${def.desc}`, 'good');
  g.particles.burst('spark', g.player.x, g.player.y - 18, 8, ['#d6ff9a', '#fff3c4'], { speed: 18, up: 30 });
}