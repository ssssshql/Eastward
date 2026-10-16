import React from 'react';
import { BackpackIcon, BookOpenIcon, UsersIcon } from 'lucide-react';
import type { Stats } from '../../types/game';
import { goals } from '../../data/goals';

interface GoalTrackerProps {
  stats: Stats;
  goalsDone: string[];
  requests: number;
  onInventory: () => void;
  onJournal: () => void;
  onVillagers: () => void;
}

export function GoalTracker({ stats, goalsDone, requests, onInventory, onJournal, onVillagers }: GoalTrackerProps) {
  const next = goals.find((g) => !goalsDone.includes(g.id));
  const btn =
  'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs text-cream-dim transition-colors duration-150 hover:bg-cream/10 hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-amber';
  return (
    <div className="glass w-[264px] p-4">
      {next ?
      <>
          <div className="flex items-baseline justify-between">
            <h3 className="text-base font-black">{next.title}</h3>
            <span className="text-xs font-bold text-amber">+{next.reward}</span>
          </div>
          <p className="mt-0.5 text-xs text-cream-dim">{next.desc}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-3">
              <div className="h-full rounded-full bg-sage" style={{ width: `${Math.min(1, stats[next.stat] / next.target) * 100}%` }} />
            </div>
            <span className="text-[11px] tabular-nums text-cream-dim">
              {Math.min(stats[next.stat], next.target)}/{next.target}
            </span>
          </div>
        </> :

      <p className="text-base font-black">所有目标都完成了，雾谷因你而繁荣。</p>
      }
      {requests > 0 && <p className="mt-2 text-xs text-mist">灯湖镇委托板上有 {requests} 个委托</p>}
      <div className="-mx-1.5 mt-3 flex border-t border-cream/10 pt-2">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onInventory} className={btn}>
          <BackpackIcon className="h-3.5 w-3.5" aria-hidden="true" />
          背包 Tab
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onVillagers} className={btn}>
          <UsersIcon className="h-3.5 w-3.5" aria-hidden="true" />
          居民 V
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onJournal} className={btn}>
          <BookOpenIcon className="h-3.5 w-3.5" aria-hidden="true" />
          日志 G
        </button>
      </div>
    </div>);

}