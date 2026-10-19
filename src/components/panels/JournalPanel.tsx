import React from 'react';
import { CheckIcon } from 'lucide-react';
import type { Stats } from '../../types/game';
import { goals } from '../../data/goals';
import { Modal } from '../Modal';

interface JournalPanelProps {
  stats: Stats;
  goalsDone: string[];
  onClose: () => void;
}

const CONTROLS: [string, string][] = [
['WASD / 方向键', '移动'],
['走向门口', '进入房屋'],
['点击远处地面 / 物体', '自动寻路，走过去并互动'],
['空格 / 左键（可按住）', '使用手中的工具或物品'],
['E / 右键', '互动 · 收获 · 出货 · 上床'],
['1 – = / 滚轮', '切换快捷栏'],
['Tab', '背包与工作台'],
['V', '居民好感'],
['G', '日志'],
['Esc', '关闭面板']];

const TIPS = [
'有时会有一位叫阿墨的流浪汉在火堆旁歇脚。分他一份吃的，他会回赠些稀奇的东西。',
'晴朗的夜里抬头看看，看见流星的第二天，农场里可能会多出一块发光的石头。',
'每栋房子都能推门进去：杂货铺、铁匠铺、酒馆、居民的小屋都有自己的布置。',
'回到小屋，在床边按 E 就能睡觉。',
'沿着农场东边的小路过桥，就能到达灯湖镇。',
'镇子北边的山洞是矿洞入口。每 5 层可以直接从那一层开始。',
'腌制罐能把作物、鸡蛋、牛奶变成价值翻倍的加工品。',
'凌晨两点前记得回家，在矿洞里倒下会丢失一些金币。'];

export function JournalPanel({ stats, goalsDone, onClose }: JournalPanelProps) {
  return (
    <Modal title="农场日志" subtitle={`已完成 ${goalsDone.length} / ${goals.length} 个目标`} onClose={onClose} className="w-[760px]">
      <div className="grid gap-8 px-7 py-5 sm:grid-cols-[1.3fr_1fr]">
        <ol className="space-y-3">
          {goals.map((g) => {
            const done = goalsDone.includes(g.id);
            const v = Math.min(stats[g.stat], g.target);
            return (
              <li key={g.id} className="flex items-center gap-3">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${done ? 'bg-sage text-ink' : 'bg-ink-3 text-cream-dim'}`}>
                  {done && <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`text-sm font-medium ${done ? 'text-cream-dim line-through decoration-cream/30' : ''}`}>{g.title}</span>
                    <span className="text-xs text-amber">+{g.reward}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-3">
                      <div className={`h-full rounded-full ${done ? 'bg-sage/50' : 'bg-sage'}`} style={{ width: `${v / g.target * 100}%` }} />
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
        <div className="space-y-6">
          <section>
            <h3 className="font-display text-lg">操作</h3>
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
            <h3 className="font-display text-lg">老农的叮嘱</h3>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-cream-dim">
              {TIPS.map((t) => <li key={t} className="border-l-2 border-amber/40 pl-3">{t}</li>)}
            </ul>
          </section>
        </div>
      </div>
    </Modal>);

}