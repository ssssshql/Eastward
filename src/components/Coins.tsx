import React from 'react';

interface CoinsProps {
  value: number;
  className?: string;
}

export function Coins({ value, className = '' }: CoinsProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-pixel tabular-nums ${className}`}>
      <span className="inline-block h-3 w-3 rounded-full border-2 border-[#8a4a10] bg-[#ffd04a] shadow-[inset_-1px_-1px_0_#e08a1e]" aria-hidden="true" />
      {value.toLocaleString('zh-CN')}
    </span>);

}