import React from 'react';
import type { PromptIcon } from '../types/game';

const GLYPHS: Record<PromptIcon, string[]> = {
  hand: ['...11....', '..1..1...', '..1..111.', '..1..1..1', '111..1..1', '1.1.....1', '1.......1', '.1......1', '..1....1.', '...1111..'],
  talk: ['.1111111.', '1.......1', '1.11.11.1', '1.......1', '1.......1', '.111.111.', '....11...', '....1....'],
  gift: ['.11...11.', '1..1.1..1', '.1111111.', '111111111', '1...1...1', '1...1...1', '1...1...1', '111111111'],
  door: ['..11111..', '.1.....1.', '.1.....1.', '.1.....1.', '.1....11.', '.1.....1.', '.1.....1.', '111111111'],
  sleep: ['...111.1.', '..11.....', '.11....1.', '.11......', '.11......', '.11......', '..11.....', '...111...'],
  look: ['.........', '..11111..', '.1.....1.', '1..111..1', '1..111..1', '.1.....1.', '..11111..'],
  fish: ['...111...', '..1...1..', '11.....1.', '1.1.1...1', '11.....1.', '..1...1..', '...111...'],
  ship: ['111111111', '1.......1', '1.1...1.1', '1..1.1..1', '1...1...1', '1..1.1..1', '1.1...1.1', '111111111']
};

interface PixelGlyphProps {
  name: PromptIcon;
  size?: number;
  className?: string;
}

/** Tiny hand-drawn pixel glyph with a 1px drop shadow, rendered crisp at any integer size. */
export function PixelGlyph({ name, size = 24, className = '' }: PixelGlyphProps) {
  const rows = GLYPHS[name];
  const w = rows[0].length;
  const h = rows.length;
  const s = Math.max(w, h + 1);
  const ox = (s - w) / 2;
  const oy = (s - h - 1) / 2;
  const rects: React.ReactNode[] = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '1') rects.push(<rect key={`${x}-${y}`} x={x + ox} y={y + oy} width={1} height={1} />);
  }));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${s} ${s}`} shapeRendering="crispEdges" aria-hidden="true" className={className}>
      <g fill="#140b07" opacity={0.75} transform="translate(0 1)">{rects}</g>
      <g fill="currentColor">{rects}</g>
    </svg>);

}