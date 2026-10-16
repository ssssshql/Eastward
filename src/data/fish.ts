import type { FishDef } from '../types/game';

export const fishList: FishDef[] = [
{ id: 'fish_minnow', difficulty: 0.3, weight: 5 },
{ id: 'fish_perch', difficulty: 0.5, weight: 3 },
{ id: 'fish_koi', difficulty: 0.72, weight: 1.3 },
{ id: 'fish_lantern', difficulty: 0.85, weight: 1.6, night: true },
{ id: 'fish_carp', difficulty: 0.65, weight: 2.4, map: 'town' }];