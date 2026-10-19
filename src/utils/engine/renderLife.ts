import type { FarmGame } from './FarmGame';
import type { SpriteBank } from '../sprites/bank';
import type { Caster, Drawable, LightSource } from './renderTypes';
import type { EmoteKind } from './life';
import { visitorActive } from './life';
import { TILE } from './constants';

interface Sink {
  items: Drawable[];
  lights: LightSource[];
  mirrors: Caster[];
  contact: [number, number, number, number][];
}

/** Adds visitors and critters to the depth-sorted draw list. */
export function collectLife(ctx: CanvasRenderingContext2D, g: FarmGame, bank: SpriteBank, out: Sink): void {
  const S = bank.shared;
  const t = g.elapsed;
  const L = g.life;
  const w = L.wanderer;
  if (visitorActive(g, w)) {
    const frames = S.npcs.wanderer;
    const img = frames[w.dir][0];
    const x = Math.round(w.x);
    const y = Math.round(w.y);
    out.contact.push([x, y - 1, 6, 2.2]);
    out.mirrors.push({ img, bx: x, by: y, ox: -10, oy: -26 });
    out.items.push({ y, draw: () => ctx.drawImage(img, x - 10, y - 26) });
    const fx = x + 16;
    const fy = y - 1;
    const fl = 0.9 + Math.sin(t * 8) * 0.05;
    out.lights.push({ x: fx, y: fy - 6, r: 72, a: 0.55 + fl * 0.35, kind: 'warm', base: fy });
    if (Math.random() < 0.18) g.particles.spawn('spark', fx + (Math.random() - 0.5) * 5, fy - 4, { z: 0, vz: 16 + Math.random() * 12, life: 0.7, color: Math.random() < 0.5 ? '#ffb040' : '#fff0a0' });
    if (Math.random() < 0.05) g.particles.spawn('smoke', fx, fy - 10, { life: 2.6, size: 1.4, vx: 2 + Math.random() * 2, color: '#b8b0b8' });
    out.contact.push([fx, fy, 7, 2]);
    out.items.push({
      y: fy,
      draw: () => {
        ctx.fillStyle = '#6a4630';
        ctx.fillRect(fx - 6, fy - 2, 12, 2);
        ctx.fillStyle = '#9a6a42';
        ctx.fillRect(fx - 5, fy - 3, 4, 1);
        ctx.fillRect(fx + 1, fy - 3, 4, 1);
        ctx.fillStyle = '#7a7480';
        for (const sx of [-7, -4, 3, 6]) ctx.fillRect(fx + sx, fy - 1, 2, 2);
        const fh = 5 + Math.floor(t * 8) % 3;
        ctx.fillStyle = '#ff7a2a';
        ctx.fillRect(fx - 3, fy - 3 - fh, 6, fh);
        ctx.fillStyle = '#ffcf5a';
        ctx.fillRect(fx - 2, fy - 3 - fh + 2, 4, fh - 2);
        ctx.fillStyle = '#fff6c8';
        ctx.fillRect(fx - 1, fy - 3 - Math.max(2, fh - 3), 2, Math.max(2, fh - 4));
      }
    });
  }
  const c = L.cat;
  if (visitorActive(g, c)) {
    const side = c.dir === 'left' ? 'left' : 'right';
    const img = S.cat[side][c.moving ? Math.floor(c.walkT * 7) % 2 : 0];
    const x = Math.round(c.x);
    const y = Math.round(c.y);
    out.contact.push([x, y - 1, 5, 1.8]);
    out.mirrors.push({ img, bx: x, by: y, ox: -9, oy: -13 });
    out.items.push({ y, draw: () => ctx.drawImage(img, x - 9, y - 13) });
  }
  for (const cr of L.critters) {
    const x = Math.round(cr.x);
    const y = Math.round(cr.y);
    if (cr.kind === 'duck') {
      const img = S.duck[cr.dir === 1 ? 'right' : 'left'][Math.floor(cr.t * 2) % 2];
      out.items.push({ y, draw: () => ctx.drawImage(img, x - 6, y - 7) });
      continue;
    }
    if (cr.kind === 'butterfly') {
      const z = Math.round(cr.z);
      const open = Math.floor(cr.t * 8) % 2 === 0;
      out.items.push({
        y: y + 2,
        draw: () => {
          ctx.fillStyle = 'rgba(10,18,34,0.25)';
          ctx.fillRect(x - 1, y, 3, 1);
          ctx.fillStyle = cr.color;
          if (open) {
            ctx.fillRect(x - 2, y - z, 2, 2);
            ctx.fillRect(x + 1, y - z, 2, 2);
          } else ctx.fillRect(x - 1, y - z - 1, 3, 2);
          ctx.fillStyle = '#3a2a2a';
          ctx.fillRect(x, y - z, 1, 2);
        }
      });
      continue;
    }
    const z = Math.round(cr.z);
    const flap = cr.flee && Math.floor(cr.t * 12) % 2 === 0;
    const hop = !cr.flee && cr.t < 0.15 ? 1 : 0;
    out.items.push({
      y: y + (cr.flee ? 200 : 0),
      draw: () => {
        if (z < 40) {
          ctx.fillStyle = 'rgba(10,18,34,0.28)';
          ctx.fillRect(x - 2, y, 5, 1);
        }
        const by = y - 3 - z - hop;
        ctx.fillStyle = cr.color;
        ctx.fillRect(x - 2, by, 5, 3);
        ctx.fillRect(x + (cr.dir === 1 ? 2 : -3), by - 1, 2, 2);
        ctx.fillStyle = '#f0c040';
        ctx.fillRect(x + (cr.dir === 1 ? 4 : -4), by, 1, 1);
        if (cr.flee) {
          ctx.fillStyle = cr.color;
          ctx.fillRect(x - 3, by + (flap ? -2 : 1), 2, 1);
          ctx.fillRect(x + 2, by + (flap ? -2 : 1), 2, 1);
        }
      }
    });
  }
}

const GLYPH: Record<EmoteKind, {color: string;px: [number, number][];}> = {
  note: { color: '#3a6ad0', px: [[4, 1], [5, 1], [5, 2], [5, 3], [5, 4], [3, 4], [4, 4], [3, 5], [4, 5]] },
  dots: { color: '#3a2012', px: [[2, 4], [4, 4], [6, 4]] },
  heart: { color: '#e2463f', px: [[2, 2], [3, 2], [5, 2], [6, 2], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [3, 4], [4, 4], [5, 4], [4, 5]] },
  excl: { color: '#e08a1e', px: [[4, 1], [4, 2], [4, 3], [4, 5]] },
  zzz: { color: '#5a6ad0', px: [[2, 2], [3, 2], [4, 2], [3, 3], [2, 4], [3, 4], [4, 4], [5, 1], [6, 1], [6, 0]] },
  sweat: { color: '#4aa0e0', px: [[4, 1], [3, 2], [4, 2], [3, 3], [4, 3], [5, 3], [4, 4]] }
};

function headOf(g: FarmGame, who: string): [number, number] | null {
  const L = g.life;
  if (who === 'wanderer') return visitorActive(g, L.wanderer) ? [L.wanderer.x, L.wanderer.y - 30] : null;
  if (who === 'cat') return visitorActive(g, L.cat) ? [L.cat.x, L.cat.y - 16] : null;
  if (g.world.id !== 'town') return null;
  const st = g.npcs.find((n) => n.id === who);
  return st && st.visible ? [st.x, st.y - 30] : null;
}

/** Speech bubbles, shooting stars and the tap-to-walk marker, painted above everything. */
export function drawLifeOverlay(ctx: CanvasRenderingContext2D, g: FarmGame): void {
  const t = g.elapsed;
  for (const e of g.life.emotes) {
    const h = headOf(g, e.who);
    if (!h) continue;
    const age = 2.2 - e.t;
    const pop = age < 0.1 ? 1 : 0;
    const x = Math.round(h[0]) - 5;
    const y = Math.round(h[1]) - 9 + pop;
    ctx.globalAlpha = Math.min(1, e.t * 3);
    ctx.fillStyle = '#140b07';
    ctx.fillRect(x - 1, y, 11, 9);
    ctx.fillRect(x, y - 1, 9, 11);
    ctx.fillStyle = '#fdf1d8';
    ctx.fillRect(x, y, 9, 9);
    ctx.fillStyle = '#c9a46a';
    ctx.fillRect(x, y + 8, 9, 1);
    ctx.fillStyle = '#140b07';
    ctx.fillRect(x + 3, y + 10, 3, 1);
    ctx.fillRect(x + 4, y + 11, 1, 1);
    const gl = GLYPH[e.kind];
    ctx.fillStyle = gl.color;
    for (const [px, py] of gl.px) ctx.fillRect(x + px, y + py + 1, 1, 1);
  }
  ctx.globalAlpha = 1;
  for (const m of g.life.meteors) {
    const a = Math.min(1, m.life * 2);
    for (let k = 0; k < 10; k++) {
      ctx.globalAlpha = a * (1 - k / 10);
      ctx.fillStyle = k < 2 ? '#ffffff' : '#bfe4ff';
      ctx.fillRect(Math.round(m.x - m.vx * k * 0.012), Math.round(m.y - m.vy * k * 0.012), k < 2 ? 2 : 1, 1);
    }
  }
  ctx.globalAlpha = 1;
  const goal = g.pathGoal;
  if (goal && g.path) {
    const cx = goal.x * TILE + 8;
    const cy = goal.y * TILE + 10;
    const r = 4 + Math.floor(t * 4) % 2 * 2;
    ctx.fillStyle = goal.interact ? 'rgba(255,181,71,0.9)' : 'rgba(253,241,216,0.85)';
    ctx.fillRect(cx - r, cy, 2, 1);
    ctx.fillRect(cx + r - 1, cy, 2, 1);
    ctx.fillRect(cx, cy - Math.round(r / 2), 1, 2);
    ctx.fillRect(cx, cy + Math.round(r / 2) - 1, 1, 2);
    ctx.fillRect(cx, cy, 1, 1);
  }
}