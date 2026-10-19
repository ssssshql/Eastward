import type { MinimapView, Season, World } from '../../types/game';
import { GRASS } from '../sprites/terrain';

const S = 4;
const GROUND: Record<string, string> = {
  path: '#c49a6c',
  sand: '#e6d09a',
  water: '#3a86ad',
  dock: '#9b6b46',
  cobble: '#aaa4b2',
  cave: '#5a4a62',
  wall: '#241c2c',
  floor: '#b47a4a'
};
const ROOF: Record<string, string> = {
  house: '#c8503a',
  coop: '#7a3a32',
  store: '#2f8f8a',
  smith: '#3a3442',
  tavern: '#8a2f3a',
  cottage0: '#d06a3a',
  cottage1: '#4a7ad0',
  cottage2: '#7a5ad0',
  cottage3: '#3a9a6a',
  fountain: '#7fd8ff',
  cave: '#4a4458',
  bin: '#9a6a43',
  board: '#9a6a43',
  cart: '#e0503a'
};
const TREE: Record<Season, string> = { spring: '#2f7a42', summer: '#246a3c', autumn: '#b0582a', winter: '#6f8a90' };

/** Paints a flat, readable top-down map of a world (4 screen px per tile). */
export function renderMinimap(w: World, season: Season, marker: [number, number] | null): MinimapView {
  const c = document.createElement('canvas');
  c.width = w.w * S;
  c.height = w.h * S;
  const x = c.getContext('2d');
  if (x) {
    for (let ty = 0; ty < w.h; ty++) {
      for (let tx = 0; tx < w.w; tx++) {
        const i = ty * w.w + tx;
        const g = w.ground[i];
        x.fillStyle = w.tilled[i] ? '#7a5238' : g === 'grass' ? GRASS[season] : GROUND[g];
        x.fillRect(tx * S, ty * S, S, S);
        if (g === 'water' && ty > 0) {
          const up = w.ground[i - w.w];
          if (up !== 'water' && up !== 'dock') {
            x.fillStyle = '#245f80';
            x.fillRect(tx * S, ty * S, S, 1);
          }
        }
      }
    }
    for (let ty = 0; ty < w.h; ty++) {
      for (let tx = 0; tx < w.w; tx++) {
        const o = w.objects[ty * w.w + tx];
        if (!o) continue;
        const px = tx * S;
        const py = ty * S;
        switch (o.kind) {
          case 'tree':
            x.fillStyle = TREE[season];
            x.fillRect(px, py - 1, S, S);
            x.fillStyle = 'rgba(255,255,255,0.18)';
            x.fillRect(px, py - 1, 2, 1);
            break;
          case 'bush':
            x.fillStyle = '#4f8a45';
            x.fillRect(px + 1, py + 1, 2, 2);
            break;
          case 'rock':
            x.fillStyle = o.variant >= 3 ? '#b98af0' : '#8d929f';
            x.fillRect(px + 1, py + 1, 2, 2);
            break;
          case 'stump':
            x.fillStyle = '#7b5238';
            x.fillRect(px + 1, py + 1, 2, 2);
            break;
          case 'crystal':
            x.fillStyle = '#c08cff';
            x.fillRect(px + 1, py, 2, 3);
            break;
          case 'torch':
          case 'lamp':
            x.fillStyle = '#ffd27a';
            x.fillRect(px + 1, py + 1, 2, 2);
            break;
          case 'ladder':
            x.fillStyle = o.variant ? '#ffb547' : '#140b07';
            x.fillRect(px, py, S, S);
            break;
          default:
            break;
        }
      }
    }
    for (const s of w.structures) {
      if (s.kind === 'furniture') continue;
      const key = s.kind === 'cottage' ? `cottage${s.variant ?? 0}` : s.kind;
      const tall = ['house', 'coop', 'store', 'smith', 'tavern', 'cottage'].includes(s.kind) ? 1 : 0;
      const px = s.x * S;
      const py = (s.y - tall) * S;
      const pw = s.w * S;
      const ph = (s.h + tall) * S;
      x.fillStyle = '#140b07';
      x.fillRect(px - 1, py - 1, pw + 2, ph + 2);
      x.fillStyle = ROOF[key] ?? '#9a6a43';
      x.fillRect(px, py, pw, ph);
      x.fillStyle = 'rgba(255,255,255,0.22)';
      x.fillRect(px, py, pw, 1);
    }
    x.fillStyle = '#ffb547';
    for (const wp of w.warps) x.fillRect(wp.x * S, wp.y * S, wp.w * S, wp.h * S);
  }
  return { url: c.toDataURL(), w: w.w, h: w.h, marker };
}