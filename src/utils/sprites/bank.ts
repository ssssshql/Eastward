import type { Dir, Season, World } from '../../types/game';
import { crops } from '../../data/crops';
import { npcs } from '../../data/npcs';
import { buildGround, buildSoil, buildWaterFrames } from './terrain';
import { buildBush, buildFlower, buildRock, buildStump, buildTree, buildTuft, buildWeed, TreeSprite } from './nature';
import { buildCropFrames } from './crops';
import { BARKEEP_PALETTE, buildCharacterFrames, PLAYER_PALETTE, WANDERER_PALETTE } from './character';
import { buildBin, buildCart, buildingForKind, buildLamp, BuildingSprite, PAD } from './buildings';
import { buildBat, buildCat, buildChicken, buildCow, buildDuck, buildSlime, CreatureFrames } from './creatures';
import { buildBoard, buildBrazier, buildCave, buildCrystal, buildFountain, buildJar, buildLadder } from './props';
import { buildFurnitureSet, FurnitureSprite } from './furniture';

export interface LightSprites {
  warm: HTMLCanvasElement;
  cool: HTMLCanvasElement;
  green: HTMLCanvasElement;
  violet: HTMLCanvasElement;
}

export interface StructureSprite {
  day: HTMLCanvasElement;
  night: HTMLCanvasElement;
  meta: BuildingSprite | null;
  offX: number;
}

export interface SpriteBank {
  season: Season;
  water: HTMLCanvasElement[];
  trees: TreeSprite[];
  stumps: HTMLCanvasElement[];
  rocks: HTMLCanvasElement[];
  weeds: HTMLCanvasElement[];
  bushes: HTMLCanvasElement[];
  tufts: HTMLCanvasElement[];
  flowers: HTMLCanvasElement[];
  structures: Record<string, StructureSprite>;
  shared: Shared;
}

export interface Shared {
  crops: Record<string, HTMLCanvasElement[]>;
  player: Record<Dir, HTMLCanvasElement[]>;
  npcs: Record<string, Record<Dir, HTMLCanvasElement[]>>;
  soilDry: HTMLCanvasElement[];
  soilWet: HTMLCanvasElement[];
  lights: LightSprites;
  lampOn: HTMLCanvasElement;
  lampOff: HTMLCanvasElement;
  jar: HTMLCanvasElement;
  ladderDown: HTMLCanvasElement;
  ladderUp: HTMLCanvasElement;
  brazier: HTMLCanvasElement;
  crystals: HTMLCanvasElement[];
  slime: HTMLCanvasElement[];
  slimeDeep: HTMLCanvasElement[];
  bat: HTMLCanvasElement[];
  chicken: CreatureFrames;
  cow: CreatureFrames;
  cat: CreatureFrames;
  duck: CreatureFrames;
  furniture: Record<string, FurnitureSprite>;
}

let shared: Shared | null = null;
const banks = new Map<Season, SpriteBank>();
const grounds = new WeakMap<World, {season: Season;canvas: HTMLCanvasElement;}>();
const silhouettes = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();

function buildLight(rgb: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const x = c.getContext('2d');
  if (x) {
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${rgb},1)`);
    gr.addColorStop(0.3, `rgba(${rgb},0.6)`);
    gr.addColorStop(0.65, `rgba(${rgb},0.18)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = gr;
    x.fillRect(0, 0, 64, 64);
  }
  return c;
}

export function getShared(): Shared {
  if (!shared) {
    const cropFrames: Record<string, HTMLCanvasElement[]> = {};
    for (const c of crops) cropFrames[c.id] = buildCropFrames(c);
    const npcFrames: Record<string, Record<Dir, HTMLCanvasElement[]>> = {};
    for (const n of npcs) npcFrames[n.id] = buildCharacterFrames(n.palette);
    npcFrames.barkeep = buildCharacterFrames(BARKEEP_PALETTE);
    npcFrames.wanderer = buildCharacterFrames(WANDERER_PALETTE);
    const soil = buildSoil();
    shared = {
      crops: cropFrames,
      player: buildCharacterFrames(PLAYER_PALETTE),
      npcs: npcFrames,
      soilDry: soil.dry,
      soilWet: soil.wet,
      lights: { warm: buildLight('255,170,90'), cool: buildLight('120,220,255'), green: buildLight('200,255,120'), violet: buildLight('190,130,255') },
      lampOn: buildLamp(true),
      lampOff: buildLamp(false),
      jar: buildJar(),
      ladderDown: buildLadder(false),
      ladderUp: buildLadder(true),
      brazier: buildBrazier(),
      crystals: [buildCrystal(0), buildCrystal(1)],
      slime: buildSlime('#5ee67a'),
      slimeDeep: buildSlime('#4a8aff'),
      bat: buildBat(),
      chicken: buildChicken(),
      cow: buildCow(),
      cat: buildCat(),
      duck: buildDuck(),
      furniture: buildFurnitureSet()
    };
  }
  return shared;
}

function structureSprites(season: Season): Record<string, StructureSprite> {
  const out: Record<string, StructureSprite> = {};
  for (const kind of ['house', 'coop', 'store', 'smith', 'tavern']) {
    const d = buildingForKind(kind, 0, season, false);
    const n = buildingForKind(kind, 0, season, true);
    out[kind] = { day: d.canvas, night: n.canvas, meta: d, offX: -PAD };
  }
  for (let v = 0; v < 4; v++) {
    const d = buildingForKind('cottage', v, season, false);
    const n = buildingForKind('cottage', v, season, true);
    out[`cottage${v}`] = { day: d.canvas, night: n.canvas, meta: d, offX: -PAD };
  }
  const cartD = buildCart(season, false);
  out.cart = { day: cartD, night: buildCart(season, true), meta: null, offX: -1 };
  const bin = buildBin(season);
  out.bin = { day: bin, night: bin, meta: null, offX: 0 };
  const board = buildBoard(season);
  out.board = { day: board, night: board, meta: null, offX: 0 };
  const fountain = buildFountain(season);
  out.fountain = { day: fountain, night: fountain, meta: null, offX: 0 };
  const cave = buildCave();
  out.cave = { day: cave, night: cave, meta: null, offX: 0 };
  return out;
}

export function getBank(season: Season, seed: number): SpriteBank {
  let b = banks.get(season);
  if (!b) {
    const range = (n: number) => Array.from({ length: n }, (_, i) => i);
    const s = seed % 100000;
    b = {
      season,
      water: buildWaterFrames(season),
      trees: range(9).map((v) => buildTree(v, season, s)),
      stumps: range(3).map((v) => buildStump(v, season)),
      rocks: range(8).map((v) => buildRock(v, season, s)),
      weeds: range(3).map((v) => buildWeed(v, season, s)),
      bushes: range(2).map((v) => buildBush(v, season, s)),
      tufts: range(4).map((v) => buildTuft(v, season)),
      flowers: range(6).map((v) => buildFlower(v, season)),
      structures: structureSprites(season),
      shared: getShared()
    };
    banks.set(season, b);
  }
  return b;
}

export function getGround(world: World, season: Season): HTMLCanvasElement {
  const g = grounds.get(world);
  if (g && (g.season === season || world.indoor)) return g.canvas;
  const canvas = buildGround(world, season);
  grounds.set(world, { season, canvas });
  return canvas;
}

/** Lazily derives a flat dark silhouette of any sprite, used for directional sun shadows. */
export function silhouette(src: HTMLCanvasElement): HTMLCanvasElement {
  let s = silhouettes.get(src);
  if (!s) {
    s = document.createElement('canvas');
    s.width = src.width;
    s.height = src.height;
    const x = s.getContext('2d');
    if (x) {
      x.drawImage(src, 0, 0);
      x.globalCompositeOperation = 'source-in';
      x.fillStyle = '#0a1424';
      x.fillRect(0, 0, s.width, s.height);
    }
    silhouettes.set(src, s);
  }
  return s;
}