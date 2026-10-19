import type { World } from '../../types/game';
import type { Caster, ViewRect } from './renderTypes';
import { TILE } from './constants';
import { hash2 } from '../noise';

export function waterInView(world: World, v: ViewRect): boolean {
  const tx0 = Math.max(0, Math.floor(v.x / TILE));
  const tx1 = Math.min(world.w - 1, Math.ceil((v.x + v.w) / TILE));
  const ty0 = Math.max(0, Math.floor(v.y / TILE));
  const ty1 = Math.min(world.h - 1, Math.ceil((v.y + v.h) / TILE));
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (world.ground[ty * world.w + tx] === 'water') return true;
  return false;
}

/**
 * Mirror pass: every caster is flipped about its own ground line into an offscreen layer, tinted toward
 * the water colour, then copied back in thin rows with a travelling ripple offset. The opaque ground canvas
 * is drawn over the top afterwards, so reflections only survive where there is open water.
 */
export function drawReflections(ctx: CanvasRenderingContext2D, rctx: CanvasRenderingContext2D, mirrors: Caster[], v: ViewRect, t: number, tint: string, strength: number): void {
  const W = rctx.canvas.width;
  const H = rctx.canvas.height;
  rctx.setTransform(1, 0, 0, 1, 0, 0);
  rctx.globalCompositeOperation = 'source-over';
  rctx.globalAlpha = 1;
  rctx.imageSmoothingEnabled = false;
  rctx.clearRect(0, 0, W, H);
  for (const c of mirrors) {
    const left = c.bx + c.ox;
    const reflTop = c.by - c.oy - c.img.height;
    const reflBottom = c.by - c.oy;
    if (left > v.x + W || left + c.img.width < v.x || reflTop > v.y + H || reflBottom < v.y) continue;
    rctx.setTransform(1, 0, 0, -1, Math.round(c.bx - v.x), Math.round(c.by - v.y));
    rctx.drawImage(c.img, c.ox, c.oy);
  }
  rctx.setTransform(1, 0, 0, 1, 0, 0);
  rctx.globalCompositeOperation = 'source-atop';
  rctx.globalAlpha = 0.42;
  rctx.fillStyle = tint;
  rctx.fillRect(0, 0, W, H);
  rctx.globalCompositeOperation = 'source-over';
  rctx.globalAlpha = 1;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = strength;
  for (let y = 0; y < H; y += 2) {
    const wy = y + v.y;
    const off = Math.round(Math.sin(wy * 0.33 + t * 2.3) * 1.1 + Math.sin(wy * 0.12 - t * 1.4) * 0.7);
    const h = Math.min(2, H - y);
    ctx.drawImage(rctx.canvas, 0, y, W, h, off, y, W, h);
  }
  ctx.globalAlpha = 1;
}

/** Twinkling specular glints scattered over open water. */
export function drawSparkles(ctx: CanvasRenderingContext2D, world: World, v: ViewRect, t: number, night: number): void {
  const tx0 = Math.max(0, Math.floor(v.x / TILE));
  const tx1 = Math.min(world.w - 1, Math.ceil((v.x + v.w) / TILE));
  const ty0 = Math.max(0, Math.floor(v.y / TILE));
  const ty1 = Math.min(world.h - 1, Math.ceil((v.y + v.h) / TILE));
  const tick = Math.floor(t * 3);
  ctx.setTransform(1, 0, 0, 1, -v.x, -v.y);
  ctx.fillStyle = night > 0.5 ? 'rgba(200,220,255,0.7)' : 'rgba(255,252,236,0.9)';
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      if (world.ground[ty * world.w + tx] !== 'water') continue;
      for (let k = 0; k < 2; k++) {
        const ph = tick + k * 7 + (tx * 3 + ty * 5 & 3);
        if (hash2(tx * 2 + k, ty, ph) > 0.16) continue;
        const sx = tx * TILE + Math.floor(hash2(tx, ty * 2 + k, ph + 11) * 13);
        const sy = ty * TILE + Math.floor(hash2(tx + 5, ty, ph + 23) * 14);
        const life = t * 3 % 1;
        const w = life < 0.5 ? 3 : 1;
        ctx.fillRect(sx - (w > 1 ? 1 : 0), sy, w, 1);
      }
    }
  }
}