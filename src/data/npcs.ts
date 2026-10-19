import type { NpcDef } from '../types/game';

export const npcs: NpcDef[] = [
{
  id: 'vera',
  name: '薇拉',
  title: '杂货铺老板',
  bio: '跑遍了山那边的集市，最后在雾谷停了下来。说话很快，算账更快。',
  palette: { skin: '#f3c6a2', hair: '#2b2140', shirt: '#ff7a59', over: '#3b4a8a', boot: '#3a2a30', scarf: '#ffd27a', style: 'long' },
  loves: ['moonbloom', 'sunpetal', 'jam_moonbloom'],
  likes: ['egg', 'turnip', 'mayo', 'jam_emberberry', 'forage_coral'],
  hates: ['slime', 'bat_wing'],
  home: [5, 24],
  spot: [16, 12],
  evening: [38, 19],
  lines: ['新到的种子都摆出来啦，趁早来挑！', '镇上的人都说你的农场越来越像样了。', '听说矿洞深处有会发光的石头……我可不敢去。', '下雨天客人少，正好偷个懒。'],
  closeLines: ['跟你聊天总是很开心，比算账有趣多了。', '如果哪天我离开雾谷，最舍不得的大概就是你。'],
  heartGifts: [
  { hearts: 2, item: 'seed_moonbloom', qty: 3, text: '这几颗种子是我私藏的，送你。' },
  { hearts: 4, item: 'jar', qty: 2, text: '老客户的福利，这两个腌制罐拿去用吧。' }]

},
{
  id: 'gu',
  name: '老顾',
  title: '铁匠',
  bio: '沉默寡言的老铁匠，炉火三十年没熄过。嘴上嫌麻烦，手上从不偷懒。',
  palette: { skin: '#d9a07a', hair: '#9a9aa6', shirt: '#5a5f6e', over: '#6b3a28', boot: '#2a2228', scarf: '#c23b2b', style: 'short' },
  loves: ['gold_bar', 'jam_pepper', 'amethyst'],
  likes: ['iron_bar', 'pepper', 'stew', 'cheese', 'forage_mushroom'],
  hates: ['sunpetal', 'moonbloom'],
  home: [5, 31],
  spot: [30, 12],
  evening: [40, 19],
  lines: ['……工具要常磨，人也一样。', '铜锭、铁锭、金锭，有了就拿来，我给你打。', '矿洞里的史莱姆怕火。可惜你没有火。', '今天炉子很旺。'],
  closeLines: ['你比我年轻时还能吃苦。', '……谢谢你常来看我这个老头子。'],
  heartGifts: [
  { hearts: 2, item: 'iron_bar', qty: 3, text: '多打了几块，别客气。' },
  { hearts: 4, item: 'gold_bar', qty: 2, text: '这是我压箱底的好料。' }]

},
{
  id: 'xiaoman',
  name: '小满',
  title: '渔家少女',
  bio: '每天都守在镇湖边，能叫出每一种鱼的名字。梦想是钓到传说中的湖主。',
  palette: { skin: '#f6d0b0', hair: '#e8743a', shirt: '#4fd0c0', over: '#2f6f9a', boot: '#3a3a44', scarf: '#fff1c8', style: 'bun' },
  loves: ['fish_koi', 'fish_lantern', 'tart', 'fish_tuna'],
  likes: ['fish_carp', 'emberberry', 'fish_soup', 'jam_emberberry', 'forage_shell'],
  hates: ['stone', 'slime'],
  home: [18, 32],
  spot: [35, 25],
  evening: [37, 20],
  lines: ['嘘——鱼要上钩了！', '湖里的金鲤只在小镇才有哦。', '下雨天锦鲤会浮上来，可别错过！', '水面冒泡的地方就是鱼群，往那儿抛竿！', '海滩栈桥的尽头水最深，大鱼都在那里。'],
  closeLines: ['和你一起钓鱼的时候，时间过得特别快。', '等我钓到湖主，第一个告诉你！'],
  heartGifts: [
  { hearts: 2, item: 'fish_soup', qty: 3, text: '我妈妈做的鱼汤，超好喝的！' },
  { hearts: 4, item: 'fish_lantern', qty: 1, text: '这是我钓到的第一条灯笼鱼，送给你。' }]

},
{
  id: 'qing',
  name: '阿青',
  title: '旅行画家',
  bio: '为了画下雾谷的晨雾而来，结果一住就是三年。总是带着画板。',
  palette: { skin: '#f0c8a8', hair: '#3a5a7a', shirt: '#f2efe6', over: '#5a7a4a', boot: '#4a3628', scarf: '#9a6ad8', style: 'short' },
  loves: ['amethyst', 'quartz', 'jam_sunpetal'],
  likes: ['sunpetal', 'coffee', 'melon', 'cheese', 'forage_berry'],
  hates: ['bat_wing', 'pepper'],
  home: [29, 32],
  spot: [21, 21],
  evening: [39, 20],
  lines: ['傍晚的光最适合作画，金色会把一切变温柔。', '喷泉的水声让我很安心。', '你知道吗？矿洞里的紫晶在灯下是会变色的。', '雾林清晨的光像牛奶一样，我常去那边写生。'],
  closeLines: ['我画了一幅你的农场，等完成了送给你。', '在雾谷遇见你，大概是我旅途里最好的事。'],
  heartGifts: [
  { hearts: 2, item: 'coffee', qty: 3, text: '画画熬夜必备，分你一些。' },
  { hearts: 4, item: 'amethyst', qty: 2, text: '这是我在旅途中收集的，现在它们属于你。' }]

}];


export const requestPool: {item: string;qty: number;}[] = [
{ item: 'turnip', qty: 5 },
{ item: 'pepper', qty: 4 },
{ item: 'emberberry', qty: 6 },
{ item: 'sunpetal', qty: 2 },
{ item: 'egg', qty: 3 },
{ item: 'fish_perch', qty: 1 },
{ item: 'fish_minnow', qty: 3 },
{ item: 'fish_sardine', qty: 3 },
{ item: 'fish_trout', qty: 1 },
{ item: 'forage_mushroom', qty: 3 },
{ item: 'forage_shell', qty: 4 },
{ item: 'copper_ore', qty: 8 },
{ item: 'iron_ore', qty: 5 },
{ item: 'wood', qty: 30 },
{ item: 'stone', qty: 30 },
{ item: 'quartz', qty: 2 },
{ item: 'slime', qty: 6 }];