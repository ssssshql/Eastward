import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HeartIcon } from 'lucide-react';
import type { Dialog } from '../types/game';
import { MAX_HEARTS } from '../utils/engine/constants';
import { getPortraitUrl } from '../utils/sprites/portraits';

interface DialogBoxProps {
  dialog: Dialog;
  onClose: () => void;
}

export function DialogBox({ dialog, onClose }: DialogBoxProps) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    const id = window.setInterval(() => setShown((n) => n >= dialog.text.length ? n : n + 1), 22);
    return () => window.clearInterval(id);
  }, [dialog.text]);
  return (
    <motion.div
      className="absolute inset-x-0 bottom-3 z-30 flex justify-center px-3 sm:bottom-6 sm:px-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}>
      <section role="dialog" aria-label={`${dialog.name}的对话`} className="panel flex w-full max-w-3xl gap-4 p-5 sm:gap-5 sm:p-6" onClick={onClose}>
        <div className="slot flex w-24 shrink-0 flex-col items-center gap-2 pb-2 pt-3 sm:w-28">
          <img src={getPortraitUrl(dialog.npc)} alt="" className="pixelated h-[84px] w-[60px] sm:h-[112px] sm:w-[80px]" />
          <div className="flex gap-0.5">
            {Array.from({ length: MAX_HEARTS }, (_, i) =>
            <HeartIcon key={i} className={`h-3 w-3 ${i < dialog.hearts ? 'fill-berry text-berry' : 'text-parch-lo'}`} aria-hidden="true" />
            )}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-baseline gap-2">
            <h2 className="plate px-3 py-0.5 text-lg font-black">{dialog.name}</h2>
            <span className="text-xs text-cream-dim">{dialog.title}</span>
          </div>
          <p className="mt-2 min-h-[72px] whitespace-pre-line text-[15px] leading-relaxed text-cream">{dialog.text.slice(0, shown)}</p>
          <p className="mt-auto self-end text-xs text-cream-dim">
            <span className="keycap mr-1.5">E</span>继续
          </p>
        </div>
      </section>
    </motion.div>);

}