export interface ViewRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LightSource {
  x: number;
  y: number;
  r: number;
  a: number;
  kind: 'warm' | 'cool' | 'green' | 'violet';
  /** Ground line of the emitter, used to mirror the glow into water. */
  base?: number;
}

export interface SunState {
  dx: number;
  dy: number;
  strength: number;
}

export interface Drawable {
  y: number;
  draw: () => void;
}

/** A sprite anchored at a ground point, used for sun shadows and water reflections. */
export interface Caster {
  img: HTMLCanvasElement;
  bx: number;
  by: number;
  ox: number;
  oy: number;
}

export interface FrameInfo {
  view: ViewRect;
  /** Light intensity factor (boosted indoors so lamps read). */
  night: number;
  /** True outdoor night amount, drives window/lamp sprite states. */
  dayNight: number;
  sun: SunState;
}