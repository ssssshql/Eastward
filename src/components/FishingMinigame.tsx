import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { FishResult } from '../types/game';
import { fishList } from '../data/fish';
import { getItem } from '../utils/items';
import { ItemIcon } from './ItemIcon';

interface FishingMinigameProps {
  fishId: string;
  onFinish: (r: FishResult) => void;
}

interface Sim {
  bar: number;
  vel: number;
  fish: number;
  fvel: number;
  target: number;
  timer: number;
  progress: number;
  hold: boolean;
  done: boolean;
  t: number;
  perfect: boolean;
  chestAt: number;
  chest: {y: number;p: number;got: boolean;} | null;
}

const FISH = 24;
const EASE = [0.23, 1, 0.32, 1] as const;

/** Stardew-style reel-in: keep the green bar on the fish until the meter fills; grab treasure if it appears. */
export function FishingMinigame({ fishId, onFinish }: FishingMinigameProps) {
  const def = fishList.find((f) => f.id === fishId) ?? fishList[0];
  const d = def.difficulty;
  const [track] = useState(() => Math.max(200, Math.min(300, window.innerHeight - 110)));
  const zoneH = Math.round(track * (0.31 - d * 0.11));
  const [, force] = useState(0);
  const [result, setResult] = useState<FishResult | null>(null);
  const sim = useRef<Sim>({ bar: 0, vel: 0, fish: track * 0.3, fvel: 0, target: track * 0.3, timer: 0, progress: 0.3, hold: false, done: false, t: 0, perfect: true, chestAt: Math.random() < 0.3 ? 1 + Math.random() * 2.5 : -1, chest: null });
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    const s = sim.current;
    const top = track - FISH;
    const end = (ok: boolean) => {
      if (s.done) return;
      s.done = true;
      const [lo, hi] = def.size;
      const q = Math.min(1, 0.2 + Math.random() * 0.6 + (s.perfect ? 0.2 : 0));
      const r: FishResult = { success: ok, size: Math.round(lo + (hi - lo) * q), perfect: ok && s.perfect, treasure: ok && !!s.chest?.got };
      setResult(r);
      window.setTimeout(() => finishRef.current(r), ok ? 1100 : 700);
    };
    const kd = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        s.hold = true;
      } else if (e.key === 'Escape') end(false);
    };
    const ku = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'j' || e.key === 'J') s.hold = false;
    };
    const pd = () => s.hold = true;
    const pu = () => s.hold = false;
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('pointerdown', pd);
    window.addEventListener('pointerup', pu);
    window.addEventListener('pointercancel', pu);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (!s.done) {
        s.t += dt;
        s.vel = Math.max(-380, Math.min(380, s.vel + (s.hold ? 720 : -620) * dt));
        s.bar += s.vel * dt;
        if (s.bar < 0) {
          s.bar = 0;
          s.vel = s.vel < -120 ? -s.vel * 0.35 : 0;
        }
        if (s.bar > track - zoneH) {
          s.bar = track - zoneH;
          s.vel = Math.min(0, -s.vel * 0.25);
        }
        s.timer -= dt;
        if (s.timer <= 0) {
          const r = Math.random();
          switch (def.behavior) {
            case 'dart':
              s.timer = 0.25 + r * (0.9 - d * 0.5);
              s.target = Math.max(0, Math.min(top, s.fish + (Math.random() - 0.5) * top * 1.1));
              break;
            case 'smooth':
              s.timer = 1 + r * 1.4;
              s.target = Math.random() * top;
              break;
            case 'sinker':
              s.timer = 0.5 + r * 1.2;
              s.target = Math.random() * Math.random() * top;
              break;
            case 'floater':
              s.timer = 0.5 + r * 1.2;
              s.target = top - Math.random() * Math.random() * top;
              break;
            default:
              s.timer = 0.5 + r * (1.6 - d);
              s.target = Math.random() * top;
          }
        }
        const k = def.behavior === 'smooth' ? 6 : def.behavior === 'dart' ? 40 + d * 30 : 14 + d * 18;
        s.fvel += (s.target - s.fish) * k * dt;
        s.fvel *= Math.exp(-dt * (def.behavior === 'smooth' ? 3 : 6));
        s.fish = Math.max(0, Math.min(top, s.fish + s.fvel * dt));
        const c = s.fish + FISH / 2;
        const inZone = c >= s.bar - 3 && c <= s.bar + zoneH + 3;
        s.progress += inZone ? 0.3 * dt : -(0.16 + d * 0.12) * dt;
        if (!inZone) s.perfect = false;
        if (s.chestAt > 0 && !s.chest && s.t >= s.chestAt) s.chest = { y: Math.random() * (track - 24), p: 0, got: false };
        if (s.chest && !s.chest.got) {
          const cc = s.chest.y + 10;
          const on = cc >= s.bar && cc <= s.bar + zoneH;
          s.chest.p = Math.max(0, Math.min(1, s.chest.p + (on ? 0.6 : -0.25) * dt));
          if (s.chest.p >= 1) s.chest.got = true;
        }
        if (s.progress >= 1) {
          s.progress = 1;
          end(true);
        } else if (s.progress <= 0) {
          s.progress = 0;
          end(false);
        }
        force((n) => n + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('pointerdown', pd);
      window.removeEventListener('pointerup', pu);
      window.removeEventListener('pointercancel', pu);
    };
  }, [d, def, track, zoneH]);

  const s = sim.current;
  const c = s.fish + FISH / 2;
  const inZone = c >= s.bar - 3 && c <= s.bar + zoneH + 3;
  const meter = s.progress < 0.3 ? 'bg-berry' : s.progress < 0.7 ? 'bg-amber' : 'bg-sage';
  const item = getItem(fishId);
  return (
    <motion.div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0c0705]/40 p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
      <motion.section aria-label="钓鱼" className="flex items-center gap-3" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, ease: EASE }}>
        <div className="px-wood flex gap-2">
          <div className="relative w-14 overflow-hidden border-2 border-wood-ink bg-[#1b4a63]" style={{ height: track }}>
            {[0.18, 0.42, 0.66].map((y) => <div key={y} className="absolute inset-x-0 h-[2px] bg-[#2a6582]" style={{ top: `${y * 100}%` }} />)}
            <div className="absolute inset-x-0 bottom-0 h-3 bg-[#5a4a3a]" />
            <div className="absolute bottom-3 left-2 h-4 w-1 bg-[#3f8a4a]" />
            <div className="absolute bottom-3 right-3 h-6 w-1 bg-[#3f8a4a]" />
            <div className={`absolute inset-x-1 border-2 ${inZone ? 'border-[#c8ffb0] bg-sage/75' : 'border-sage-deep bg-sage/40'}`} style={{ bottom: s.bar, height: zoneH }} />
            {s.chest && !s.chest.got &&
            <div className="absolute left-1/2 h-5 w-6 -translate-x-1/2 border-2 border-wood-ink bg-[#b06a2a]" style={{ bottom: s.chest.y }}>
                <div className="h-1 w-full bg-brass bg-[#f0c060]" />
                <div className="absolute -bottom-2 left-0 h-1 bg-amber" style={{ width: `${s.chest.p * 100}%` }} />
              </div>
            }
            <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: s.fish }}>
              <ItemIcon id={fishId} size={FISH} className={result ? '' : 'brightness-0 opacity-80'} />
            </div>
          </div>
          <div className="relative w-3 border-2 border-wood-ink bg-ink-3" style={{ height: track }}>
            <div className={`absolute inset-x-0 bottom-0 ${meter}`} style={{ height: `${s.progress * 100}%` }} />
          </div>
        </div>
        <div className="panel flex w-52 flex-col p-5 sm:w-60" style={{ minHeight: Math.min(track, 220) }}>
          {result?.success ?
          <>
              <p className="text-xs text-cream-dim">钓到了！</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="slot flex h-14 w-14 items-center justify-center">
                  <ItemIcon id={fishId} size={40} />
                </div>
                <div>
                  <h2 className="font-display text-xl font-black">{item.name}</h2>
                  <p className="font-pixel text-lg text-amber">{result.size} 厘米</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                {result.perfect && <span className="plate px-2 py-0.5">完美收线</span>}
                {result.treasure && <span className="plate px-2 py-0.5">宝箱到手</span>}
              </div>
            </> :

          <>
              <p className="text-xs text-cream-dim">有东西上钩了</p>
              <h2 className="mt-1 font-display text-2xl font-black">{result ? '它逃走了……' : '？？？'}</h2>
              <p className="mt-3 text-sm leading-relaxed text-cream-dim">
                按住 <span className="keycap">空格</span> 或按住屏幕抬起绿框，让鱼留在框里，填满右侧的进度条。
              </p>
              {s.chest && !s.chest.got && <p className="mt-2 text-xs text-amber">出现了宝箱！把绿框移到宝箱上</p>}
              <p className="mt-auto pt-3 text-xs text-cream-dim">Esc 放弃</p>
            </>
          }
        </div>
      </motion.section>
    </motion.div>);

}