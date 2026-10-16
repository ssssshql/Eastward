import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Banner } from '../../types/game';

export function MapBanner({ banner }: {banner: Banner | null;}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[22%] z-20 flex justify-center" aria-live="polite">
      <AnimatePresence>
        {banner &&
        <motion.div
          key={banner.key}
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
          
            <div className="h-px w-40 bg-cream/40" />
            <h2 className="title-shadow mt-3 text-5xl font-black tracking-tight text-cream">{banner.title}</h2>
            <p className="title-shadow mt-2 text-sm tracking-[0.2em] text-cream/80">{banner.sub}</p>
            <div className="mt-3 h-px w-40 bg-cream/40" />
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}