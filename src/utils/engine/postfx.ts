import type { V3 } from './lighting';

const VERT = `
attribute vec2 a;
varying vec2 v;
void main() {
  v = vec2(a.x * 0.5 + 0.5, 0.5 - a.y * 0.5);
  gl_Position = vec4(a, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 v;
uniform sampler2D uScene;
uniform sampler2D uLight;
uniform vec2 uView;
uniform vec2 uSceneSize;
uniform vec2 uFrac;
uniform vec2 uCam;
uniform vec2 uSun;
uniform float uTime;
uniform float uNight;
uniform float uRain;
uniform float uGolden;
uniform float uOutdoor;
uniform float uHurt;
uniform float uFade;
uniform float uDof;
uniform vec3 uAmbient;

float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0.0; float a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * n(p); p *= 2.03; a *= 0.5; }
  return s;
}
vec3 litAt(vec2 tuv) {
  vec3 c = texture2D(uScene, tuv).rgb;
  vec3 l = texture2D(uLight, tuv).rgb;
  return c * (uAmbient + l * (0.25 + uNight * 1.7));
}
vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
void main() {
  vec2 px = v * uView + uFrac;
  vec2 tuv = px / uSceneSize;
  vec2 texel = 1.0 / uSceneSize;
  vec3 col = litAt(tuv);

  // Bloom + tilt-shift depth of field from a shared ring of taps.
  vec3 bloom = vec3(0.0);
  vec3 blur = vec3(0.0);
  for (int i = 0; i < 8; i++) {
    float an = float(i) * 0.785398 + 0.39;
    vec2 o = vec2(cos(an), sin(an)) * texel;
    vec3 a = litAt(tuv + o * 1.8);
    vec3 b = litAt(tuv + o * 4.5);
    blur += a * 0.6 + b * 0.4;
    bloom += max(a - 0.7, 0.0) + max(b - 0.7, 0.0) * 0.7;
  }
  blur /= 8.0;
  float dof = smoothstep(0.2, 0.5, abs(v.y - 0.52)) * uDof;
  col = mix(col, blur, dof * 0.9);
  col += bloom * 0.12;

  vec2 world = uCam + px;
  // Drifting cloud shadows.
  float cl = fbm(world * 0.0065 + vec2(uTime * 0.018, uTime * 0.007));
  float shade = smoothstep(0.48, 0.7, cl) * (1.0 - uNight) * (0.24 - uRain * 0.12) * uOutdoor;
  col *= 1.0 - shade;

  // Volumetric god rays, angled with the sun and stronger in golden hours.
  vec2 rp = uCam * 0.55 + px;
  vec2 dir = normalize(vec2(-uSun.x * 0.6 + 0.25, 1.0));
  float along = dot(rp, vec2(dir.y, -dir.x));
  float rays = pow(0.5 + 0.5 * sin(along * 0.05 + fbm(vec2(along * 0.01, uTime * 0.05)) * 6.0), 5.0);
  rays *= smoothstep(1.05, 0.0, v.y) * (0.55 + 0.45 * fbm(rp * 0.01 + uTime * 0.03));
  float rayAmt = (0.07 + uGolden * 0.2) * (1.0 - uNight) * (1.0 - uRain * 0.8) * uOutdoor * (1.0 - shade * 3.0);
  col += vec3(1.0, 0.78, 0.48) * rays * rayAmt;

  // Atmospheric haze toward the top of the frame.
  col = mix(col, vec3(0.62, 0.72, 0.86) * uAmbient, (1.0 - v.y) * 0.06 * uOutdoor * (1.0 - uNight));

  // Dark foreground foliage framing the top corners (parallax).
  vec2 fg = uCam * 1.35 + px;
  float leaf = fbm(fg * 0.035) + fbm(fg * 0.11) * 0.35;
  float corner = max(1.0 - length((v - vec2(0.0, 0.0)) * vec2(2.2, 3.2)), 1.0 - length((v - vec2(1.0, 0.0)) * vec2(2.2, 3.2)));
  float fgm = smoothstep(0.52, 0.58, corner * 0.9 + leaf * 0.55) * uOutdoor;
  col = mix(col, vec3(0.02, 0.04, 0.05) + vec3(0.05, 0.08, 0.04) * leaf * (1.0 - uNight), fgm * 0.93);

  // Filmic grade: exposure, ACES, teal-orange split tone, saturation.
  col *= 1.12;
  col = aces(col);
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col += vec3(-0.035, 0.005, 0.045) * (1.0 - l) * (1.0 - l) + vec3(0.04, 0.012, -0.03) * l * l;
  col = mix(vec3(l), col, 1.18 - uRain * 0.3);
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.35);

  // Lens: chromatic fringe, vignette, grain, damage pulse, transition fade.
  vec2 d = v - 0.5;
  float r2 = dot(d, d);
  col.r = mix(col.r, litAt(tuv + d * texel * 3.0).r * 0.9, r2 * 0.6);
  col *= 1.0 - r2 * 0.95;
  col += (h(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.035;
  col = mix(col, vec3(0.55, 0.02, 0.04), uHurt * smoothstep(0.08, 0.5, r2) * 0.8);
  col *= 1.0 - uFade;
  gl_FragColor = vec4(col, 1.0);
}`;

export interface FxUniforms {
  viewW: number;
  viewH: number;
  fracX: number;
  fracY: number;
  camX: number;
  camY: number;
  sunX: number;
  sunY: number;
  time: number;
  night: number;
  rain: number;
  golden: number;
  outdoor: number;
  hurt: number;
  fade: number;
  dof: number;
  ambient: V3;
}

const UNIFORMS = ['uScene', 'uLight', 'uView', 'uSceneSize', 'uFrac', 'uCam', 'uSun', 'uTime', 'uNight', 'uRain', 'uGolden', 'uOutdoor', 'uHurt', 'uFade', 'uDof', 'uAmbient'];

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type);
  if (!s) throw new Error('shader');
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'compile');
  return s;
}

function makeTex(gl: WebGLRenderingContext, filter: number): WebGLTexture {
  const t = gl.createTexture();
  if (!t) throw new Error('texture');
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}

/** Cinematic post pass: lighting, bloom, tilt-shift, god rays, foliage framing, filmic grade. */
export class PostFX {
  private gl: WebGLRenderingContext;
  private tScene: WebGLTexture;
  private tLight: WebGLTexture;
  private loc: Record<string, WebGLUniformLocation | null> = {};

  static create(canvas: HTMLCanvasElement): PostFX | null {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl) return null;
    try {
      return new PostFX(gl);
    } catch {
      return null;
    }
  }

  private constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    const prog = gl.createProgram();
    if (!prog) throw new Error('program');
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    for (const k of UNIFORMS) this.loc[k] = gl.getUniformLocation(prog, k);
    this.tScene = makeTex(gl, gl.NEAREST);
    this.tLight = makeTex(gl, gl.LINEAR);
    gl.uniform1i(this.loc.uScene, 0);
    gl.uniform1i(this.loc.uLight, 1);
  }

  render(scene: HTMLCanvasElement, light: HTMLCanvasElement, w: number, h: number, u: FxUniforms): void {
    const gl = this.gl;
    gl.viewport(0, 0, w, h);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tScene);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.tLight);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, light);
    gl.uniform2f(this.loc.uView, u.viewW, u.viewH);
    gl.uniform2f(this.loc.uSceneSize, scene.width, scene.height);
    gl.uniform2f(this.loc.uFrac, u.fracX, u.fracY);
    gl.uniform2f(this.loc.uCam, u.camX, u.camY);
    gl.uniform2f(this.loc.uSun, u.sunX, u.sunY);
    gl.uniform1f(this.loc.uTime, u.time);
    gl.uniform1f(this.loc.uNight, u.night);
    gl.uniform1f(this.loc.uRain, u.rain);
    gl.uniform1f(this.loc.uGolden, u.golden);
    gl.uniform1f(this.loc.uOutdoor, u.outdoor);
    gl.uniform1f(this.loc.uHurt, u.hurt);
    gl.uniform1f(this.loc.uFade, u.fade);
    gl.uniform1f(this.loc.uDof, u.dof);
    gl.uniform3f(this.loc.uAmbient, u.ambient[0], u.ambient[1], u.ambient[2]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}