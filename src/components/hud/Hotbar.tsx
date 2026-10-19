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
  compact?: boolean;
}

const KEYS = '1234567890-=';

export function Hotbar({ inventory, selected, canWater, canMax, onSelect, compact = false }: HotbarProps) {
  const slots = inventory.slice(0, HOTBAR_SIZE);
  const sel = slots[selected];
  return (
    <div className="flex max-w-full flex-col items-center gap-2">
      {!compact && <div className="text-outline h-5 text-sm font-medium text-cream">{sel ? getItem(sel.id).name : ''}</div>}
      <nav className={`glass no-scrollbar flex max-w-full overflow-x-auto ${compact ? 'gap-1 px-2 pb-2 pt-2' : 'gap-1.5 px-2.5 pb-2.5 pt-3'}`} aria-label="快捷栏">
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
              className={`relative flex shrink-0 items-center justify-center transition-transform duration-150 ease-out ${active ? 'slot-lit' : 'slot'} ${compact ? 'h-10 w-10' : 'h-12 w-12'} ${active ? compact ? '-translate-y-0.5' : '-translate-y-1' : ''}`}>
              {!compact && <span className="absolute left-0 top-[-2px] font-pixel text-[9px] text-parch-ink/50">{KEYS[i]}</span>}
              {s && <ItemIcon id={s.id} size={compact ? 24 : 32} />}
              {s && s.qty > 1 &&
              <span className={`absolute bottom-[-2px] font-pixel font-bold tabular-nums text-cream [text-shadow:1px_1px_0_#3a2012,-1px_-1px_0_#3a2012,1px_-1px_0_#3a2012,-1px_1px_0_#3a2012] ${compact ? 'right-0 text-[10px] leading-none' : 'right-0 text-[12px]'}`}>
                  {s.qty}
                </span>
              }
              {s?.id === 'can' &&
              <span className="absolute bottom-0 left-1 right-1 h-[3px] bg-ink/80">
                  <span className="block h-full bg-mist" style={{ width: `${canWater / canMax * 100}%` }} />
                </span>
              }
            </button>);

        })}
      </nav>
    </div>);

}