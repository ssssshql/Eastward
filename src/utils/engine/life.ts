import type { Dir, MapId } from '../../types/game';
import type { FarmGame } from './FarmGame';
import { FARM_RECT, TILE } from './constants';
import { inBounds, isSolid, isWater, makeObj } from './world';
import { ambientAt } from './lighting';
import { getItem } from '../items';

export type CritterKind = 'bird' | 'duck' | 'butterfly';
export type EmoteKind = 'note' | 'dots' | 'heart' | 'excl' | 'zzz' | 'sweat';

export interface Critter {
  kind: CritterKind;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  t: number;
  flee: boolean;
  color: string;
  dir: 1 | -1;
}

export interface Emote {
  who: string;
  kind: EmoteKind;
  t: number;
}

export interface Visitor {
  id: 'wanderer' | 'cat';
  map: MapId;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  dir: Dir;
  moving: boolean;
  walkT: number;
  tx: number;
  ty: number;
  wait: number;
  talked: boolean;
  gifted: boolean;
}

export interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface LifeState {
  critters: Critter[];
  emotes: Emote[];
  wanderer: Visitor | null;
  cat: Visitor | null;
  meteors: Meteor[];
  greeted: string[];
  sawMeteor: boolean;
  timers: {critter: number;emote: number;meteor: number;};
}

export function createLife(): LifeState {
  return { critters: [], emotes: [], wanderer: null, cat: null, meteors: [], greeted: [], sawMeteor: false, timers: { critter: 0.5, emote: 3, meteor: 0 } };
}

const WANDERER_LINES = [
'……你也是从山那边来的？',
'这堆火是我今晚唯一的朋友。',
'雾谷的星星，比城里的亮多了。',
'别看我这样，年轻时我也种过地。',
'要是有口热乎的吃，就好了……',
'听说矿洞最深处，有一扇谁也打不开的门。',
'我明天大概就走了。风往哪儿吹，我就往哪儿去。'];

const WANDERER_GIFTS = ['seed_moonbloom', 'amethyst', 'gold_ore', 'fish_lantern', 'coffee', 'seed_melon', 'quartz'];
const BIRD_COLORS = ['#8a5a3a', '#5a6a8a', '#c8a060', '#6a4a3a'];
const BUTTERFLY_COLORS = ['#ffe070', '#ff9ac0', '#9ad0ff', '#ffffff', '#ffb050'];

function freeSpot(g: FarmGame, map: MapId, x0: number, y0: number, needRight: boolean): [number, number] | null {
  const w = map === 'farm' ? g.farm : g.town;
  for (let r = 0; r < 6; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const x = x0 + dx;
        const y = y0 + dy;
        if (!inBounds(w, x, y) || isSolid(w, x, y) || w.ground[y * w.w + x] === 'dock') continue;
        if (needRight && isSolid(w, x + 1, y)) continue;
        return [x, y];
      }
    }
  }
  return null;
}

function makeVisitor(id: Visitor['id'], map: MapId, x: number, y: number): Visitor {
  const px = x * TILE + 8;
  const py = y * TILE + 11;
  return { id, map, x: px, y: py, homeX: px, homeY: py, dir: 'down', moving: false, walkT: 0, tx: px, ty: py, wait: 2, talked: false, gifted: false };
}

/** Rolls who drops by today: the wandering stranger and a stray cat. */
export function rollVisitors(g: FarmGame, first = false): void {
  const L = g.life;
  L.wanderer = null;
  L.cat = null;
  L.greeted = [];
  if (first || Math.random() < 0.5) {
    const inTown = !first && Math.random() < 0.55;
    const spot = inTown ? freeSpot(g, 'town', 31, 26, true) : freeSpot(g, 'farm', 24, 8, true);
    if (spot) L.wanderer = makeVisitor('wanderer', inTown ? 'town' : 'farm', spot[0], spot[1]);
  }
  if (first || Math.random() < 0.6) {
    const spot = freeSpot(g, 'farm', 12, 8, false);
    if (spot) L.cat = makeVisitor('cat', 'farm', spot[0], spot[1]);
  }
}

export function onNewDay(g: FarmGame): void {
  const L = g.life;
  if (L.sawMeteor && Math.random() < 0.45) {
    for (let k = 0; k < 20; k++) {
      const x = FARM_RECT.x + Math.floor(Math.random() * FARM_RECT.w);
      const y = FARM_RECT.y + Math.floor(Math.random() * FARM_RECT.h);
      const i = y * g.farm.w + x;
      if (g.farm.ground[i] === 'grass' && !g.farm.objects[i] && !g.farm.crops[i] && !g.farm.tilled[i] && g.farm.blocked[i] < 0) {
        g.farm.objects[i] = makeObj('rock', 7, 3);
        g.toast('昨夜的流星落在了农场里，去找找那块发光的石头吧', 'good');
        break;
      }
    }
  }
  L.sawMeteor = false;
  rollVisitors(g);
}

export function emote(g: FarmGame, who: string, kind: EmoteKind): void {
  const L = g.life;
  L.emotes = L.emotes.filter((e) => e.who !== who);
  L.emotes.push({ who, kind, t: 2.2 });
}

export function visitorActive(g: FarmGame, v: Visitor | null): v is Visitor {
  if (!v || v.map !== g.world.id) return false;
  if (v.id === 'wanderer') {
    const h = g.time / 60;
    return h >= 7 && h < 23.5;
  }
  return g.time / 60 < 21;
}

export function visitorNear(g: FarmGame, px: number, py: number, r: number): Visitor | null {
  let best: Visitor | null = null;
  let bd = r;
  for (const v of [g.life.wanderer, g.life.cat]) {
    if (!visitorActive(g, v)) continue;
    const d = Math.hypot(v.x - px, v.y - 6 - py);
    if (d < bd) {
      bd = d;
      best = v;
    }
  }
  return best;
}

function openWandererDialog(g: FarmGame, text: string): void {
  g.dialog = { npc: 'wanderer', name: '阿墨', title: '流浪汉', text, hearts: 0 };
  g.mode = 'dialog';
  g.dirty = true;
}

export function interactVisitor(g: FarmGame, v: Visitor): void {
  const dx = g.player.x - v.x;
  const dy = g.player.y - v.y;
  v.dir = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
  if (v.id === 'cat') {
    if (v.gifted) {
      g.toast('小猫眯着眼睛打了个哈欠', 'info');
      return;
    }
    v.gifted = true;
    emote(g, 'cat', 'heart');
    g.particles.burst('spark', v.x, v.y - 12, 8, ['#ff8ab0', '#ffd0e0'], { speed: 16, up: 30, z: 2, life: 0.9 });
    if (Math.random() < 0.3) {
      g.addItem('fish_minnow', 1);
      g.toast('小猫蹭了蹭你的腿，还叼来一条小鱼', 'good');
    } else g.toast('小猫蹭了蹭你的腿，咕噜咕噜', 'good');
    return;
  }
  const st = g.inv[g.selected];
  if (st && getItem(st.id).kind === 'food' && !v.gifted) {
    v.gifted = true;
    g.removeFromSlot(g.selected, 1);
    const gift = WANDERER_GIFTS[Math.floor(Math.random() * WANDERER_GIFTS.length)];
    g.addItem(gift, 1);
    emote(g, 'wanderer', 'heart');
    openWandererDialog(g, `……${getItem(st.id).name}，还是热的。谢谢你。\n他从破旧的口袋里摸出一样东西塞给你：「${getItem(gift).name}」。`);
    return;
  }
  if (!v.talked) {
    v.talked = true;
    emote(g, 'wanderer', 'excl');
  }
  g.talkSeq++;
  const line = v.gifted ? '火烧得正旺。今晚能睡个好觉了。' : WANDERER_LINES[(g.day + g.talkSeq) % WANDERER_LINES.length];
  openWandererDialog(g, line);
}

function updateVisitor(g: FarmGame, v: Visitor, dt: number): void {
  if (v.id === 'wanderer') {
    const near = Math.hypot(g.player.x - v.x, g.player.y - v.y) < 44;
    if (near && g.world.id === v.map) {
      const dx = g.player.x - v.x;
      const dy = g.player.y - v.y;
      v.dir = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
      if (!g.life.greeted.includes('wanderer')) {
        g.life.greeted.push('wanderer');
        emote(g, 'wanderer', 'dots');
      }
    } else v.dir = 'down';
    return;
  }
  const w = g.farm;
  if (v.moving) {
    const dx = v.tx - v.x;
    const dy = v.ty - v.y;
    const d = Math.hypot(dx, dy);
    const s = 22 * dt;
    const nx = v.x + dx / Math.max(d, 0.01) * Math.min(s, d);
    const ny = v.y + dy / Math.max(d, 0.01) * Math.min(s, d);
    if (d < 1 || isSolid(w, Math.floor(nx / TILE), Math.floor((ny - 2) / TILE))) {
      v.moving = false;
      v.wait = 2 + Math.random() * 5;
    } else {
      v.x = nx;
      v.y = ny;
      v.walkT += dt;
      v.dir = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
    }
  } else {
    v.wait -= dt;
    if (v.wait <= 0) {
      v.tx = v.homeX + (Math.random() - 0.5) * 90;
      v.ty = v.homeY + (Math.random() - 0.5) * 50;
      v.moving = true;
      if (Math.random() < 0.25) emote(g, 'cat', Math.random() < 0.5 ? 'note' : 'zzz');
    }
  }
}

function updateCritters(g: FarmGame, dt: number, night: number): void {
  const L = g.life;
  const w = g.world;
  const pl = g.player;
  if (w.indoor || w.dark) {
    L.critters = [];
    return;
  }
  const season = g.season();
  L.timers.critter -= dt;
  if (L.timers.critter <= 0) {
    L.timers.critter = 0.9 + Math.random();
    if (L.critters.length < 12 && night < 0.55 && g.weather !== 'rain') {
      const x = g.camX + Math.random() * g.viewW;
      const y = g.camY + Math.random() * g.viewH;
      const tx = Math.floor(x / TILE);
      const ty = Math.floor(y / TILE);
      if (inBounds(w, tx, ty)) {
        const far = Math.hypot(x - pl.x, y - pl.y) > 60;
        if (isWater(w, tx, ty)) {
          if (L.critters.filter((c) => c.kind === 'duck').length < 3 && season !== 'winter' && w.id !== 'beach') L.critters.push({ kind: 'duck', x, y, z: 0, vx: (Math.random() - 0.5) * 8, vy: 0, t: Math.random() * 9, flee: false, color: '#ffffff', dir: 1 });
        } else if (!isSolid(w, tx, ty) && far) {
          const fly = (season === 'spring' || season === 'summer') && Math.random() < 0.45;
          if (fly) L.critters.push({ kind: 'butterfly', x, y, z: 8, vx: 0, vy: 0, t: Math.random() * 9, flee: false, color: BUTTERFLY_COLORS[Math.floor(Math.random() * BUTTERFLY_COLORS.length)], dir: 1 });else
          L.critters.push({ kind: 'bird', x, y, z: 0, vx: 0, vy: 0, t: Math.random() * 3, flee: false, color: BIRD_COLORS[Math.floor(Math.random() * BIRD_COLORS.length)], dir: Math.random() < 0.5 ? 1 : -1 });
        }
      }
    }
  }
  const keep: Critter[] = [];
  for (const c of L.critters) {
    c.t += dt;
    const dp = Math.hypot(c.x - pl.x, c.y - pl.y);
    if (c.kind === 'bird') {
      if (!c.flee && dp < 34) {
        c.flee = true;
        c.dir = c.x > pl.x ? 1 : -1;
        c.vx = c.dir * (50 + Math.random() * 30);
        c.vy = -15 - Math.random() * 15;
      }
      if (c.flee) {
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.z += 46 * dt;
      } else if (c.t > 1.2 + c.x % 1) {
        c.t = 0;
        if (Math.random() < 0.5) c.dir = c.dir === 1 ? -1 : 1;
        c.x += c.dir * 2;
      }
      if (c.z > 120) continue;
    } else if (c.kind === 'duck') {
      const sp = c.flee || dp < 26 ? 22 : 6;
      if (dp < 26) c.vx = (c.x > pl.x ? 1 : -1) * sp;else
      if (Math.random() < dt * 0.4) c.vx = (Math.random() - 0.5) * 12;
      if (Math.random() < dt * 0.3) c.vy = (Math.random() - 0.5) * 6;
      const nx = c.x + c.vx * dt;
      const ny = c.y + c.vy * dt;
      if (isWater(w, Math.floor(nx / TILE), Math.floor(ny / TILE)) && isWater(w, Math.floor((nx + c.vx * 0.4) / TILE), Math.floor(ny / TILE))) {
        c.x = nx;
        c.y = ny;
      } else {
        c.vx = -c.vx;
        c.vy = -c.vy;
      }
      if (Math.abs(c.vx) > 0.5) c.dir = c.vx > 0 ? 1 : -1;
      if (Math.random() < dt * 0.6) g.particles.spawn('ripple', c.x, c.y + 1, { life: 0.8 });
    } else {
      c.x += Math.sin(c.t * 1.3) * 14 * dt + Math.cos(c.t * 0.7) * 6 * dt;
      c.y += Math.cos(c.t * 1.1) * 8 * dt;
      c.z = 9 + Math.sin(c.t * 2.2) * 4;
      if (dp < 18) {
        c.x += (c.x - pl.x) * dt * 2;
        c.z += 4;
      }
      if (night > 0.6) continue;
    }
    if (c.x < g.camX - 160 || c.x > g.camX + g.viewW + 160 || c.y < g.camY - 160 || c.y > g.camY + g.viewH + 160) continue;
    keep.push(c);
  }
  L.critters = keep;
}

/** Everything that makes the valley feel inhabited: visitors, critters, chatter bubbles and shooting stars. */
export function updateLife(g: FarmGame, dt: number): void {
  const L = g.life;
  const { night } = ambientAt(g.displayTime(), g.weather);
  L.emotes = L.emotes.filter((e) => (e.t -= dt) > 0);
  L.meteors = L.meteors.filter((m) => {
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    return (m.life -= dt) > 0;
  });
  updateCritters(g, dt, night);
  if (g.mode === 'title') return;
  for (const v of [L.wanderer, L.cat]) if (visitorActive(g, v)) updateVisitor(g, v, dt);

  if (g.world.id === 'town') {
    const pl = g.player;
    for (const st of g.npcs) {
      if (!st.visible) continue;
      if (st.moving && Math.random() < dt * 3) g.particles.spawn('dust', st.x + (Math.random() - 0.5) * 6, st.y, { life: 0.4, vz: 12, z: 1, color: '#cdb89a' });
      const d = Math.hypot(pl.x - st.x, pl.y - st.y);
      if (!st.moving && st.path.length === 0 && d < 40) {
        const dx = pl.x - st.x;
        const dy = pl.y - st.y;
        st.dir = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
      }
      if (d < 36 && !L.greeted.includes(st.id)) {
        L.greeted.push(st.id);
        emote(g, st.id, st.friendship >= 200 ? 'heart' : 'excl');
      }
    }
  }

  L.timers.emote -= dt;
  if (L.timers.emote <= 0) {
    L.timers.emote = 3.5 + Math.random() * 4;
    const pool: string[] = [];
    if (g.world.id === 'town') for (const st of g.npcs) if (st.visible) pool.push(st.id);
    if (visitorActive(g, L.wanderer)) pool.push('wanderer');
    if (pool.length) {
      const who = pool[Math.floor(Math.random() * pool.length)];
      const h = g.time / 60;
      const kinds: EmoteKind[] = h > 21 ? ['zzz', 'dots', 'note'] : g.weather === 'rain' ? ['sweat', 'dots', 'note'] : ['note', 'dots', 'heart', 'note'];
      emote(g, who, kinds[Math.floor(Math.random() * kinds.length)]);
    }
  }

  if (!g.world.indoor && !g.world.dark && night > 0.75 && g.weather === 'clear') {
    L.timers.meteor -= dt;
    if (L.timers.meteor <= 0) {
      L.timers.meteor = 6 + Math.random() * 14;
      L.meteors.push({ x: g.camX + Math.random() * g.viewW * 0.8, y: g.camY + Math.random() * g.viewH * 0.35, vx: 170 + Math.random() * 60, vy: 60 + Math.random() * 30, life: 0.7 });
      if (!L.sawMeteor) {
        L.sawMeteor = true;
        g.toast('一颗流星划过夜空……许个愿吧', 'good');
      }
    }
  }
}