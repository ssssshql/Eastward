import type { RecipeDef } from '../types/game';

export const recipes: RecipeDef[] = [
{ id: 'jar', output: 'jar', qty: 1, inputs: [{ id: 'wood', qty: 15 }, { id: 'stone', qty: 10 }, { id: 'copper_ore', qty: 3 }] },
{ id: 'sprinkler', output: 'sprinkler', qty: 1, inputs: [{ id: 'copper_bar', qty: 1 }, { id: 'stone', qty: 10 }, { id: 'quartz', qty: 1 }] },
{ id: 'lamp', output: 'lamp', qty: 1, inputs: [{ id: 'wood', qty: 8 }, { id: 'stone', qty: 4 }] },
{ id: 'stew', output: 'stew', qty: 1, inputs: [{ id: 'turnip', qty: 2 }, { id: 'wood', qty: 1 }] },
{ id: 'tart', output: 'tart', qty: 1, inputs: [{ id: 'emberberry', qty: 3 }, { id: 'egg', qty: 1 }] },
{ id: 'fish_soup', output: 'fish_soup', qty: 1, inputs: [{ id: 'fish_minnow', qty: 2 }, { id: 'pepper', qty: 1 }] }];


export const processing: Record<string, string> = {
  turnip: 'jam_turnip',
  pepper: 'jam_pepper',
  emberberry: 'jam_emberberry',
  sunpetal: 'jam_sunpetal',
  moonbloom: 'jam_moonbloom',
  amber: 'jam_amber',
  melon: 'jam_melon',
  egg: 'mayo',
  milk: 'cheese'
};