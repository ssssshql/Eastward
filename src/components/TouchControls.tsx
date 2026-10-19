import React, { useRef, useState } from 'react';
import { HandIcon, PickaxeIcon } from 'lucide-react';
import type { Prompt } from '../types/game';
import type { TouchDirs } from '../hooks/useGame';

interface TouchControlsProps {
  prompt: Prompt | null;
  onMove: (d: TouchDirs) => void;
  onUse: (down: boolean) => void;
  onInteract: () => void;
}

const RADIUS = 52;
const IDLE: TouchDirs = { up: false, down: false, left: false, right: false };

/** Stardew-mobile style controls: floating joystick on the left, tool + interact buttons on the right. */
export function TouchControls({ prompt, onMove, onUse, onInteract }: TouchControlsProps) {
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

  const useLabel = prompt && prompt.key !== 'E' ? prompt.text : '使用';
  const actLabel = prompt && prompt.key === 'E' ? prompt.text : '互动';

  return (
    <div className="pointer-events-none safe-inset z-20">
    <div className="absolute inset-x-0 bottom-[76px] flex items-end justify-between px-4 sm:bottom-[84px] sm:px-8">
      <div
          ref={padRef}
          role="slider"
          aria-label="移动摇杆"
          aria-valuenow={0}
          className="pointer-events-auto relative flex h-32 w-32 touch-none items-center justify-center rounded-full border-[3px] border-wood-ink bg-wood-lo/55 shadow-[inset_0_0_0_3px_rgba(214,150,90,0.55)]"
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

      <div className="pointer-events-auto flex items-end gap-3">
        <button
            type="button"
            aria-label={actLabel}
            className={`btn-wood flex h-[72px] w-[72px] touch-none flex-col items-center justify-center gap-0.5 rounded-full text-[#13351f] ${actPressed ? 'translate-y-0.5 bg-sage-deep' : 'bg-sage'}`}
            onPointerDown={(e) => {
              e.preventDefault();
              setActPressed(true);
              onInteract();
            }}
            onPointerUp={() => setActPressed(false)}
            onPointerCancel={() => setActPressed(false)}>
          <HandIcon className="h-6 w-6" aria-hidden="true" />
          <span className="max-w-[64px] truncate px-1 text-[10px] font-bold leading-tight">{actLabel}</span>
        </button>
        <button
            type="button"
            aria-label={useLabel}
            className={`btn-wood mb-10 flex h-[84px] w-[84px] touch-none flex-col items-center justify-center gap-0.5 rounded-full text-parch-ink ${usePressed ? 'translate-y-0.5 bg-amber-deep' : 'bg-amber'}`}
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
          <PickaxeIcon className="h-7 w-7" aria-hidden="true" />
          <span className="max-w-[76px] truncate px-1 text-[10px] font-bold leading-tight">{useLabel}</span>
        </button>
      </div>
    </div>
    </div>);

}