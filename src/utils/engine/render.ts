import type { FarmGame } from './FarmGame';
import type { SpriteBank } from '../sprites/bank';
import { silhouette } from '../sprites/bank';
import { TILE } from './constants';
import { cropStage, isMature, lineTiles } from './farmActions';
import { getIconCanvas } from '../sprites/iconCache';
import { getItem } from '../items';
import { processing } from '../../data/recipes';
import type { Particle } from './particles';

export interface ViewRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LightSource {
  x: number;
  y: number;
  r: number;
  a: number;
  kind: 'warm' | 'cool' | 'green' | 'violet';
}

export interface SunState {
  dx: number;
  dy: number;
  strength: number;
}

interface Drawable {
  y: number;
  draw: () => void;
}

interface Caster {
  img: HTMLCanvasElement;
  bx: number;
  by: number;
  ox: number;
  oy: number;
}

/** Sun direction for long cinematic shadows. Morning shadows fall west, evening shadows east. */
export function sunAt(minutes: number, night: number, overcast: boolean, dark: boolean): SunState {
  if (dark) return { dx: 0, dy: 0, strength: 0 };
  const h = minutes / 60;
  const t = Math.min(1, Math.max(0, (h - 6) / 13.5));
  const dx = -1.7 + t * 3.4;
  const dy = 0.28 + (1 - Math.sin(Math.PI * t)) * 0.32;
  const day = 1 - night;
  const strength = (overcast ? 0.18 : 0.5) * day + night * 0.12;
  return night > 0.7 ? { dx: 0.35, dy: 0.45, strength } : { dx, dy, strength };
}

export function drawWorld(
ctx: CanvasRenderingContext2D,
shadowCtx: CanvasRenderingContext2D,
g: FarmGame,
bank: SpriteBank,
ground: HTMLCanvasElement,
patterns: CanvasPattern[],
v: ViewRect,
night: number,
sun: SunState)
: LightSource[] {
  const { world, player } = g;
  const S = bank.shared;
  const t = g.elapsed;
  const lights: LightSource[] = [];
  const casters: Caster[] = [];
  const base = () => ctx.setTransform(1, 0, 0, 1, -v.x, -v.y);
  const skew = (px: number, py: number, k: number) => ctx.setTransform(1, 0, k, 1, Math.round(px) - v.x, Math.round(py) - v.y);
  base();
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = false;

  if (patterns.length && !world.dark) {
    ctx.fillStyle = patterns[Math.floor(t * 7) % patterns.length];
    ctx.fillRect(v.x, v.y, v.w, v.h);
  } else {
    ctx.fillStyle = '#0c0a12';
    ctx.fillRect(v.x, v.y, v.w, v.h);
  }
  const sx = Math.max(0, v.x);
  const sy = Math.max(0, v.y);
  const ex = Math.min(ground.width, v.x + v.w);
  const ey = Math.min(ground.height, v.y + v.h);
  if (ex > sx && ey > sy) ctx.drawImage(ground, sx, sy, ex - sx, ey - sy, sx, sy, ex - sx, ey - sy);

  const tx0 = Math.max(0, Math.floor(v.x / TILE) - 3);
  const tx1 = Math.min(world.w - 1, Math.ceil((v.x + v.w) / TILE) + 3);
  const ty0 = Math.max(0, Math.floor(v.y / TILE) - 1);
  const ty1 = Math.min(world.h - 1, Math.ceil((v.y + v.h) / TILE) + 7);
  const tilledAt = (x: number, y: number) => x >= 0 && y >= 0 && x < world.w && y < world.h && world.tilled[y * world.w + x] === 1;

  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const i = ty * world.w + tx;
      if (!world.tilled[i]) continue;
      const m = (tilledAt(tx, ty - 1) ? 1 : 0) | (tilledAt(tx + 1, ty) ? 2 : 0) | (tilledAt(tx, ty + 1) ? 4 : 0) | (tilledAt(tx - 1, ty) ? 8 : 0);
      ctx.drawImage((world.watered[i] ? S.soilWet : S.soilDry)[m], tx * TILE, ty * TILE);
    }
  }

  const items: Drawable[] = [];
  const contact: [number, number, number, number][] = [];
  const windSway = Math.sin(t * 0.4) * 0.015;
  const isNight = night > 0.35;

  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const i = ty * world.w + tx;
      const o = world.objects[i];
      const bx = tx * TILE + 8;
      const by = ty * TILE + 14;
      if (o) {
        const shake = Math.max(0, o.shake - t);
        const sh = shake > 0 ? Math.sin(t * 60) * shake * 5 : 0;
        switch (o.kind) {
          case 'tree':{
              const spr = bank.trees[o.variant % bank.trees.length];
              contact.push([bx, by, 9, 3]);
              casters.push({ img: spr.trunk, bx, by: by + 0, ox: -24, oy: -61 }, { img: spr.canopy, bx, by, ox: -24, oy: -61 });
              const behind = player.y < by - 2 && player.y > by - 58 && Math.abs(player.x - bx) < 20;
              const sway = Math.sin(t * 1.1 + tx * 0.9 + ty * 0.37) * 0.03 + Math.sin(t * 2.3 + tx) * 0.008 + windSway;
              items.push({
                y: by,
                draw: () => {
                  ctx.drawImage(spr.trunk, Math.round(bx - 24 + sh * 0.4), by - 61);
                  if (behind) ctx.globalAlpha = 0.45;
                  skew(bx + sh, by - 21, sway);
                  ctx.drawImage(spr.canopy, -24, -40);
                  base();
                  ctx.globalAlpha = 1;
                }
              });
              break;
            }
          case 'stump':
            contact.push([bx, by, 7, 2.5]);
            casters.push({ img: bank.stumps[o.variant % 3], bx, by, ox: -8, oy: -14 });
            items.push({ y: by, draw: () => ctx.drawImage(bank.stumps[o.variant % 3], Math.round(bx - 8 + sh), by - 14) });
            break;
          case 'rock':{
              const img = bank.rocks[o.variant % 8];
              contact.push([bx, by - 1, 8, 2.5]);
              casters.push({ img, bx, by, ox: -9, oy: -13 });
              if (o.variant >= 3 && world.dark) lights.push({ x: bx, y: by - 6, r: 16, a: 0.35, kind: o.variant === 4 ? 'warm' : o.variant === 3 ? 'violet' : 'cool' });
              items.push({ y: by, draw: () => ctx.drawImage(img, Math.round(bx - 9 + sh), by - 13) });
              break;
            }
          case 'crystal':{
              const img = S.crystals[o.variant % 2];
              lights.push({ x: bx, y: by - 8, r: 46, a: 0.75 + Math.sin(t * 2 + tx) * 0.12, kind: o.variant ? 'cool' : 'violet' });
              items.push({ y: by, draw: () => ctx.drawImage(img, Math.round(bx - 9 + sh), by - 20) });
              break;
            }
          case 'torch':{
              const fl = 0.85 + Math.sin(t * 13 + tx) * 0.08 + Math.sin(t * 7.3 + ty) * 0.07;
              lights.push({ x: bx, y: by - 12, r: 78, a: fl, kind: 'warm' });
              if (Math.random() < 0.25) g.particles.spawn('spark', bx + (Math.random() - 0.5) * 4, by - 9, { z: 0, vz: 18 + Math.random() * 10, life: 0.6, color: Math.random() < 0.5 ? '#ffb040' : '#fff0a0' });
              items.push({
                y: by,
                draw: () => {
                  ctx.drawImage(S.brazier, bx - 7, by - 18);
                  ctx.fillStyle = '#ffcf5a';
                  const fh = 3 + Math.round(Math.sin(t * 15 + tx) * 1.5 + 1.5);
                  ctx.fillRect(bx - 2, by - 10 - fh, 4, fh);
                  ctx.fillStyle = '#fff6c8';
                  ctx.fillRect(bx - 1, by - 9 - fh + 1, 2, fh - 1);
                }
              });
              break;
            }
          case 'ladder':
            items.push({ y: by - 14, draw: () => ctx.drawImage(o.variant ? S.ladderUp : S.ladderDown, bx - 8, by - 14) });
            if (o.variant) lights.push({ x: bx, y: by - 14, r: 36, a: 0.6, kind: 'warm' });
            break;
          case 'bush':
            contact.push([bx, by, 9, 3]);
            casters.push({ img: bank.bushes[o.variant % 2], bx, by: by + 1, ox: -13, oy: -21 });
            items.push({
              y: by,
              draw: () => {
                skew(bx + sh, by + 1, Math.sin(t * 1.4 + tx) * 0.05);
                ctx.drawImage(bank.bushes[o.variant % 2], -13, -21);
                base();
              }
            });
            break;
          case 'weed':
            items.push({
              y: by,
              draw: () => {
                skew(bx, by + 1, Math.sin(t * 1.8 + tx * 1.3 + ty) * 0.12 + windSway);
                ctx.drawImage(bank.weeds[o.variant % 3], -8, -16);
                base();
              }
            });
            break;
          case 'sprinkler':
            contact.push([bx, by - 1, 5, 2]);
            items.push({ y: by, draw: () => ctx.drawImage(getIconCanvas('sprinkler'), bx - 8, by - 15) });
            break;
          case 'jar':{
              contact.push([bx, by, 6, 2]);
              casters.push({ img: S.jar, bx, by: by + 1, ox: -8, oy: -21 });
              const ready = !!(o.item && o.ready);
              if (ready) lights.push({ x: bx, y: by - 22, r: 18, a: 0.5, kind: 'warm' });
              items.push({
                y: by,
                draw: () => {
                  ctx.drawImage(S.jar, bx - 8, by - 20);
                  if (ready && o.item) {
                    const bob = Math.round(Math.sin(t * 4) * 1.5);
                    ctx.fillStyle = 'rgba(246,236,216,0.92)';
                    ctx.fillRect(bx - 7, by - 37 + bob, 14, 13);
                    ctx.fillRect(bx - 1, by - 24 + bob, 2, 2);
                    ctx.drawImage(getIconCanvas(processing[o.item]), bx - 6, by - 36 + bob, 12, 12);
                  }
                }
              });
              break;
            }
          case 'lamp':{
              contact.push([bx, by, 5, 2]);
              casters.push({ img: S.lampOn, bx, by: by + 1, ox: -6, oy: -34 });
              const on = night > 0.3 || world.dark;
              if (night > 0.05) lights.push({ x: bx, y: by - 26, r: 64, a: night * (0.95 + Math.sin(t * 7 + tx) * 0.04), kind: 'warm' });
              items.push({ y: by, draw: () => ctx.drawImage(on ? S.lampOn : S.lampOff, bx - 6, by - 33) });
              break;
            }
        }
      }
      const c = world.crops[i];
      if (c) {
        const img = S.crops[c.id][cropStage(c)];
        const st = cropStage(c);
        if (st >= 2) contact.push([bx, by, 5, 1.6]);
        if (st >= 3) casters.push({ img, bx, by: by + 1, ox: -11, oy: -32 });
        if (c.id === 'moonbloom' && isMature(c)) lights.push({ x: bx, y: by - 10, r: 32, a: 0.25 + night * 0.75 * (0.85 + Math.sin(t * 2 + tx) * 0.15), kind: 'cool' });
        items.push({
          y: by - 1,
          draw: () => {
            skew(bx, by + 1, st >= 2 ? Math.sin(t * 1.6 + tx * 0.8 + ty * 0.5) * 0.06 + windSway : 0);
            ctx.drawImage(img, -11, -32);
            base();
          }
        });
      }
    }
  }

  for (const d of world.decor) {
    if (d.x < v.x - 16 || d.x > v.x + v.w + 16 || d.y < v.y - 4 || d.y > v.y + v.h + 12) continue;
    const ti = Math.floor(d.y / TILE) * world.w + Math.floor(d.x / TILE);
    if (world.tilled[ti] || world.objects[ti] || world.crops[ti]) continue;
    const img = d.kind === 'tuft' ? bank.tufts[d.variant % 4] : bank.flowers[d.variant % 6];
    const ddx = d.x - player.x;
    const ddy = d.y - player.y;
    const push = ddx * ddx + ddy * ddy < 70 ? ddx > 0 ? 0.5 : -0.5 : 0;
    const k = Math.sin(t * 1.6 + d.x * 0.05 + d.y * 0.03) * 0.12 + push + windSway;
    items.push({
      y: d.y,
      draw: () => {
        skew(d.x, d.y, k);
        ctx.drawImage(img, -Math.floor(img.width / 2), -img.height);
        base();
      }
    });
  }

  for (const s of world.structures) {
    const key = s.kind === 'cottage' ? `cottage${s.variant ?? 0}` : s.kind;
    const spr = bank.structures[key];
    if (!spr) continue;
    const img = isNight ? spr.night : spr.day;
    const px = s.x * TILE + spr.offX;
    const bottom = (s.y + s.h) * TILE;
    const top = bottom - img.height + 2;
    if (px > v.x + v.w || px + img.width < v.x || bottom + 4 < v.y || top > v.y + v.h) continue;
    casters.push({ img: spr.day, bx: px, by: bottom, ox: 0, oy: -img.height + 2 });
    if (spr.meta && night > 0.05) {
      for (const [wx, wy] of spr.meta.windows) lights.push({ x: px + wx, y: top + wy, r: 36, a: night * 0.9, kind: 'warm' });
      lights.push({ x: px + spr.meta.door[0], y: top + spr.meta.door[1] + 10, r: 26, a: night * 0.5, kind: 'warm' });
    }
    if (s.kind === 'smith') lights.push({ x: px + 64, y: top + 6, r: 30, a: 0.4 + night * 0.4, kind: 'warm' });
    if (s.kind === 'cart' && night > 0.05) lights.push({ x: px + 32, y: top + 31, r: 40, a: night * 0.9, kind: 'warm' });
    if (s.kind === 'cave') lights.push({ x: px + 48, y: top + 30, r: 34, a: 0.4 + night * 0.6, kind: 'warm' });
    if (s.kind === 'fountain') lights.push({ x: px + 32, y: top + 36, r: 40, a: 0.15 + night * 0.35, kind: 'cool' });
    if (s.kind === 'bin') contact.push([px + 16, bottom - 2, 15, 3]);
    items.push({ y: bottom - 2, draw: () => ctx.drawImage(img, px, top) });
  }

  if (world.id === 'town') {
    for (const st of g.npcs) {
      if (!st.visible) continue;
      const frames = S.npcs[st.id][st.dir];
      const f = st.moving ? [1, 0, 2, 0][Math.floor(st.walkT * 8) % 4] : 0;
      const x = Math.round(st.x);
      const y = Math.round(st.y);
      contact.push([x, y - 1, 6, 2.2]);
      casters.push({ img: frames[f], bx: x, by: y, ox: -10, oy: -26 });
      items.push({ y, draw: () => ctx.drawImage(frames[f], x - 10, y - 26) });
    }
  }
  if (world.id === 'farm') {
    for (const a of g.animals) {
      const fr = a.kind === 'chicken' ? S.chicken : S.cow;
      const imgs = fr[a.dir];
      const f = a.moving ? Math.floor(a.walkT * 6) % 2 : 0;
      const img = imgs[f];
      const x = Math.round(a.x);
      const y = Math.round(a.y);
      contact.push([x, y - 1, a.kind === 'cow' ? 11 : 5, 2.2]);
      casters.push({ img, bx: x, by: y, ox: -Math.floor(img.width / 2), oy: -img.height + 1 });
      items.push({
        y,
        draw: () => {
          ctx.drawImage(img, x - Math.floor(img.width / 2), y - img.height + 1);
          if (a.ready) {
            const bob = Math.round(Math.sin(t * 4 + a.id) * 1.5);
            ctx.fillStyle = 'rgba(246,236,216,0.92)';
            ctx.fillRect(x - 6, y - img.height - 14 + bob, 12, 11);
            ctx.drawImage(getIconCanvas(a.kind === 'chicken' ? 'egg' : 'milk'), x - 5, y - img.height - 13 + bob, 10, 10);
          }
        }
      });
    }
  }
  for (const m of g.monsters) {
    const frames = m.kind === 'slime' ? world.floor >= 6 ? S.slimeDeep : S.slime : S.bat;
    const f = Math.floor(t * (m.kind === 'bat' ? 10 : 3) + m.seed) % 2;
    const img = frames[f];
    const x = Math.round(m.x);
    const hover = m.kind === 'bat' ? 10 + Math.round(Math.sin(t * 4 + m.seed) * 2) : 0;
    const y = Math.round(m.y);
    contact.push([x, y, m.kind === 'bat' ? 4 : 7, 2]);
    lights.push({ x, y: y - 6 - hover, r: 18, a: 0.35, kind: m.kind === 'slime' ? 'green' : 'violet' });
    items.push({
      y,
      draw: () => {
        if (m.hurt > 0 && Math.floor(t * 30) % 2 === 0) ctx.globalAlpha = 0.4;
        ctx.drawImage(img, x - Math.floor(img.width / 2), y - img.height + 2 - hover);
        ctx.globalAlpha = 1;
        if (m.hp < m.max) {
          ctx.fillStyle = 'rgba(10,8,18,0.8)';
          ctx.fillRect(x - 7, y - img.height - 4 - hover, 14, 2);
          ctx.fillStyle = '#ff5a4a';
          ctx.fillRect(x - 7, y - img.height - 4 - hover, Math.round(14 * m.hp / m.max), 2);
        }
      }
    });
  }

  const pf = player.moving ? [1, 0, 2, 0][Math.floor(player.walkT * 9) % 4] : 0;
  contact.push([player.x, player.y - 1, 6, 2.2]);
  casters.push({ img: S.player[player.dir][pf], bx: Math.round(player.x), by: Math.round(player.y), ox: -10, oy: -26 });
  items.push({ y: player.y, draw: () => drawPlayer(ctx, g, bank, pf) });

  // Directional sun shadows composited once so overlaps never double-darken.
  if (sun.strength > 0.01) {
    shadowCtx.setTransform(1, 0, 0, 1, 0, 0);
    shadowCtx.clearRect(0, 0, v.w, v.h);
    for (const c of casters) {
      shadowCtx.setTransform(1, 0, -sun.dx, -sun.dy, c.bx - v.x, c.by - v.y);
      shadowCtx.drawImage(silhouette(c.img), c.ox, c.oy);
    }
    shadowCtx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = sun.strength;
    ctx.drawImage(shadowCtx.canvas, 0, 0);
    ctx.globalAlpha = 1;
    base();
  }
  ctx.fillStyle = world.dark ? 'rgba(4,2,10,0.5)' : 'rgba(10,18,34,0.32)';
  for (const [x, y, rx, ry] of contact) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTarget(ctx, g);

  items.sort((a, b) => a.y - b.y);
  for (const d of items) d.draw();

  drawFishing(ctx, g);
  drawParticles(ctx, g.particles.list, t, lights);
  if ((night > 0.3 || world.dark) && g.mode !== 'title') lights.push({ x: player.x, y: player.y - 10, r: world.dark ? 92 : 64, a: world.dark ? 0.95 : night * 0.42, kind: 'warm' });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return lights;
}

function drawTarget(ctx: CanvasRenderingContext2D, g: FarmGame): void {
  if (g.mode !== 'play' || !g.target || g.fishing || g.player.action) return;
  const st = g.inv[g.selected];
  if (st && st.id === 'sword') return;
  const tiles = lineTiles(g, g.target.x, g.target.y, st ? st.id : '');
  const a = 0.6 + Math.sin(g.elapsed * 5) * 0.15;
  for (const { x, y } of tiles) {
    const px = x * TILE;
    const py = y * TILE;
    ctx.fillStyle = 'rgba(255,240,200,0.1)';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = `rgba(255,244,214,${a})`;
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

function drawPlayer(ctx: CanvasRenderingContext2D, g: FarmGame, bank: SpriteBank, f: number): void {
  const pl = g.player;
  const frames = bank.shared.player[pl.dir];
  const x = Math.round(pl.x);
  const y = Math.round(pl.y);
  const holding = !!pl.action || !!g.fishing;
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
  if (id === 'rod' && !act) ang = 0.1;
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

function drawFishing(ctx: CanvasRenderingContext2D, g: FarmGame): void {
  const f = g.fishing;
  if (!f) return;
  const pl = g.player;
  const tips: Record<string, [number, number]> = { right: [12, -22], left: [-12, -22], down: [9, -14], up: [-9, -28] };
  const [ox, oy] = tips[pl.dir];
  const sx = Math.round(pl.x) + ox;
  const sy = Math.round(pl.y) + oy;
  const bite = f.phase === 'bite';
  const bob = bite ? 1 + Math.round(Math.sin(g.elapsed * 30)) : Math.round(Math.sin(g.elapsed * 3) * 0.6);
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
  ctx.fillRect(bx - 1, by - 1, 2, 2);
  if (bite) {
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(bx, by - 12, 1, 5);
    ctx.fillRect(bx, by - 6, 1, 1);
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, list: Particle[], t: number, lights: LightSource[]): void {
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
        ctx.arc(p.x, p.y - p.z, p.size, 0, Math.PI * 2);
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
          const r = (p.kind === 'ripple' ? 7 : 2.5) * k + 1;
          ctx.globalAlpha = (1 - k) * 0.7;
          ctx.strokeStyle = '#dff6ff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, r, r * 0.45, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
    }
  }
  ctx.globalAlpha = 1;
}

export function drawLights(lctx: CanvasRenderingContext2D, bank: SpriteBank, v: ViewRect, lights: LightSource[]): void {
  lctx.setTransform(1, 0, 0, 1, 0, 0);
  lctx.globalCompositeOperation = 'source-over';
  lctx.globalAlpha = 1;
  lctx.fillStyle = '#000';
  lctx.fillRect(0, 0, v.w, v.h);
  lctx.setTransform(1, 0, 0, 1, -v.x, -v.y);
  lctx.globalCompositeOperation = 'lighter';
  for (const l of lights) {
    if (l.a <= 0.01) continue;
    if (l.x + l.r < v.x || l.x - l.r > v.x + v.w || l.y + l.r < v.y || l.y - l.r > v.y + v.h) continue;
    lctx.globalAlpha = Math.min(1, l.a);
    lctx.drawImage(bank.shared.lights[l.kind], l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  lctx.globalAlpha = 1;
  lctx.globalCompositeOperation = 'source-over';
  lctx.setTransform(1, 0, 0, 1, 0, 0);
}