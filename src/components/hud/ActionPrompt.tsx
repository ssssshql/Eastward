import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Prompt } from '../../types/game';
import { PixelGlyph } from '../PixelGlyph';

export function ActionPrompt({ prompt }: {prompt: Prompt | null;}) {
  return (
    <div className="flex h-10 items-end justify-center" aria-live="polite">
      <AnimatePresence mode="wait">
        {prompt &&
        <motion.div
          key={prompt.key + prompt.text}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 2 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="glass flex items-center gap-2 whitespace-nowrap px-3 py-1.5 text-sm">
            <span className="keycap">{prompt.key}</span>
            {prompt.icon && <PixelGlyph name={prompt.icon} size={16} className="text-amber" />}
            <span>{prompt.text}</span>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}