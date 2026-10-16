import type { Animal, AnimalKind, NpcState } from '../../types/game';
import type { FarmGame } from './FarmGame';
import { PEN_RECT, TILE } from './constants';
import { isSolid } from './world';
import { TOWN_HUB } from './maps/townMap';
import { npcs } from '../../data/npcs';

const ANIMAL_NAMES: Record<AnimalKind, string[]> = {
  chicken: ['豆豆', '团子', '小花', '布丁', '芝麻', '奶黄'],
  cow: ['云朵', '奶糖', '可可', '棉花']
};

export function createNpcStates(): NpcState[] {
  return npcs.map((n) => ({
    id: n.id,
    x: n.home[0] * TILE + 8,
    y: n.home[1] * TILE + 12,
    dir: 'down',
    moving: false,
    walkT: 0,
    wait: 0,
    path: [],
    phase: '',
    visible: false,
    friendship: 0,
    talked: false,
    gifted: false,
    rewarded: []
  }));
}

export function npcDef(id: string) {
  return npcs.find((n) => n.id === id) ?? npcs[0];
}

export function resetNpcsForDay(g: FarmGame): void {
  for (const st of g.npcs) {
    const def = npcDef(st.id);
    st.talked = false;
    st.gifted = false;
    st.phase = '';
    st.path = [];
    st.visible = false;
    st.x = def.home[0] * TILE + 8;
    st.y = def.home[1] * TILE + 12;
  }
}

export function updateNpcs(g: FarmGame, dt: number): void {
  const h = g.time / 60;
  const town = g.town;
  for (const st of g.npcs) {
    const def = npcDef(st.id);
    let phase: string;
    let dest: [number, number];
    if (h < 7) {
      phase = 'sleep';
      dest = def.home;
    } else if (h < 17) {
      const rainy = g.weather !== 'clear' && st.id !== 'xiaoman';
      phase = rainy ? 'tavern' : 'work';
      dest = rainy ? def.evening : def.spot;
    } else if (h < 21.5) {
      phase = 'tavern';
      dest = def.evening;
    } else {
      phase = 'home';
      dest = def.home;
    }
    if (phase !== st.phase) {
      st.phase = phase;
      if (phase === 'sleep') {
        st.visible = false;
        st.path = [];
      } else {
        st.visible = true;
        st.path = [TOWN_HUB, dest];
      }
    }
    if (!st.visible) continue;
    if (st.path.length) {
      const [tx, ty] = st.path[0];
      const gx = tx * TILE + 8;
      const gy = ty * TILE + 12;
      const dx = gx - st.x;
      const dy = gy - st.y;
      const d = Math.hypot(dx, dy);
      if (d < 1.5) {
        st.path.shift();
      } else {
        const s = Math.min(d, 34 * dt);
        st.x += dx / d * s;
        st.y += dy / d * s;
        st.dir = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
        st.moving = true;
        st.walkT += dt;
      }
    } else {
      st.moving = false;
      if (phase === 'home') {
        st.visible = false;
        continue;
      }
      st.wait -= dt;
      if (st.wait <= 0) {
        st.wait = 3 + Math.random() * 5;
        const nx = dest[0] + Math.round((Math.random() - 0.5) * 3);
        const ny = dest[1] + Math.round((Math.random() - 0.5) * 2);
        if (!isSolid(town, nx, ny)) st.path = [[nx, ny]];else
        st.dir = (['down', 'left', 'right'] as const)[Math.floor(Math.random() * 3)];
      }
    }
  }
}

export function npcNear(g: FarmGame, px: number, py: number, r: number): NpcState | null {
  if (g.world.id !== 'town') return null;
  let best: NpcState | null = null;
  let bd = r;
  for (const st of g.npcs) {
    if (!st.visible) continue;
    const d = Math.hypot(st.x - px, st.y - 6 - py);
    if (d < bd) {
      bd = d;
      best = st;
    }
  }
  return best;
}

export function spawnAnimal(g: FarmGame, kind: AnimalKind): Animal {
  const names = ANIMAL_NAMES[kind];
  const used = g.animals.map((a) => a.name);
  const name = names.find((n) => !used.includes(n)) ?? names[0];
  const a: Animal = {
    id: ++g.entitySeq,
    kind,
    name,
    x: (PEN_RECT.x + 3 + Math.random() * 6) * TILE,
    y: (PEN_RECT.y + 1 + Math.random() * 2) * TILE + 12,
    dir: 'right',
    moving: false,
    walkT: 0,
    wait: 1,
    tx: 0,
    ty: 0,
    petted: false,
    ready: false,
    mood: 50
  };
  g.animals.push(a);
  return a;
}

export function updateAnimals(g: FarmGame, dt: number): void {
  if (g.world.id !== 'farm') return;
  const h = g.time / 60;
  for (const a of g.animals) {
    if (a.moving) {
      const dx = a.tx - a.x;
      const dy = a.ty - a.y;
      const d = Math.hypot(dx, dy);
      const sp = (a.kind === 'chicken' ? 20 : 12) * dt;
      const nx = a.x + dx / d * Math.min(sp, d);
      const ny = a.y + dy / d * Math.min(sp, d);
      if (d < 1 || isSolid(g.farm, Math.floor(nx / TILE), Math.floor((ny - 2) / TILE))) {
        a.moving = false;
        a.wait = 2 + Math.random() * 4;
      } else {
        a.x = nx;
        a.y = ny;
        a.walkT += dt;
        if (Math.abs(dx) > 0.5) a.dir = dx > 0 ? 'right' : 'left';
      }
    } else {
      a.wait -= dt;
      if (a.wait <= 0 && h < 20) {
        a.tx = (PEN_RECT.x + Math.random() * PEN_RECT.w) * TILE;
        a.ty = (PEN_RECT.y + Math.random() * PEN_RECT.h) * TILE + 10;
        a.moving = true;
      }
    }
  }
}

export function animalNear(g: FarmGame, px: number, py: number, r: number): Animal | null {
  if (g.world.id !== 'farm') return null;
  let best: Animal | null = null;
  let bd = r;
  for (const a of g.animals) {
    const d = Math.hypot(a.x - px, a.y - 5 - py);
    if (d < bd) {
      bd = d;
      best = a;
    }
  }
  return best;
}

function solidPx(g: FarmGame, x: number, y: number): boolean {
  return isSolid(g.world, Math.floor(x / TILE), Math.floor(y / TILE));
}

export function updateMonsters(g: FarmGame, dt: number): void {
  if (!g.world.dark) return;
  const pl = g.player;
  const fl = g.world.floor;
  for (const m of g.monsters) {
    m.hurt = Math.max(0, m.hurt - dt);
    m.cd -= dt;
    const dx = pl.x - m.x;
    const dy = pl.y - 6 - m.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    if (m.kind === 'slime') {
      if (m.cd <= 0) {
        if (dist < 120) {
          const s = 72 + fl * 3;
          m.vx = dx / dist * s;
          m.vy = dy / dist * s;
          m.cd = 0.8 + Math.random() * 0.6;
        } else {
          const a = Math.random() * Math.PI * 2;
          m.vx = Math.cos(a) * 30;
          m.vy = Math.sin(a) * 30;
          m.cd = 1.4 + Math.random();
        }
      }
      const k = Math.exp(-dt * 4.5);
      m.vx *= k;
      m.vy *= k;
      const nx = m.x + m.vx * dt;
      if (!solidPx(g, nx, m.y)) m.x = nx;else
      m.vx *= -0.5;
      const ny = m.y + m.vy * dt;
      if (!solidPx(g, m.x, ny)) m.y = ny;else
      m.vy *= -0.5;
    } else {
      const chase = dist < 150 ? 1 : 0.2;
      const t = g.elapsed * 5 + m.seed;
      const tvx = dx / dist * 58 * chase + Math.cos(t) * 30;
      const tvy = dy / dist * 58 * chase + Math.sin(t * 1.3) * 30;
      m.vx += (tvx - m.vx) * Math.min(1, dt * 2.5);
      m.vy += (tvy - m.vy) * Math.min(1, dt * 2.5);
      m.x = Math.max(16, Math.min(g.world.w * TILE - 16, m.x + m.vx * dt));
      m.y = Math.max(16, Math.min(g.world.h * TILE - 16, m.y + m.vy * dt));
    }
    if (dist < 11 && pl.invuln <= 0 && m.hurt <= 0) {
      g.damagePlayer(m.kind === 'slime' ? 8 + fl : 6 + fl, m.x, m.y);
    }
  }
}

export function hitMonsters(g: FarmGame, x: number, y: number, dmg: number): number {
  const pl = g.player;
  let hits = 0;
  for (const m of g.monsters) {
    const d = Math.hypot(m.x - x, m.y - y);
    if (d > 20) continue;
    hits++;
    m.hp -= dmg;
    m.hurt = 0.3;
    const kd = Math.max(1, Math.hypot(m.x - pl.x, m.y - pl.y));
    m.vx = (m.x - pl.x) / kd * 180;
    m.vy = (m.y - pl.y) / kd * 180;
    m.cd = Math.max(m.cd, 0.5);
    g.particles.burst('spark', m.x, m.y, 6, ['#ffffff', '#fff3c4'], { speed: 40, up: 30, z: 6 });
  }
  const dead = g.monsters.filter((m) => m.hp <= 0);
  if (dead.length) {
    g.monsters = g.monsters.filter((m) => m.hp > 0);
    for (const m of dead) {
      g.stats.monsters++;
      const cols = m.kind === 'slime' ? ['#5ee67a', '#a8ffb0', '#2fa850'] : ['#7a5aa0', '#3a2a58', '#c0a0e0'];
      g.particles.burst('chip', m.x, m.y, 14, cols, { speed: 50, up: 70, z: 6 });
      if (m.kind === 'slime') {
        if (Math.random() < 0.7) g.addItem('slime', 1);
        if (Math.random() < 0.15) g.addItem('copper_ore', 1);
      } else {
        if (Math.random() < 0.55) g.addItem('bat_wing', 1);
        if (Math.random() < 0.12) g.addItem('iron_ore', 1);
      }
    }
    g.checkGoals();
  }
  return hits;
}