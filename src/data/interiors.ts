import type { RoomSpec } from '../types/game';

/**
 * Interior rooms. Rows 0–2 are the back wall, the bottom row is the front wall with a door gap in the middle.
 * Items with y = 1 hang on the wall, y = 2 stand against it, y ≥ 3 sit on the floor.
 */
export const rooms: Record<string, RoomSpec> = {
  house: {
    name: '雾谷农场 · 小屋',
    w: 12,
    h: 10,
    style: { wall: '#c99a6e', trim: '#7a4e32', floor: '#b47a4a', floorKind: 'plank', pattern: 'diamond' },
    wake: [4, 4],
    rugs: [{ x: 4, y: 5, w: 5, h: 3, color: '#b8463a', border: '#e8c27a' }],
    items: [
    { prop: 'painting', x: 1, y: 1, w: 1, h: 1 },
    { prop: 'window', x: 3, y: 1, w: 1, h: 1 },
    { prop: 'fireplace', x: 5, y: 2, w: 2, h: 1, use: 'note', label: '烤烤火', note: '炉火噼啪作响，屋子里暖洋洋的。' },
    { prop: 'window', x: 8, y: 1, w: 1, h: 1 },
    { prop: 'bookshelf', x: 9, y: 2, w: 2, h: 1, use: 'note', label: '翻翻书架', note: '一排旧农书。《雾谷四季耕作志》的书页都翻卷了。' },
    { prop: 'bed_player', x: 1, y: 3, w: 2, h: 2, use: 'sleep', label: '上床睡觉' },
    { prop: 'lampStand', x: 3, y: 3, w: 1, h: 1 },
    { prop: 'stove', x: 10, y: 4, w: 1, h: 1, use: 'note', label: '看看灶台', note: '锅里还温着昨晚的芜菁汤。' },
    { prop: 'table', x: 6, y: 6, w: 2, h: 1 },
    { prop: 'stool', x: 5, y: 6, w: 1, h: 1 },
    { prop: 'stool', x: 8, y: 6, w: 1, h: 1 },
    { prop: 'plant', x: 1, y: 8, w: 1, h: 1 },
    { prop: 'barrel', x: 10, y: 8, w: 1, h: 1 }]

  },
  coop: {
    name: '鸡舍',
    w: 10,
    h: 8,
    style: { wall: '#9a5a3e', trim: '#5a3424', floor: '#a88a52', floorKind: 'hay', pattern: 'plank' },
    rugs: [],
    items: [
    { prop: 'window', x: 3, y: 1, w: 1, h: 1 },
    { prop: 'window', x: 6, y: 1, w: 1, h: 1 },
    { prop: 'hay', x: 1, y: 2, w: 2, h: 1 },
    { prop: 'hay', x: 7, y: 2, w: 2, h: 1 },
    { prop: 'trough', x: 4, y: 3, w: 2, h: 1, use: 'coop', label: '查看鸡舍' },
    { prop: 'nest', x: 1, y: 5, w: 1, h: 1 },
    { prop: 'nest', x: 2, y: 5, w: 1, h: 1 },
    { prop: 'sack', x: 8, y: 4, w: 1, h: 1 },
    { prop: 'nest', x: 8, y: 6, w: 1, h: 1 }]

  },
  store: {
    name: '薇拉的杂货铺',
    w: 12,
    h: 9,
    style: { wall: '#e6d2a6', trim: '#2f7f7a', floor: '#b88456', floorKind: 'plank', pattern: 'stripe' },
    rugs: [{ x: 4, y: 6, w: 4, h: 2, color: '#2f7f7a', border: '#f0dcb4' }],
    items: [
    { prop: 'shelfGoods', x: 1, y: 2, w: 3, h: 1, use: 'note', label: '看看货架', note: '货架上摆满了种子袋和腌菜罐，标签都是薇拉手写的。' },
    { prop: 'window', x: 5, y: 1, w: 1, h: 1 },
    { prop: 'clock', x: 7, y: 1, w: 1, h: 1 },
    { prop: 'shelfProduce', x: 8, y: 2, w: 3, h: 1, use: 'note', label: '看看货架', note: '刚到的蔬果，带着山那边的露水。' },
    { prop: 'keeper', x: 5, y: 4, w: 1, h: 1, npc: 'vera' },
    { prop: 'counter_store', x: 4, y: 5, w: 4, h: 1, use: 'store', label: '和薇拉买东西' },
    { prop: 'barrel', x: 1, y: 5, w: 1, h: 1 },
    { prop: 'sack', x: 1, y: 6, w: 1, h: 1 },
    { prop: 'crate', x: 10, y: 5, w: 1, h: 1 },
    { prop: 'crate', x: 10, y: 6, w: 1, h: 1 },
    { prop: 'plant', x: 1, y: 7, w: 1, h: 1 },
    { prop: 'plant', x: 10, y: 7, w: 1, h: 1 }]

  },
  smith: {
    name: '老顾的铁匠铺',
    w: 11,
    h: 9,
    style: { wall: '#6e6676', trim: '#3a2e2a', floor: '#7a7484', floorKind: 'stone', pattern: 'stone' },
    rugs: [],
    items: [
    { prop: 'forge', x: 1, y: 2, w: 2, h: 1, use: 'note', label: '看看炉火', note: '炉膛里的火三十年没熄过。' },
    { prop: 'toolrack', x: 4, y: 1, w: 2, h: 1 },
    { prop: 'window', x: 7, y: 1, w: 1, h: 1 },
    { prop: 'anvil', x: 3, y: 4, w: 1, h: 1, use: 'note', label: '看看铁砧', note: '铁砧上还留着刚打好的马蹄铁，余温烫手。' },
    { prop: 'keeper', x: 7, y: 4, w: 1, h: 1, npc: 'gu' },
    { prop: 'counter_smith', x: 6, y: 5, w: 3, h: 1, use: 'smith', label: '找老顾打铁' },
    { prop: 'barrel', x: 9, y: 3, w: 1, h: 1 },
    { prop: 'crate', x: 1, y: 6, w: 1, h: 1 },
    { prop: 'crate', x: 9, y: 6, w: 1, h: 1 }]

  },
  tavern: {
    name: '灯湖酒馆',
    w: 14,
    h: 10,
    style: { wall: '#8a4a3a', trim: '#4a2a1e', floor: '#9a6440', floorKind: 'plank', pattern: 'plank' },
    rugs: [{ x: 7, y: 4, w: 5, h: 3, color: '#7a2a34', border: '#e0a050' }],
    items: [
    { prop: 'kegs', x: 1, y: 2, w: 2, h: 1, use: 'note', label: '闻闻酒桶', note: '一排橡木酒桶，散发着麦芽和蜂蜜的香气。' },
    { prop: 'shelfBar', x: 3, y: 2, w: 3, h: 1 },
    { prop: 'window', x: 6, y: 1, w: 1, h: 1 },
    { prop: 'window', x: 8, y: 1, w: 1, h: 1 },
    { prop: 'fireplace', x: 10, y: 2, w: 2, h: 1, use: 'note', label: '烤烤火', note: '酒馆的壁炉边总是坐满了人，今天也不例外。' },
    { prop: 'keeper', x: 3, y: 3, w: 1, h: 1, npc: 'barkeep' },
    { prop: 'counter_bar', x: 2, y: 4, w: 4, h: 1, use: 'tavern', label: '点些吃的' },
    { prop: 'tableRound', x: 8, y: 5, w: 2, h: 1 },
    { prop: 'stool', x: 7, y: 5, w: 1, h: 1 },
    { prop: 'stool', x: 10, y: 5, w: 1, h: 1 },
    { prop: 'tableRound', x: 4, y: 7, w: 2, h: 1 },
    { prop: 'stool', x: 3, y: 7, w: 1, h: 1 },
    { prop: 'stool', x: 6, y: 7, w: 1, h: 1 },
    { prop: 'tableRound', x: 10, y: 7, w: 2, h: 1 },
    { prop: 'stool', x: 9, y: 7, w: 1, h: 1 },
    { prop: 'stool', x: 12, y: 7, w: 1, h: 1 },
    { prop: 'plant', x: 12, y: 3, w: 1, h: 1 },
    { prop: 'lampStand', x: 12, y: 5, w: 1, h: 1 },
    { prop: 'barrel', x: 1, y: 6, w: 1, h: 1 },
    { prop: 'barrel', x: 1, y: 7, w: 1, h: 1 }]

  },
  cottage0: {
    name: '薇拉的小屋',
    w: 10,
    h: 8,
    style: { wall: '#e2bfa0', trim: '#8a4a3a', floor: '#b07848', floorKind: 'plank', pattern: 'diamond' },
    rugs: [{ x: 3, y: 4, w: 3, h: 2, color: '#3b4a8a', border: '#ffd27a' }],
    items: [
    { prop: 'window', x: 3, y: 1, w: 1, h: 1 },
    { prop: 'painting', x: 5, y: 1, w: 1, h: 1 },
    { prop: 'bookshelf', x: 7, y: 2, w: 2, h: 1, use: 'note', label: '看看书架', note: '一摞摞账本，夹着几张山那边集市的旧车票。' },
    { prop: 'bed_vera', x: 1, y: 3, w: 2, h: 2, use: 'note', label: '看看', note: '床铺得整整齐齐，枕边放着一本翻开的游记。' },
    { prop: 'lampStand', x: 3, y: 3, w: 1, h: 1 },
    { prop: 'table', x: 6, y: 5, w: 2, h: 1 },
    { prop: 'stool', x: 8, y: 5, w: 1, h: 1 },
    { prop: 'plant', x: 8, y: 3, w: 1, h: 1 },
    { prop: 'crate', x: 1, y: 6, w: 1, h: 1 }]

  },
  cottage1: {
    name: '老顾的家',
    w: 10,
    h: 8,
    style: { wall: '#8e7e70', trim: '#3a2e2a', floor: '#86808e', floorKind: 'stone', pattern: 'plank' },
    rugs: [{ x: 3, y: 5, w: 4, h: 1, color: '#6b3a28', border: '#c23b2b' }],
    items: [
    { prop: 'painting', x: 1, y: 1, w: 1, h: 1 },
    { prop: 'fireplace', x: 4, y: 2, w: 2, h: 1, use: 'note', label: '烤烤火', note: '老顾家的壁炉砌得格外结实。' },
    { prop: 'window', x: 7, y: 1, w: 1, h: 1 },
    { prop: 'bed_gu', x: 1, y: 3, w: 2, h: 2, use: 'note', label: '看看', note: '硬板床，被子叠成了豆腐块。' },
    { prop: 'table', x: 6, y: 4, w: 2, h: 1 },
    { prop: 'stool', x: 8, y: 4, w: 1, h: 1 },
    { prop: 'anvil', x: 8, y: 6, w: 1, h: 1 },
    { prop: 'barrel', x: 8, y: 3, w: 1, h: 1 },
    { prop: 'crate', x: 1, y: 6, w: 1, h: 1 }]

  },
  cottage2: {
    name: '小满家',
    w: 10,
    h: 8,
    style: { wall: '#bcd8d2', trim: '#2f6f9a', floor: '#a87850', floorKind: 'plank', pattern: 'stripe' },
    rugs: [{ x: 3, y: 4, w: 3, h: 2, color: '#4fd0c0', border: '#fff1c8' }],
    items: [
    { prop: 'window', x: 3, y: 1, w: 1, h: 1 },
    { prop: 'window', x: 5, y: 1, w: 1, h: 1 },
    { prop: 'aquarium', x: 7, y: 2, w: 2, h: 1, use: 'note', label: '看看鱼缸', note: '小满养的鱼在缸里慢悠悠地游着，水面映着窗外的光。' },
    { prop: 'bed_man', x: 1, y: 3, w: 2, h: 2, use: 'note', label: '看看', note: '床头挂着一张手绘的镇湖地图，标满了钓点。' },
    { prop: 'table', x: 6, y: 5, w: 2, h: 1 },
    { prop: 'stool', x: 8, y: 5, w: 1, h: 1 },
    { prop: 'barrel', x: 8, y: 3, w: 1, h: 1 },
    { prop: 'plant', x: 1, y: 6, w: 1, h: 1 }]

  },
  cottage3: {
    name: '阿青的画室',
    w: 10,
    h: 8,
    style: { wall: '#e4dccb', trim: '#5a7a4a', floor: '#9a6a48', floorKind: 'plank', pattern: 'stripe' },
    rugs: [{ x: 3, y: 4, w: 4, h: 2, color: '#9a6ad8', border: '#f2efe6' }],
    items: [
    { prop: 'window', x: 2, y: 1, w: 1, h: 1 },
    { prop: 'window', x: 5, y: 1, w: 1, h: 1 },
    { prop: 'painting', x: 8, y: 1, w: 1, h: 1 },
    { prop: 'easel', x: 5, y: 4, w: 1, h: 1, use: 'note', label: '看看画', note: '画布上是雾谷的晨雾，颜料还没干透。' },
    { prop: 'bed_qing', x: 1, y: 3, w: 2, h: 2, use: 'note', label: '看看', note: '被子上沾着几点群青色的颜料。' },
    { prop: 'plant', x: 8, y: 3, w: 1, h: 1 },
    { prop: 'table', x: 7, y: 5, w: 2, h: 1 },
    { prop: 'crate', x: 1, y: 6, w: 1, h: 1 }]

  }
};