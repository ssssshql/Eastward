import React from 'react';
import { CloudRainIcon, MapPinIcon, MoonIcon, SnowflakeIcon, SunIcon } from 'lucide-react';
import type { Season, Weather } from '../../types/game';
import { DAY_END, DAY_START, SEASON_NAMES } from '../../utils/engine/constants';
import { formatTime } from '../../utils/items';
import { Coins } from '../Coins';

interface ClockCardProps {
  season: Season;
  dayOfSeason: number;
  time: number;
  weather: Weather;
  tomorrow: Weather;
  money: number;
  mapName: string;
  compact?: boolean;
}

const WEATHER_LABEL: Record<Weather, string> = { clear: '晴', rain: '雨', snow: '雪' };

export function ClockCard({ season, dayOfSeason, time, weather, tomorrow, money, mapName, compact = false }: ClockCardProps) {
  const h = time / 60 % 24;
  const night = h >= 19 || h < 6;
  const Icon = weather === 'rain' ? CloudRainIcon : weather === 'snow' ? SnowflakeIcon : night ? MoonIcon : SunIcon;
  const progress = Math.min(1, Math.max(0, (time - DAY_START) / (DAY_END - DAY_START)));
  const late = time >= 24 * 60;
  if (compact) {
    return (
      <div className="glass flex items-center gap-3 rounded-xl px-3 py-2">
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-[10px] text-cream-dim">
            <Icon className="h-3 w-3 text-amber" aria-hidden="true" />
            {SEASON_NAMES[season]} · 第 {dayOfSeason} 天
          </div>
          <div className={`font-pixel text-2xl font-bold leading-none tabular-nums ${late ? 'text-berry' : 'text-cream'}`}>{formatTime(time)}</div>
        </div>
        <Coins value={money} className="text-sm font-black text-amber" />
      </div>);

  }
  return (
    <div className="glass w-56 px-4 pb-3 pt-3.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">
          {SEASON_NAMES[season]} · 第 {dayOfSeason} 天
        </span>
        <span className="flex items-center gap-1 text-xs text-cream-dim">
          <Icon className="h-4 w-4 text-amber" aria-hidden="true" />
          {WEATHER_LABEL[weather]}
        </span>
      </div>
      <div className={`mt-1 font-pixel text-[40px] font-bold leading-none tabular-nums ${late ? 'text-berry' : 'text-cream'}`}>{formatTime(time)}</div>
      <div className="relative mt-3 h-[3px] rounded-full bg-cream/15" role="progressbar" aria-label="今日进度" aria-valuenow={Math.round(progress * 100)}>
        <div className="absolute inset-y-0 left-0 rounded-full bg-amber/70" style={{ width: `${progress * 100}%` }} />
        <div className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber ring-2 ring-ink" style={{ left: `${progress * 100}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-cream-dim/80">
        <span>06:00</span>
        <span>明日 {WEATHER_LABEL[tomorrow]}</span>
        <span>02:00</span>
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-cream/10 pt-2.5">
        <span className="flex items-center gap-1 truncate text-xs text-cream-dim">
          <MapPinIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {mapName}
        </span>
        <Coins value={money} className="text-xl font-black text-amber" />
      </div>
    </div>);

}