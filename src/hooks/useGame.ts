import { useEffect, useMemo, useRef, useState } from 'react';
import type { AnimalKind, PanelMode, UiSnapshot, UpgradeId } from '../types/game';
import { FarmGame, InputState } from '../utils/engine/FarmGame';
import { Renderer } from '../utils/engine/Renderer';
import { buy, buyAnimal, craft, smelt, upgrade } from '../utils/engine/economy';
import { deliverRequest } from '../utils/engine/social';

export interface GameActions {
  selectSlot: (i: number) => void;
  swapSlots: (a: number, b: number) => void;
  buy: (id: string, qty: number) => void;
  buyAnimal: (kind: AnimalKind) => void;
  upgrade: (id: UpgradeId) => void;
  smelt: (ore: string) => void;
  craft: (id: string) => void;
  eat: (slot: number) => void;
  deliver: (id: number) => void;
  openPanel: (m: PanelMode) => void;
  closePanel: () => void;
  confirmSleep: () => void;
  continueDay: () => void;
  finishFishing: (success: boolean) => void;
  newGame: () => void;
  continueGame: () => void;
}

interface UseGameOptions {
  depthOfField: boolean;
}

const HOTKEYS = '1234567890-=';

function createInput(): InputState {
  return { up: false, down: false, left: false, right: false, useHeld: false, usePressed: false, interactPressed: false, mouseX: 0, mouseY: 0, mouseInside: false };
}

export function useGame({ depthOfField }: UseGameOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<FarmGame | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const [snap, setSnap] = useState<UiSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rendererRef.current) rendererRef.current.options.dof = depthOfField;
  }, [depthOfField]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: Renderer;
    const game = new FarmGame();
    try {
      renderer = new Renderer(canvas);
    } catch {
      setError('你的浏览器不支持画布渲染，请换用最新版 Chrome / Edge / Safari。');
      return;
    }
    renderer.options.dof = depthOfField;
    rendererRef.current = renderer;
    gameRef.current = game;
    const input = createInput();

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      renderer.resize(Math.floor(r.width), Math.floor(r.height));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const setDir = (k: string, v: boolean) => {
      if (k === 'w' || k === 'arrowup') input.up = v;else
      if (k === 's' || k === 'arrowdown') input.down = v;else
      if (k === 'a' || k === 'arrowleft') input.left = v;else
      if (k === 'd' || k === 'arrowright') input.right = v;else
      return false;
      return true;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null;
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA')) return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'tab'].includes(k)) e.preventDefault();
      if (game.mode === 'fishing' || game.mode === 'title' || game.mode === 'summary') return;
      if (game.mode === 'dialog') {
        if (!e.repeat && (k === ' ' || k === 'e' || k === 'f' || k === 'enter' || k === 'escape')) {
          game.closePanel();
          input.usePressed = false;
          input.useHeld = false;
        }
        return;
      }
      if (setDir(k, true)) return;
      if (k === ' ' || k === 'j') {
        if (!e.repeat && game.mode === 'play') input.usePressed = true;
        input.useHeld = game.mode === 'play';
      } else if (k === 'e' || k === 'f') {
        if (!e.repeat && game.mode === 'play') input.interactPressed = true;
      } else if (k === 'tab' || k === 'i') game.togglePanel('inventory');else
      if (k === 'g') game.togglePanel('journal');else
      if (k === 'v') game.togglePanel('villagers');else
      if (k === 'escape') game.closePanel();else
      if (game.mode === 'play') {
        const idx = HOTKEYS.indexOf(e.key);
        if (idx >= 0) game.selectSlot(idx);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (setDir(k, false)) return;
      if (k === ' ' || k === 'j') input.useHeld = false;
    };
    const onMove = (e: MouseEvent) => {
      input.mouseX = e.offsetX;
      input.mouseY = e.offsetY;
      input.mouseInside = true;
    };
    const onLeave = () => {
      input.mouseInside = false;
      input.useHeld = false;
    };
    const onDown = (e: MouseEvent) => {
      if (game.mode === 'dialog') {
        game.closePanel();
        return;
      }
      if (game.mode !== 'play') return;
      if (e.button === 0) {
        input.usePressed = true;
        input.useHeld = true;
      } else if (e.button === 2) input.interactPressed = true;
    };
    const onUp = (e: MouseEvent) => {
      if (e.button === 0) input.useHeld = false;
    };
    const onWheel = (e: WheelEvent) => {
      if (game.mode === 'play') game.cycleSlot(e.deltaY > 0 ? 1 : -1);
    };
    const onCtx = (e: MouseEvent) => e.preventDefault();
    const onBlur = () => Object.assign(input, { up: false, down: false, left: false, right: false, useHeld: false });

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('blur', onBlur);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('wheel', onWheel, { passive: true });
    canvas.addEventListener('contextmenu', onCtx);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (game.mode !== 'play') input.up = input.down = input.left = input.right = false;
      game.update(dt, input);
      input.usePressed = false;
      input.interactPressed = false;
      renderer.frame(game, Math.min(dt, 0.05));
      if (game.dirty) {
        game.dirty = false;
        setSnap(game.snapshot());
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('blur', onBlur);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('contextmenu', onCtx);
      gameRef.current = null;
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions = useMemo<GameActions>(() => {
    const call = (fn: (g: FarmGame) => void) => {
      const g = gameRef.current;
      if (g) {
        fn(g);
        g.dirty = true;
      }
    };
    return {
      selectSlot: (i) => call((g) => g.selectSlot(i)),
      swapSlots: (a, b) => call((g) => g.swapSlots(a, b)),
      buy: (id, qty) => call((g) => buy(g, id, qty)),
      buyAnimal: (kind) => call((g) => buyAnimal(g, kind)),
      upgrade: (id) => call((g) => upgrade(g, id)),
      smelt: (ore) => call((g) => smelt(g, ore)),
      craft: (id) => call((g) => craft(g, id)),
      eat: (slot) => call((g) => g.eatSlot(slot)),
      deliver: (id) => call((g) => deliverRequest(g, id)),
      openPanel: (m) => call((g) => g.togglePanel(m)),
      closePanel: () => call((g) => g.closePanel()),
      confirmSleep: () => call((g) => g.sleep(false)),
      continueDay: () => call((g) => g.continueDay()),
      finishFishing: (s) => call((g) => g.finishFishing(s)),
      newGame: () => call((g) => g.startNewGame()),
      continueGame: () => call((g) => g.continueSaved())
    };
  }, []);

  return { canvasRef, snap, actions, error };
}