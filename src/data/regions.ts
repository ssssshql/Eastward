import type { MapId, RegionDef } from '../types/game';

export const regions: RegionDef[] = [
{ id: 'mine', name: '幽光矿洞', sub: '灯湖镇以北', desc: '越往下矿石越珍贵，怪物也越凶。每次进入，洞穴的样子都会改变，每 5 层可以直接从那一层开始。', box: [67, 2, 31, 25] },
{ id: 'forest', name: '雾林', sub: '农场以西', desc: '终年弥漫着薄雾的老林子。林间池塘有鳟鱼，雨天会有大鲶鱼出没，树下能采到野菇和山莓。', box: [2, 32, 29, 34] },
{ id: 'farm', name: '雾谷农场', sub: '你的家', desc: '老屋、鸡舍和一片等待开垦的田地。东边的小河和南边的池塘都能垂钓。', box: [35, 32, 28, 34] },
{ id: 'town', name: '灯湖镇', sub: '农场以东', desc: '杂货铺、铁匠铺、酒馆和居民的小屋围着喷泉广场。镇湖里有只在这里出没的金鲤。', box: [67, 32, 31, 30] },
{ id: 'beach', name: '雨岸海滩', sub: '农场与小镇以南', desc: '长长的沙滩和伸进海里的木栈桥。站在栈桥尽头能钓到海鱼，退潮后沙滩上满是贝壳。', box: [24, 72, 60, 26] }];


export const regionLinks: [MapId, MapId][] = [
['forest', 'farm'],
['farm', 'town'],
['town', 'mine'],
['farm', 'beach'],
['town', 'beach']];


export function regionName(id: MapId): string {
  return regions.find((r) => r.id === id)?.name ?? '';
}