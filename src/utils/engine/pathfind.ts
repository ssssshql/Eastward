import type { World } from '../../types/game';
import { inBounds, isSolid } from './world';

const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Breadth-first search over walkable tiles to the nearest goal tile. Returns waypoints excluding the start. */
export function findPath(w: World, sx: number, sy: number, goals: Set<number>): [number, number][] | null {
  const W = w.w;
  if (!inBounds(w, sx, sy)) return null;
  const start = sy * W + sx;
  if (goals.has(start)) return [];
  const prev = new Int32Array(W * w.h).fill(-2);
  prev[start] = -1;
  const q: number[] = [start];
  let head = 0;
  while (head < q.length) {
    const c = q[head++];
    const cx = c % W;
    const cy = (c - cx) / W;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!inBounds(w, nx, ny)) continue;
      const n = ny * W + nx;
      if (prev[n] !== -2 || isSolid(w, nx, ny)) continue;
      prev[n] = c;
      if (goals.has(n)) {
        const out: [number, number][] = [];
        let k = n;
        while (k !== start && k >= 0) {
          out.push([k % W, Math.floor(k / W)]);
          k = prev[k];
        }
        return out.reverse();
      }
      q.push(n);
    }
  }
  return null;
}

/** Walkable 4-neighbours of a tile, as a goal set. */
export function neighbourGoals(w: World, x: number, y: number): Set<number> {
  const s = new Set<number>();
  for (const [dx, dy] of DIRS) {
    const nx = x + dx;
    const ny = y + dy;
    if (inBounds(w, nx, ny) && !isSolid(w, nx, ny)) s.add(ny * w.w + nx);
  }
  return s;
}