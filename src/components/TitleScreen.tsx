import React from 'react';
import { motion } from 'framer-motion';
import { Maximize2Icon, Minimize2Icon } from 'lucide-react';
import { useFullscreen } from '../hooks/useFullscreen';

interface TitleScreenProps {
  hasSave: boolean;
  onNew: () => void;
  onContinue: () => void;
}

const EASE = [0.23, 1, 0.32, 1] as const;

const FEATURES = ['农场 · 小镇 · 雾林 · 海滩 · 矿洞', '每栋房屋都能走进去', '蓄力抛竿 · 鱼类图鉴', '养殖 · 加工 · 委托 · 战斗'];

export function TitleScreen({ hasSave, onNew, onContinue }: TitleScreenProps) {
  const fs = useFullscreen();
  const FsIcon = fs.isFullscreen ? Minimize2Icon : Maximize2Icon;
  return (
    <motion.div className="absolute inset-0 z-20 flex items-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}>
      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-ink/55" aria-hidden="true" />
      {fs.supported &&
      <button
        type="button"
        onClick={() => void fs.toggle()}
        className="btn-wood absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-md bg-wood px-3 py-1.5 text-sm font-bold text-cream"
        style={{ marginTop: 'env(safe-area-inset-top, 0px)', marginRight: 'env(safe-area-inset-right, 0px)' }}>
          <FsIcon className="h-4 w-4" aria-hidden="true" />
          {fs.isFullscreen ? '退出全屏' : '全屏'}
        </button>
      }
      <motion.div
        className="relative mb-[6vh] flex w-full max-w-5xl flex-col gap-6 px-6 text-cream sm:mb-[9vh] sm:ml-[7vw] sm:flex-row sm:items-end sm:justify-between sm:gap-12 sm:pl-0 sm:pr-[7vw]"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: EASE }}>
        <div>
          <p className="text-xs font-bold tracking-[0.5em] text-amber">MISTVALE</p>
          <h1 className="title-shadow mt-3 text-5xl font-black leading-none tracking-tight sm:text-6xl lg:text-[88px]">雾谷农场</h1>
          <p className="mt-4 hidden max-w-md text-base leading-relaxed text-cream/85 sm:block">山那边的老农场交到了你手里。白天耕种养殖，去雾林采蘑菇、到海滩栈桥钓鱼，傍晚推门走进镇上的酒馆，深夜举着灯下到矿洞最深处。</p>
          <ul className="mt-4 flex flex-wrap gap-2 sm:mt-6">
            {FEATURES.map((f) =>
            <li key={f} className="rounded-md border-2 border-wood-ink bg-wood-lo/80 px-3 py-1 text-xs text-cream">
                {f}
              </li>
            )}
          </ul>
        </div>
        <div className="flex shrink-0 flex-col gap-3">
          {hasSave &&
          <button type="button" autoFocus onClick={onContinue} className="btn-wood w-60 rounded-lg bg-amber py-3 text-lg font-black text-parch-ink hover:bg-[#ffc76a] focus:outline-none focus-visible:ring-2 focus-visible:ring-cream">
              继续经营
            </button>
          }
          <button
            type="button"
            autoFocus={!hasSave}
            onClick={onNew}
            className={`btn-wood w-60 rounded-lg py-3 text-lg font-black focus:outline-none focus-visible:ring-2 focus-visible:ring-amber ${hasSave ? 'bg-wood text-cream hover:bg-wood-hi' : 'bg-amber text-parch-ink hover:bg-[#ffc76a]'}`}>
            {hasSave ? '开始新的农场' : '开始经营'}
          </button>
          <p className="mt-2 hidden w-60 text-xs leading-relaxed text-cream/60 [@media(pointer:fine)]:block">WASD 移动 · 空格/左键 使用 · E/右键 互动 · Tab 背包 · M 地图 · G 日志</p>
          <p className="mt-1 w-60 text-xs leading-relaxed text-cream/60 [@media(pointer:fine)]:hidden">点击地面自动寻路 · 左侧摇杆移动 · 右侧按钮使用工具与互动</p>
        </div>
      </motion.div>
    </motion.div>);

}