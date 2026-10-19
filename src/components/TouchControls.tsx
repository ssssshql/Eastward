import React, { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HandIcon } from 'lucide-react';
import type { Prompt } from '../types/game';
import type { TouchDirs } from '../hooks/useGame';
import { ItemIcon } from './ItemIcon';

interface TouchControlsProps {
  prompt: Prompt | null;
  heldItem: string | null;
  canWater: number;
  canMax: number;
  onMove: (d: TouchDirs) => void;
  onUse: (down: boolean) => void;
  onInteract: () => void;
}

const RADIUS = 52;
const IDLE: TouchDirs = { up: false, down: false, left: false, right: false };
const EASE = [0.23, 1, 0.32, 1] as const;

/** Stardew-mobile style controls: floating joystick on the left, interact + use buttons on the right. */
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
    setKnob({ x: dx, y: dy });
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

  // Which button the current context prompt belongs to: E → interact, anything else (空格) → use.
  const target = prompt ? prompt.key === 'E' ? 'act' : 'use' : null;
  const actLabel = target === 'act' && prompt ? prompt.text : '互动';
  const useLabel = target === 'use' && prompt ? prompt.text : '使用';
  const showWater = heldItem === 'can';

  return (
    <div className="pointer-events-none safe-inset z-20">
      {/* Joystick: sits low in the corner, beside the hotbar on wide screens. */}
      <div
        ref={padRef}
        role="slider"
        aria-label="移动摇杆"
        aria-valuenow={0}
        className="pointer-events-auto absolute bottom-[60px] left-4 flex h-32 w-32 touch-none items-center justify-center rounded-full border-[3px] border-wood-ink bg-wood-lo/55 shadow-[inset_0_0_0_3px_rgba(214,150,90,0.55)] sm:left-8 min-[800px]:bottom-3"
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
        <div className="absolute inset-6 rounded-full border-2 border-dashed border-wood-hi/30" aria-hidden="true" />
        <div
          className="h-14 w-14 rounded-full border-[3px] border-wood-ink bg-parch shadow-[inset_0_-4px_0_#c9a46a,0_4px_0_rgba(10,5,3,0.5)]"
          style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
          aria-hidden="true" />
      </div>

      {/* Action cluster */}
      <div className="absolute bottom-[60px] right-4 sm:right-8 min-[800px]:bottom-3">
        {/* Context hint: full, readable text above the button it applies to. */}
        <div className="pointer-events-none absolute bottom-full right-0 mb-3 flex justify-end" aria-live="polite">
          <AnimatePresence mode="wait">
            {prompt && target &&
            <motion.div
              key={prompt.key + prompt.text}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: EASE }}
              className={`glass flex items-center gap-2 whitespace-nowrap rounded-full py-1 pl-1 pr-3 text-[13px] font-bold text-cream ${target === 'act' ? 'mr-[92px]' : ''}`}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-wood-ink ${target === 'act' ? 'bg-sage text-[#13351f]' : 'bg-amber'}`} aria-hidden="true">
                  {target === 'act' || !heldItem ? <HandIcon className="h-3.5 w-3.5" /> : <ItemIcon id={heldItem} size={16} />}
                </span>
                {prompt.text}
              </motion.div>
            }
          </AnimatePresence>
        </div>

        <div className="pointer-events-auto flex items-end gap-4">
          {/* Interact */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              aria-label={actLabel}
              className={`btn-wood flex h-16 w-16 touch-none items-center justify-center rounded-full text-[#13351f] ${actPressed ? 'bg-sage-deep' : 'bg-sage'} ${
              target === 'act' ? 'outline outline-[3px] outline-offset-2 outline-cream' : ''}`}
              onPointerDown={(e) => {
                e.preventDefault();
                setActPressed(true);
                onInteract();
              }}
              onPointerUp={() => setActPressed(false)}
              onPointerCancel={() => setActPressed(false)}>
              <HandIcon className="h-7 w-7" aria-hidden="true" />
            </button>
            <span className="text-[11px] font-bold text-cream [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">互动</span>
          </div>

          {/* Use held item */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              aria-label={useLabel}
              className={`btn-wood relative flex h-[76px] w-[76px] touch-none items-center justify-center rounded-full ${usePressed ? 'bg-amber-deep' : 'bg-amber'} ${
              target === 'use' ? 'outline outline-[3px] outline-offset-2 outline-cream' : ''}`}
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
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-parch shadow-[inset_0_2px_0_#c9a46a]" aria-hidden="true">
                {heldItem ? <ItemIcon id={heldItem} size={32} /> : <HandIcon className="h-6 w-6 text-parch-ink" />}
              </span>
              {showWater &&
              <span className="absolute bottom-2 left-1/2 h-[5px] w-10 -translate-x-1/2 overflow-hidden rounded-full border border-wood-ink bg-ink/80" aria-hidden="true">
                  <span className="block h-full bg-mist transition-[width] duration-200 ease-out" style={{ width: `${canWater / canMax * 100}%` }} />
                </span>
              }
            </button>
            <span className="text-[11px] font-bold text-cream [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">使用</span>
          </div>
        </div>
      </div>
    </div>);

}