import type { FarmGame } from './FarmGame';
import { TILE } from './constants';
import { ambientAt } from './lighting';
import { chimneyOf, PAD } from '../sprites/buildings';
import { LEAF_PARTICLES } from '../sprites/nature';

export interface AmbientTimers {
  leaf: number;
  smoke: number;
  fly: number;
  mote: number;
  splash: number;
  drip: number;
}

/** Ambient life: fireflies, falling leaves, chimney smoke, dust motes, rain splashes. */
export function updateAmbient(g: FarmGame, amb: AmbientTimers, dt: number): void {
  const w = g.world;
  const P = g.particles;
  const rx = () => g.camX + Math.random() * g.viewW;
  const ry = () => g.camY + Math.random() * g.viewH;
  if (w.dark) {
    amb.drip -= dt;
    if (amb.drip <= 0) {
      amb.drip = 0.25;
      P.spawn('mote', rx(), ry(), { z: 6 + Math.random() * 20, life: 4, vx: (Math.random() - 0.5) * 4, vy: -2, color: '#c0a0ff' });
    }
    return;
  }
  const { night } = ambientAt(g.displayTime(), g.weather);
  if (w.indoor) {
    amb.mote -= dt;
    if (amb.mote <= 0) {
      amb.mote = 0.4;
      // Dust drifting through the window light.
      const wins = w.structures.filter((s) => s.prop === 'window');
      if (wins.length && night < 0.6 && P.count('mote') < 18) {
        const s = wins[Math.floor(Math.random() * wins.length)];
        P.spawn('mote', s.x * TILE + 8 + (Math.random() - 0.3) * 24, (s.y + 2) * TILE + Math.random() * 40, { z: 6 + Math.random() * 20, life: 4 + Math.random() * 2, vx: 2 + Math.random() * 2, vy: -0.5, color: '#fff2c8' });
      }
    }
    return;
  }
  const season = g.season();

  amb.fly -= dt;
  if (night > 0.55 && g.weather === 'clear' && season !== 'winter' && amb.fly <= 0) {
    amb.fly = 0.15;
    if (P.count('firefly') < 34) P.spawn('firefly', rx(), ry(), { z: 4 + Math.random() * 14, life: 5 + Math.random() * 5, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 6 });
  }

  amb.leaf -= dt;
  if (amb.leaf <= 0) {
    amb.leaf = season === 'autumn' ? 0.12 : season === 'winter' ? 1.4 : 0.4;
    for (let k = 0; k < 14; k++) {
      const tx = Math.floor(rx() / TILE);
      const ty = Math.floor((g.camY + Math.random() * (g.viewH + 48)) / TILE);
      if (tx < 0 || ty < 0 || tx >= w.w || ty >= w.h) continue;
      const o = w.objects[ty * w.w + tx];
      if (o && o.kind === 'tree' && Math.floor(o.variant / 3) !== 1) {
        const blossom = Math.floor(o.variant / 3) === 2 && season === 'spring';
        const cols = blossom ? ['#ffc3d8', '#ffe3ee', '#ff9ac0'] : LEAF_PARTICLES[season];
        P.spawn(blossom ? 'petal' : 'leaf', tx * TILE + 8 + (Math.random() - 0.5) * 30, ty * TILE + 14 + Math.random() * 10, {
          z: 18 + Math.random() * 22,
          vz: -9 - Math.random() * 5,
          vx: 6 + Math.random() * 8,
          vy: 2,
          life: 7,
          color: cols[Math.floor(Math.random() * cols.length)]
        });
        break;
      }
    }
  }

  amb.smoke -= dt;
  if (amb.smoke <= 0) {
    amb.smoke = 0.3;
    for (const s of w.structures) {
      const ch = chimneyOf(s.kind, s.variant ?? 0);
      if (!ch) continue;
      const bottom = (s.y + s.h) * TILE;
      P.spawn('smoke', s.x * TILE - PAD + PAD + ch[0] + (Math.random() - 0.5) * 2, bottom - ch[1] + 2, {
        life: 3.2,
        size: s.kind === 'smith' ? 2.2 : 1.5,
        vx: 3 + Math.random() * 3,
        color: s.kind === 'smith' ? '#8a8494' : '#d9d4dc'
      });
    }
    const f = w.structures.find((s) => s.kind === 'fountain');
    if (f) P.burst('drop', f.x * TILE + 32, (f.y + f.h) * TILE - 52, 3, ['#bfefff', '#ffffff'], { speed: 14, up: 60, z: 2, life: 0.8 });
  }

  amb.mote -= dt;
  if (night < 0.3 && g.weather === 'clear' && amb.mote <= 0) {
    amb.mote = 0.35;
    if (P.count('mote') < 26) P.spawn('mote', rx(), ry(), { z: 10 + Math.random() * 24, life: 4 + Math.random() * 2, vx: 4 + Math.random() * 3, vy: -1, color: '#fff2c8' });
  }

  if (g.weather === 'rain' && g.mode !== 'title') {
    amb.splash -= dt;
    while (amb.splash <= 0) {
      amb.splash += 0.025;
      const x = rx();
      const y = ry();
      const tx = Math.floor(x / TILE);
      const ty = Math.floor(y / TILE);
      const water = tx >= 0 && ty >= 0 && tx < w.w && ty < w.h && w.ground[ty * w.w + tx] === 'water';
      P.spawn(water ? 'ripple' : 'splash', x, y, { life: water ? 0.6 : 0.25 });
    }
  }
}