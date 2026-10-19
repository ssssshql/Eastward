import type { Season } from '../types/game';

/** What grows wild in each region per season; duplicates weight the roll. */
export const forageTable: Record<'forest' | 'beach', Record<Season, string[]>> = {
  forest: {
    spring: ['forage_herb', 'forage_herb', 'forage_mushroom'],
    summer: ['forage_berry', 'forage_berry', 'forage_mushroom'],
    autumn: ['forage_mushroom', 'forage_mushroom', 'forage_berry'],
    winter: ['forage_holly', 'forage_holly', 'forage_mushroom']
  },
  beach: {
    spring: ['forage_shell', 'forage_shell', 'forage_coral'],
    summer: ['forage_shell', 'forage_coral', 'forage_coral'],
    autumn: ['forage_shell', 'forage_shell', 'forage_coral'],
    winter: ['forage_shell', 'forage_shell', 'forage_shell', 'forage_coral']
  }
};