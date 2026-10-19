import React from 'react';
import { ItemIcon } from '../ItemIcon';

interface ShopRowProps {
  icon: string;
  title: string;
  meta: string;
  tag?: string;
  children: React.ReactNode;
}

export const btnBase = 'btn-wood rounded-md px-3.5 pb-2 pt-1.5 text-sm font-black disabled:cursor-not-allowed';
export const btnPrimary = `${btnBase} bg-amber text-parch-ink hover:bg-[#ffc76a]`;
export const btnGhost = `${btnBase} bg-wood text-cream hover:bg-wood-hi`;

export function ShopRow({ icon, title, meta, tag, children }: ShopRowProps) {
  return (
    <li className="flex items-center gap-3 py-3 sm:gap-4">
      <div className="slot flex h-12 w-12 shrink-0 items-center justify-center">
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
    <div className="flex gap-1.5 px-4 pt-4 sm:px-7" role="tablist">
      {tabs.map((t) =>
      <button
        key={t.id}
        role="tab"
        type="button"
        aria-selected={value === t.id}
        onClick={() => onChange(t.id)}
        className={`btn-wood rounded-md px-4 py-1.5 text-sm font-black focus:outline-none focus-visible:ring-2 focus-visible:ring-amber ${value === t.id ? 'bg-parch text-parch-ink' : 'bg-wood-lo text-cream-dim hover:text-cream'}`}>
          {t.label}
        </button>
      )}
    </div>);

}