import React from 'react';
import { BackpackIcon, BookOpenIcon, MapIcon, UsersIcon } from 'lucide-react';
import type { Stats } from '../../types/game';
import { goals } from '../../data/goals';

interface GoalTrackerProps {
  stats: Stats;
  goalsDone: string[];
  requests: number;
  onInventory: () => void;
  onJournal: () => void;
  onVillagers: () => void;
  onMap: () => void;
}

export function GoalTracker({ stats, goalsDone, requests, onInventory, onJournal, onVillagers, onMap }: GoalTrackerProps) {
  const next = goals.find((g) => !goalsDone.includes(g.id));
  const links = [
  { label: '背包', key: 'Tab', Icon: BackpackIcon, on: onInventory },
  { label: '地图', key: 'M', Icon: MapIcon, on: onMap },
  { label: '居民', key: 'V', Icon: UsersIcon, on: onVillagers },
  { label: '日志', key: 'G', Icon: BookOpenIcon, on: onJournal }];

  return (
    <div className="glass w-[272px] p-4">
      {next ?
      <>
          <div className="flex items-baseline justify-between">
            <h3 className="text-base font-black">{next.title}</h3>
            <span className="text-xs font-bold text-amber">+{next.reward}</span>
          </div>
          <p className="mt-0.5 text-xs text-cream-dim">{next.desc}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden bg-ink-3">
              <div className="h-full bg-sage" style={{ width: `${Math.min(1, stats[next.stat] / next.target) * 100}%` }} />
            </div>
            <span className="text-[11px] tabular-nums text-cream-dim">
              {Math.min(stats[next.stat], next.target)}/{next.target}
            </span>
          </div>
        </> :
      <p className="text-base font-black">所有目标都完成了，雾谷因你而繁荣。</p>
      }
      {requests > 0 && <p className="mt-2 text-xs text-mist">灯湖镇委托板上有 {requests} 个委托</p>}
      <div className="-mx-1.5 mt-3 grid grid-cols-4 border-t border-cream/10 pt-2">
        {links.map(({ label, key, Icon, on }) =>
        <button
          key={label}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={on}
          className="flex flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[11px] text-cream-dim transition-colors duration-150 hover:bg-cream/10 hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-amber">
            <Icon className="h-4 w-4 text-amber" aria-hidden="true" />
            <span className="whitespace-nowrap">{label}</span>
            <span className="font-pixel text-[9px] text-cream-dim/70">{key}</span>
          </button>
        )}
      </div>
    </div>);

}