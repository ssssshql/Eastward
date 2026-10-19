import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { XIcon } from 'lucide-react';

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  aside?: React.ReactNode;
}

const EASE = [0.23, 1, 0.32, 1] as const;

/** Carved wooden window with a name plaque — the shared frame for every menu. */
export function Modal({ title, subtitle, onClose, children, className = '', aside }: ModalProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div className="fixed inset-0 z-30 flex items-center justify-center p-2 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: EASE }}>
      <div className="absolute inset-0 bg-[#0c0705]/60" onClick={onClose} aria-hidden="true" />
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`panel relative flex max-h-[94dvh] max-w-full flex-col text-cream sm:max-h-[88vh] ${className}`}
        initial={reduce ? false : { opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 4 }}
        transition={{ duration: 0.22, ease: EASE }}>
        <header className="mx-[9px] mt-[9px] flex items-center justify-between gap-4 border-b-2 border-wood-lo/80 px-3 pb-3 pt-3 sm:gap-6 sm:px-5 sm:pb-4 sm:pt-4">
          <div className="min-w-0">
            <h2 className="plate px-4 py-1 font-display text-lg font-black leading-tight tracking-tight sm:text-xl">{title}</h2>
            {subtitle && <p className="mt-2 text-xs text-cream-dim sm:text-sm">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {aside}
            {onClose &&
            <button type="button" onClick={onClose} aria-label="关闭" className="btn-wood flex h-9 w-9 items-center justify-center rounded-md bg-berry text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-amber">
                <XIcon className="h-5 w-5" strokeWidth={3} />
              </button>
            }
          </div>
        </header>
        <div className="mx-[9px] mb-[9px] min-h-0 flex-1 overflow-y-auto">{children}</div>
      </motion.section>
    </motion.div>);

}