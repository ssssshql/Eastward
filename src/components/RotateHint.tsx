import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SmartphoneIcon } from 'lucide-react';
import { enterImmersive, fullscreenSupported } from '../hooks/useFullscreen';

interface RotateHintProps {
  onDismiss: () => void;
}

/** Shown on phones held upright: asks to turn sideways and offers one-tap fullscreen + landscape. */
export function RotateHint({ onDismiss }: RotateHintProps) {
  const reduce = useReducedMotion();
  const canFs = fullscreenSupported();
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-ink/95 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}>
      <section className="panel w-full max-w-sm px-7 pb-7 pt-8 text-center text-cream" aria-label="请横屏游玩">
        <motion.div
          className="mx-auto flex h-20 w-20 items-center justify-center"
          animate={reduce ? undefined : { rotate: [0, 0, 90, 90, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, times: [0, 0.2, 0.45, 0.8, 1], ease: [0.23, 1, 0.32, 1] }}>
          <SmartphoneIcon className="h-16 w-16 text-amber" aria-hidden="true" />
        </motion.div>
        <h2 className="mt-4 text-2xl font-black">横过手机来玩</h2>
        <p className="mt-2 text-sm leading-relaxed text-cream-dim">雾谷是一片宽阔的山谷，横屏能看到更多风景，摇杆和按钮也更顺手。</p>
        <button
          type="button"
          onClick={() => {
            void enterImmersive();
            onDismiss();
          }}
          className="btn-wood mt-6 w-full rounded-lg bg-amber py-3 text-base font-black text-parch-ink">
          {canFs ? '全屏横屏游玩' : '我已横过来了'}
        </button>
        {!canFs && <p className="mt-3 text-xs leading-relaxed text-cream-dim">iPhone 可以点浏览器的「分享」→「添加到主屏幕」，从桌面打开即可全屏。</p>}
        <button type="button" onClick={onDismiss} className="mt-3 text-sm text-cream-dim underline-offset-4 hover:underline">
          先竖着玩
        </button>
      </section>
    </motion.div>);

}