import React from 'react';
import { getIconUrl } from '../utils/sprites/iconCache';

interface ItemIconProps {
  id: string;
  size?: number;
  className?: string;
}

export function ItemIcon({ id, size = 32, className = '' }: ItemIconProps) {
  return <img src={getIconUrl(id)} width={size} height={size} alt="" draggable={false} className={`pixelated ${className}`} />;
}