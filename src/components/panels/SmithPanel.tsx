import React, { useState } from 'react';
import { CheckIcon } from 'lucide-react';
import type { UiSnapshot, UpgradeId } from '../../types/game';
import { smeltDefs, upgradeDefs } from '../../data/shop';
import { getItem } from '../../utils/items';
import { Modal } from '../Modal';
import { Coins } from '../Coins';
import { ItemIcon } from '../ItemIcon';
import { btnPrimary, ShopRow, Tabs } from './ShopRow';

interface SmithPanelProps {
  snap: UiSnapshot;
  onSmelt: (ore: string) => void;
  onUpgrade: (id: UpgradeId) => void;
  onClose: () => void;
}

type Tab = 'smelt' | 'upgrade';
const TOOLS: UpgradeId[] = ['can', 'hoe', 'pickaxe', 'axe', 'sword'];

export function SmithPanel({ snap, onSmelt, onUpgrade, onClose }: SmithPanelProps) {
  const [tab, setTab] = useState<Tab>('smelt');
  const count = (id: string) => snap.inventory.reduce((a, s) => a + (s && s.id === id ? s.qty : 0), 0);
  return (
    <Modal title="老顾的铁匠铺" subtitle="“……矿石拿来，我给你打。”" onClose={onClose} className="w-[700px]" aside={<Coins value={snap.money} className="text-xl font-black text-amber" />}>
      <Tabs<Tab>
        tabs={[
        { id: 'smelt', label: '熔炼' },
        { id: 'upgrade', label: '工具升级' }]
        }
        value={tab}
        onChange={setTab} />
      
      <ul className="divide-y divide-cream/10 px-7 py-3">
        {tab === 'smelt' &&
        smeltDefs.map((s) => {
          const have = count(s.ore);
          const ok = have >= s.qty && count('wood') >= 1;
          return (
            <ShopRow key={s.ore} icon={s.bar} title={getItem(s.bar).name} meta={`${s.qty} 块${getItem(s.ore).name} + 1 份木材 · 当前持有 ${have}`}>
                <ItemIcon id={s.ore} size={24} />
                <button type="button" disabled={!ok} onClick={() => onSmelt(s.ore)} className={btnPrimary}>
                  熔炼
                </button>
              </ShopRow>);

        })}
        {tab === 'upgrade' &&
        TOOLS.map((id) => {
          const lvl = snap.upgrades[id];
          const u = upgradeDefs.find((d) => d.id === id && d.level === lvl + 1);
          if (!u) {
            return (
              <ShopRow key={id} icon={id} title={getItem(id).name} meta="已经是最高等级">
                  <span className="flex items-center gap-1 text-sm text-sage">
                    <CheckIcon className="h-4 w-4" aria-hidden="true" />
                    满级
                  </span>
                </ShopRow>);

          }
          const ok = snap.money >= u.price && u.bars.every((b) => count(b.id) >= b.qty);
          return (
            <ShopRow key={id} icon={u.icon} title={u.name} meta={`${u.desc} · 需要 ${u.bars.map((b) => `${getItem(b.id).name}×${b.qty}（有 ${count(b.id)}）`).join('、')}`}>
                <Coins value={u.price} className="text-sm text-amber" />
                <button type="button" disabled={!ok} onClick={() => onUpgrade(id)} className={btnPrimary}>
                  升级
                </button>
              </ShopRow>);

        })}
      </ul>
    </Modal>);

}