import React from 'react';
import { ItemIcon } from '../ItemIcon';

interface ShopRowProps {
  icon: string;
  title: string;
  meta: string;
  tag?: string;
  children: React.ReactNode;
}

export const btnBase =
'rounded-lg px-3 py-1.5 text-sm font-bold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber disabled:cursor-not-allowed disabled:opacity-35';
export const btnPrimary = `${btnBase} bg-amber text-ink hover:bg-amber-deep`;
export const btnGhost = `${btnBase} bg-cream/10 text-cream hover:bg-cream/20`;

export function ShopRow({ icon, title, meta, tag, children }: ShopRowProps) {
  return (
    <li className="flex items-center gap-4 py-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink-3/80">
        <ItemIcon id={icon} size={32} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-bold">{title}</span>
          {tag && <span className="text-xs text-mist">{tag}</span>}
        </div>
        <p className="mt-0.5 truncate text-xs text-cream-dim">{meta}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </li>);

}

interface TabsProps<T extends string> {
  tabs: {id: T;label: string;}[];
  value: T;
  onChange: (t: T) => void;
}

export function Tabs<T extends string>({ tabs, value, onChange }: TabsProps<T>) {
  return (
    <div className="flex gap-1 px-7 pt-4" role="tablist">
      {tabs.map((t) =>
      <button
        key={t.id}
        role="tab"
        type="button"
        aria-selected={value === t.id}
        onClick={() => onChange(t.id)}
        className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber ${
        value === t.id ? 'bg-cream text-ink' : 'text-cream-dim hover:bg-cream/10 hover:text-cream'}`
        }>
        
          {t.label}
        </button>
      )}
    </div>);

}