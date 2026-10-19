import React from 'react';
import { motion } from 'framer-motion';
import type { DaySummary as Summary } from '../../types/game';
import { goals } from '../../data/goals';
import { getItem } from '../../utils/items';
import { DAYS_PER_SEASON, SEASON_NAMES } from '../../utils/engine/constants';
import { ItemIcon } from '../ItemIcon';
import { Coins } from '../Coins';

interface DaySummaryProps {
  summary: Summary;
  money: number;
  onContinue: () => void;
}

export function DaySummary({ summary, money, onContinue }: DaySummaryProps) {
  const dayOfSeason = (summary.day - 1) % DAYS_PER_SEASON + 1;
  return (
    <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/90 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
      <motion.section className="panel w-[540px] p-7 text-cream" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.12, ease: [0.23, 1, 0.32, 1] }} aria-label="今日结算">
        <p className="text-sm text-cream-dim">
          {SEASON_NAMES[summary.season]} · 第 {dayOfSeason} 天 结束
        </p>
        <h2 className="mt-1 text-4xl font-black tracking-tight">{summary.fainted ? '你在矿洞里倒下了……' : summary.passedOut ? '你在路边睡着了……' : '晚安，雾谷。'}</h2>
        {summary.passedOut && <p className="mt-2 text-sm text-berry">好心的居民把你送回了家，诊疗费 {summary.lost} 金币。</p>}
        <div className="mt-6 border-y border-cream/10 py-4">
          {summary.items.length === 0 ?
          <p className="text-sm text-cream-dim">今天没有出货。明天带点收成去出货箱吧。</p> :
          <ul className="max-h-60 space-y-2 overflow-y-auto">
              {summary.items.map((it) =>
            <li key={it.id} className="flex items-center gap-3 text-sm">
                  <ItemIcon id={it.id} size={28} />
                  <span className="flex-1">{getItem(it.id).name}</span>
                  <span className="tabular-nums text-cream-dim">×{it.qty}</span>
                  <Coins value={it.total} className="w-20 justify-end text-amber" />
                </li>
            )}
            </ul>
          }
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xs text-cream-dim">今日收入</p>
            <Coins value={summary.total} className="font-display text-3xl text-amber" />
          </div>
          <div className="text-right">
            <p className="text-xs text-cream-dim">存款</p>
            <Coins value={money} className="font-display text-lg" />
          </div>
        </div>
        {summary.goals.length > 0 &&
        <ul className="mt-5 space-y-1">
            {summary.goals.map((id) => {
            const g = goals.find((x) => x.id === id);
            return g ? <li key={id} className="text-sm text-sage">目标达成：{g.title} +{g.reward}</li> : null;
          })}
          </ul>
        }
        <button type="button" autoFocus onClick={onContinue} className="btn-wood mt-7 w-full rounded-lg bg-amber py-3 font-display text-lg font-black text-parch-ink hover:bg-[#ffc76a]">
          迎接新的一天
        </button>
      </motion.section>
    </motion.div>);

}