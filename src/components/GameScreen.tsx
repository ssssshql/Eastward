import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import { Hud } from './hud/Hud';
import { MapBanner } from './hud/MapBanner';
import { TitleScreen } from './TitleScreen';
import { StorePanel } from './panels/StorePanel';
import { SmithPanel } from './panels/SmithPanel';
import { TavernPanel } from './panels/TavernPanel';
import { BoardPanel } from './panels/BoardPanel';
import { VillagersPanel } from './panels/VillagersPanel';
import { InventoryPanel } from './panels/InventoryPanel';
import { JournalPanel } from './panels/JournalPanel';
import { SleepDialog } from './panels/SleepDialog';
import { DaySummary } from './panels/DaySummary';
import { FishingMinigame } from './FishingMinigame';
import { DialogBox } from './DialogBox';

interface GameScreenProps {
  depthOfField: boolean;
}

export function GameScreen({ depthOfField }: GameScreenProps) {
  const { canvasRef, snap, actions, error } = useGame({ depthOfField });
  const mode = snap?.mode;
  return (
    <main className="relative h-screen w-full select-none overflow-hidden bg-ink font-sans text-cream">
      <canvas ref={canvasRef} className="pixelated absolute inset-0 block h-full w-full" aria-label="雾谷农场游戏画面" />
      {error && <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-cream">{error}</div>}
      {!snap && !error && <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-cream-dim">雾气正在散去……</div>}
      {snap && mode !== 'title' && mode !== 'summary' && <Hud snap={snap} actions={actions} />}
      {snap && mode !== 'title' && mode !== 'summary' && <MapBanner banner={snap.banner} />}
      <AnimatePresence>
        {snap && mode === 'title' && <TitleScreen key="title" hasSave={snap.hasSave} onNew={actions.newGame} onContinue={actions.continueGame} />}
        {snap && mode === 'store' && <StorePanel key="store" snap={snap} onBuy={actions.buy} onBuyAnimal={actions.buyAnimal} onClose={actions.closePanel} />}
        {snap && mode === 'smith' && <SmithPanel key="smith" snap={snap} onSmelt={actions.smelt} onUpgrade={actions.upgrade} onClose={actions.closePanel} />}
        {snap && mode === 'tavern' && <TavernPanel key="tavern" money={snap.money} onBuy={actions.buy} onClose={actions.closePanel} />}
        {snap && mode === 'board' && <BoardPanel key="board" snap={snap} onDeliver={actions.deliver} onClose={actions.closePanel} />}
        {snap && mode === 'villagers' && <VillagersPanel key="villagers" snap={snap} onClose={actions.closePanel} />}
        {snap && mode === 'inventory' &&
        <InventoryPanel key="inv" inventory={snap.inventory} selected={snap.selected} onSwap={actions.swapSlots} onCraft={actions.craft} onEat={actions.eat} onClose={actions.closePanel} />
        }
        {snap && mode === 'journal' && <JournalPanel key="journal" stats={snap.stats} goalsDone={snap.goalsDone} onClose={actions.closePanel} />}
        {snap && mode === 'sleep' && <SleepDialog key="sleep" time={snap.time} onSleep={actions.confirmSleep} onCancel={actions.closePanel} />}
        {snap && mode === 'dialog' && snap.dialog && <DialogBox key="dialog" dialog={snap.dialog} onClose={actions.closePanel} />}
        {snap && mode === 'fishing' && snap.fishingFish && <FishingMinigame key="fish" fishId={snap.fishingFish} onFinish={actions.finishFishing} />}
        {snap && mode === 'summary' && snap.summary && <DaySummary key="summary" summary={snap.summary} money={snap.money} onContinue={actions.continueDay} />}
      </AnimatePresence>
    </main>);

}