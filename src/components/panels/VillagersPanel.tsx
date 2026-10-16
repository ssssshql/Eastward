import React from 'react';
import { HeartIcon } from 'lucide-react';
import type { UiSnapshot } from '../../types/game';
import { npcs } from '../../data/npcs';
import { getItem } from '../../utils/items';
import { HEART, MAX_HEARTS } from '../../utils/engine/constants';
import { getPortraitUrl } from '../../utils/sprites/portraits';
import { Modal } from '../Modal';
import { ItemIcon } from '../ItemIcon';

interface VillagersPanelProps {
  snap: UiSnapshot;
  onClose: () => void;
}

export function VillagersPanel({ snap, onClose }: VillagersPanelProps) {
  return (
    <Modal title="灯湖镇的居民" subtitle="每天聊天、送他们喜欢的东西，好感到 2 心和 4 心时会收到回礼。" onClose={onClose} className="w-[760px]">
      <ul className="grid grid-cols-2 gap-3 px-7 py-5">
        {npcs.map((n) => {
          const st = snap.npcs.find((x) => x.id === n.id);
          const f = st?.friendship ?? 0;
          const hearts = Math.min(MAX_HEARTS, Math.floor(f / HEART));
          const partial = f % HEART / HEART;
          return (
            <li key={n.id} className="flex gap-4 rounded-xl bg-ink-2/80 p-4">
              <img src={getPortraitUrl(n.id)} alt="" className="pixelated h-[84px] w-[60px] shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-black">{n.name}</h3>
                  <span className="text-xs text-cream-dim">{n.title}</span>
                </div>
                <div className="mt-1 flex gap-0.5" aria-label={`好感 ${hearts} 心`}>
                  {Array.from({ length: MAX_HEARTS }, (_, i) =>
                  <HeartIcon key={i} className={`h-4 w-4 ${i < hearts ? 'fill-rose text-rose' : i === hearts && partial > 0 ? 'text-rose/70' : 'text-cream/20'}`} aria-hidden="true" />
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-cream-dim">{n.bio}</p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-cream-dim">
                  <span>最爱</span>
                  {n.loves.map((id) =>
                  <span key={id} title={getItem(id).name}>
                      <ItemIcon id={id} size={18} />
                    </span>
                  )}
                  <span className="ml-auto">{st?.talked ? '今天聊过了' : '今天还没聊'}</span>
                </div>
              </div>
            </li>);

        })}
      </ul>
    </Modal>);

}