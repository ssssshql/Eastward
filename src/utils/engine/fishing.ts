import type { FishResult } from '../../types/game';
import type { FarmGame, InputState } from './FarmGame';
import { TILE } from './constants';
import { isWater } from './world';
import { fishList } from '../../data/fish';
import { getItem } from '../items';

const DIRV: Record<string, [number, number]> = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const WATERC = ['#9fe0f6', '#5fb8e0', '#d8f6ff'];
const MAX_CAST = 5;
const TREASURE: [string, number][] = [['gold_ore', 2], ['quartz', 1], ['amethyst', 1], ['seed_moonbloom', 2], ['iron_ore', 3], ['coffee', 1], ['copper_bar', 1]];

function origin(g: FarmGame): [number, number] {
  return [Math.floor(g.player.x / TILE), Math.floor((g.player.y - 4) / TILE)];
}

/** True when there is open water within casting range in the facing direction. */
export function waterAhead(g: FarmGame): boolean {
  const v = DIRV[g.player.dir];
  const [px, py] = origin(g);
  for (let d = 1; d <= MAX_CAST; d++) if (isWater(g.world, px + v[0] * d, py + v[1] * d)) return true;
  return false;
}

/** Holding the use button with the rod raises it and starts the power meter, Stardew style. */
export function beginCharge(g: FarmGame): void {
  if (!waterAhead(g)) {
    g.toast('面朝水面才能抛竿', 'info');
    return;
  }
  g.casting = { power: 0, dir: 1 };
  g.dirty = true;
}

/** Power swings 0 → 1 → 0 while held; releasing throws the line that many tiles out. */
export function updateCasting(g: FarmGame, dt: number, input: InputState): void {
  const c = g.casting;
  if (!c) return;
  if (input.useHeld) {
    c.power += c.dir * dt * 1.15;
    if (c.power >= 1) {
      c.power = 1;
      c.dir = -1;
    } else if (c.power <= 0) {
      c.power = 0;
      c.dir = 1;
    }
    return;
  }
  g.casting = null;
  g.dirty = true;
  const v = DIRV[g.player.dir];
  const [px, py] = origin(g);
  const reach = 1 + Math.round(c.power * (MAX_CAST - 1));
  // Prefer the charged distance (falling back nearer), then reach just past it if the shore is wide.
  const order = [...Array.from({ length: reach }, (_, k) => reach - k), ...Array.from({ length: MAX_CAST - reach }, (_, k) => reach + 1 + k)];
  for (const d of order) {
    const x = px + v[0] * d;
    const y = py + v[1] * d;
    if (isWater(g.world, x, y)) {
      g.castPower = c.power;
      g.player.action = { tool: 'rod', t: 0, dur: 0.42, tx: x, ty: y, applied: false };
      return;
    }
  }
  g.toast('鱼线落在了岸上，再往水里抛远一点', 'info');
}

/** The bobber lands: start the wait. Schooling spots and long casts bring bites sooner. */
export function castLine(g: FarmGame, tx: number, ty: number): void {
  const cx = tx * TILE + 8;
  const cy = ty * TILE + 8;
  const spot = (g.world.spots ?? []).some(([sx, sy]) => Math.abs(sx - tx) <= 1 && Math.abs(sy - ty) <= 1);
  const wait = (1.6 + Math.random() * 3.6) * (spot ? 0.45 : 1) * (1 - g.castPower * 0.25);
  g.fishing = { phase: 'wait', t: wait, bx: cx, by: cy, power: g.castPower, spot };
  g.particles.spawn('ripple', cx, cy, { life: 0.9 });
  g.particles.burst('drop', cx, cy, 5, WATERC, { speed: 15, up: 40 });
}

function pickFish(g: FarmGame, power: number, spot: boolean): string {
  const h = g.time / 60 % 24;
  const night = h >= 19 || h < 6;
  const season = g.season();
  const map = g.world.id;
  const pool = fishList.filter((f) => f.maps.includes(map) && (!f.night || night) && (!f.seasons || f.seasons.includes(season)));
  if (!pool.length) return 'fish_minnow';
  const weights = pool.map((f) => f.weight * (f.rain && g.weather === 'rain' ? 2.4 : 1) * (1 + (power + (spot ? 0.5 : 0)) * f.difficulty));
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
      g.fishingFish = pickFish(g, f.power, f.spot);
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
    g.toast('鱼溜走了……下次浮漂一沉就收线', 'warn');
  }
}

/** Applies the outcome of the reel-in minigame: catch log, records, perfect bonus and treasure. */
export function resolveCatch(g: FarmGame, r: FishResult): void {
  const id = g.fishingFish;
  g.fishingFish = null;
  g.mode = 'play';
  if (r.success && id) {
    g.addItem(id, 1);
    g.stats.fish++;
    const prev = g.fishLog[id] ?? { count: 0, best: 0 };
    const first = prev.count === 0;
    const record = !first && r.size > prev.best;
    g.fishLog[id] = { count: prev.count + 1, best: Math.max(prev.best, r.size) };
    g.toast(`${first ? '新鱼种！' : ''}钓到了${getItem(id).name} · ${r.size} 厘米${record ? ' · 新纪录' : ''}`, 'good');
    if (r.perfect) {
      g.energy = Math.min(g.maxEnergy, g.energy + 8);
      g.toast('完美收线！体力 +8', 'good');
    }
    if (r.treasure) {
      const [item, qty] = TREASURE[Math.floor(Math.random() * TREASURE.length)];
      g.addItem(item, qty);
      g.toast(`宝箱里装着${getItem(item).name} ×${qty}`, 'good');
    }
    g.checkGoals();
  } else g.toast('鱼挣脱了……', 'warn');
  g.dirty = true;
}