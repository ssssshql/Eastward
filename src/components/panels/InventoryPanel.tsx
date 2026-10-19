import React, { useState } from 'react';
import type { Stack } from '../../types/game';
import { recipes } from '../../data/recipes';
import { HOTBAR_SIZE } from '../../utils/engine/constants';
import { getItem } from '../../utils/items';
import { Modal } from '../Modal';
import { ItemIcon } from '../ItemIcon';
import { Coins } from '../Coins';

interface InventoryPanelProps {
  inventory: (Stack | null)[];
  selected: number;
  onSwap: (a: number, b: number) => void;
  onCraft: (id: string) => void;
  onEat: (slot: number) => void;
  onClose: () => void;
}

const KIND_LABEL: Record<string, string> = { tool: '工具', seed: '种子', produce: '作物', resource: '材料', fish: '鱼', placeable: '设施', food: '料理', artisan: '加工品', animal: '畜产品' };

export function InventoryPanel({ inventory, selected, onSwap, onCraft, onEat, onClose }: InventoryPanelProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const count = (id: string) => inventory.reduce((a, s) => a + (s && s.id === id ? s.qty : 0), 0);
  const detailSlot = focus ?? picked ?? selected;
  const detail = inventory[detailSlot];
  const detailDef = detail ? getItem(detail.id) : null;

  const click = (i: number) => {
    if (picked === null) {
      if (inventory[i]) setPicked(i);
    } else {
      if (picked !== i) onSwap(picked, i);
      setPicked(null);
    }
  };

  return (
    <Modal title="背包" subtitle="点击两个格子交换位置 · 第一行就是快捷栏" onClose={onClose} className="w-[760px]">
      <div className="px-7 pt-5">
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
          {inventory.map((s, i) =>
          <button
            key={i}
            type="button"
            onClick={() => click(i)}
            onMouseEnter={() => setFocus(i)}
            onMouseLeave={() => setFocus(null)}
            aria-label={s ? `${getItem(s.id).name} ×${s.qty}` : '空格位'}
            className={`slot relative flex aspect-square items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber ${i < HOTBAR_SIZE ? '' : 'slot-dim'} ${
            picked === i ? 'outline outline-[3px] outline-amber' : i === selected ? 'outline outline-2 outline-berry' : ''}`}>
              {s && <ItemIcon id={s.id} size={32} />}
              {s && s.qty > 1 && <span className="absolute bottom-0 right-1 font-pixel text-[12px] font-bold tabular-nums text-cream [text-shadow:1px_1px_0_#3a2012,-1px_-1px_0_#3a2012,1px_-1px_0_#3a2012,-1px_1px_0_#3a2012]">{s.qty}</span>}
            </button>
          )}
        </div>
      </div>
      <div className="grid gap-6 px-7 pb-7 pt-5 sm:grid-cols-[1fr_1.25fr]">
        <div className="rounded-xl bg-ink-2/70 p-4">
          {detail && detailDef ?
          <>
              <div className="flex items-center gap-3">
                <ItemIcon id={detail.id} size={48} />
                <div>
                  <h3 className="font-display text-lg">{detailDef.name}</h3>
                  <span className="text-xs text-cream-dim">{KIND_LABEL[detailDef.kind]}</span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-cream-dim">{detailDef.desc}</p>
              <div className="mt-4 flex items-center justify-between">
                {detailDef.sell > 0 && detailDef.kind !== 'tool' ? <Coins value={detailDef.sell} className="text-sm text-amber" /> : <span />}
                {detailDef.kind === 'food' &&
              <button type="button" onClick={() => onEat(detailSlot)} className="rounded-lg bg-sage px-3 py-1.5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-sage-deep">
                    食用
                  </button>
              }
              </div>
            </> :
          <p className="text-sm text-cream-dim">把鼠标移到物品上查看详情。</p>
          }
        </div>
        <div>
          <h3 className="font-display text-lg">工作台</h3>
          <ul className="mt-2 divide-y divide-cream/10">
            {recipes.map((r) => {
              const ok = r.inputs.every((s) => count(s.id) >= s.qty);
              return (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  <ItemIcon id={r.output} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{getItem(r.output).name}</div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {r.inputs.map((s) => {
                        const have = count(s.id);
                        return (
                          <span key={s.id} className={`flex items-center gap-1 text-xs tabular-nums ${have >= s.qty ? 'text-cream-dim' : 'text-berry'}`}>
                            <ItemIcon id={s.id} size={16} />
                            {have}/{s.qty}
                          </span>);
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!ok}
                    onClick={() => onCraft(r.id)}
                    className="rounded-lg bg-amber px-3 py-1.5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-amber-deep disabled:cursor-not-allowed disabled:bg-cream/10 disabled:text-cream-dim">
                    制作
                  </button>
                </li>);
            })}
          </ul>
        </div>
      </div>
    </Modal>);

}