import React from 'react';

interface CoinsProps {
  value: number;
  className?: string;
}

export function Coins({ value, className = '' }: CoinsProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 tabular-nums ${className}`}>
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber ring-2 ring-amber-deep/60" aria-hidden="true" />
      {value.toLocaleString('zh-CN')}
    </span>);

}