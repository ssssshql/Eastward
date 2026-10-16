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

export function Modal({ title, subtitle, onClose, children, className = '', aside }: ModalProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div className="fixed inset-0 z-30 flex items-center justify-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: EASE }}>
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden="true" />
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`glass relative flex max-h-[88vh] flex-col text-cream ${className}`}
        initial={reduce ? false : { opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 4 }}
        transition={{ duration: 0.22, ease: EASE }}>
        
        <header className="flex items-start justify-between gap-6 border-b border-cream/10 px-7 pb-4 pt-6">
          <div>
            <h2 className="font-display text-2xl font-black leading-tight tracking-tight">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-cream-dim">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {aside}
            {onClose &&
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="rounded-lg p-1.5 text-cream-dim transition-colors duration-150 hover:bg-cream/10 hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-amber">
              
                <XIcon className="h-5 w-5" />
              </button>
            }
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </motion.section>
    </motion.div>);

}