export type PKind = 'chip' | 'drop' | 'leaf' | 'petal' | 'spark' | 'smoke' | 'firefly' | 'ripple' | 'dust' | 'mote' | 'splash';

export interface Particle {
  kind: PKind;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  max: number;
  color: string;
  size: number;
  seed: number;
}

export interface SpawnOpts {
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  life?: number;
  color?: string;
  size?: number;
}

export interface BurstOpts {
  speed?: number;
  up?: number;
  life?: number;
  z?: number;
  size?: number;
}

export class ParticleSystem {
  list: Particle[] = [];

  spawn(kind: PKind, x: number, y: number, o: SpawnOpts = {}): void {
    if (this.list.length > 800) return;
    const life = o.life ?? 1;
    this.list.push({
      kind,
      x,
      y,
      z: o.z ?? 0,
      vx: o.vx ?? 0,
      vy: o.vy ?? 0,
      vz: o.vz ?? 0,
      life,
      max: life,
      color: o.color ?? '#ffffff',
      size: o.size ?? 1,
      seed: Math.random() * 100
    });
  }

  burst(kind: PKind, x: number, y: number, n: number, colors: string[], o: BurstOpts = {}): void {
    const speed = o.speed ?? 30;
    const up = o.up ?? 60;
    const life = o.life ?? 0.6;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.6);
      this.spawn(kind, x, y, {
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s * 0.5,
        vz: up * (0.6 + Math.random() * 0.6),
        z: o.z ?? 4,
        life: life * (0.7 + Math.random() * 0.6),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: o.size ?? 1
      });
    }
  }

  count(kind: PKind): number {
    let c = 0;
    for (const p of this.list) if (p.kind === kind) c++;
    return c;
  }

  update(dt: number): void {
    const L = this.list;
    let j = 0;
    for (let i = 0; i < L.length; i++) {
      const p = L[i];
      p.life -= dt;
      if (p.life <= 0) continue;
      switch (p.kind) {
        case 'chip':
        case 'drop':
        case 'dust':
        case 'spark':
          p.vz -= (p.kind === 'spark' ? 50 : 260) * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
          if (p.z < 0) {
            p.z = 0;
            p.vz *= -0.3;
            p.vx *= 0.5;
            p.vy *= 0.5;
            if (p.kind === 'drop') p.life = Math.min(p.life, 0.05);
          }
          break;
        case 'leaf':
        case 'petal':
          if (p.z > 0) {
            p.vz = Math.max(p.vz - 40 * dt, -12);
            p.z += p.vz * dt;
            p.x += (p.vx + Math.sin(p.seed + p.life * 2.5) * 10) * dt;
            p.y += p.vy * dt;
          } else p.z = 0;
          break;
        case 'smoke':
          p.z += 9 * dt;
          p.x += p.vx * dt;
          p.size += dt * 1.6;
          break;
        case 'firefly':
          p.vx += (Math.random() - 0.5) * 50 * dt;
          p.vy += (Math.random() - 0.5) * 50 * dt;
          p.vx *= 0.985;
          p.vy *= 0.985;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += Math.sin(p.life * 2 + p.seed) * 4 * dt;
          break;
        case 'mote':
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += Math.sin(p.life + p.seed) * 3 * dt;
          break;
        default:
          break;
      }
      L[j++] = p;
    }
    L.length = j;
  }
}