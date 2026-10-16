import type { NpcState } from '../../types/game';
import type { FarmGame } from './FarmGame';
import { HEART, MAX_HEARTS } from './constants';
import { npcDef } from './entities';
import { npcs, requestPool } from '../../data/npcs';
import { getItem } from '../items';

export function heartsOf(f: number): number {
  return Math.min(MAX_HEARTS, Math.floor(f / HEART));
}

function face(g: FarmGame, st: NpcState): void {
  const dx = g.player.x - st.x;
  const dy = g.player.y - st.y;
  st.dir = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
  st.path = [];
  st.moving = false;
  st.wait = 4;
}

function openDialog(g: FarmGame, st: NpcState, text: string): void {
  const def = npcDef(st.id);
  g.dialog = { npc: st.id, name: def.name, title: def.title, text, hearts: heartsOf(st.friendship) };
  g.mode = 'dialog';
  g.dirty = true;
}

function heartRewards(g: FarmGame, st: NpcState): string {
  const def = npcDef(st.id);
  let extra = '';
  for (const hg of def.heartGifts) {
    if (heartsOf(st.friendship) >= hg.hearts && !st.rewarded.includes(hg.hearts)) {
      st.rewarded.push(hg.hearts);
      g.addItem(hg.item, hg.qty);
      extra += `\n${hg.text}`;
    }
  }
  return extra;
}

export function talkTo(g: FarmGame, st: NpcState): void {
  const def = npcDef(st.id);
  face(g, st);
  let prefix = '';
  if (!st.talked) {
    st.talked = true;
    st.friendship = Math.min(MAX_HEARTS * HEART, st.friendship + 20);
  } else prefix = '';
  const pool = heartsOf(st.friendship) >= 3 ? [...def.lines, ...def.closeLines] : def.lines;
  g.talkSeq++;
  const seasonal = g.weather === 'rain' ? '外面雨好大，你也小心别着凉。' : g.weather === 'snow' ? '下雪了，整个镇子都安静下来了。' : null;
  const idx = (g.day * 3 + g.talkSeq + st.id.length) % (pool.length + (seasonal ? 1 : 0));
  const line = seasonal && idx === pool.length ? seasonal : pool[idx % pool.length];
  openDialog(g, st, prefix + line + heartRewards(g, st));
}

export function giveGift(g: FarmGame, st: NpcState, slot: number): void {
  const s = g.inv[slot];
  if (!s) return;
  const def = npcDef(st.id);
  const item = getItem(s.id);
  face(g, st);
  if (st.gifted) {
    openDialog(g, st, '今天已经收过你的礼物啦，明天再说吧。');
    return;
  }
  let delta = 20;
  let text = `谢谢，${item.name}……你真贴心。`;
  if (def.loves.includes(s.id)) {
    delta = 80;
    text = `${item.name}！这……是给我的吗？我最喜欢这个了！`;
  } else if (def.likes.includes(s.id)) {
    delta = 45;
    text = `是${item.name}呀，谢谢你，我很喜欢。`;
  } else if (def.hates.includes(s.id)) {
    delta = -30;
    text = '呃……这个你还是自己留着吧。';
  }
  g.removeFromSlot(slot, 1);
  st.gifted = true;
  if (!st.talked) {
    st.talked = true;
    delta += 20;
  }
  st.friendship = Math.max(0, Math.min(MAX_HEARTS * HEART, st.friendship + delta));
  g.stats.gifts++;
  if (delta > 0) g.particles.burst('spark', st.x, st.y - 26, 10, ['#ff8ab0', '#ffd0e0', '#ffffff'], { speed: 22, up: 40, z: 4, life: 1 });
  g.checkGoals();
  openDialog(g, st, text + heartRewards(g, st));
}

export function rollRequests(g: FarmGame): void {
  g.requests = g.requests.map((r) => ({ ...r, daysLeft: r.daysLeft - 1 })).filter((r) => r.daysLeft > 0);
  let tries = 0;
  while (g.requests.length < 3 && tries < 6) {
    tries++;
    if (g.requests.length >= 1 && Math.random() < 0.45) break;
    const pick = requestPool[Math.floor(Math.random() * requestPool.length)];
    if (g.requests.some((r) => r.item === pick.item)) continue;
    const npc = npcs[Math.floor(Math.random() * npcs.length)];
    const reward = Math.round((getItem(pick.item).sell * pick.qty * 1.7 + 80) / 10) * 10;
    g.requests.push({ id: ++g.entitySeq, npc: npc.id, item: pick.item, qty: pick.qty, reward, daysLeft: 3 });
  }
}

export function deliverRequest(g: FarmGame, id: number): void {
  const r = g.requests.find((x) => x.id === id);
  if (!r) return;
  if (g.countItem(r.item) < r.qty) {
    g.toast('物品数量不够', 'warn');
    return;
  }
  g.consumeItem(r.item, r.qty);
  g.money += r.reward;
  const st = g.npcs.find((n) => n.id === r.npc);
  if (st) st.friendship = Math.min(MAX_HEARTS * HEART, st.friendship + 60);
  g.requests = g.requests.filter((x) => x.id !== id);
  g.stats.requests++;
  g.toast(`委托完成！${npcDef(r.npc).name}送上了 ${r.reward} 金币`, 'good');
  g.checkGoals();
}