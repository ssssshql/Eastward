import type { GoalDef } from '../types/game';

export const goals: GoalDef[] = [
{ id: 'till', title: '破土', desc: '翻松 10 块土地', stat: 'tilled', target: 10, reward: 50 },
{ id: 'plant', title: '播下希望', desc: '播种 10 次', stat: 'planted', target: 10, reward: 80 },
{ id: 'harvest', title: '第一份收获', desc: '收获 5 次作物', stat: 'harvested', target: 5, reward: 120 },
{ id: 'fish', title: '临水而居', desc: '钓到 3 条鱼', stat: 'fish', target: 3, reward: 150 },
{ id: 'forage', title: '山野拾趣', desc: '在雾林或海滩采集 10 份野生物产', stat: 'forage', target: 10, reward: 150 },
{ id: 'gift', title: '新邻居', desc: '给镇上的居民送 3 次礼物', stat: 'gifts', target: 3, reward: 150 },
{ id: 'ore', title: '初入矿洞', desc: '采集 10 块矿石', stat: 'ore', target: 10, reward: 150 },
{ id: 'monster', title: '驱逐黑暗', desc: '击败 15 只怪物', stat: 'monsters', target: 15, reward: 250 },
{ id: 'process', title: '手艺人', desc: '用腌制罐加工 5 次', stat: 'processed', target: 5, reward: 250 },
{ id: 'request', title: '有求必应', desc: '完成 3 个镇上的委托', stat: 'requests', target: 3, reward: 300 },
{ id: 'angler', title: '垂钓好手', desc: '钓到 20 条鱼', stat: 'fish', target: 20, reward: 400 },
{ id: 'deep', title: '深渊行者', desc: '抵达矿洞第 10 层', stat: 'deepest', target: 10, reward: 500 },
{ id: 'moon', title: '夜之花园', desc: '收获 1 朵月光花', stat: 'moonbloom', target: 1, reward: 300 },
{ id: 'rich', title: '雾谷富农', desc: '累计赚取 10000 金币', stat: 'earned', target: 10000, reward: 2000 }];