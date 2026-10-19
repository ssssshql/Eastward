import { useEffect, useState } from 'react';

type FsElement = HTMLElement & {webkitRequestFullscreen?: () => Promise<void> | void;};
type FsDocument = Document & {webkitFullscreenElement?: Element | null;webkitExitFullscreen?: () => Promise<void> | void;};
type LockableOrientation = {lock?: (o: string) => Promise<void>;unlock?: () => void;};

function fsElement(): Element | null {
  const d = document as FsDocument;
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

export function fullscreenSupported(): boolean {
  const el = document.documentElement as FsElement;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen);
}

/** Fullscreen + landscape lock. Must be called from a user gesture. */
export async function enterImmersive(): Promise<void> {
  const el = document.documentElement as FsElement;
  try {
    if (!fsElement()) {
      if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });else
      await el.webkitRequestFullscreen?.();
    }
  } catch {

    /* fullscreen refused */}
  try {
    await (screen.orientation as unknown as LockableOrientation).lock?.('landscape');
  } catch {

    /* orientation lock unsupported */}
}

export async function exitImmersive(): Promise<void> {
  const d = document as FsDocument;
  try {
    (screen.orientation as unknown as LockableOrientation).unlock?.();
  } catch {

    /* ignore */}
  try {
    if (fsElement()) {
      if (d.exitFullscreen) await d.exitFullscreen();else
      await d.webkitExitFullscreen?.();
    }
  } catch {

    /* ignore */}
}

/** Adds the mobile web-app meta tags once so the game fills the screen edge to edge. */
export function ensureMobileMeta(): void {
  const set = (name: string, content: string) => {
    let m = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
    if (!m) {
      m = document.createElement('meta');
      m.name = name;
      document.head.appendChild(m);
    }
    m.content = content;
  };
  set('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  set('apple-mobile-web-app-capable', 'yes');
  set('mobile-web-app-capable', 'yes');
  set('apple-mobile-web-app-status-bar-style', 'black-translucent');
  set('theme-color', '#1f1410');
}

export function useFullscreen() {
  const [isFullscreen, setFs] = useState(false);
  useEffect(() => {
    const on = () => setFs(!!fsElement());
    on();
    document.addEventListener('fullscreenchange', on);
    document.addEventListener('webkitfullscreenchange', on);
    return () => {
      document.removeEventListener('fullscreenchange', on);
      document.removeEventListener('webkitfullscreenchange', on);
    };
  }, []);
  return {
    isFullscreen,
    supported: typeof document !== 'undefined' && fullscreenSupported(),
    toggle: () => isFullscreen ? exitImmersive() : enterImmersive()
  };
}

export function usePortrait(): boolean {
  const [portrait, setPortrait] = useState(() => typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const on = () => setPortrait(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return portrait;
}