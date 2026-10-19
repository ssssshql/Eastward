import type { Animal, Banner, DaySummary, Dialog, Dir, MapId, Mode, Monster, NpcState, PanelMode, Pickup, Player, Prompt, Request, Season, Stack, Stats, Structure, Toast, UiSnapshot, UpgradeId, Weather, World } from '../../types/game';
import { DAY_END, DAY_START, DAYS_PER_SEASON, HOTBAR_SIZE, INV_SIZE, MAP_NAMES, MAP_SUBS, MAX_STACK, MIN_PER_SEC, PLAYER_SPEED, SEASON_NAMES, SEASONS, TILE, TITLE_TIME } from './constants';
import { advanceNight, inBounds, interiorKey, isDoorTile, isSolid, warpAt } from './world';
import { createFarm } from './maps/farmMap';
import { createTown } from './maps/townMap';
import { createMine, MINE_SPAWN } from './maps/mineMap';
import { createInterior } from './maps/interiorMap';
import { ParticleSystem } from './particles';
import { actWithSelected, computePrompt, computeTarget, interact, stepAction, updateFishing } from './farmActions';
import { createNpcStates, resetNpcsForDay, spawnAnimal, updateAnimals, updateMonsters, updateNpcs } from './entities';
import { rollRequests } from './social';
import { eatSlot } from './economy';
import { hasSave, readSave, worldFromSave, worldToSave, writeSave } from './save';
import { updateAmbient, AmbientTimers } from './ambient';
import { createLife, LifeState, onNewDay, rollVisitors, updateLife, visitorNear } from './life';
import { findPath, neighbourGoals } from './pathfind';
import { animalNear, npcNear } from './entities';
import { isMature } from './farmActions';
import { REACH } from './constants';
import { getItem } from '../items';
import { goals } from '../../data/goals';
import { LEAF_PARTICLES } from '../sprites/nature';

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  useHeld: boolean;
  usePressed: boolean;
  interactPressed: boolean;
  mouseX: number;
  mouseY: number;
  mouseInside: boolean;
}

export interface FishingState {
  phase: 'wait' | 'bite';
  t: number;
  bx: number;
  by: number;
}

export interface Target {
  x: number;
  y: number;
  mouse: boolean;
}

interface PendingWarp {
  to: MapId;
  tx: number;
  ty: number;
  dir: Dir;
  floor?: number;
  key?: string;
}

export function emptyStats(): Stats {
  return { tilled: 0, watered: 0, planted: 0, harvested: 0, fish: 0, earned: 0, crafted: 0, wood: 0, stone: 0, moonbloom: 0, shipped: 0, monsters: 0, deepest: 0, gifts: 0, requests: 0, processed: 0, ore: 0 };
}

function starterInventory(): (Stack | null)[] {
  const inv: (Stack | null)[] = new Array(INV_SIZE).fill(null);
  ['hoe', 'can', 'axe', 'pickaxe', 'sword', 'rod'].forEach((id, i) => inv[i] = { id, qty: 1 });
  inv[6] = { id: 'seed_turnip', qty: 15 };
  inv[7] = { id: 'seed_pepper', qty: 5 };
  inv[8] = { id: 'ration', qty: 3 };
  return inv;
}

function spawnPlayer(x = 7, y = 8, dir: Dir = 'down'): Player {
  return { x: x * TILE + 8, y: y * TILE + 6, dir, moving: false, walkT: 0, action: null, invuln: 0, kx: 0, ky: 0 };
}

function rollWeather(season: Season): Weather {
  if (season === 'winter') return Math.random() < 0.35 ? 'snow' : 'clear';
  return Math.random() < 0.22 ? 'rain' : 'clear';
}

export class FarmGame {
  seed: number;
  farm: World;
  town: World;
  world: World;
  interiors = new Map<string, World>();
  monsters: Monster[] = [];
  npcs: NpcState[] = createNpcStates();
  animals: Animal[] = [];
  requests: Request[] = [];
  player: Player = spawnPlayer();
  inv: (Stack | null)[] = starterInventory();
  selected = 0;
  money = 500;
  day = 1;
  time = DAY_START;
  energy = 100;
  maxEnergy = 100;
  hp = 100;
  maxHp = 100;
  weather: Weather = 'clear';
  tomorrow: Weather = 'clear';
  canWater = 40;
  canMax = 40;
  upgrades: Record<UpgradeId, number> = { hoe: 0, can: 0, axe: 0, pickaxe: 0, sword: 0 };
  stats: Stats = emptyStats();
  goalsDone: string[] = [];
  todayGoals: string[] = [];
  shipped: Stack[] = [];
  mode: Mode = 'title';
  summary: DaySummary | null = null;
  dialog: Dialog | null = null;
  banner: Banner | null = null;
  toasts: Toast[] = [];
  pickups: Pickup[] = [];
  particles = new ParticleSystem();
  fishing: FishingState | null = null;
  fishingFish: string | null = null;
  camX = 0;
  camY = 0;
  viewW = 480;
  viewH = 270;
  viewScale = 3;
  elapsed = 0;
  fade = 0;
  hurtT = 0;
  target: Target | null = null;
  prompt: Prompt | null = null;
  dirty = true;
  passedOut = false;
  fainted = false;
  speedBuff = false;
  ladderSpawned = false;
  entitySeq = 0;
  talkSeq = 0;
  private pending: PendingWarp | null = null;
  private useCooldown = 0;
  private snapCam = true;
  private minuteBucket = -1;
  private seq = 0;
  private amb: AmbientTimers = { leaf: 0, smoke: 0, fly: 0, mote: 0, splash: 0, drip: 0 };
  life: LifeState = createLife();
  path: [number, number][] | null = null;
  pathGoal: {x: number;y: number;interact: boolean;} | null = null;
  private pathStuck = 0;

  constructor(seed = Math.floor(Math.random() * 1e9)) {
    this.seed = seed;
    this.farm = createFarm(seed);
    this.town = createTown(seed);
    this.world = this.farm;
    spawnAnimal(this, 'chicken');
    rollRequests(this);
    rollVisitors(this, true);
  }

  // ---------- tap to walk ----------
  /** Tap/click on the map: walk there, or walk next to the thing tapped and interact with it. */
  tapAt(sx: number, sy: number): void {
    if (this.mode !== 'play' || this.pending || this.player.action || this.fishing) return;
    const wx = this.camX + sx / this.viewScale;
    const wy = this.camY + sy / this.viewScale;
    const w = this.world;
    let tx = Math.floor(wx / TILE);
    let ty = Math.floor(wy / TILE);
    if (!inBounds(w, tx, ty)) return;
    let interactive = false;
    const being = visitorNear(this, wx, wy + 4, 14) ?? npcNear(this, wx, wy + 4, 14) ?? animalNear(this, wx, wy + 4, 14);
    if (being) {
      tx = Math.floor(being.x / TILE);
      ty = Math.floor((being.y - 3) / TILE);
      interactive = true;
    }
    const i = ty * w.w + tx;
    const crop = w.crops[i];
    const o = w.objects[i];
    const solid = isSolid(w, tx, ty);
    if (!interactive) interactive = solid || !!crop && isMature(crop) || !!o && o.kind === 'jar';
    const pl = this.player;
    const ptx = Math.floor(pl.x / TILE);
    const pty = Math.floor((pl.y - 3) / TILE);
    if (interactive && Math.abs(ptx - tx) + Math.abs(pty - ty) === 1 && Math.hypot(tx * TILE + 8 - pl.x, ty * TILE + 8 - (pl.y - 6)) <= REACH) {
      this.arrive({ x: tx, y: ty, interact: true });
      return;
    }
    const goals = interactive ? neighbourGoals(w, tx, ty) : new Set<number>([i]);
    if (!goals.size) return;
    const p = findPath(w, ptx, pty, goals);
    if (!p) {
      this.toast('那边过不去', 'info');
      return;
    }
    this.path = p;
    this.pathGoal = { x: tx, y: ty, interact: interactive };
    this.pathStuck = 0;
    if (!p.length) this.arrive(this.pathGoal);
  }

  cancelPath(): void {
    this.path = null;
    this.pathGoal = null;
  }

  private arrive(goal: {x: number;y: number;interact: boolean;}): void {
    this.cancelPath();
    if (!goal.interact) return;
    const pl = this.player;
    const dx = goal.x * TILE + 8 - pl.x;
    const dy = goal.y * TILE + 8 - (pl.y - 6);
    pl.dir = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
    this.target = computeTarget(this, { up: false, down: false, left: false, right: false, useHeld: false, usePressed: false, interactPressed: false, mouseX: 0, mouseY: 0, mouseInside: false });
    interact(this);
  }

  /** Converts the next waypoint into virtual stick input. */
  private pathInput(input: InputState, dt: number): InputState {
    const path = this.path;
    const pl = this.player;
    if (!path || !path.length) {
      if (this.pathGoal) this.arrive(this.pathGoal);
      return input;
    }
    const [wx, wy] = path[0];
    const gx = wx * TILE + 8;
    const gy = wy * TILE + 11;
    const dx = gx - pl.x;
    const dy = gy - pl.y;
    if (Math.abs(dx) < 1.6 && Math.abs(dy) < 1.6) {
      path.shift();
      this.pathStuck = 0;
      return this.pathInput(input, dt);
    }
    this.pathStuck += dt;
    if (this.pathStuck > 1.2) {
      this.cancelPath();
      return input;
    }
    return { ...input, left: dx < -1.2, right: dx > 1.2, up: dy < -1.2, down: dy > 1.2 };
  }

  season(): Season {
    return SEASONS[Math.floor((this.day - 1) / DAYS_PER_SEASON) % 4];
  }

  dayOfSeason(): number {
    return (this.day - 1) % DAYS_PER_SEASON + 1;
  }

  displayTime(): number {
    return this.mode === 'title' ? TITLE_TIME : this.time;
  }

  leafColors(): string[] {
    return LEAF_PARTICLES[this.season()];
  }

  // ---------- loop ----------
  update(rawDt: number, input: InputState): void {
    const dt = Math.min(rawDt, 0.05);
    this.elapsed += dt;
    this.hurtT = Math.max(0, this.hurtT - dt);
    this.particles.update(dt);
    updateAmbient(this, this.amb, dt);
    updateLife(this, dt);
    this.pruneFeeds();
    if (this.pending) {
      this.fade = Math.min(1, this.fade + dt * 5);
      if (this.fade >= 1) this.doWarp(this.pending);
    } else this.fade = Math.max(0, this.fade - dt * 3.5);
    if (this.mode === 'play' && !this.pending) this.updatePlay(dt, input);
    this.updateCamera(dt);
    const bucket = Math.floor(this.time / 10);
    if (bucket !== this.minuteBucket) {
      this.minuteBucket = bucket;
      this.dirty = true;
    }
    if (this.banner && this.elapsed - this.banner.key / 1000 > 3) {
      this.banner = null;
      this.dirty = true;
    }
  }

  private updatePlay(dt: number, input: InputState): void {
    this.time += dt * MIN_PER_SEC;
    if (this.time >= DAY_END) {
      this.sleep(true);
      return;
    }
    const pl = this.player;
    pl.invuln = Math.max(0, pl.invuln - dt);
    this.useCooldown -= dt;
    updateNpcs(this, dt);
    updateAnimals(this, dt);
    updateMonsters(this, dt);
    if (this.mode !== 'play') return;
    if (Math.abs(pl.kx) + Math.abs(pl.ky) > 2) {
      if (!this.blocked(pl.x + pl.kx * dt, pl.y)) pl.x += pl.kx * dt;
      if (!this.blocked(pl.x, pl.y + pl.ky * dt)) pl.y += pl.ky * dt;
      const k = Math.exp(-dt * 9);
      pl.kx *= k;
      pl.ky *= k;
    }
    this.target = computeTarget(this, input);
    if (pl.action) {
      stepAction(this, dt);
      pl.moving = false;
    } else if (this.fishing) {
      updateFishing(this, dt, input);
      pl.moving = false;
    } else {
      const manual = input.up || input.down || input.left || input.right;
      if (manual && this.path) this.cancelPath();
      const mv = this.path ? this.pathInput(input, dt) : input;
      this.move(dt, mv);
      if (mv.up && !this.world.indoor) this.tryDoor();
      if (input.usePressed || input.useHeld && this.useCooldown <= 0) {
        actWithSelected(this);
        this.useCooldown = this.inv[this.selected]?.id === 'sword' ? 0.26 : 0.34;
      }
      if (input.interactPressed && this.mode === 'play') interact(this);
    }
    this.checkWarp();
    const pr = computePrompt(this);
    const a = this.prompt ? this.prompt.key + this.prompt.text : '';
    const b = pr ? pr.key + pr.text : '';
    if (a !== b) {
      this.prompt = pr;
      this.dirty = true;
    }
  }

  /** Walking up into a door walks you inside, like Stardew. */
  private tryDoor(): void {
    const pl = this.player;
    const tx = Math.floor(pl.x / TILE);
    const ty = Math.floor((pl.y - 7) / TILE);
    if (!inBounds(this.world, tx, ty)) return;
    const si = this.world.blocked[ty * this.world.w + tx];
    if (si < 0) return;
    const s = this.world.structures[si];
    if (isDoorTile(s, tx, ty)) this.enterBuilding(s);
  }

  enterBuilding(s: Structure): void {
    this.requestWarp({ to: 'interior', key: interiorKey(s), tx: 0, ty: 0, dir: 'up' });
  }

  getInterior(key: string): World {
    let w = this.interiors.get(key);
    if (!w) {
      const outside = key === 'house' || key === 'coop' ? this.farm : this.town;
      const s = outside.structures.find((st) => st.kind !== 'furniture' && interiorKey(st) === key);
      const ex = s ? s.x + s.w / 2 - 0.5 : 7;
      const ey = s ? s.y + s.h : 8;
      w = createInterior(key, outside.id, ex, ey, this.seed);
      this.interiors.set(key, w);
    }
    return w;
  }

  private wakeInHouse(): void {
    const house = this.getInterior('house');
    this.world = house;
    const [wx, wy] = house.wake ?? [4, 4];
    this.player = spawnPlayer(wx, wy, 'down');
  }

  private checkWarp(): void {
    const pl = this.player;
    const tx = Math.floor(pl.x / TILE);
    const ty = Math.floor((pl.y - 3) / TILE);
    const wp = warpAt(this.world, tx, ty);
    if (wp) {
      if (wp.to === 'mine') {
        const start = Math.max(1, Math.floor(this.stats.deepest / 5) * 5);
        this.requestWarp({ to: 'mine', tx: 0, ty: 0, dir: 'up', floor: start });
      } else this.requestWarp({ to: wp.to, tx: wp.tx, ty: wp.ty, dir: wp.dir, key: wp.key });
      return;
    }
    const o = this.world.objects[ty * this.world.w + tx];
    if (this.world.dark && o && o.kind === 'ladder' && o.variant === 0) {
      this.requestWarp({ to: 'mine', tx: 0, ty: 0, dir: 'up', floor: this.world.floor + 1 });
    }
  }

  private requestWarp(p: PendingWarp): void {
    if (this.pending) return;
    this.pending = p;
    this.fishing = null;
    this.player.action = null;
    this.player.moving = false;
  }

  private doWarp(p: PendingWarp): void {
    this.pending = null;
    const fromIndoor = this.world.indoor;
    if (p.to === 'mine') {
      const floor = p.floor ?? 1;
      const m = createMine(floor, this.seed + this.day * 13);
      this.world = m.world;
      this.monsters = m.monsters;
      this.ladderSpawned = false;
      this.player = { ...spawnPlayer(MINE_SPAWN[0], MINE_SPAWN[1], 'up'), invuln: 1 };
      if (floor > this.stats.deepest) {
        this.stats.deepest = floor;
        this.checkGoals();
      }
      this.setBanner(`第 ${floor} 层`, floor % 5 === 0 ? '下次可以从这一层直接开始' : MAP_SUBS.mine);
    } else if (p.to === 'interior') {
      const w = this.getInterior(p.key ?? 'house');
      this.world = w;
      this.monsters = [];
      const [sx, sy] = w.spawn ?? [Math.floor(w.w / 2), w.h - 2];
      this.player = spawnPlayer(sx, sy, 'up');
    } else {
      const fromMap = this.world.id;
      this.world = p.to === 'farm' ? this.farm : this.town;
      this.monsters = [];
      this.player = spawnPlayer(p.tx, p.ty, p.dir);
      if (!fromIndoor || fromMap !== 'interior') this.setBanner(MAP_NAMES[p.to], MAP_SUBS[p.to]);
    }
    this.particles.list = [];
    this.life.critters = [];
    this.cancelPath();
    this.snapCam = true;
    this.dirty = true;
  }

  private setBanner(title: string, sub: string): void {
    this.banner = { key: Math.round(this.elapsed * 1000), title, sub };
    this.dirty = true;
  }

  damagePlayer(dmg: number, sx: number, sy: number): void {
    const pl = this.player;
    if (pl.invuln > 0) return;
    this.hp = Math.max(0, this.hp - dmg);
    pl.invuln = 0.9;
    const d = Math.max(1, Math.hypot(pl.x - sx, pl.y - sy));
    pl.kx = (pl.x - sx) / d * 170;
    pl.ky = (pl.y - sy) / d * 170;
    this.hurtT = 0.45;
    this.particles.burst('chip', pl.x, pl.y - 10, 8, ['#ff4a4a', '#ffb0a0'], { speed: 30, up: 40 });
    this.dirty = true;
    if (this.hp <= 0) {
      this.fainted = true;
      this.sleep(true);
    }
  }

  private move(dt: number, input: InputState): void {
    const pl = this.player;
    const mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    if (!mx && !my) {
      pl.moving = false;
      pl.walkT = 0;
      return;
    }
    const sp = PLAYER_SPEED * (this.speedBuff ? 1.3 : 1);
    const len = Math.hypot(mx, my);
    const dx = mx / len * sp * dt;
    const dy = my / len * sp * dt;
    if (mx && my) {
      const keep = pl.dir === 'left' && mx < 0 || pl.dir === 'right' && mx > 0 || pl.dir === 'up' && my < 0 || pl.dir === 'down' && my > 0;
      if (!keep) pl.dir = mx > 0 ? 'right' : 'left';
    } else pl.dir = mx > 0 ? 'right' : mx < 0 ? 'left' : my > 0 ? 'down' : 'up';
    if (!this.blocked(pl.x + dx, pl.y)) pl.x += dx;
    if (!this.blocked(pl.x, pl.y + dy)) pl.y += dy;
    pl.moving = true;
    pl.walkT += dt * (this.speedBuff ? 1.3 : 1);
    if (Math.random() < dt * 4 && !this.world.indoor) {
      this.particles.spawn('dust', pl.x + (Math.random() - 0.5) * 6, pl.y, { life: 0.45, vz: 14, z: 1, vx: -mx * 8, color: this.world.dark ? '#7a6a80' : this.season() === 'winter' ? '#eef3f8' : '#cdb89a' });
    }
  }

  private blocked(x: number, y: number): boolean {
    const x0 = Math.floor((x - 5) / TILE);
    const x1 = Math.floor((x + 5) / TILE);
    const y0 = Math.floor((y - 5) / TILE);
    const y1 = Math.floor((y - 1) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (isSolid(this.world, tx, ty)) return true;
    return false;
  }

  private updateCamera(dt: number): void {
    const mapW = this.world.w * TILE;
    const mapH = this.world.h * TILE;
    let tx: number;
    let ty: number;
    if (this.mode === 'title') {
      tx = 20 * TILE + Math.sin(this.elapsed * 0.05) * 150 - this.viewW / 2;
      ty = 17 * TILE + Math.sin(this.elapsed * 0.037) * 70 - this.viewH / 2;
    } else {
      tx = this.player.x - this.viewW / 2;
      ty = this.player.y - 14 - this.viewH / 2;
    }
    tx = mapW > this.viewW ? Math.min(Math.max(tx, 0), mapW - this.viewW) : (mapW - this.viewW) / 2;
    ty = mapH > this.viewH ? Math.min(Math.max(ty, 0), mapH - this.viewH) : (mapH - this.viewH) / 2;
    if (this.snapCam) {
      this.camX = tx;
      this.camY = ty;
      this.snapCam = false;
    } else {
      const k = 1 - Math.exp(-dt * (this.mode === 'title' ? 2 : 6));
      this.camX += (tx - this.camX) * k;
      this.camY += (ty - this.camY) * k;
    }
  }

  private pruneFeeds(): void {
    const now = this.elapsed;
    const t0 = this.toasts.length;
    const p0 = this.pickups.length;
    this.toasts = this.toasts.filter((t) => now - t.t < 3);
    this.pickups = this.pickups.filter((p) => now - p.t < 3.2);
    if (t0 !== this.toasts.length || p0 !== this.pickups.length) this.dirty = true;
  }

  // ---------- feedback ----------
  toast(text: string, tone: Toast['tone'] = 'info'): void {
    const last = this.toasts[this.toasts.length - 1];
    if (last && last.text === text && this.elapsed - last.t < 1.2) return;
    this.toasts = [...this.toasts.slice(-3), { id: ++this.seq, text, tone, t: this.elapsed }];
    this.dirty = true;
  }

  private pushPickup(id: string, qty: number): void {
    const ex = this.pickups.find((p) => p.id === id && this.elapsed - p.t < 2);
    if (ex) {
      ex.qty += qty;
      ex.t = this.elapsed;
    } else this.pickups = [...this.pickups.slice(-4), { key: ++this.seq, id, qty, t: this.elapsed }];
    this.dirty = true;
  }

  // ---------- inventory ----------
  addItem(id: string, qty: number): number {
    let left = qty;
    for (const s of this.inv) {
      if (s && s.id === id && s.qty < MAX_STACK) {
        const k = Math.min(left, MAX_STACK - s.qty);
        s.qty += k;
        left -= k;
        if (!left) break;
      }
    }
    for (let i = 0; i < this.inv.length && left > 0; i++) {
      if (!this.inv[i]) {
        const k = Math.min(left, MAX_STACK);
        this.inv[i] = { id, qty: k };
        left -= k;
      }
    }
    const added = qty - left;
    if (added > 0) this.pushPickup(id, added);
    if (left > 0) this.toast('背包满了！', 'warn');
    this.dirty = true;
    return added;
  }

  countItem(id: string): number {
    return this.inv.reduce((a, s) => a + (s && s.id === id ? s.qty : 0), 0);
  }

  consumeItem(id: string, qty: number): void {
    let left = qty;
    for (let i = this.inv.length - 1; i >= 0 && left > 0; i--) {
      const s = this.inv[i];
      if (s && s.id === id) {
        const k = Math.min(left, s.qty);
        s.qty -= k;
        left -= k;
        if (s.qty <= 0) this.inv[i] = null;
      }
    }
    this.dirty = true;
  }

  removeFromSlot(slot: number, qty: number): void {
    const s = this.inv[slot];
    if (!s) return;
    s.qty -= qty;
    if (s.qty <= 0) this.inv[slot] = null;
    this.dirty = true;
  }

  eatSlot(slot: number): void {
    eatSlot(this, slot);
  }

  selectSlot(i: number): void {
    if (i >= 0 && i < HOTBAR_SIZE) {
      this.selected = i;
      this.dirty = true;
    }
  }

  cycleSlot(d: number): void {
    this.selectSlot((this.selected + d + HOTBAR_SIZE) % HOTBAR_SIZE);
  }

  swapSlots(a: number, b: number): void {
    const t = this.inv[a];
    this.inv[a] = this.inv[b];
    this.inv[b] = t;
    this.dirty = true;
  }

  checkGoals(): void {
    for (const goal of goals) {
      if (this.goalsDone.includes(goal.id)) continue;
      if (this.stats[goal.stat] >= goal.target) {
        this.goalsDone.push(goal.id);
        this.todayGoals.push(goal.id);
        this.money += goal.reward;
        this.toast(`目标达成 · ${goal.title}  +${goal.reward} 金币`, 'good');
      }
    }
    this.dirty = true;
  }

  // ---------- panels & days ----------
  togglePanel(m: PanelMode): void {
    if (this.mode === m) this.mode = 'play';else
    if (this.mode === 'play' && !this.fishing && !this.player.action) this.mode = m;
    this.dirty = true;
  }

  closePanel(): void {
    if (this.mode === 'dialog') this.dialog = null;
    if (['store', 'smith', 'tavern', 'board', 'inventory', 'journal', 'villagers', 'sleep', 'dialog'].includes(this.mode)) this.mode = 'play';
    this.dirty = true;
  }

  finishFishing(success: boolean): void {
    const id = this.fishingFish;
    this.fishingFish = null;
    this.mode = 'play';
    if (success && id) {
      this.addItem(id, 1);
      this.stats.fish++;
      this.toast(`钓到了 ${getItem(id).name}！`, 'good');
      this.checkGoals();
    } else this.toast('鱼挣脱了……', 'warn');
    this.dirty = true;
  }

  sleep(passedOut: boolean): void {
    const agg = new Map<string, number>();
    for (const s of this.shipped) agg.set(s.id, (agg.get(s.id) ?? 0) + s.qty);
    const items = [...agg.entries()].map(([id, qty]) => ({ id, qty, total: qty * getItem(id).sell }));
    const total = items.reduce((a, b) => a + b.total, 0);
    let lost = 0;
    if (passedOut) {
      lost = Math.min(Math.floor(this.money * 0.1), 300);
      this.money -= lost;
    }
    this.money += total;
    this.stats.earned += total;
    this.stats.shipped += items.reduce((a, b) => a + b.qty, 0);
    this.checkGoals();
    this.summary = { day: this.day, season: this.season(), items, total, passedOut, fainted: this.fainted, lost, goals: [...this.todayGoals] };
    this.passedOut = passedOut;
    this.fishing = null;
    this.player.action = null;
    this.dialog = null;
    this.mode = 'summary';
    this.dirty = true;
  }

  continueDay(): void {
    const prev = this.season();
    this.day++;
    this.time = DAY_START;
    this.weather = this.tomorrow;
    this.tomorrow = rollWeather(this.season());
    const processed = advanceNight(this.farm, this.weather, Math.random);
    for (const a of this.animals) {
      if (a.petted) a.ready = true;else
      a.mood = Math.max(0, a.mood - 10);
      a.petted = false;
    }
    resetNpcsForDay(this);
    rollRequests(this);
    onNewDay(this);
    this.cancelPath();
    this.energy = this.passedOut ? Math.round(this.maxEnergy * 0.65) : this.maxEnergy;
    this.hp = this.fainted ? Math.round(this.maxHp * 0.6) : this.maxHp;
    this.fainted = false;
    this.speedBuff = false;
    this.shipped = [];
    this.todayGoals = [];
    this.summary = null;
    this.monsters = [];
    this.wakeInHouse();
    this.particles.list = [];
    this.mode = 'play';
    this.snapCam = true;
    if (this.season() !== prev) this.toast(`${SEASON_NAMES[this.season()]}天来了`, 'good');
    if (this.weather === 'rain') this.toast('下雨了 — 作物今天不用浇水', 'info');
    if (processed) this.toast(`腌制罐里的 ${processed} 份加工品做好了`, 'good');
    if (this.animals.some((a) => a.ready)) this.toast('动物们留下了礼物，去鸡舍旁看看吧', 'good');
    this.setBanner(`${SEASON_NAMES[this.season()]} · 第 ${this.dayOfSeason()} 天`, MAP_NAMES.farm);
    this.save();
    this.dirty = true;
  }

  startNewGame(): void {
    this.mode = 'play';
    this.time = DAY_START;
    this.wakeInHouse();
    this.snapCam = true;
    this.particles.list = [];
    this.setBanner(MAP_NAMES.farm, '春 · 第 1 天');
    this.toast('走出小屋，先翻土播种，再沿着东边的小路去灯湖镇看看吧', 'good');
    this.save();
    this.dirty = true;
  }

  continueSaved(): void {
    const d = readSave();
    if (!d) return;
    this.seed = d.seed;
    this.farm = worldFromSave(d);
    this.town = createTown(d.seed);
    this.interiors.clear();
    this.money = d.money;
    this.day = d.day;
    this.energy = d.energy;
    this.weather = d.weather;
    this.tomorrow = d.tomorrow;
    this.inv = [...d.inv, ...new Array(Math.max(0, INV_SIZE - d.inv.length)).fill(null)];
    this.canWater = d.canWater;
    this.canMax = d.canMax;
    this.upgrades = { hoe: 0, can: 0, axe: 0, pickaxe: 0, sword: 0, ...d.upgrades };
    this.stats = { ...emptyStats(), ...d.stats };
    this.goalsDone = d.goalsDone;
    if (d.npcs) {
      for (const st of this.npcs) {
        const s = d.npcs.find((x) => x.id === st.id);
        if (s) {
          st.friendship = s.friendship;
          st.rewarded = s.rewarded;
        }
      }
    }
    if (d.animals) this.animals = d.animals;
    if (d.requests) this.requests = d.requests;
    this.time = DAY_START;
    this.wakeInHouse();
    this.particles.list = [];
    this.mode = 'play';
    this.snapCam = true;
    this.setBanner(MAP_NAMES.farm, `欢迎回来 · ${SEASON_NAMES[this.season()]} 第 ${this.dayOfSeason()} 天`);
    this.dirty = true;
  }

  save(): void {
    writeSave({
      v: 1,
      ...worldToSave(this.farm),
      money: this.money,
      day: this.day,
      energy: this.energy,
      weather: this.weather,
      tomorrow: this.tomorrow,
      inv: this.inv,
      canWater: this.canWater,
      canMax: this.canMax,
      upgrades: this.upgrades,
      stats: this.stats,
      goalsDone: this.goalsDone,
      npcs: this.npcs.map((n) => ({ id: n.id, friendship: n.friendship, rewarded: n.rewarded })),
      animals: this.animals,
      requests: this.requests
    });
  }

  snapshot(): UiSnapshot {
    return {
      mode: this.mode,
      money: this.money,
      day: this.day,
      season: this.season(),
      dayOfSeason: this.dayOfSeason(),
      time: this.time,
      weather: this.weather,
      tomorrow: this.tomorrow,
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      hp: this.hp,
      maxHp: this.maxHp,
      mapId: this.world.id,
      mapName: this.world.name,
      floor: this.world.floor,
      inventory: this.inv.map((s) => s ? { ...s } : null),
      selected: this.selected,
      canWater: this.canWater,
      canMax: this.canMax,
      prompt: this.mode === 'play' ? this.prompt : null,
      toasts: [...this.toasts],
      pickups: this.pickups.map((p) => ({ ...p })),
      stats: { ...this.stats },
      goalsDone: [...this.goalsDone],
      summary: this.summary,
      fishingFish: this.fishingFish,
      upgrades: { ...this.upgrades },
      hasSave: hasSave(),
      dialog: this.dialog,
      requests: this.requests.map((r) => ({ ...r })),
      npcs: this.npcs.map((n) => ({ id: n.id, friendship: n.friendship, talked: n.talked, gifted: n.gifted })),
      animals: this.animals.map((a) => ({ kind: a.kind, name: a.name, mood: a.mood, ready: a.ready, petted: a.petted })),
      banner: this.banner,
      speedBuff: this.speedBuff
    };
  }
}