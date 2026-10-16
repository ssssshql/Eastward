import React from 'react';
import type { Stack } from '../../types/game';
import { HOTBAR_SIZE } from '../../utils/engine/constants';
import { getItem } from '../../utils/items';
import { ItemIcon } from '../ItemIcon';

interface HotbarProps {
  inventory: (Stack | null)[];
  selected: number;
  canWater: number;
  canMax: number;
  onSelect: (i: number) => void;
}

const KEYS = '1234567890-=';

export function Hotbar({ inventory, selected, canWater, canMax, onSelect }: HotbarProps) {
  const slots = inventory.slice(0, HOTBAR_SIZE);
  const sel = slots[selected];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-5 text-sm font-medium text-cream [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">{sel ? getItem(sel.id).name : ''}</div>
      <nav className="glass flex gap-1.5 p-2" aria-label="快捷栏">
        {slots.map((s, i) => {
          const active = i === selected;
          return (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(i)}
              aria-label={s ? `${getItem(s.id).name}${s.qty > 1 ? ` ×${s.qty}` : ''}` : `空格位 ${i + 1}`}
              aria-pressed={active}
              className={`relative flex h-12 w-12 items-center justify-center rounded-xl transition-[transform,background-color,box-shadow] duration-150 ease-out ${
              active ? '-translate-y-1 bg-cream/15 shadow-[0_0_0_2px_#f2b45a]' : 'bg-ink-3/60 hover:bg-ink-3'}`
              }>
              
              <span className="absolute left-1 top-0.5 text-[9px] font-medium text-cream/35">{KEYS[i]}</span>
              {s && <ItemIcon id={s.id} size={32} />}
              {s && s.qty > 1 && <span className="absolute bottom-0.5 right-1 text-[11px] font-bold tabular-nums text-cream [text-shadow:0_1px_2px_#000]">{s.qty}</span>}
              {s?.id === 'can' &&
              <span className="absolute bottom-1 left-2 right-2 h-[3px] overflow-hidden rounded-full bg-ink/80">
                  <span className="block h-full rounded-full bg-mist" style={{ width: `${canWater / canMax * 100}%` }} />
                </span>
              }
            </button>);

        })}
      </nav>
    </div>);

}