import { buildIcon } from './icons';

const canvases = new Map<string, HTMLCanvasElement>();
const urls = new Map<string, string>();

export function getIconCanvas(id: string): HTMLCanvasElement {
  let c = canvases.get(id);
  if (!c) {
    c = buildIcon(id);
    canvases.set(id, c);
  }
  return c;
}

export function getIconUrl(id: string): string {
  let u = urls.get(id);
  if (!u) {
    u = getIconCanvas(id).toDataURL();
    urls.set(id, u);
  }
  return u;
}