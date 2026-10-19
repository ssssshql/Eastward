import React from 'react';
import { HeartIcon, ZapIcon } from 'lucide-react';

interface VitalsProps {
  energy: number;
  maxEnergy: number;
  hp: number;
  maxHp: number;
  showHp: boolean;
  compact?: boolean;
}

interface BarProps {
  value: number;
  max: number;
  color: string;
  icon: React.ReactNode;
  label: string;
  compact: boolean;
}

function Bar({ value, max, color, icon, label, compact }: BarProps) {
  const pct = Math.max(0, Math.min(1, value / max));
  const low = pct < 0.25;
  const fill = low ? 'bg-berry' : color;
  if (compact) {
    return (
      <div className="flex items-center gap-1.5" role="meter" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max}>
        {icon}
        <div className="relative h-2 w-20 overflow-hidden border border-wood-ink bg-ink-3">
          <div className={`absolute inset-y-0 left-0 transition-[width] duration-200 ease-out ${fill}`} style={{ width: `${pct * 100}%` }} />
        </div>
        <span className={`w-6 text-right text-[10px] font-black tabular-nums ${low ? 'text-berry' : 'text-cream'}`}>{Math.round(value)}</span>
      </div>);

  }
  return (
    <div className="flex flex-col items-center gap-1.5" role="meter" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max}>
      {icon}
      <div className="relative h-36 w-3.5 overflow-hidden border-2 border-wood-ink bg-ink-3">
        <div className={`absolute inset-x-0 bottom-0 transition-[height] duration-200 ease-out ${fill}`} style={{ height: `${pct * 100}%` }} />
      </div>
      <span className={`text-xs font-black tabular-nums ${low ? 'text-berry' : 'text-cream'}`}>{Math.round(value)}</span>
    </div>);

}

export function EnergyMeter({ energy, maxEnergy, hp, maxHp, showHp, compact = false }: VitalsProps) {
  return (
    <div className={compact ? 'glass flex flex-col gap-1 px-2.5 py-2' : 'glass flex gap-3 px-3 pb-3 pt-2.5'}>
      {showHp && <Bar compact={compact} value={hp} max={maxHp} color="bg-berry" icon={<HeartIcon className="h-3.5 w-3.5 fill-berry text-berry" aria-hidden="true" />} label="生命" />}
      <Bar compact={compact} value={energy} max={maxEnergy} color="bg-sage" icon={<ZapIcon className="h-3.5 w-3.5 fill-sage text-sage" aria-hidden="true" />} label="体力" />
    </div>);

}