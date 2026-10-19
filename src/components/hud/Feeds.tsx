import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Pickup, Toast } from '../../types/game';
import { getItem } from '../../utils/items';
import { ItemIcon } from '../ItemIcon';

const EASE = [0.23, 1, 0.32, 1] as const;

export function PickupFeed({ pickups }: {pickups: Pickup[];}) {
  return (
    <ul className="flex flex-col gap-1.5" aria-live="polite">
      <AnimatePresence initial={false}>
        {pickups.map((p) =>
        <motion.li
          key={p.key}
          layout
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="glass flex items-center gap-2 py-1 pl-1.5 pr-3 text-sm">
            <ItemIcon id={p.id} size={24} />
            <span className="font-medium text-sage">+{p.qty}</span>
            <span className="text-cream">{getItem(p.id).name}</span>
          </motion.li>
        )}
      </AnimatePresence>
    </ul>);

}

const TONE: Record<Toast['tone'], string> = {
  info: 'text-cream',
  good: 'text-[#c8ffb0]',
  warn: 'text-[#ffb0a0]'
};

export function ToastStack({ toasts }: {toasts: Toast[];}) {
  return (
    <ul className="flex flex-col items-center gap-2" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) =>
        <motion.li
          key={t.id}
          layout
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: EASE }}
          className={`glass max-w-[92vw] px-4 py-1.5 text-center text-sm sm:whitespace-nowrap ${TONE[t.tone]}`}>
            {t.text}
          </motion.li>
        )}
      </AnimatePresence>
    </ul>);

}