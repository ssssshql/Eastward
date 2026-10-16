import React from 'react';
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
}

export function Hud({ snap, actions }: HudProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="pointer-events-auto absolute left-4 top-4">
        <GoalTracker
          stats={snap.stats}
          goalsDone={snap.goalsDone}
          requests={snap.requests.length}
          onInventory={() => actions.openPanel('inventory')}
          onJournal={() => actions.openPanel('journal')}
          onVillagers={() => actions.openPanel('villagers')} />
        
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
        <EnergyMeter energy={snap.energy} maxEnergy={snap.maxEnergy} hp={snap.hp} maxHp={snap.maxHp} showHp={snap.mapId === 'mine' || snap.hp < snap.maxHp} />
      </div>
    </div>);

}