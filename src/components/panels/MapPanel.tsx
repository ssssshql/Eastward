import React, { useMemo, useState } from 'react';
import { MapPinIcon } from 'lucide-react';
import type { MapId, MinimapView, UiSnapshot } from '../../types/game';
import { regionLinks, regions } from '../../data/regions';
import { fishList } from '../../data/fish';
import { forageTable } from '../../data/forage';
import { getItem } from '../../utils/items';
import { Modal } from '../Modal';
import { ItemIcon } from '../ItemIcon';

interface MapPanelProps {
  snap: UiSnapshot;
  getMinimap: (id: MapId) => MinimapView | null;
  onClose: () => void;
}

const center = (id: MapId): [number, number] => {
  const r = regions.find((x) => x.id === id);
  if (!r) return [50, 50];
  const [l, t, w, h] = r.box;
  return [l + w / 2, t + h / 2];
};

/** Stardew-style valley map: an overview of every region plus a detailed local map of the selected one. */
export function MapPanel({ snap, getMinimap, onClose }: MapPanelProps) {
  const here = snap.region;
  const [sel, setSel] = useState<MapId>(here === 'interior' ? 'farm' : here);
  const views = useMemo(() => {
    const out: Partial<Record<MapId, MinimapView | null>> = {};
    for (const r of regions) out[r.id] = getMinimap(r.id);
    return out;
  }, [getMinimap]);
  const region = regions.find((r) => r.id === sel) ?? regions[0];
  const view = views[sel] ?? null;
  const fish = fishList.filter((f) => f.maps.includes(sel));
  const forage = sel === 'forest' || sel === 'beach' ? [...new Set(forageTable[sel][snap.season])] : [];

  return (
    <Modal title="雾谷地图" subtitle="点击区域查看详细地图 · 橙色方块是通往其他区域的出口" onClose={onClose} className="w-[920px]">
      <div className="grid gap-5 px-5 py-5 sm:px-7 md:grid-cols-[1fr_1.15fr]">
        <div className="slot relative aspect-[4/3] w-full" role="group" aria-label="区域总览">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {regionLinks.map(([a, b]) => {
              const [x1, y1] = center(a);
              const [x2, y2] = center(b);
              return <line key={a + b} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#9a5f34" strokeWidth={1.2} strokeDasharray="2 1.6" vectorEffect="non-scaling-stroke" />;
            })}
          </svg>
          {regions.map((r) => {
            const [l, t, w, h] = r.box;
            const v = views[r.id];
            const active = sel === r.id;
            const isHere = here === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSel(r.id)}
                aria-pressed={active}
                className={`absolute overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-amber ${active ? 'slot-lit' : 'slot'}`}
                style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%` }}>
                {v ? <img src={v.url} alt="" className="pixelated absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-[#2a2232]" />}
                <span className="text-outline absolute inset-x-0 bottom-0 bg-ink/55 px-1 py-0.5 text-center text-[11px] font-black text-cream">{r.name}</span>
                {isHere &&
                <span className="absolute left-1 top-1 flex items-center gap-0.5 bg-berry px-1 text-[10px] font-bold text-cream">
                    <MapPinIcon className="h-3 w-3" aria-hidden="true" />
                    你在这里
                  </span>
                }
              </button>);

          })}
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="flex items-baseline gap-2">
            <h3 className="plate px-3 py-0.5 text-lg font-black">{region.name}</h3>
            <span className="text-xs text-cream-dim">{region.sub}</span>
          </div>
          <div className="slot relative mt-3 w-full overflow-hidden bg-[#2a2232]">
            {view ?
            <div className="relative w-full" style={{ aspectRatio: `${view.w} / ${view.h}` }}>
                <img src={view.url} alt={`${region.name}地图`} className="pixelated absolute inset-0 h-full w-full" />
                {view.marker &&
              <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 border-2 border-wood-ink bg-berry" style={{ left: `${view.marker[0] / view.w * 100}%`, top: `${view.marker[1] / view.h * 100}%` }} aria-label="你的位置" />
              }
              </div> :
            <p className="px-4 py-10 text-center text-sm text-cream-dim">矿洞每次进入都会变化，下到矿洞里再打开地图就能看到当前这一层。</p>
            }
          </div>
          <p className="mt-3 text-sm leading-relaxed text-cream-dim">{region.desc}</p>
          {fish.length > 0 &&
          <div className="mt-3">
              <p className="text-xs font-bold text-cream">可钓到的鱼</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {fish.map((f) => {
                const known = !!snap.fishLog[f.id]?.count;
                return (
                  <span key={f.id} title={known ? getItem(f.id).name : '尚未钓到'} className="slot flex h-9 w-9 items-center justify-center">
                      <ItemIcon id={f.id} size={24} className={known ? '' : 'brightness-0 opacity-40'} />
                    </span>);

              })}
              </div>
            </div>
          }
          {forage.length > 0 &&
          <div className="mt-3">
              <p className="text-xs font-bold text-cream">本季可采集</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {forage.map((id) =>
              <span key={id} className="flex items-center gap-1 text-xs text-cream-dim">
                    <ItemIcon id={id} size={20} />
                    {getItem(id).name}
                  </span>
              )}
              </div>
            </div>
          }
        </div>
      </div>
    </Modal>);

}