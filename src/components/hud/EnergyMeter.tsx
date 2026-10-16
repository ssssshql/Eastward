import React from 'react';
import { HeartIcon, ZapIcon } from 'lucide-react';

interface VitalsProps {
  energy: number;
  maxEnergy: number;
  hp: number;
  maxHp: number;
  showHp: boolean;
}

function Bar({ value, max, color, low, icon, label }: {value: number;max: number;color: string;low: string;icon: React.ReactNode;label: string;}) {
  const pct = Math.max(0, Math.min(1, value / max));
  const isLow = pct < 0.25;
  return (
    <div className="flex flex-col items-center gap-1.5" role="meter" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max}>
      {icon}
      <div className="relative h-36 w-3.5 overflow-hidden rounded-full bg-ink-3">
        <div className={`absolute inset-x-0 bottom-0 rounded-full transition-[height] duration-200 ease-out ${isLow ? low : color}`} style={{ height: `${pct * 100}%` }} />
      </div>
      <span className={`text-xs font-black tabular-nums ${isLow ? 'text-berry' : 'text-cream'}`}>{Math.round(value)}</span>
    </div>);

}

export function EnergyMeter({ energy, maxEnergy, hp, maxHp, showHp }: VitalsProps) {
  return (
    <div className="glass flex gap-3 px-3 pb-3 pt-2.5">
      {showHp && <Bar value={hp} max={maxHp} color="bg-berry" low="bg-berry animate-pulse" icon={<HeartIcon className="h-3.5 w-3.5 fill-berry text-berry" aria-hidden="true" />} label="生命" />}
      <Bar value={energy} max={maxEnergy} color="bg-sage" low="bg-berry" icon={<ZapIcon className="h-3.5 w-3.5 fill-sage text-sage" aria-hidden="true" />} label="体力" />
    </div>);

}