import type { FarmGame } from './FarmGame';
import type { SpriteBank } from '../sprites/bank';
import type { World } from '../../types/game';
import type { Caster, Drawable, FrameInfo, LightSource, SunState, ViewRect } from './renderTypes';
import { silhouette } from '../sprites/bank';
import { TILE } from './constants';
import { cropStage, isMature } from './farmActions';
import { getIconCanvas } from '../sprites/iconCache';
import { processing } from '../../data/recipes';
import { drawCastMeter, drawFishing, drawParticles, drawPlayer, drawTarget } from './renderActors';
import { drawFishSpots, drawReflections, drawSparkles, waterInView } from './water';
import { collectLife, drawLifeOverlay } from './renderLife';

export type { LightSource, SunState, ViewRect } from './renderTypes';

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

const FLOOR_Y = 3 * TILE;

function windowBeams(ctx: CanvasRenderingContext2D, world: World, dayNight: number, patch: boolean): void {
  const a = 1 - dayNight;
  if (a < 0.05) return;
  for (const s of world.structures) {
    if (s.prop !== 'window') continue;
    const cx = s.x * TILE + 8;
    const wb = (s.y + s.h) * TILE - 4;
    const slant = 12;
    ctx.fillStyle = '#ffeec4';
    ctx.beginPath();
    if (patch) {
      ctx.globalAlpha = 0.16 * a;
      ctx.moveTo(cx - 7 + slant * 0.6, FLOOR_Y + 14);
      ctx.lineTo(cx + 7 + slant * 0.6, FLOOR_Y + 14);
      ctx.lineTo(cx + 9 + slant, FLOOR_Y + 32);
      ctx.lineTo(cx - 9 + slant, FLOOR_Y + 32);
    } else {
      ctx.globalAlpha = 0.07 * a;
      ctx.moveTo(cx - 7, wb - 14);
      ctx.lineTo(cx + 7, wb - 14);
      ctx.lineTo(cx + 9 + slant, FLOOR_Y + 32);
      ctx.lineTo(cx - 9 + slant, FLOOR_Y + 32);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * Builds and paints one frame of the world. Sprites are always placed on whole pixels and nothing
 * sways on a timer — foliage only reacts when something touches it (a chop, or the player brushing
 * through grass), which keeps the picture rock steady like Stardew.
 */
export function drawWorld(
ctx: CanvasRenderingContext2D,
shadowCtx: CanvasRenderingContext2D,
reflCtx: CanvasRenderingContext2D,
g: FarmGame,
bank: SpriteBank,
ground: HTMLCanvasElement,
patterns: CanvasPattern[],
f: FrameInfo)
: LightSource[] {
  const { world, player } = g;
  const v = f.view;
  const night = f.night;
  const sun = f.sun;
  const S = bank.shared;
  const t = g.elapsed;
  const lights: LightSource[] = [];
  const casters: Caster[] = [];
  const mirrors: Caster[] = [];
  const items: Drawable[] = [];
  const contact: [number, number, number, number][] = [];
  const outdoor = !world.dark && !world.indoor;
  const isNight = f.dayNight > 0.35;
  const base = () => ctx.setTransform(1, 0, 0, 1, -v.x, -v.y);
  const skew = (px: number, py: number, k: number) => ctx.setTransform(1, 0, k, 1, Math.round(px) - v.x, Math.round(py) - v.y);
  const cast = (c: Caster, shadow = true) => {
    if (shadow) casters.push(c);
    mirrors.push(c);
  };
  const px = Math.round(player.x);
  const py = Math.round(player.y);

  const tx0 = Math.max(0, Math.floor(v.x / TILE) - 3);
  const tx1 = Math.min(world.w - 1, Math.ceil((v.x + v.w) / TILE) + 3);
  const ty0 = Math.max(0, Math.floor(v.y / TILE) - 1);
  const ty1 = Math.min(world.h - 1, Math.ceil((v.y + v.h) / TILE) + 7);

  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const i = ty * world.w + tx;
      const o = world.objects[i];
      const bx = tx * TILE + 8;
      const by = ty * TILE + 14;
      if (o) {
        const shake = Math.max(0, o.shake - t);
        const sh = shake > 0 ? Math.round(Math.sin(t * 60) * shake * 5) : 0;
        switch (o.kind) {
          case 'tree':{
              const spr = bank.trees[o.variant % bank.trees.length];
              contact.push([bx, by, 9, 3]);
              cast({ img: spr.trunk, bx, by, ox: -24, oy: -61 });
              cast({ img: spr.canopy, bx, by, ox: -24, oy: -61 });
              const behind = py < by - 2 && py > by - 58 && Math.abs(px - bx) < 20;
              items.push({
                y: by,
                draw: () => {
                  ctx.drawImage(spr.trunk, bx - 24 + Math.round(sh * 0.4), by - 61);
                  if (behind) ctx.globalAlpha = 0.45;
                  ctx.drawImage(spr.canopy, bx - 24 + sh, by - 61);
                  ctx.globalAlpha = 1;
                }
              });
              break;
            }
          case 'stump':
            contact.push([bx, by, 7, 2.5]);
            cast({ img: bank.stumps[o.variant % 3], bx, by, ox: -8, oy: -14 });
            items.push({ y: by, draw: () => ctx.drawImage(bank.stumps[o.variant % 3], bx - 8 + sh, by - 14) });
            break;
          case 'rock':{
              const img = bank.rocks[o.variant % 8];
              contact.push([bx, by - 1, 8, 2.5]);
              cast({ img, bx, by, ox: -9, oy: -13 });
              if (o.variant >= 3 && world.dark) lights.push({ x: bx, y: by - 6, r: 16, a: 0.35, kind: o.variant === 4 ? 'warm' : o.variant === 3 ? 'violet' : 'cool' });
              items.push({ y: by, draw: () => ctx.drawImage(img, bx - 9 + sh, by - 13) });
              break;
            }
          case 'crystal':{
              const img = S.crystals[o.variant % 2];
              lights.push({ x: bx, y: by - 8, r: 46, a: 0.8, kind: o.variant ? 'cool' : 'violet' });
              items.push({ y: by, draw: () => ctx.drawImage(img, bx - 9 + sh, by - 20) });
              break;
            }
          case 'torch':{
              const fl = 0.88 + Math.sin(t * 9 + tx) * 0.05;
              lights.push({ x: bx, y: by - 12, r: 78, a: fl, kind: 'warm' });
              if (Math.random() < 0.2) g.particles.spawn('spark', bx + (Math.random() - 0.5) * 4, by - 9, { z: 0, vz: 18 + Math.random() * 10, life: 0.6, color: Math.random() < 0.5 ? '#ffb040' : '#fff0a0' });
              items.push({
                y: by,
                draw: () => {
                  ctx.drawImage(S.brazier, bx - 7, by - 18);
                  ctx.fillStyle = '#ffcf5a';
                  const fh = 4 + Math.floor(t * 8 + tx) % 3;
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
            cast({ img: bank.bushes[o.variant % 2], bx, by: by + 1, ox: -13, oy: -21 });
            items.push({ y: by, draw: () => ctx.drawImage(bank.bushes[o.variant % 2], bx - 13 + sh, by - 20) });
            break;
          case 'weed':
            items.push({ y: by, draw: () => ctx.drawImage(bank.weeds[o.variant % 3], bx - 8, by - 15) });
            break;
          case 'forage':{
              const img = getIconCanvas(o.item ?? 'forage_herb');
              contact.push([bx, by - 1, 5, 1.8]);
              items.push({ y: by - 2, draw: () => ctx.drawImage(img, bx - 8, by - 16) });
              break;
            }
          case 'sprinkler':
            contact.push([bx, by - 1, 5, 2]);
            items.push({ y: by, draw: () => ctx.drawImage(getIconCanvas('sprinkler'), bx - 8, by - 15) });
            break;
          case 'jar':{
              contact.push([bx, by, 6, 2]);
              cast({ img: S.jar, bx, by: by + 1, ox: -8, oy: -21 });
              const ready = !!(o.item && o.ready);
              if (ready) lights.push({ x: bx, y: by - 22, r: 18, a: 0.5, kind: 'warm' });
              items.push({
                y: by,
                draw: () => {
                  ctx.drawImage(S.jar, bx - 8, by - 20);
                  if (ready && o.item) {
                    const bob = Math.floor(t * 2) % 2;
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
              const on = night > 0.3 || world.dark;
              const img = on ? S.lampOn : S.lampOff;
              cast({ img, bx, by: by + 1, ox: -6, oy: -34 });
              if (night > 0.05) lights.push({ x: bx, y: by - 26, r: 64, a: night * 0.96, kind: 'warm', base: by });
              items.push({ y: by, draw: () => ctx.drawImage(img, bx - 6, by - 33) });
              break;
            }
        }
      }
      const c = world.crops[i];
      if (c) {
        const img = S.crops[c.id][cropStage(c)];
        const st = cropStage(c);
        if (st >= 2) contact.push([bx, by, 5, 1.6]);
        if (st >= 3) cast({ img, bx, by: by + 1, ox: -11, oy: -32 });
        if (c.id === 'moonbloom' && isMature(c)) lights.push({ x: bx, y: by - 10, r: 32, a: 0.25 + night * 0.75, kind: 'cool' });
        items.push({ y: by - 1, draw: () => ctx.drawImage(img, bx - 11, by - 31) });
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
    // Grass only leans while the player is brushing through it.
    const push = ddx * ddx + ddy * ddy < 60 ? ddx > 0 ? 0.3 : -0.3 : 0;
    const dx = Math.round(d.x);
    const dy = Math.round(d.y);
    items.push({
      y: d.y,
      draw: () => {
        if (push) {
          skew(dx, dy, push);
          ctx.drawImage(img, -Math.floor(img.width / 2), -img.height);
          base();
        } else ctx.drawImage(img, dx - Math.floor(img.width / 2), dy - img.height);
      }
    });
  }

  for (const s of world.structures) {
    if (s.kind === 'furniture') {
      const bottom = (s.y + s.h) * TILE;
      if (s.npc) {
        const frames = S.npcs[s.npc];
        if (!frames) continue;
        const x = s.x * TILE + 8;
        const y = bottom - 2;
        contact.push([x, y - 1, 6, 2.2]);
        items.push({ y, draw: () => ctx.drawImage(frames.down[0], x - 10, y - 26) });
        continue;
      }
      const fs = S.furniture[s.prop ?? ''];
      if (!fs) continue;
      const img = isNight && fs.night ? fs.night : fs.img;
      const fpx = s.x * TILE + Math.round((s.w * TILE - img.width) / 2);
      const top = bottom - img.height;
      for (const L of fs.lights) {
        const fl = L.flicker ? 0.9 + Math.sin(t * 7 + s.x) * 0.05 : 1;
        lights.push({ x: fpx + L.x, y: top + L.y, r: L.r, a: L.a * fl, kind: L.kind });
        if (L.flicker && Math.random() < 0.06) g.particles.spawn('spark', fpx + L.x + (Math.random() - 0.5) * 8, top + L.y, { z: 0, vz: 14 + Math.random() * 10, life: 0.7, color: '#ffc060' });
      }
      if (s.prop === 'window' && f.dayNight < 0.9) {
        const cx = s.x * TILE + 8;
        lights.push({ x: cx + 14, y: FLOOR_Y + 22, r: 44, a: (1 - f.dayNight) * 0.55, kind: 'warm' });
      }
      if (s.y >= 3) contact.push([fpx + img.width / 2, bottom - 1, img.width * 0.42, 2.4]);
      items.push({ y: bottom - 1, draw: () => ctx.drawImage(img, fpx, top) });
      continue;
    }
    const key = s.kind === 'cottage' ? `cottage${s.variant ?? 0}` : s.kind;
    const spr = bank.structures[key];
    if (!spr) continue;
    const img = isNight ? spr.night : spr.day;
    const spx = s.x * TILE + spr.offX;
    const bottom = (s.y + s.h) * TILE;
    const top = bottom - img.height + 2;
    casters.push({ img: spr.day, bx: spx, by: bottom, ox: 0, oy: -img.height + 2 });
    mirrors.push({ img, bx: spx, by: bottom, ox: 0, oy: -img.height + 2 });
    if (spx > v.x + v.w || spx + img.width < v.x || bottom + 4 < v.y || top > v.y + v.h) continue;
    if (spr.meta && night > 0.05) {
      for (const [wx, wy] of spr.meta.windows) lights.push({ x: spx + wx, y: top + wy, r: 38, a: night * 0.9, kind: 'warm', base: bottom });
      for (const [lx, ly] of spr.meta.lamps) lights.push({ x: spx + lx, y: top + ly, r: 30, a: night * 0.92, kind: 'warm', base: bottom });
      lights.push({ x: spx + spr.meta.door[0], y: top + spr.meta.door[1] + 10, r: 26, a: night * 0.5, kind: 'warm' });
    }
    if (s.kind === 'smith') lights.push({ x: s.x * TILE + 64, y: top + 6, r: 30, a: 0.4 + night * 0.4, kind: 'warm' });
    if (s.kind === 'cart' && night > 0.05) lights.push({ x: spx + 32, y: top + 31, r: 40, a: night * 0.9, kind: 'warm' });
    if (s.kind === 'cave') lights.push({ x: spx + 48, y: top + 30, r: 34, a: 0.4 + night * 0.6, kind: 'warm' });
    if (s.kind === 'fountain') lights.push({ x: spx + 32, y: top + 36, r: 40, a: 0.15 + night * 0.35, kind: 'cool' });
    if (s.kind === 'bin') contact.push([spx + 16, bottom - 2, 15, 3]);
    items.push({ y: bottom - 2, draw: () => ctx.drawImage(img, spx, top) });
  }

  if (world.id === 'town') {
    for (const st of g.npcs) {
      if (!st.visible) continue;
      const frames = S.npcs[st.id][st.dir];
      const fi = st.moving ? [1, 0, 2, 0][Math.floor(st.walkT * 8) % 4] : 0;
      const x = Math.round(st.x);
      const y = Math.round(st.y);
      contact.push([x, y - 1, 6, 2.2]);
      cast({ img: frames[fi], bx: x, by: y, ox: -10, oy: -26 });
      items.push({ y, draw: () => ctx.drawImage(frames[fi], x - 10, y - 26) });
    }
  }
  if (world.id === 'farm') {
    for (const a of g.animals) {
      const fr = a.kind === 'chicken' ? S.chicken : S.cow;
      const img = fr[a.dir][a.moving ? Math.floor(a.walkT * 6) % 2 : 0];
      const x = Math.round(a.x);
      const y = Math.round(a.y);
      contact.push([x, y - 1, a.kind === 'cow' ? 11 : 5, 2.2]);
      cast({ img, bx: x, by: y, ox: -Math.floor(img.width / 2), oy: -img.height + 1 });
      items.push({
        y,
        draw: () => {
          ctx.drawImage(img, x - Math.floor(img.width / 2), y - img.height + 1);
          if (a.ready) {
            const bob = Math.floor(t * 2 + a.id) % 2;
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
    const img = frames[Math.floor(t * (m.kind === 'bat' ? 10 : 3) + m.seed) % 2];
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
  contact.push([px, py - 1, 6, 2.2]);
  cast({ img: S.player[player.dir][pf], bx: px, by: py, ox: -10, oy: -26 });
  items.push({ y: player.y, draw: () => drawPlayer(ctx, g, bank, pf) });
  collectLife(ctx, g, bank, { items, lights, mirrors, contact });

  // ---------- paint ----------
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = false;
  base();
  if (patterns.length && outdoor) {
    ctx.fillStyle = patterns[Math.floor(t * 5) % patterns.length];
    ctx.fillRect(v.x, v.y, v.w, v.h);
    if (waterInView(world, v)) {
      drawReflections(ctx, reflCtx, mirrors, v, t, g.season() === 'winter' ? '#5f8aa6' : '#1d5a74', 0.62 - night * 0.2);
      drawSparkles(ctx, world, v, t, night);
      base();
    }
  } else {
    ctx.fillStyle = world.indoor ? '#120d16' : '#0c0a12';
    ctx.fillRect(v.x, v.y, v.w, v.h);
  }
  const sx = Math.max(0, v.x);
  const sy = Math.max(0, v.y);
  const ex = Math.min(ground.width, v.x + v.w);
  const ey = Math.min(ground.height, v.y + v.h);
  if (ex > sx && ey > sy) ctx.drawImage(ground, sx, sy, ex - sx, ey - sy, sx, sy, ex - sx, ey - sy);

  const tilledAt = (x: number, y: number) => x >= 0 && y >= 0 && x < world.w && y < world.h && world.tilled[y * world.w + x] === 1;
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const i = ty * world.w + tx;
      if (!world.tilled[i]) continue;
      const m = (tilledAt(tx, ty - 1) ? 1 : 0) | (tilledAt(tx + 1, ty) ? 2 : 0) | (tilledAt(tx, ty + 1) ? 4 : 0) | (tilledAt(tx - 1, ty) ? 8 : 0);
      ctx.drawImage((world.watered[i] ? S.soilWet : S.soilDry)[m], tx * TILE, ty * TILE);
    }
  }
  if (outdoor) {
    drawFishSpots(ctx, world, v, t);
    base();
  }
  if (world.indoor) windowBeams(ctx, world, f.dayNight, true);

  if (sun.strength > 0.01 && outdoor) {
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
  ctx.fillStyle = world.dark ? 'rgba(4,2,10,0.5)' : world.indoor ? 'rgba(20,10,20,0.35)' : 'rgba(10,18,34,0.32)';
  for (const [x, y, rx, ry] of contact) {
    ctx.beginPath();
    ctx.ellipse(Math.round(x), Math.round(y), rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTarget(ctx, g);
  items.sort((a, b) => a.y - b.y);
  for (const d of items) d.draw();
  base();
  if (world.indoor) windowBeams(ctx, world, f.dayNight, false);
  drawFishing(ctx, g);
  drawCastMeter(ctx, g);
  drawParticles(ctx, g.particles.list, t, lights);
  drawLifeOverlay(ctx, g);

  if (outdoor) {
    const n = lights.length;
    for (let k = 0; k < n; k++) {
      const l = lights[k];
      if (l.base === undefined) continue;
      const my = 2 * l.base - l.y;
      const mtx = Math.floor(l.x / TILE);
      const mty = Math.floor(my / TILE);
      if (mtx >= 0 && mty >= 0 && mtx < world.w && mty < world.h && world.ground[mty * world.w + mtx] === 'water') lights.push({ x: l.x, y: my, r: l.r * 0.75, a: l.a * 0.5, kind: l.kind });
    }
  }
  if ((night > 0.3 || world.dark) && g.mode !== 'title' && !world.indoor) lights.push({ x: px, y: py - 10, r: world.dark ? 92 : 64, a: world.dark ? 0.95 : night * 0.42, kind: 'warm' });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return lights;
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
    lctx.drawImage(bank.shared.lights[l.kind], Math.round(l.x - l.r), Math.round(l.y - l.r), Math.round(l.r * 2), Math.round(l.r * 2));
  }
  lctx.globalAlpha = 1;
  lctx.globalCompositeOperation = 'source-over';
  lctx.setTransform(1, 0, 0, 1, 0, 0);
}