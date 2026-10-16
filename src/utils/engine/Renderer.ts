import type { FarmGame } from './FarmGame';
import type { Weather, World } from '../../types/game';
import { getBank, getGround, SpriteBank } from '../sprites/bank';
import { drawLights, drawWorld, sunAt } from './render';
import { PostFX } from './postfx';
import { ambientAt, V3 } from './lighting';

interface Flake {
  x: number;
  y: number;
  s: number;
}

export interface RenderOptions {
  dof: boolean;
}

const MINE_AMBIENT: V3 = [0.17, 0.15, 0.26];

export class Renderer {
  private display: HTMLCanvasElement;
  private fx: PostFX | null;
  private ctx2d: CanvasRenderingContext2D | null = null;
  private scene = document.createElement('canvas');
  private sctx: CanvasRenderingContext2D;
  private light = document.createElement('canvas');
  private lctx: CanvasRenderingContext2D;
  private shadow = document.createElement('canvas');
  private shctx: CanvasRenderingContext2D;
  private bank: SpriteBank | null = null;
  private patternBank: SpriteBank | null = null;
  private patterns: CanvasPattern[] = [];
  private flakes: Flake[] = [];
  private flakeKind: Weather = 'clear';
  options: RenderOptions = { dof: true };
  scale = 3;
  viewW = 480;
  viewH = 270;

  constructor(display: HTMLCanvasElement) {
    this.display = display;
    this.fx = PostFX.create(display);
    if (!this.fx) this.ctx2d = display.getContext('2d');
    const s = this.scene.getContext('2d');
    const l = this.light.getContext('2d');
    const sh = this.shadow.getContext('2d');
    if (!s || !l || !sh) throw new Error('2d context unavailable');
    this.sctx = s;
    this.lctx = l;
    this.shctx = sh;
  }

  resize(w: number, h: number): void {
    if (w <= 0 || h <= 0) return;
    this.scale = Math.max(2, Math.round(Math.min(w / 470, h / 280)));
    this.display.width = w;
    this.display.height = h;
    this.viewW = w / this.scale;
    this.viewH = h / this.scale;
    for (const c of [this.scene, this.light, this.shadow]) {
      c.width = Math.ceil(this.viewW) + 2;
      c.height = Math.ceil(this.viewH) + 2;
    }
    this.sctx.imageSmoothingEnabled = false;
    this.shctx.imageSmoothingEnabled = false;
  }

  private ensureBank(g: FarmGame): SpriteBank {
    const bank = getBank(g.season(), g.seed);
    if (bank !== this.patternBank) {
      this.patternBank = bank;
      this.patterns = bank.water.map((c) => this.sctx.createPattern(c, 'repeat')).filter((p): p is CanvasPattern => !!p);
    }
    this.bank = bank;
    return bank;
  }

  private drawWeather(dt: number, weather: Weather, world: World): void {
    if (weather === 'clear' || world.dark) return;
    const W = this.scene.width;
    const H = this.scene.height;
    const want = weather === 'rain' ? 190 : 130;
    if (this.flakeKind !== weather || this.flakes.length !== want) {
      this.flakeKind = weather;
      this.flakes = Array.from({ length: want }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 0.6 + Math.random() * 0.8 }));
    }
    const c = this.sctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (weather === 'rain') {
      c.strokeStyle = 'rgba(196,220,246,0.5)';
      c.lineWidth = 1;
      c.beginPath();
      for (const f of this.flakes) {
        f.y += 300 * dt * f.s;
        f.x -= 80 * dt * f.s;
        if (f.y > H) {
          f.y -= H + 8;
          f.x = Math.random() * (W + 40);
        }
        if (f.x < -4) f.x += W + 8;
        c.moveTo(Math.round(f.x) + 0.5, Math.round(f.y));
        c.lineTo(Math.round(f.x - 2 * f.s) + 0.5, Math.round(f.y + 7 * f.s));
      }
      c.stroke();
    } else {
      c.fillStyle = 'rgba(250,252,255,0.92)';
      for (const f of this.flakes) {
        f.y += 22 * dt * f.s;
        f.x += Math.sin(f.y * 0.05 + f.s * 10) * 10 * dt;
        if (f.y > H) {
          f.y -= H + 4;
          f.x = Math.random() * W;
        }
        const sz = f.s > 1.1 ? 2 : 1;
        c.fillRect(Math.round(f.x), Math.round(f.y), sz, sz);
      }
    }
  }

  frame(g: FarmGame, dt: number): void {
    const bank = this.ensureBank(g);
    const ground = getGround(g.world, g.season());
    g.viewW = this.viewW;
    g.viewH = this.viewH;
    g.viewScale = this.scale;
    const fx = Math.floor(g.camX);
    const fy = Math.floor(g.camY);
    const view = { x: fx, y: fy, w: this.scene.width, h: this.scene.height };
    const dark = g.world.dark;
    const minutes = g.displayTime();
    const L = ambientAt(minutes, g.weather);
    const night = dark ? 1 : L.night;
    const ambient: V3 = dark ? MINE_AMBIENT : L.ambient;
    const weather = g.mode === 'title' ? 'clear' : g.weather;
    const sun = sunAt(minutes, L.night, weather !== 'clear', dark);
    const lights = drawWorld(this.sctx, this.shctx, g, bank, ground, this.patterns, view, night, sun);
    this.drawWeather(dt, weather, g.world);
    drawLights(this.lctx, bank, view, lights);

    const h = minutes / 60;
    const golden = Math.max(0, 1 - Math.abs(h - 7) / 1.6) + Math.max(0, 1 - Math.abs(h - 17.8) / 1.8);
    if (this.fx) {
      this.fx.render(this.scene, this.light, this.display.width, this.display.height, {
        viewW: this.viewW,
        viewH: this.viewH,
        fracX: g.camX - fx,
        fracY: g.camY - fy,
        camX: fx,
        camY: fy,
        sunX: sun.dx,
        sunY: sun.dy,
        time: g.elapsed,
        night,
        rain: weather === 'rain' ? 1 : 0,
        golden: Math.min(1, golden),
        outdoor: dark ? 0 : 1,
        hurt: Math.min(1, g.hurtT * 2.2),
        fade: g.fade,
        dof: this.options.dof ? 1 : 0,
        ambient
      });
    } else if (this.ctx2d) {
      const c = this.ctx2d;
      const s = this.scale;
      c.imageSmoothingEnabled = false;
      c.globalCompositeOperation = 'source-over';
      c.drawImage(this.scene, -(g.camX - fx) * s, -(g.camY - fy) * s, this.scene.width * s, this.scene.height * s);
      c.globalCompositeOperation = 'multiply';
      const a = ambient.map((x) => Math.round(Math.min(1, x) * 255));
      c.fillStyle = `rgb(${a[0]},${a[1]},${a[2]})`;
      c.fillRect(0, 0, this.display.width, this.display.height);
      c.globalCompositeOperation = 'source-over';
      if (g.fade > 0) {
        c.fillStyle = `rgba(0,0,0,${g.fade})`;
        c.fillRect(0, 0, this.display.width, this.display.height);
      }
    }
  }
}