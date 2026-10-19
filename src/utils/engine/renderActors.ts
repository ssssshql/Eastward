import type { FarmGame } from './FarmGame';
import type { SpriteBank } from '../sprites/bank';
import type { LightSource } from './renderTypes';
import type { Particle } from './particles';
import { TILE } from './constants';
import { lineTiles } from './farmActions';
import { getIconCanvas } from '../sprites/iconCache';
import { getItem } from '../items';

export function drawTarget(ctx: CanvasRenderingContext2D, g: FarmGame): void {
  if (g.mode !== 'play' || !g.target || g.fishing || g.casting || g.player.action || g.world.indoor) return;
  const st = g.inv[g.selected];
  if (st && (st.id === 'sword' || st.id === 'rod')) return;
  const tiles = lineTiles(g, g.target.x, g.target.y, st ? st.id : '');
  for (const { x, y } of tiles) {
    const px = x * TILE;
    const py = y * TILE;
    ctx.fillStyle = 'rgba(255,240,200,0.12)';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = 'rgba(255,244,214,0.75)';
    ctx.fillRect(px, py, 3, 1);
    ctx.fillRect(px, py, 1, 3);
    ctx.fillRect(px + 13, py, 3, 1);
    ctx.fillRect(px + 15, py, 1, 3);
    ctx.fillRect(px, py + 15, 3, 1);
    ctx.fillRect(px, py + 13, 1, 3);
    ctx.fillRect(px + 13, py + 15, 3, 1);
    ctx.fillRect(px + 15, py + 13, 1, 3);
  }
  if (st && getItem(st.id).kind === 'placeable' && g.world.id === 'farm') {
    ctx.globalAlpha = 0.5;
    ctx.drawImage(getIconCanvas(st.id), g.target.x * TILE, g.target.y * TILE - 1);
    ctx.globalAlpha = 1;
  }
}

export function drawPlayer(ctx: CanvasRenderingContext2D, g: FarmGame, bank: SpriteBank, f: number): void {
  const pl = g.player;
  const frames = bank.shared.player[pl.dir];
  const x = Math.round(pl.x);
  const y = Math.round(pl.y);
  const holding = !!pl.action || !!g.fishing || !!g.casting;
  const behind = holding && pl.dir === 'up';
  if (pl.invuln > 0 && Math.floor(g.elapsed * 20) % 2 === 0) ctx.globalAlpha = 0.45;
  if (behind) drawTool(ctx, g, x, y);
  ctx.drawImage(frames[f], x - 10, y - 26);
  if (holding && !behind) drawTool(ctx, g, x, y);
  ctx.globalAlpha = 1;
}

function drawTool(ctx: CanvasRenderingContext2D, g: FarmGame, x: number, y: number): void {
  const pl = g.player;
  const act = pl.action;
  const id = act ? act.tool : 'rod';
  const icon = getIconCanvas(id);
  const p = act ? Math.min(1, act.t / act.dur) : 1;
  const e = 1 - Math.pow(1 - p, 3);
  let hx = x;
  let hy = y - 12;
  let flip = false;
  if (pl.dir === 'right') hx = x + 3;else
  if (pl.dir === 'left') {
    hx = x - 3;
    flip = true;
  } else if (pl.dir === 'down') hx = x + 4;else
  {
    hx = x - 4;
    hy = y - 16;
    flip = true;
  }
  let ang = pl.dir === 'down' || pl.dir === 'up' ? -1.6 + e * 2.2 : -2.0 + e * 2.4;
  if (id === 'sword') ang = -2.3 + e * 3.0;
  if (id === 'can') ang = -0.4 + e * 0.9;
  // Rod raised back over the shoulder while charging, resting forward while the line is out.
  if (id === 'rod' && !act) ang = g.casting ? -1.9 - g.casting.power * 0.5 : 0.1;
  ctx.save();
  ctx.translate(hx, hy);
  if (flip) ctx.scale(-1, 1);
  ctx.rotate(ang);
  ctx.drawImage(icon, -3, -13);
  if (id === 'sword' && p > 0.2 && p < 0.9) {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 13, -2.6, -1.0);
    ctx.stroke();
  }
  ctx.restore();
}

/** Stardew-style vertical casting meter beside the player: red → amber → green as power builds. */
export function drawCastMeter(ctx: CanvasRenderingContext2D, g: FarmGame): void {
  const c = g.casting;
  if (!c) return;
  const pl = g.player;
  const x = Math.round(pl.x) + (pl.dir === 'left' ? 10 : -16);
  const y = Math.round(pl.y) - 34;
  const H = 24;
  ctx.fillStyle = '#140b07';
  ctx.fillRect(x - 1, y - 1, 7, H + 2);
  ctx.fillStyle = '#9a5f34';
  ctx.fillRect(x, y, 5, H);
  ctx.fillStyle = '#2c1d16';
  ctx.fillRect(x + 1, y + 1, 3, H - 2);
  const fill = Math.round((H - 2) * c.power);
  ctx.fillStyle = c.power < 0.34 ? '#ff5a5a' : c.power < 0.72 ? '#ffb547' : '#8fe0a0';
  ctx.fillRect(x + 1, y + H - 1 - fill, 3, fill);
  if (c.power > 0.96) {
    ctx.fillStyle = '#fff6c8';
    ctx.fillRect(x + 1, y + 1, 3, 1);
  }
}

export function drawFishing(ctx: CanvasRenderingContext2D, g: FarmGame): void {
  const f = g.fishing;
  if (!f) return;
  const pl = g.player;
  const tips: Record<string, [number, number]> = { right: [12, -22], left: [-12, -22], down: [9, -14], up: [-9, -28] };
  const [ox, oy] = tips[pl.dir];
  const sx = Math.round(pl.x) + ox;
  const sy = Math.round(pl.y) + oy;
  const bite = f.phase === 'bite';
  const bob = bite ? 2 : Math.floor(g.elapsed * 1.5) % 2;
  const bx = Math.round(f.bx);
  const by = Math.round(f.by) + bob;
  ctx.strokeStyle = 'rgba(240,236,220,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sx + 0.5, sy + 0.5);
  ctx.quadraticCurveTo((sx + bx) / 2, Math.max(sy, by) + 6, bx + 0.5, by + 0.5);
  ctx.stroke();
  ctx.fillStyle = '#f4f1e8';
  ctx.fillRect(bx - 1, by - 2, 2, 1);
  ctx.fillStyle = '#ff3d3d';
  ctx.fillRect(bx - 1, by - 1, 2, bite ? 1 : 2);
  if (bite) {
    // Big "!" over the angler's head, like Stardew's bite cue.
    const hx = Math.round(pl.x) - 2;
    const hy = Math.round(pl.y) - 44;
    ctx.fillStyle = '#140b07';
    ctx.fillRect(hx - 1, hy - 1, 6, 11);
    ctx.fillRect(hx - 1, hy + 11, 6, 5);
    ctx.fillStyle = '#ffd23a';
    ctx.fillRect(hx, hy, 4, 9);
    ctx.fillRect(hx, hy + 12, 4, 3);
    ctx.fillStyle = '#fff6c8';
    ctx.fillRect(hx, hy, 1, 8);
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, list: Particle[], t: number, lights: LightSource[]): void {
  for (const p of list) {
    const a = Math.min(1, p.life / p.max * 2);
    const x = Math.round(p.x);
    const y = Math.round(p.y - p.z);
    ctx.globalAlpha = a;
    switch (p.kind) {
      case 'chip':
      case 'drop':
      case 'dust':
        ctx.fillStyle = p.color;
        ctx.fillRect(x, y, p.size, p.size);
        break;
      case 'leaf':
      case 'petal':{
          ctx.fillStyle = p.color;
          const flat = Math.sin(p.seed + t * 6) > 0;
          ctx.fillRect(x, y, flat ? 2 : 1, flat ? 1 : 2);
          break;
        }
      case 'spark':
        ctx.fillStyle = p.color;
        ctx.fillRect(x, y, 1, 1);
        if (p.life > p.max * 0.5) {
          ctx.globalAlpha = a * 0.5;
          ctx.fillRect(x - 1, y, 3, 1);
          ctx.fillRect(x, y - 1, 1, 3);
        }
        lights.push({ x: p.x, y: p.y - p.z, r: 8, a: a * 0.6, kind: 'warm' });
        break;
      case 'smoke':
        ctx.globalAlpha = a * 0.3;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, Math.round(p.size), 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'firefly':{
          const pulse = 0.5 + 0.5 * Math.sin(t * 3 + p.seed);
          ctx.globalAlpha = a * pulse;
          ctx.fillStyle = '#efffa8';
          ctx.fillRect(x, y, 1, 1);
          lights.push({ x: p.x, y: p.y - p.z, r: 11, a: a * pulse * 0.9, kind: 'green' });
          break;
        }
      case 'mote':
        ctx.globalAlpha = a * 0.6;
        ctx.fillStyle = p.color;
        ctx.fillRect(x, y, 1, 1);
        break;
      case 'ripple':
      case 'splash':{
          const k = 1 - p.life / p.max;
          const r = Math.round((p.kind === 'ripple' ? 7 : 2.5) * k + 1);
          ctx.globalAlpha = (1 - k) * 0.7;
          ctx.strokeStyle = '#dff6ff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(x, Math.round(p.y) + 0.5, r, Math.max(1, Math.round(r * 0.45)), 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
    }
  }
  ctx.globalAlpha = 1;
}