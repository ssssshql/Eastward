import React from 'react';
import { motion } from 'framer-motion';

interface TitleScreenProps {
  hasSave: boolean;
  onNew: () => void;
  onContinue: () => void;
}

const EASE = [0.23, 1, 0.32, 1] as const;

const FEATURES = ['三张地图 · 农场 / 灯湖镇 / 无尽矿洞', '四位居民 · 好感与回礼', '养殖 · 加工 · 委托 · 战斗'];

export function TitleScreen({ hasSave, onNew, onContinue }: TitleScreenProps) {
  return (
    <motion.div className="absolute inset-0 z-20 flex items-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}>
      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-ink/55" aria-hidden="true" />
      <motion.div
        className="relative mb-[9vh] ml-[7vw] flex w-full max-w-5xl items-end justify-between gap-12 pr-[7vw] text-cream"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: EASE }}>
        
        <div>
          <p className="text-xs font-bold tracking-[0.5em] text-amber">MISTVALE</p>
          <h1 className="title-shadow mt-3 text-[88px] font-black leading-none tracking-tight">雾谷农场</h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-cream/85">山那边的老农场交到了你手里。白天耕种养殖，傍晚去镇上的酒馆听居民闲聊，深夜举着灯下到矿洞最深处。</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {FEATURES.map((f) =>
            <li key={f} className="rounded-full border border-cream/20 px-3 py-1 text-xs text-cream/80">
                {f}
              </li>
            )}
          </ul>
        </div>
        <div className="flex shrink-0 flex-col gap-3">
          {hasSave &&
          <button
            type="button"
            autoFocus
            onClick={onContinue}
            className="w-60 rounded-xl bg-amber py-3.5 text-lg font-black text-ink transition-colors duration-150 hover:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-ink">
            
              继续经营
            </button>
          }
          <button
            type="button"
            autoFocus={!hasSave}
            onClick={onNew}
            className={`w-60 rounded-xl py-3.5 text-lg font-black transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${
            hasSave ? 'border border-cream/30 text-cream hover:bg-cream/10' : 'bg-amber text-ink hover:bg-cream'}`
            }>
            
            {hasSave ? '开始新的农场' : '开始经营'}
          </button>
          <p className="mt-2 w-60 text-xs leading-relaxed text-cream/60">WASD 移动 · 空格/左键 使用 · E/右键 互动 · Tab 背包 · V 居民 · G 日志</p>
        </div>
      </motion.div>
    </motion.div>);

}