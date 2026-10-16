import type { Crop, Prompt, WorldObject } from '../../types/game';
import type { FarmGame, InputState, Target } from './FarmGame';
import { REACH, TILE } from './constants';
import { inBounds, isWater, makeObj } from './world';
import { getCrop, getItem, isSellable } from '../items';
import { fishList } from '../../data/fish';
import { processing } from '../../data/recipes';
import { animalNear, hitMonsters, npcDef, npcNear } from './entities';
import { giveGift, talkTo } from './social';
import { shipSlot } from './economy';

export const DIRV: Record<string, [number, number]> = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };

const DIRT = ['#8a6446', '#6b4a33', '#a07a55'];
const WOODC = ['#c08a58', '#7b5238', '#e4b880'];
const STONEC = ['#9aa0ad', '#6e7280', '#c9cdd6'];
const WATERC = ['#9fe0f6', '#5fb8e0', '#d8f6ff'];
const GREEN = ['#6ac84f', '#3f9a3f', '#a6e070'];
const SPARK = ['#fff3c4', '#ffd66b', '#ffffff'];
const ORE_DROP: Record<number, [string, number, number]> = { 3: ['quartz', 1, 2], 4: ['copper_ore', 1, 3], 5: ['iron_ore', 1, 2], 6: ['gold_ore', 1, 2], 7: ['amethyst', 1, 1] };
const ORE_COLOR: Record<number, string[]> = { 3: ['#e7d4ff', '#c9a8f5'], 4: ['#ff9a4a', '#ffd0a0'], 5: ['#e8f0ff', '#b8c8dc'], 6: ['#ffe066', '#fff3b0'], 7: ['#6ff6e2', '#c0fff4'] };

export function isMature(c: Crop): boolean {
  return c.age >= getCrop(c.id).days;
}

export function cropStage(c: Crop): number {
  const d = getCrop(c.id);
  if (c.age >= d.days) return 4;
  return Math.min(3, Math.floor(c.age / d.days * 4));
}

function facePoint(g: FarmGame): [number, number] {
  const v = DIRV[g.player.dir];
  return [g.player.x + v[0] * 13, g.player.y - 6 + v[1] * 13];
}

export function computeTarget(g: FarmGame, input: InputState): Target {
  const pl = g.player;
  if (input.mouseInside) {
    const wx = g.camX + input.mouseX / g.viewScale;
    const wy = g.camY + input.mouseY / g.viewScale;
    const tx = Math.floor(wx / TILE);
    const ty = Math.floor(wy / TILE);
    if (Math.hypot(tx * TILE + 8 - pl.x, ty * TILE + 8 - (pl.y - 6)) <= REACH) return { x: tx, y: ty, mouse: true };
  }
  const [fx, fy] = facePoint(g);
  return { x: Math.floor(fx / TILE), y: Math.floor(fy / TILE), mouse: false };
}

export function lineTiles(g: FarmGame, tx: number, ty: number, tool: string): {x: number;y: number;}[] {
  const lvl = tool === 'hoe' ? g.upgrades.hoe : tool === 'can' ? g.upgrades.can : 0;
  if (!lvl) return [{ x: tx, y: ty }];
  const v = DIRV[g.player.dir];
  return [0, 1, 2].map((k) => ({ x: tx + v[0] * k, y: ty + v[1] * k }));
}

function face(g: FarmGame, t: Target): void {
  if (!t.mouse) return;
  const dx = t.x * TILE + 8 - g.player.x;
  const dy = t.y * TILE + 8 - (g.player.y - 6);
  if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
  g.player.dir = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
}

function targetObj(g: FarmGame): {o: WorldObject;i: number;} | null {
  const t = g.target;
  if (!t || !inBounds(g.world, t.x, t.y)) return null;
  const i = t.y * g.world.w + t.x;
  const o = g.world.objects[i];
  return o ? { o, i } : null;
}

/** Things you can talk to / interact with take priority over tool use. */
function tryInteractables(g: FarmGame): boolean {
  const [fx, fy] = facePoint(g);
  const npc = npcNear(g, fx, fy, 16);
  if (npc) {
    const st = g.inv[g.selected];
    if (st && getItem(st.id).kind !== 'tool') giveGift(g, npc, g.selected);else
    talkTo(g, npc);
    return true;
  }
  const a = animalNear(g, fx, fy, 15);
  if (a) {
    if (a.ready) {
      const prod = a.kind === 'chicken' ? 'egg' : 'milk';
      if (g.addItem(prod, 1)) a.ready = false;
    } else if (!a.petted) {
      a.petted = true;
      a.mood = Math.min(100, a.mood + 15);
      g.particles.burst('spark', a.x, a.y - 16, 8, ['#ff8ab0', '#ffd0e0'], { speed: 16, up: 30, z: 2, life: 0.9 });
      g.toast(`摸了摸「${a.name}」，它看起来很开心`, 'good');
    } else g.toast(`「${a.name}」今天已经很满足了`, 'info');
    return true;
  }
  const t = g.target;
  if (!t || !inBounds(g.world, t.x, t.y)) return false;
  const w = g.world;
  const i = t.y * w.w + t.x;
  const c = w.crops[i];
  if (c && isMature(c)) {
    harvest(g, t.x, t.y);
    return true;
  }
  const o = w.objects[i];
  if (o && o.kind === 'jar') {
    useJar(g, o);
    return true;
  }
  if (w.blocked[i] >= 0) {
    useStructure(g, w.structures[w.blocked[i]].kind);
    return true;
  }
  return false;
}

function useStructure(g: FarmGame, kind: string): void {
  switch (kind) {
    case 'house':
      g.mode = 'sleep';
      break;
    case 'bin':
      shipSlot(g, g.selected);
      break;
    case 'store':
    case 'cart':
      g.mode = 'store';
      break;
    case 'smith':
      g.mode = 'smith';
      break;
    case 'tavern':
      g.mode = 'tavern';
      break;
    case 'board':
      g.mode = 'board';
      break;
    case 'coop':{
        const ready = g.animals.filter((a) => a.ready).length;
        g.toast(g.animals.length ? `鸡舍里住着 ${g.animals.length} 只动物，${ready} 份产物待收集` : '鸡舍还空着，去镇上的杂货铺买只小鸡吧', 'info');
        break;
      }
    case 'fountain':
      g.toast('你往喷泉里许了个愿……水面泛起了金色的光', 'good');
      break;
  }
  g.dirty = true;
}

function useJar(g: FarmGame, o: WorldObject): void {
  if (o.item && o.ready) {
    const out = processing[o.item];
    if (out && g.addItem(out, 1)) {
      o.item = null;
      o.ready = false;
      g.stats.processed++;
      g.checkGoals();
    }
    return;
  }
  if (o.item) {
    g.toast(`${getItem(o.item).name}正在腌制中，明早就好`, 'info');
    return;
  }
  const st = g.inv[g.selected];
  if (st && processing[st.id]) {
    o.item = st.id;
    o.ready = false;
    g.removeFromSlot(g.selected, 1);
    g.toast(`放入了${getItem(st.id).name}，明早变成${getItem(processing[st.id]).name}`, 'good');
  } else g.toast('手持作物、鸡蛋或牛奶，放进腌制罐加工', 'info');
}

export function interact(g: FarmGame): void {
  tryInteractables(g);
}

export function actWithSelected(g: FarmGame): void {
  const t = g.target;
  if (!t) return;
  const st = g.inv[g.selected];
  const def = st ? getItem(st.id) : null;
  if (!(def && def.kind === 'tool' && st && st.id === 'sword' && g.world.dark) && tryInteractables(g)) return;
  if (!st || !def) return;
  switch (def.kind) {
    case 'tool':
      if (g.energy <= 0) {
        g.toast('太累了……先吃点东西或回家休息吧', 'warn');
        return;
      }
      face(g, t);
      if (st.id === 'rod') {
        startCast(g);
        return;
      }
      if (g.world.id === 'town' && (st.id === 'hoe' || st.id === 'axe' || st.id === 'pickaxe')) {
        g.toast('这里是小镇的公共区域，别乱挖哦', 'info');
        return;
      }
      g.player.action = { tool: st.id, t: 0, dur: st.id === 'can' ? 0.36 : st.id === 'sword' ? 0.24 : 0.3, tx: t.x, ty: t.y, applied: false };
      return;
    case 'seed':
      plant(g, t.x, t.y);
      return;
    case 'placeable':
      place(g, t.x, t.y);
      return;
    case 'food':
      g.eatSlot(g.selected);
      return;
    default:
      return;
  }
}

export function stepAction(g: FarmGame, dt: number): void {
  const a = g.player.action;
  if (!a) return;
  a.t += dt;
  if (!a.applied && a.t >= a.dur * 0.55) {
    a.applied = true;
    applyTool(g, a.tool, a.tx, a.ty);
  }
  if (a.t >= a.dur) g.player.action = null;
}

function hoeTile(g: FarmGame, x: number, y: number): boolean {
  const w = g.world;
  if (!inBounds(w, x, y) || w.id !== 'farm') return false;
  const i = y * w.w + x;
  const o = w.objects[i];
  if (o) {
    if (o.kind !== 'weed') return false;
    w.objects[i] = null;
    g.particles.burst('chip', x * TILE + 8, y * TILE + 10, 8, GREEN);
    if (Math.random() < 0.1) g.addItem(Math.random() < 0.5 ? 'seed_turnip' : 'seed_pepper', 1);
    return true;
  }
  if (w.crops[i] || w.blocked[i] >= 0 || w.tilled[i]) return false;
  const gr = w.ground[i];
  if (gr !== 'grass' && gr !== 'path') return false;
  w.tilled[i] = 1;
  if (g.weather === 'rain') w.watered[i] = 1;
  g.stats.tilled++;
  g.particles.burst('chip', x * TILE + 8, y * TILE + 10, 7, DIRT, { speed: 26, up: 50 });
  return true;
}

function waterTile(g: FarmGame, x: number, y: number): boolean {
  const w = g.world;
  if (!inBounds(w, x, y) || g.canWater <= 0) return false;
  const i = y * w.w + x;
  if (!w.tilled[i] || w.watered[i]) return false;
  w.watered[i] = 1;
  g.canWater--;
  g.stats.watered++;
  g.particles.burst('drop', x * TILE + 8, y * TILE + 8, 6, WATERC, { speed: 20, up: 30, z: 10 });
  return true;
}

function maybeLadder(g: FarmGame, i: number): void {
  const w = g.world;
  if (!w.dark || g.ladderSpawned) return;
  const rocks = w.objects.reduce((n, o) => n + (o && o.kind === 'rock' ? 1 : 0), 0);
  if (rocks === 0 || Math.random() < 0.07 + 0.6 / (rocks + 1)) {
    w.objects[i] = makeObj('ladder', 0);
    g.ladderSpawned = true;
    g.toast('发现了通往下一层的梯子！', 'good');
  }
}

function applyTool(g: FarmGame, tool: string, tx: number, ty: number): void {
  const w = g.world;
  let cost = 0;
  const cx = tx * TILE + 8;
  const cy = ty * TILE + 10;
  if (tool === 'sword') {
    cost = 1;
    const v = DIRV[g.player.dir];
    const hx = g.player.x + v[0] * 14;
    const hy = g.player.y - 6 + v[1] * 14;
    const dmg = Math.round(12 * (1 + 0.7 * g.upgrades.sword) + Math.random() * 5);
    hitMonsters(g, hx, hy, dmg);
    g.particles.burst('mote', hx, hy, 4, ['#ffffff'], { speed: 30, up: 0, z: 6, life: 0.25 });
    const ti = Math.floor(hy / TILE) * w.w + Math.floor(hx / TILE);
    const o = w.objects[ti];
    if (o && o.kind === 'weed') {
      w.objects[ti] = null;
      g.particles.burst('chip', hx, hy, 8, GREEN);
    }
  } else if (inBounds(w, tx, ty)) {
    const i = ty * w.w + tx;
    const o = w.objects[i];
    switch (tool) {
      case 'hoe':
        cost = 2;
        for (const t of lineTiles(g, tx, ty, tool)) hoeTile(g, t.x, t.y);
        break;
      case 'can':{
          if (isWater(w, tx, ty)) {
            g.canWater = g.canMax;
            g.particles.burst('drop', cx, cy, 12, WATERC, { speed: 30, up: 70 });
            g.particles.spawn('ripple', cx, cy, { life: 0.8 });
            g.toast('水壶灌满了', 'good');
            break;
          }
          if (g.canWater <= 0) {
            g.toast('水壶空了 — 对着水面使用来灌满', 'warn');
            break;
          }
          cost = 1;
          let any = false;
          for (const t of lineTiles(g, tx, ty, tool)) any = waterTile(g, t.x, t.y) || any;
          if (!any) g.particles.burst('drop', cx, cy, 4, WATERC, { speed: 15, up: 25, z: 10 });
          break;
        }
      case 'axe':{
          cost = 3;
          if (!o) break;
          const dmg = 1 + g.upgrades.axe;
          if (o.kind === 'tree') {
            o.hp -= dmg;
            o.shake = g.elapsed + 0.3;
            g.particles.burst('chip', cx, cy, 6, WOODC, { speed: 36 });
            if (o.hp <= 0) {
              w.objects[i] = makeObj('stump', o.variant, 3);
              const n = 4 + Math.floor(Math.random() * 3);
              g.addItem('wood', n);
              g.stats.wood += n;
              g.particles.burst('leaf', cx, cy, 16, g.leafColors(), { speed: 40, up: 40, z: 30, life: 2.5 });
            }
          } else if (o.kind === 'stump' || o.kind === 'bush') {
            o.hp -= dmg;
            o.shake = g.elapsed + 0.3;
            g.particles.burst('chip', cx, cy, 6, o.kind === 'bush' ? GREEN : WOODC, { speed: 30 });
            if (o.hp <= 0) {
              w.objects[i] = null;
              const n = o.kind === 'stump' ? 2 : 1;
              g.addItem('wood', n);
              g.stats.wood += n;
            }
          } else if (o.kind === 'weed') {
            w.objects[i] = null;
            g.particles.burst('chip', cx, cy, 8, GREEN);
          }
          break;
        }
      case 'pickaxe':{
          cost = 3;
          const dmg = 1 + g.upgrades.pickaxe;
          if (o && (o.kind === 'rock' || o.kind === 'crystal')) {
            o.hp -= dmg;
            o.shake = g.elapsed + 0.25;
            const ore = o.kind === 'crystal' ? ORE_COLOR[o.variant ? 7 : 3] : ORE_COLOR[o.variant];
            g.particles.burst('chip', cx, cy, 7, ore ? [...STONEC, ...ore] : STONEC, { speed: 40, up: 70 });
            if (o.hp <= 0) {
              w.objects[i] = null;
              if (o.kind === 'crystal') {
                g.addItem(o.variant ? 'amethyst' : 'quartz', 2);
                g.stats.ore += 2;
              } else {
                const drop = ORE_DROP[o.variant];
                if (drop) {
                  const n = drop[1] + Math.floor(Math.random() * (drop[2] - drop[1] + 1));
                  g.addItem(drop[0], n);
                  g.stats.ore += n;
                  g.particles.burst('spark', cx, cy - 4, 10, ORE_COLOR[o.variant], { speed: 30, up: 40 });
                }
                const n = 1 + Math.floor(Math.random() * 2);
                g.addItem('stone', n);
                g.stats.stone += n;
                maybeLadder(g, i);
              }
            }
          } else if (o && (o.kind === 'sprinkler' || o.kind === 'lamp' || o.kind === 'jar' && !o.item)) {
            w.objects[i] = null;
            g.addItem(o.kind, 1);
          } else if (o && o.kind === 'weed') {
            w.objects[i] = null;
            g.particles.burst('chip', cx, cy, 8, GREEN);
          } else if (!o && w.tilled[i] && !w.crops[i]) {
            w.tilled[i] = 0;
            w.watered[i] = 0;
            g.particles.burst('chip', cx, cy, 6, DIRT);
          }
          break;
        }
      case 'rod':
        cost = 2;
        g.fishing = { phase: 'wait', t: 1.8 + Math.random() * 3.5, bx: cx, by: ty * TILE + 8 };
        g.particles.spawn('ripple', cx, ty * TILE + 8, { life: 0.9 });
        g.particles.burst('drop', cx, ty * TILE + 8, 5, WATERC, { speed: 15, up: 40 });
        break;
    }
  }
  if (cost) {
    g.energy = Math.max(0, g.energy - cost);
    if (g.energy === 0) g.toast('体力耗尽了', 'warn');
  }
  g.checkGoals();
  g.dirty = true;
}

export function harvest(g: FarmGame, x: number, y: number): void {
  const w = g.world;
  const i = y * w.w + x;
  const c = w.crops[i];
  if (!c) return;
  const def = getCrop(c.id);
  const qty = def.yield[0] + Math.floor(Math.random() * (def.yield[1] - def.yield[0] + 1));
  if (!g.addItem(def.produceId, qty)) return;
  if (def.regrow) {
    c.age = def.days - def.regrow;
    c.harvests++;
  } else w.crops[i] = null;
  g.stats.harvested++;
  if (c.id === 'moonbloom') g.stats.moonbloom++;
  g.particles.burst('spark', x * TILE + 8, y * TILE + 4, 12, def.glow ? ['#c6f6ff', '#7de3ff', '#ffffff'] : SPARK, { speed: 26, up: 50, life: 0.8 });
  g.particles.burst('chip', x * TILE + 8, y * TILE + 10, 5, GREEN, { speed: 24 });
  g.checkGoals();
}

function plant(g: FarmGame, x: number, y: number): void {
  const w = g.world;
  if (!inBounds(w, x, y)) return;
  const i = y * w.w + x;
  const st = g.inv[g.selected];
  if (!st) return;
  const def = getItem(st.id);
  if (w.id !== 'farm') {
    g.toast('种子要种在自家农场里', 'info');
    return;
  }
  if (!w.tilled[i]) {
    g.toast('需要先用锄头翻土', 'info');
    return;
  }
  if (w.crops[i] || w.objects[i] || !def.cropId) return;
  w.crops[i] = { id: def.cropId, age: 0, harvests: 0 };
  g.removeFromSlot(g.selected, 1);
  g.stats.planted++;
  g.particles.burst('chip', x * TILE + 8, y * TILE + 10, 4, DIRT, { speed: 16, up: 30 });
  g.checkGoals();
}

function place(g: FarmGame, x: number, y: number): void {
  const w = g.world;
  if (!inBounds(w, x, y)) return;
  const i = y * w.w + x;
  const st = g.inv[g.selected];
  if (!st) return;
  if (w.id !== 'farm') {
    g.toast('设施只能放在自家农场里', 'info');
    return;
  }
  if (w.ground[i] === 'water' || w.objects[i] || w.crops[i] || w.blocked[i] >= 0) {
    g.toast('这里放不下', 'info');
    return;
  }
  const px = g.player.x;
  const py = g.player.y;
  if (px + 5 > x * TILE && px - 5 < x * TILE + TILE && py > y * TILE && py - 5 < y * TILE + TILE) {
    g.toast('站开一点再放置', 'info');
    return;
  }
  w.tilled[i] = 0;
  w.watered[i] = 0;
  w.objects[i] = makeObj(st.id === 'sprinkler' ? 'sprinkler' : st.id === 'jar' ? 'jar' : 'lamp');
  g.removeFromSlot(g.selected, 1);
  g.particles.burst('dust', x * TILE + 8, y * TILE + 12, 8, ['#d8c8a8', '#bfae90'], { speed: 30, up: 20 });
}

function startCast(g: FarmGame): void {
  const pl = g.player;
  const v = DIRV[pl.dir];
  const ptx = Math.floor(pl.x / TILE);
  const pty = Math.floor((pl.y - 4) / TILE);
  let found: {x: number;y: number;} | null = null;
  for (let d = 1; d <= 4; d++) {
    const x = ptx + v[0] * d;
    const y = pty + v[1] * d;
    if (isWater(g.world, x, y)) found = { x, y };else
    if (found) break;
  }
  if (!found) {
    g.toast('面朝水面才能抛竿', 'info');
    return;
  }
  pl.action = { tool: 'rod', t: 0, dur: 0.42, tx: found.x, ty: found.y, applied: false };
}

function pickFish(g: FarmGame): string {
  const h = g.time / 60 % 24;
  const night = h >= 19 || h < 6;
  const pool = fishList.filter((f) => (!f.night || night) && (!f.map || f.map === g.world.id));
  const weights = pool.map((f) => f.weight * (f.id === 'fish_koi' && g.weather === 'rain' ? 2.2 : 1));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let k = 0; k < pool.length; k++) {
    r -= weights[k];
    if (r <= 0) return pool[k].id;
  }
  return pool[0].id;
}

export function updateFishing(g: FarmGame, dt: number, input: InputState): void {
  const f = g.fishing;
  if (!f) return;
  f.t -= dt;
  if (input.usePressed || input.interactPressed) {
    if (f.phase === 'bite') {
      g.fishingFish = pickFish(g);
      g.mode = 'fishing';
    } else g.toast('收回了鱼线', 'info');
    g.fishing = null;
    g.dirty = true;
    return;
  }
  if (Math.random() < dt * 0.8) g.particles.spawn('ripple', f.bx, f.by + 1, { life: 0.7 });
  if (f.phase === 'wait' && f.t <= 0) {
    f.phase = 'bite';
    f.t = 1.0;
    g.particles.burst('drop', f.bx, f.by, 6, WATERC, { speed: 20, up: 50 });
    g.particles.spawn('ripple', f.bx, f.by, { life: 0.6 });
    g.dirty = true;
  } else if (f.phase === 'bite' && f.t <= 0) {
    g.fishing = null;
    g.toast('鱼溜走了……', 'warn');
  }
}

export function computePrompt(g: FarmGame): Prompt | null {
  if (g.fishing) return g.fishing.phase === 'bite' ? { key: '空格', text: '上钩了！快收线' } : { key: '空格', text: '收回鱼线' };
  const st = g.inv[g.selected];
  const [fx, fy] = facePoint(g);
  const npc = npcNear(g, fx, fy, 16);
  if (npc) {
    const name = npcDef(npc.id).name;
    if (st && getItem(st.id).kind !== 'tool') return { key: 'E', text: npc.gifted ? `和${name}聊聊` : `把${getItem(st.id).name}送给${name}` };
    return { key: 'E', text: `和${name}聊聊` };
  }
  const a = animalNear(g, fx, fy, 15);
  if (a) return { key: 'E', text: a.ready ? `收集${a.kind === 'chicken' ? '鸡蛋' : '牛奶'}` : a.petted ? `「${a.name}」很开心` : `抚摸「${a.name}」` };
  const t = g.target;
  const w = g.world;
  if (!t || !inBounds(w, t.x, t.y)) return null;
  const i = t.y * w.w + t.x;
  const c = w.crops[i];
  if (c && isMature(c)) return { key: 'E', text: `收获 ${getCrop(c.id).name}` };
  const o = w.objects[i];
  if (o && o.kind === 'jar') {
    if (o.item && o.ready) return { key: 'E', text: `取出${getItem(processing[o.item]).name}` };
    if (o.item) return { key: 'E', text: '腌制中……' };
    if (st && processing[st.id]) return { key: 'E', text: `放入${getItem(st.id).name}` };
    return { key: 'E', text: '腌制罐 · 手持作物放入' };
  }
  const si = w.blocked[i];
  if (si >= 0) {
    const labels: Record<string, string> = {
      house: '回家休息',
      store: '进入杂货铺',
      cart: '看看种子摊',
      smith: '进入铁匠铺',
      tavern: '进入灯湖酒馆',
      board: '查看委托板',
      coop: '查看鸡舍',
      fountain: '许个愿'
    };
    const kind = w.structures[si].kind;
    if (kind === 'bin') return st && isSellable(st.id) ? { key: 'E', text: `出货 ${getItem(st.id).name} ×${st.qty}` } : { key: 'E', text: '出货箱 · 手持要卖的物品' };
    if (labels[kind]) return { key: 'E', text: labels[kind] };
  }
  if (!st) return null;
  if (st.id === 'can' && w.ground[i] === 'water') return { key: '空格', text: '灌满水壶' };
  const def = getItem(st.id);
  if (def.kind === 'food') return { key: '空格', text: `食用 ${def.name}` };
  return null;
}