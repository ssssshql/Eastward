import React, { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Prompt, PromptIcon } from '../types/game';
import type { TouchDirs } from '../hooks/useGame';
import { ItemIcon } from './ItemIcon';
import { PixelGlyph } from './PixelGlyph';

interface TouchControlsProps {
  prompt: Prompt | null;
  heldItem: string | null;
  canWater: number;
  canMax: number;
  onMove: (d: TouchDirs) => void;
  onUse: (down: boolean) => void;
  onInteract: () => void;
}

const RADIUS = 50;
const IDLE: TouchDirs = { up: false, down: false, left: false, right: false };
const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * Pixel-art touch controls that share the hotbar's chrome: a carved wooden joystick on the left,
 * and on the right a parchment "use" slot showing the held item plus a wooden "interact" plaque whose
 * glyph changes with what's in front of you (talk, door, gift, pick up…).
 */
export function TouchControls({ prompt, heldItem, canWater, canMax, onMove, onUse, onInteract }: TouchControlsProps) {
  const reduce = useReducedMotion();
  const padRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [usePressed, setUsePressed] = useState(false);
  const [actPressed, setActPressed] = useState(false);

  const update = (cx: number, cy: number) => {
    const el = padRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let dx = cx - (r.left + r.width / 2);
    let dy = cy - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = dx / len * RADIUS;
      dy = dy / len * RADIUS;
    }
    setKnob({ x: Math.round(dx), y: Math.round(dy) });
    const nx = dx / RADIUS;
    const ny = dy / RADIUS;
    if (Math.hypot(nx, ny) < 0.28) {
      onMove(IDLE);
      return;
    }
    onMove({ left: nx < -0.38, right: nx > 0.38, up: ny < -0.38, down: ny > 0.38 });
  };

  const release = () => {
    pointer.current = null;
    setKnob({ x: 0, y: 0 });
    onMove(IDLE);
  };

  const target = prompt ? prompt.key === 'E' ? 'act' : 'use' : null;
  const actIcon: PromptIcon = target === 'act' && prompt?.icon ? prompt.icon : 'hand';
  const hintIcon: PromptIcon = prompt?.icon ?? 'hand';

  return (
    <div className="pointer-events-none safe-inset z-20">
      <div
        ref={padRef}
        role="slider"
        aria-label="移动摇杆"
        aria-valuenow={0}
        className="pointer-events-auto absolute bottom-[64px] left-4 flex h-32 w-32 touch-none items-center justify-center sm:left-8 min-[800px]:bottom-4"
        onPointerDown={(e) => {
          pointer.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          update(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (pointer.current === e.pointerId) update(e.clientX, e.clientY);
        }}
        onPointerUp={release}
        onPointerCancel={release}>
        <div className="absolute inset-0 rounded-full border-[3px] border-wood-ink bg-[#2c1d16]/60 shadow-[inset_0_0_0_3px_#9a5f34,inset_0_4px_0_3px_rgba(214,150,90,0.45),inset_0_0_0_6px_#5a3520]" aria-hidden="true" />
        {[0, 90, 180, 270].map((r) =>
        <span key={r} className="absolute h-2 w-2 bg-wood-hi/70" style={{ transform: `rotate(${r}deg) translateY(-48px)` }} aria-hidden="true" />
        )}
        <div className="slot relative h-14 w-14" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} aria-hidden="true" />
      </div>

      <div className="absolute bottom-[64px] right-4 sm:right-8 min-[800px]:bottom-4">
        <div className="pointer-events-none absolute bottom-full right-0 mb-2 flex justify-end" aria-live="polite">
          <AnimatePresence mode="wait">
            {prompt &&
            <motion.div
              key={prompt.key + prompt.text}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: EASE }}
              className="px-wood flex items-center gap-2 whitespace-nowrap py-0.5 pl-1 pr-2 text-[13px] font-bold text-cream">
                <PixelGlyph name={hintIcon} size={18} className={target === 'act' ? 'text-sage' : 'text-amber'} />
                {prompt.text}
              </motion.div>
            }
          </AnimatePresence>
        </div>

        <div className="pointer-events-auto relative h-[150px] w-[172px]">
          <button
            type="button"
            aria-label={target === 'act' && prompt ? prompt.text : '互动'}
            data-pressed={actPressed}
            className={`px-btn absolute left-0 top-0 flex h-[68px] w-[68px] touch-none items-center justify-center ${target === 'act' ? 'px-wood-lit' : 'px-wood'}`}
            onPointerDown={(e) => {
              e.preventDefault();
              setActPressed(true);
              onInteract();
            }}
            onPointerUp={() => setActPressed(false)}
            onPointerCancel={() => setActPressed(false)}>
            <PixelGlyph name={actIcon} size={30} className={target === 'act' ? 'text-[#fff0b0]' : 'text-parch'} />
          </button>
          <span className="text-outline absolute left-0 top-[74px] w-[68px] text-center text-[11px] font-bold text-cream">互动</span>

          <button
            type="button"
            aria-label={target === 'use' && prompt ? prompt.text : '使用'}
            data-pressed={usePressed}
            className={`px-btn absolute bottom-0 right-0 flex h-[88px] w-[88px] touch-none items-center justify-center ${target === 'use' ? 'slot-lit' : 'slot'}`}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              setUsePressed(true);
              onUse(true);
            }}
            onPointerUp={() => {
              setUsePressed(false);
              onUse(false);
            }}
            onPointerCancel={() => {
              setUsePressed(false);
              onUse(false);
            }}>
            {heldItem ? <ItemIcon id={heldItem} size={48} /> : <PixelGlyph name="hand" size={36} className="text-parch-ink" />}
            {heldItem === 'can' &&
            <span className="absolute bottom-1.5 left-1/2 h-[5px] w-12 -translate-x-1/2 border border-wood-ink bg-ink/80" aria-hidden="true">
                <span className="block h-full bg-mist transition-[width] duration-200 ease-out" style={{ width: `${canWater / canMax * 100}%` }} />
              </span>
            }
          </button>
          <span className="text-outline absolute bottom-[92px] right-0 w-[88px] text-center text-[11px] font-bold text-cream">使用</span>
        </div>
      </div>
    </div>);

}