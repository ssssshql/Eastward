import React, { useState } from 'react';
import { CheckIcon } from 'lucide-react';
import type { FishRecord, Stats } from '../../types/game';
import { goals } from '../../data/goals';
import { fishList } from '../../data/fish';
import { regionName } from '../../data/regions';
import { SEASON_NAMES } from '../../utils/engine/constants';
import { getItem } from '../../utils/items';
import { Modal } from '../Modal';
import { ItemIcon } from '../ItemIcon';
import { Tabs } from './ShopRow';

interface JournalPanelProps {
  stats: Stats;
  goalsDone: string[];
  fishLog: Record<string, FishRecord>;
  onClose: () => void;
}

type Tab = 'goals' | 'fish' | 'help';

const CONTROLS: [string, string][] = [
['WASD / 方向键', '移动'],
['走向门口', '进入房屋'],
['点击远处地面 / 物体', '自动寻路，走过去并互动'],
['空格 / 左键（可按住）', '使用手中的工具或物品'],
['手持鱼竿按住再松开', '蓄力抛竿，浮漂下沉时再按'],
['E / 右键', '互动 · 收获 · 采集 · 出货'],
['1 – = / 滚轮', '切换快捷栏'],
['Tab', '背包与工作台'],
['M', '地图'],
['V / G', '居民 / 日志'],
['Esc', '关闭面板']];

const TIPS = [
'水面冒出气泡的地方是鱼群，往那里抛竿上钩更快、更容易钓到好鱼。',
'蓄力越满抛得越远，深水里的鱼也更稀有。',
'雾林和海滩每天早上都会长出新的野生物产。',
'雨天林泽鲶和晚霞锦鲤会浮上来，海滩夜里有月影鳗。',
'回到小屋，在床边按 E 就能睡觉。凌晨两点前记得回家。',
'镇子北边的山洞是矿洞入口。每 5 层可以直接从那一层开始。',
'腌制罐能把作物、鸡蛋、牛奶变成价值翻倍的加工品。'];

export function JournalPanel({ stats, goalsDone, fishLog, onClose }: JournalPanelProps) {
  const [tab, setTab] = useState<Tab>('goals');
  const caught = fishList.filter((f) => fishLog[f.id]?.count).length;
  return (
    <Modal title="农场日志" subtitle={`目标 ${goalsDone.length}/${goals.length} · 鱼类图鉴 ${caught}/${fishList.length}`} onClose={onClose} className="w-[780px]">
      <Tabs<Tab> tabs={[{ id: 'goals', label: '目标' }, { id: 'fish', label: '鱼类图鉴' }, { id: 'help', label: '操作与提示' }]} value={tab} onChange={setTab} />
      {tab === 'goals' &&
      <ol className="grid gap-x-8 gap-y-3 px-7 py-5 sm:grid-cols-2">
          {goals.map((g) => {
          const done = goalsDone.includes(g.id);
          const v = Math.min(stats[g.stat], g.target);
          return (
            <li key={g.id} className="flex items-center gap-3">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center ${done ? 'bg-sage text-ink' : 'bg-ink-3 text-cream-dim'}`}>
                  {done && <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`text-sm font-medium ${done ? 'text-cream-dim line-through decoration-cream/30' : ''}`}>{g.title}</span>
                    <span className="text-xs text-amber">+{g.reward}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden bg-ink-3">
                      <div className={`h-full ${done ? 'bg-sage/50' : 'bg-sage'}`} style={{ width: `${v / g.target * 100}%` }} />
                    </div>
                    <span className="w-14 text-right text-[11px] tabular-nums text-cream-dim">
                      {v}/{g.target}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-cream-dim/80">{g.desc}</p>
                </div>
              </li>);

        })}
        </ol>
      }
      {tab === 'fish' &&
      <ul className="grid gap-2 px-7 py-5 sm:grid-cols-2">
          {fishList.map((f) => {
          const rec = fishLog[f.id];
          const known = !!rec?.count;
          const conds = [f.maps.map(regionName).join(' · '), f.night ? '夜间' : '', f.rain ? '雨天更多' : '', f.seasons ? f.seasons.map((s) => SEASON_NAMES[s]).join('') + '季' : ''].filter(Boolean);
          return (
            <li key={f.id} className="flex items-center gap-3 rounded-md bg-ink-2/80 p-3">
                <div className="slot flex h-12 w-12 shrink-0 items-center justify-center">
                  <ItemIcon id={f.id} size={32} className={known ? '' : 'brightness-0 opacity-40'} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold">{known ? getItem(f.id).name : '？？？'}</span>
                    {known && <span className="font-pixel text-xs text-amber">最长 {rec.best} 厘米</span>}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-cream-dim">{conds.join(' · ')}</p>
                  <p className="text-[11px] text-cream-dim/80">{known ? `已钓到 ${rec.count} 条` : '尚未钓到'}</p>
                </div>
              </li>);

        })}
        </ul>
      }
      {tab === 'help' &&
      <div className="grid gap-8 px-7 py-5 sm:grid-cols-2">
          <section>
            <h3 className="font-display text-lg font-black">操作</h3>
            <dl className="mt-2 space-y-1.5 text-sm">
              {CONTROLS.map(([k, d]) =>
            <div key={k} className="flex justify-between gap-3">
                  <dt className="text-cream">{k}</dt>
                  <dd className="text-right text-cream-dim">{d}</dd>
                </div>
            )}
            </dl>
          </section>
          <section>
            <h3 className="font-display text-lg font-black">老农的叮嘱</h3>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-cream-dim">
              {TIPS.map((t) => <li key={t} className="border-l-2 border-amber/40 pl-3">{t}</li>)}
            </ul>
          </section>
        </div>
      }
    </Modal>);

}