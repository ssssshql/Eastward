export type Dir = 'down' | 'up' | 'left' | 'right';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Weather = 'clear' | 'rain' | 'snow';
export type MapId = 'farm' | 'town' | 'forest' | 'beach' | 'mine' | 'interior';
export type Ground = 'grass' | 'path' | 'sand' | 'water' | 'dock' | 'cobble' | 'cave' | 'wall' | 'floor';
export type CropShape = 'root' | 'berry' | 'big' | 'flower' | 'glow';
export type ItemKind = 'tool' | 'seed' | 'produce' | 'resource' | 'fish' | 'placeable' | 'food' | 'artisan' | 'animal' | 'forage';
export type ObjKind = 'tree' | 'stump' | 'rock' | 'weed' | 'bush' | 'sprinkler' | 'lamp' | 'jar' | 'ladder' | 'torch' | 'crystal' | 'forage';
export type StructureKind = 'house' | 'bin' | 'coop' | 'store' | 'smith' | 'tavern' | 'cottage' | 'board' | 'fountain' | 'cave' | 'cart' | 'furniture';
export type Mode = 'title' | 'play' | 'store' | 'smith' | 'tavern' | 'board' | 'inventory' | 'journal' | 'villagers' | 'map' | 'fishing' | 'sleep' | 'summary' | 'dialog';
export type PanelMode = 'inventory' | 'journal' | 'villagers' | 'map';
export type UpgradeId = 'hoe' | 'can' | 'axe' | 'pickaxe' | 'sword';
export type AnimalKind = 'chicken' | 'cow';
export type MonsterKind = 'slime' | 'bat';
export type FurnitureUse = 'sleep' | 'store' | 'smith' | 'tavern' | 'coop' | 'note';
export type FishBehavior = 'mixed' | 'dart' | 'smooth' | 'sinker' | 'floater';
export type PromptIcon = 'hand' | 'talk' | 'gift' | 'door' | 'sleep' | 'look' | 'fish' | 'ship';

export interface CropDef {
  id: string;
  name: string;
  seedId: string;
  produceId: string;
  days: number;
  regrow?: number;
  yield: [number, number];
  shape: CropShape;
  leaf: string;
  fruit: string;
  accent: string;
  glow?: boolean;
}

export interface ItemDef {
  id: string;
  name: string;
  kind: ItemKind;
  sell: number;
  buy?: number;
  desc: string;
  cropId?: string;
  energy?: number;
  hp?: number;
  buff?: 'speed';
  color?: string;
}

export interface Stack {
  id: string;
  qty: number;
}

export interface FishDef {
  id: string;
  difficulty: number;
  weight: number;
  behavior: FishBehavior;
  maps: MapId[];
  /** Length range in centimetres. */
  size: [number, number];
  night?: boolean;
  rain?: boolean;
  seasons?: Season[];
}

export interface FishRecord {
  count: number;
  best: number;
}

export interface FishResult {
  success: boolean;
  size: number;
  perfect: boolean;
  treasure: boolean;
}

export interface RegionDef {
  id: MapId;
  name: string;
  sub: string;
  desc: string;
  /** Placement on the overview map as percentages: left, top, width, height. */
  box: [number, number, number, number];
}

export interface MinimapView {
  url: string;
  w: number;
  h: number;
  /** Player position in tile units, or null when the player is elsewhere. */
  marker: [number, number] | null;
}

export interface RecipeDef {
  id: string;
  output: string;
  qty: number;
  inputs: Stack[];
}

export interface UpgradeDef {
  id: UpgradeId;
  level: number;
  name: string;
  desc: string;
  price: number;
  bars: Stack[];
  icon: string;
}

export interface SmeltDef {
  ore: string;
  bar: string;
  qty: number;
}

export interface AnimalOffer {
  kind: AnimalKind;
  name: string;
  price: number;
  desc: string;
  icon: string;
}

export interface Stats {
  tilled: number;
  watered: number;
  planted: number;
  harvested: number;
  fish: number;
  earned: number;
  crafted: number;
  wood: number;
  stone: number;
  moonbloom: number;
  shipped: number;
  monsters: number;
  deepest: number;
  gifts: number;
  requests: number;
  processed: number;
  ore: number;
  forage: number;
}

export interface GoalDef {
  id: string;
  title: string;
  desc: string;
  stat: keyof Stats;
  target: number;
  reward: number;
}

export interface WorldObject {
  kind: ObjKind;
  variant: number;
  hp: number;
  shake: number;
  age: number;
  item?: string | null;
  ready?: boolean;
}

export interface Crop {
  id: string;
  age: number;
  harvests: number;
}

export interface Structure {
  kind: StructureKind;
  x: number;
  y: number;
  w: number;
  h: number;
  variant?: number;
  /** Interior furniture only */
  prop?: string;
  use?: FurnitureUse;
  label?: string;
  note?: string;
  npc?: string;
  walk?: boolean;
}

export interface Warp {
  x: number;
  y: number;
  w: number;
  h: number;
  to: MapId;
  tx: number;
  ty: number;
  dir: Dir;
  key?: string;
}

export interface Decor {
  x: number;
  y: number;
  kind: 'tuft' | 'flower';
  variant: number;
}

export interface Rug {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  border: string;
}

export interface InteriorStyle {
  wall: string;
  trim: string;
  floor: string;
  floorKind: 'plank' | 'stone' | 'hay';
  pattern: 'stripe' | 'diamond' | 'plank' | 'stone' | 'brick';
}

export interface Placement {
  prop: string;
  x: number;
  y: number;
  w: number;
  h: number;
  use?: FurnitureUse;
  label?: string;
  note?: string;
  npc?: string;
}

export interface RoomSpec {
  name: string;
  w: number;
  h: number;
  style: InteriorStyle;
  items: Placement[];
  rugs: Rug[];
  wake?: [number, number];
}

export interface World {
  id: MapId;
  name: string;
  dark: boolean;
  indoor: boolean;
  floor: number;
  w: number;
  h: number;
  seed: number;
  ground: Ground[];
  tilled: Uint8Array;
  watered: Uint8Array;
  objects: (WorldObject | null)[];
  crops: (Crop | null)[];
  structures: Structure[];
  warps: Warp[];
  blocked: Int16Array;
  decor: Decor[];
  rugs: Rug[];
  style?: InteriorStyle;
  spawn?: [number, number];
  wake?: [number, number];
  /** Bubbling fishing spots, rerolled each morning. */
  spots?: [number, number][];
}

export interface PlayerAction {
  tool: string;
  t: number;
  dur: number;
  tx: number;
  ty: number;
  applied: boolean;
}

export interface Player {
  x: number;
  y: number;
  dir: Dir;
  moving: boolean;
  walkT: number;
  action: PlayerAction | null;
  invuln: number;
  kx: number;
  ky: number;
}

export interface NpcDef {
  id: string;
  name: string;
  title: string;
  bio: string;
  palette: {skin: string;hair: string;shirt: string;over: string;boot: string;scarf: string;style: 'short' | 'long' | 'bun';};
  loves: string[];
  likes: string[];
  hates: string[];
  home: [number, number];
  spot: [number, number];
  evening: [number, number];
  lines: string[];
  closeLines: string[];
  heartGifts: {hearts: number;item: string;qty: number;text: string;}[];
}

export interface NpcState {
  id: string;
  x: number;
  y: number;
  dir: Dir;
  moving: boolean;
  walkT: number;
  wait: number;
  path: [number, number][];
  phase: string;
  visible: boolean;
  friendship: number;
  talked: boolean;
  gifted: boolean;
  rewarded: number[];
}

export interface Animal {
  id: number;
  kind: AnimalKind;
  name: string;
  x: number;
  y: number;
  dir: 'left' | 'right';
  moving: boolean;
  walkT: number;
  wait: number;
  tx: number;
  ty: number;
  petted: boolean;
  ready: boolean;
  mood: number;
}

export interface Monster {
  id: number;
  kind: MonsterKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  max: number;
  hurt: number;
  cd: number;
  seed: number;
}

export interface Request {
  id: number;
  npc: string;
  item: string;
  qty: number;
  reward: number;
  daysLeft: number;
}

export interface Dialog {
  npc: string;
  name: string;
  title: string;
  text: string;
  hearts: number;
}

export interface DaySummary {
  day: number;
  season: Season;
  items: {id: string;qty: number;total: number;}[];
  total: number;
  passedOut: boolean;
  fainted: boolean;
  lost: number;
  goals: string[];
}

export interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'good' | 'warn';
  t: number;
}

export interface Pickup {
  key: number;
  id: string;
  qty: number;
  t: number;
}

export interface Prompt {
  key: string;
  text: string;
  icon?: PromptIcon;
}

export interface Banner {
  key: number;
  title: string;
  sub: string;
}

export interface UiSnapshot {
  mode: Mode;
  money: number;
  day: number;
  season: Season;
  dayOfSeason: number;
  time: number;
  weather: Weather;
  tomorrow: Weather;
  energy: number;
  maxEnergy: number;
  hp: number;
  maxHp: number;
  mapId: MapId;
  mapName: string;
  region: MapId;
  floor: number;
  inventory: (Stack | null)[];
  selected: number;
  canWater: number;
  canMax: number;
  prompt: Prompt | null;
  toasts: Toast[];
  pickups: Pickup[];
  stats: Stats;
  goalsDone: string[];
  summary: DaySummary | null;
  fishingFish: string | null;
  fishLog: Record<string, FishRecord>;
  upgrades: Record<UpgradeId, number>;
  hasSave: boolean;
  dialog: Dialog | null;
  requests: Request[];
  npcs: {id: string;friendship: number;talked: boolean;gifted: boolean;}[];
  animals: {kind: AnimalKind;name: string;mood: number;ready: boolean;petted: boolean;}[];
  banner: Banner | null;
  speedBuff: boolean;
}