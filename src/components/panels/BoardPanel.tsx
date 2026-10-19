import React from 'react';
import type { UiSnapshot } from '../../types/game';
import { getItem } from '../../utils/items';
import { npcDef } from '../../utils/engine/entities';
import { getPortraitUrl } from '../../utils/sprites/portraits';
import { Modal } from '../Modal';
import { Coins } from '../Coins';
import { ItemIcon } from '../ItemIcon';
import { btnPrimary } from './ShopRow';

interface BoardPanelProps {
  snap: UiSnapshot;
  onDeliver: (id: number) => void;
  onClose: () => void;
}

export function BoardPanel({ snap, onDeliver, onClose }: BoardPanelProps) {
  const count = (id: string) => snap.inventory.reduce((a, s) => a + (s && s.id === id ? s.qty : 0), 0);
  return (
    <Modal title="委托板" subtitle="居民们张贴的请求，每天都会更新。完成可获得金币和好感。" onClose={onClose} className="w-[680px]">
      {snap.requests.length === 0 ?
      <p className="px-7 py-8 text-sm text-cream-dim">今天没有新的委托，明天再来看看吧。</p> :
      <ul className="grid gap-3 px-7 py-5">
          {snap.requests.map((r) => {
          const def = npcDef(r.npc);
          const have = count(r.item);
          const ok = have >= r.qty;
          return (
            <li key={r.id} className="flex items-center gap-4 rounded-md bg-ink-2/80 p-4">
                <img src={getPortraitUrl(r.npc)} alt="" className="pixelated h-14 w-10 shrink-0 object-cover object-top" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-bold">{def.name}</span>
                    <span className="text-cream-dim"> 想要</span>
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <ItemIcon id={r.item} size={24} />
                    <span className="font-bold">{getItem(r.item).name}</span>
                    <span className={`text-sm tabular-nums ${ok ? 'text-sage' : 'text-cream-dim'}`}>
                      {Math.min(have, r.qty)}/{r.qty}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-cream-dim">还剩 {r.daysLeft} 天 · 好感 +60</p>
                </div>
                <Coins value={r.reward} className="text-lg font-black text-amber" />
                <button type="button" disabled={!ok} onClick={() => onDeliver(r.id)} className={btnPrimary}>
                  交付
                </button>
              </li>);

        })}
        </ul>
      }
    </Modal>);

}