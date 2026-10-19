import React from 'react';
import { tavernMenu } from '../../data/shop';
import { getItem } from '../../utils/items';
import { Modal } from '../Modal';
import { Coins } from '../Coins';
import { btnGhost, btnPrimary, ShopRow } from './ShopRow';

interface TavernPanelProps {
  money: number;
  onBuy: (id: string, qty: number) => void;
  onClose: () => void;
}

export function TavernPanel({ money, onBuy, onClose }: TavernPanelProps) {
  return (
    <Modal title="灯湖酒馆" subtitle="炉火、热汤和镇上的闲话。傍晚居民们都会来这里。" onClose={onClose} className="w-[640px]" aside={<Coins value={money} className="text-xl font-black text-amber" />}>
      <ul className="divide-y divide-cream/10 px-7 py-3">
        {tavernMenu.map((id) => {
          const def = getItem(id);
          const price = def.buy ?? 0;
          return (
            <ShopRow key={id} icon={id} title={def.name} meta={def.desc} tag={def.buff ? '加速' : undefined}>
              <Coins value={price} className="w-14 justify-end text-sm text-amber" />
              <button type="button" disabled={money < price} onClick={() => onBuy(id, 1)} className={btnGhost}>
                买 1
              </button>
              <button type="button" disabled={money < price * 3} onClick={() => onBuy(id, 3)} className={btnPrimary}>
                买 3
              </button>
            </ShopRow>);

        })}
      </ul>
    </Modal>);

}