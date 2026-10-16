import type { AnimalOffer, SmeltDef, UpgradeDef } from '../types/game';

export const storeSeeds: string[] = ['seed_turnip', 'seed_pepper', 'seed_sunpetal', 'seed_emberberry', 'seed_amber', 'seed_moonbloom', 'seed_melon'];

export const storeGoods: string[] = ['ration', 'lamp'];

export const tavernMenu: string[] = ['ration', 'fish_soup', 'coffee'];

export const animalOffers: AnimalOffer[] = [
{ kind: 'chicken', name: '小鸡', price: 600, desc: '每天被抚摸后，第二天早上会下一颗蛋。鸡舍最多 4 只。', icon: 'egg' },
{ kind: 'cow', name: '奶牛', price: 1400, desc: '每天被抚摸后，第二天早上可以挤奶。鸡舍最多 2 头。', icon: 'milk' }];


export const smeltDefs: SmeltDef[] = [
{ ore: 'copper_ore', bar: 'copper_bar', qty: 5 },
{ ore: 'iron_ore', bar: 'iron_bar', qty: 5 },
{ ore: 'gold_ore', bar: 'gold_bar', qty: 5 }];


export const upgradeDefs: UpgradeDef[] = [
{ id: 'can', level: 1, name: '铜制水壶', desc: '容量 80，一次浇灌前方 3 格。', price: 500, bars: [{ id: 'copper_bar', qty: 4 }], icon: 'can' },
{ id: 'hoe', level: 1, name: '铜制锄头', desc: '一次翻松前方 3 格土地。', price: 500, bars: [{ id: 'copper_bar', qty: 4 }], icon: 'hoe' },
{ id: 'pickaxe', level: 1, name: '钢制镐子', desc: '敲石头和矿石的伤害翻倍。', price: 800, bars: [{ id: 'iron_bar', qty: 4 }], icon: 'pickaxe' },
{ id: 'axe', level: 1, name: '钢制斧头', desc: '砍树的伤害翻倍。', price: 800, bars: [{ id: 'iron_bar', qty: 4 }], icon: 'axe' },
{ id: 'sword', level: 1, name: '精钢长剑', desc: '剑的伤害 +70%。', price: 700, bars: [{ id: 'iron_bar', qty: 3 }], icon: 'sword' },
{ id: 'sword', level: 2, name: '曜金之刃', desc: '剑的伤害再 +70%。', price: 1800, bars: [{ id: 'gold_bar', qty: 3 }], icon: 'sword' }];