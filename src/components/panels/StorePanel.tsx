import React, { useState } from 'react';
import type { AnimalKind, UiSnapshot } from '../../types/game';
import { animalOffers, storeGoods, storeSeeds } from '../../data/shop';
import { ANIMAL_CAP } from '../../utils/engine/constants';
import { getCrop, getItem } from '../../utils/items';
import { Modal } from '../Modal';
import { Coins } from '../Coins';
import { btnGhost, btnPrimary, ShopRow, Tabs } from './ShopRow';

interface StorePanelProps {
  snap: UiSnapshot;
  onBuy: (id: string, qty: number) => void;
  onBuyAnimal: (kind: AnimalKind) => void;
  onClose: () => void;
}

type Tab = 'seeds' | 'goods' | 'animals';

export function StorePanel({ snap, onBuy, onBuyAnimal, onClose }: StorePanelProps) {
  const [tab, setTab] = useState<Tab>('seeds');
  const money = snap.money;
  const list = tab === 'seeds' ? storeSeeds : storeGoods;
  return (
    <Modal title="薇拉的杂货铺" subtitle="“种子都是从山那边带来的，好好待它们。”" onClose={onClose} className="w-[700px]" aside={<Coins value={money} className="text-xl font-black text-amber" />}>
      <Tabs<Tab>
        tabs={[
        { id: 'seeds', label: '种子' },
        { id: 'goods', label: '杂货' },
        { id: 'animals', label: '动物' }]
        }
        value={tab}
        onChange={setTab} />
      
      <ul className="divide-y divide-cream/10 px-7 py-3">
        {tab !== 'animals' &&
        list.map((id) => {
          const def = getItem(id);
          const price = def.buy ?? 0;
          const crop = def.cropId ? getCrop(def.cropId) : null;
          const meta = crop ? `${crop.days} 天成熟${crop.regrow ? ` · 之后每 ${crop.regrow} 天再收` : ''} · 售价 ${getItem(crop.produceId).sell}` : def.desc;
          return (
            <ShopRow key={id} icon={crop ? crop.produceId : id} title={def.name} meta={meta} tag={crop?.glow ? '夜间发光' : undefined}>
                <Coins value={price} className="w-14 justify-end text-sm text-amber" />
                <button type="button" disabled={money < price} onClick={() => onBuy(id, 1)} className={btnGhost}>
                  买 1
                </button>
                <button type="button" disabled={money < price * 5} onClick={() => onBuy(id, 5)} className={btnPrimary}>
                  买 5
                </button>
              </ShopRow>);

        })}
        {tab === 'animals' &&
        animalOffers.map((o) => {
          const owned = snap.animals.filter((a) => a.kind === o.kind).length;
          const full = owned >= ANIMAL_CAP[o.kind];
          return (
            <ShopRow key={o.kind} icon={o.icon} title={o.name} meta={o.desc} tag={`已有 ${owned}/${ANIMAL_CAP[o.kind]}`}>
                <Coins value={o.price} className="text-sm text-amber" />
                <button type="button" disabled={full || money < o.price} onClick={() => onBuyAnimal(o.kind)} className={btnPrimary}>
                  {full ? '已满' : '购买'}
                </button>
              </ShopRow>);

        })}
      </ul>
    </Modal>);

}