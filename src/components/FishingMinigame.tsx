import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { fishList } from '../data/fish';
import { getItem } from '../utils/items';
import { ItemIcon } from './ItemIcon';

interface FishingMinigameProps {
  fishId: string;
  onFinish: (success: boolean) => void;
}

const BAR = 300;
const FISH = 26;

export function FishingMinigame({ fishId, onFinish }: FishingMinigameProps) {
  const def = fishList.find((f) => f.id === fishId) ?? fishList[0];
  const d = def.difficulty;
  const zoneH = Math.round(84 - d * 30);
  const [, force] = useState(0);
  const [result, setResult] = useState<boolean | null>(null);
  const st = useRef({ zone: 40, vel: 0, fish: 120, target: 120, timer: 0, progress: 0.3, hold: false, done: false, t: 0 });
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    const s = st.current;
    const end = (ok: boolean) => {
      if (s.done) return;
      s.done = true;
      setResult(ok);
      window.setTimeout(() => finishRef.current(ok), 750);
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
    const md = () => s.hold = true;
    const mu = () => s.hold = false;
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('mousedown', md);
    window.addEventListener('mouseup', mu);
    window.addEventListener('touchstart', md);
    window.addEventListener('touchend', mu);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (!s.done) {
        s.t += dt;
        s.vel += (s.hold ? 640 : -540) * dt;
        s.vel = Math.max(-360, Math.min(360, s.vel));
        s.zone += s.vel * dt;
        if (s.zone < 0) {
          s.zone = 0;
          s.vel = Math.max(0, -s.vel * 0.35);
        }
        if (s.zone > BAR - zoneH) {
          s.zone = BAR - zoneH;
          s.vel = Math.min(0, -s.vel * 0.3);
        }
        s.timer -= dt;
        if (s.timer <= 0) {
          s.timer = 0.35 + Math.random() * (1.5 - d);
          s.target = Math.random() * (BAR - FISH);
        }
        s.fish += (s.target - s.fish) * Math.min(1, dt * (1.4 + d * 4)) + Math.sin(s.t * 13) * d * 1.4;
        s.fish = Math.max(0, Math.min(BAR - FISH, s.fish));
        const c = s.fish + FISH / 2;
        const inZone = c >= s.zone && c <= s.zone + zoneH;
        s.progress += inZone ? 0.3 * dt : -(0.16 + d * 0.1) * dt;
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
      window.removeEventListener('mousedown', md);
      window.removeEventListener('mouseup', mu);
      window.removeEventListener('touchstart', md);
      window.removeEventListener('touchend', mu);
    };
  }, [d, zoneH]);

  const s = st.current;
  const c = s.fish + FISH / 2;
  const inZone = c >= s.zone && c <= s.zone + zoneH;
  return (
    <motion.div className="absolute inset-0 z-30 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
      <motion.section
        aria-label="钓鱼"
        className="glass flex gap-5 p-5 text-cream"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}>
        
        <div className="relative w-16 overflow-hidden rounded-xl bg-[#173a4a]" style={{ height: BAR }}>
          {[0.2, 0.45, 0.7].map((y) =>
          <div key={y} className="absolute inset-x-2 h-px bg-mist/15" style={{ top: `${y * 100}%` }} />
          )}
          <div className={`absolute inset-x-1 rounded-lg border-2 ${inZone ? 'border-sage bg-sage/35' : 'border-sage/60 bg-sage/15'}`} style={{ bottom: s.zone, height: zoneH }} />
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: s.fish }}>
            <ItemIcon id={fishId} size={FISH} />
          </div>
        </div>
        <div className="relative w-2.5 overflow-hidden rounded-full bg-ink-3" style={{ height: BAR }}>
          <div className={`absolute inset-x-0 bottom-0 rounded-full ${s.progress > 0.25 ? 'bg-amber' : 'bg-berry'}`} style={{ height: `${s.progress * 100}%` }} />
        </div>
        <div className="flex w-44 flex-col justify-between py-1">
          <div>
            <p className="text-xs text-cream-dim">有东西上钩了</p>
            <h2 className="mt-1 font-display text-2xl">{result === null ? '？？？' : getItem(fishId).name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-cream-dim">按住 空格 或 鼠标 抬起绿框，让鱼待在框里，直到右侧进度条填满。</p>
          </div>
          <p className={`font-display text-lg ${result === true ? 'text-sage' : result === false ? 'text-berry' : 'text-cream-dim'}`}>
            {result === true ? '钓到啦！' : result === false ? '它逃走了……' : 'Esc 放弃'}
          </p>
        </div>
      </motion.section>
    </motion.div>);

}