import React from 'react';
import { BackpackIcon, BookOpenIcon, MapIcon, Maximize2Icon, Minimize2Icon, UsersIcon } from 'lucide-react';
import { useFullscreen } from '../../hooks/useFullscreen';
import type { UiSnapshot } from '../../types/game';
import type { GameActions } from '../../hooks/useGame';
import { ClockCard } from './ClockCard';
import { Hotbar } from './Hotbar';
import { EnergyMeter } from './EnergyMeter';
import { ActionPrompt } from './ActionPrompt';
import { PickupFeed, ToastStack } from './Feeds';
import { GoalTracker } from './GoalTracker';

interface HudProps {
  snap: UiSnapshot;
  actions: GameActions;
  touch: boolean;
}

const MENU = [
{ id: 'inventory', label: '背包', Icon: BackpackIcon },
{ id: 'map', label: '地图', Icon: MapIcon },
{ id: 'villagers', label: '居民', Icon: UsersIcon },
{ id: 'journal', label: '日志', Icon: BookOpenIcon }] as
const;

export function Hud({ snap, actions, touch }: HudProps) {
  const showHp = snap.mapId === 'mine' || snap.hp < snap.maxHp;
  const fs = useFullscreen();
  if (touch) {
    const FsIcon = fs.isFullscreen ? Minimize2Icon : Maximize2Icon;
    const btn = 'glass flex h-12 w-12 flex-col items-center justify-center gap-0.5 text-cream transition-transform duration-100 ease-out active:translate-y-0.5';
    return (
      <div className="pointer-events-none safe-inset z-10">
        <nav className="pointer-events-auto absolute left-3 top-3 flex gap-1.5" aria-label="菜单">
          {MENU.map(({ id, label, Icon }) =>
          <button key={id} type="button" onClick={() => actions.openPanel(id)} aria-label={label} className={btn}>
              <Icon className="h-4 w-4 text-amber" aria-hidden="true" />
              <span className="text-[9px] font-bold">{label}</span>
            </button>
          )}
          {fs.supported &&
          <button type="button" onClick={() => void fs.toggle()} aria-label={fs.isFullscreen ? '退出全屏' : '全屏横屏'} className={btn}>
              <FsIcon className="h-4 w-4 text-amber" aria-hidden="true" />
              <span className="text-[9px] font-bold">{fs.isFullscreen ? '退出' : '全屏'}</span>
            </button>
          }
        </nav>
        <div className="pointer-events-auto absolute right-3 top-3 flex flex-col items-end gap-2">
          <ClockCard compact season={snap.season} dayOfSeason={snap.dayOfSeason} time={snap.time} weather={snap.weather} tomorrow={snap.tomorrow} money={snap.money} mapName={snap.mapName} />
          <EnergyMeter compact energy={snap.energy} maxEnergy={snap.maxEnergy} hp={snap.hp} maxHp={snap.maxHp} showHp={showHp} />
        </div>
        <div className="absolute left-1/2 top-16 w-[min(92vw,420px)] -translate-x-1/2">
          <ToastStack toasts={snap.toasts} />
        </div>
        <div className="absolute left-3 top-16">
          <PickupFeed pickups={snap.pickups} />
        </div>
        <div className="pointer-events-auto absolute inset-x-0 bottom-2 flex justify-center px-2">
          <Hotbar compact inventory={snap.inventory} selected={snap.selected} canWater={snap.canWater} canMax={snap.canMax} onSelect={actions.selectSlot} />
        </div>
      </div>);

  }
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="pointer-events-auto absolute left-4 top-4">
        <GoalTracker
          stats={snap.stats}
          goalsDone={snap.goalsDone}
          requests={snap.requests.length}
          onInventory={() => actions.openPanel('inventory')}
          onJournal={() => actions.openPanel('journal')}
          onVillagers={() => actions.openPanel('villagers')}
          onMap={() => actions.openPanel('map')} />
      </div>
      <div className="pointer-events-auto absolute right-4 top-4">
        <ClockCard season={snap.season} dayOfSeason={snap.dayOfSeason} time={snap.time} weather={snap.weather} tomorrow={snap.tomorrow} money={snap.money} mapName={snap.mapName} />
      </div>
      <div className="absolute left-1/2 top-4 -translate-x-1/2">
        <ToastStack toasts={snap.toasts} />
      </div>
      <div className="absolute bottom-28 left-4">
        <PickupFeed pickups={snap.pickups} />
      </div>
      {snap.mode !== 'dialog' &&
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
          <ActionPrompt prompt={snap.prompt} />
          <div className="pointer-events-auto">
            <Hotbar inventory={snap.inventory} selected={snap.selected} canWater={snap.canWater} canMax={snap.canMax} onSelect={actions.selectSlot} />
          </div>
        </div>
      }
      <div className="pointer-events-auto absolute bottom-4 right-4">
        <EnergyMeter energy={snap.energy} maxEnergy={snap.maxEnergy} hp={snap.hp} maxHp={snap.maxHp} showHp={showHp} />
      </div>
    </div>);

}