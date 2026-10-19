import type { FishDef } from '../types/game';

export const fishList: FishDef[] = [
{ id: 'fish_minnow', difficulty: 0.3, weight: 5, behavior: 'smooth', maps: ['farm', 'town', 'forest'], size: [6, 14] },
{ id: 'fish_perch', difficulty: 0.5, weight: 3, behavior: 'mixed', maps: ['farm', 'town', 'forest'], size: [14, 32] },
{ id: 'fish_koi', difficulty: 0.72, weight: 1.3, behavior: 'floater', maps: ['farm', 'town'], rain: true, size: [28, 60] },
{ id: 'fish_lantern', difficulty: 0.85, weight: 1.6, behavior: 'dart', maps: ['farm', 'town'], night: true, size: [12, 26] },
{ id: 'fish_carp', difficulty: 0.65, weight: 2.4, behavior: 'sinker', maps: ['town'], size: [30, 72] },
{ id: 'fish_trout', difficulty: 0.55, weight: 3, behavior: 'mixed', maps: ['forest'], size: [20, 46] },
{ id: 'fish_catfish', difficulty: 0.8, weight: 1.1, behavior: 'sinker', maps: ['forest'], rain: true, size: [40, 112] },
{ id: 'fish_sardine', difficulty: 0.34, weight: 5, behavior: 'smooth', maps: ['beach'], size: [8, 20] },
{ id: 'fish_puffer', difficulty: 0.76, weight: 1.3, behavior: 'floater', maps: ['beach'], seasons: ['summer', 'autumn'], size: [10, 30] },
{ id: 'fish_tuna', difficulty: 0.8, weight: 1.3, behavior: 'smooth', maps: ['beach'], seasons: ['summer', 'winter'], size: [60, 150] },
{ id: 'fish_eel', difficulty: 0.84, weight: 1.4, behavior: 'dart', maps: ['beach'], night: true, size: [40, 92] }];