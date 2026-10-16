import type { CropDef } from '../types/game';

export const crops: CropDef[] = [
{ id: 'turnip', name: '珍珠芜菁', seedId: 'seed_turnip', produceId: 'turnip', days: 4, yield: [1, 1], shape: 'root', leaf: '#5fbf4f', fruit: '#f6f0e4', accent: '#b04f9a' },
{ id: 'pepper', name: '赤焰椒', seedId: 'seed_pepper', produceId: 'pepper', days: 5, regrow: 2, yield: [1, 2], shape: 'berry', leaf: '#3fa84f', fruit: '#ff4a2e', accent: '#ffcf4a' },
{ id: 'emberberry', name: '余烬莓', seedId: 'seed_emberberry', produceId: 'emberberry', days: 6, regrow: 3, yield: [2, 3], shape: 'berry', leaf: '#45a85a', fruit: '#ff3d5a', accent: '#ffb36b' },
{ id: 'sunpetal', name: '向阳葵', seedId: 'seed_sunpetal', produceId: 'sunpetal', days: 6, yield: [1, 1], shape: 'flower', leaf: '#4fae45', fruit: '#ffcc2e', accent: '#7a3e22' },
{ id: 'moonbloom', name: '月光花', seedId: 'seed_moonbloom', produceId: 'moonbloom', days: 8, yield: [1, 1], shape: 'glow', leaf: '#2f9c8c', fruit: '#c6f8ff', accent: '#5ee6ff', glow: true },
{ id: 'amber', name: '琥珀南瓜', seedId: 'seed_amber', produceId: 'amber', days: 9, yield: [1, 1], shape: 'big', leaf: '#469d44', fruit: '#ff8a1f', accent: '#ffd27a' },
{ id: 'melon', name: '星纹瓜', seedId: 'seed_melon', produceId: 'melon', days: 10, yield: [1, 1], shape: 'big', leaf: '#3c9a50', fruit: '#7bdc5a', accent: '#e9ffb0' }];