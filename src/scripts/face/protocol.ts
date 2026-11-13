/*
  What the page and the 3D scenes share: tones, camera framing, the timeline of the opening
  sequence, and the messages they exchange. No DOM and no three.js here, so the page can load
  this file without loading the renderer.
*/

/** Clay on a cool gray viewport: reads as a 3D model, not as a photo. */
export const TONE = { bg: '#eef1f4', shadow: '#a39c96', light: '#fdfcfa', changeTint: '#a7c6dd', swellTint: '#f0b4a2' };

/** Where the camera looks. The region w by h (in cm, around cx, cy) always stays in frame. */
export interface View {
  yaw: number;
  pitch: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const span = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

/* ---------- Opening sequence of the home page ---------- */

export const PHASES = [
  { id: 'scan', start: 0, end: 2.2, title: 'Guided scan', text: 'Five head positions on an iPhone, captured automatically.' },
  { id: 'model', start: 2.2, end: 3.4, title: '3D model', text: 'Facial landmarks placed automatically.' },
  { id: 'plan', start: 3.4, end: 6.0, title: 'Plan', text: "The planned nose, with today's profile dashed." },
  { id: 'recovery', start: 6.0, end: 10.0, title: 'Recovery forecast', text: '' }
] as const;
export const END = 10.6;

/** Day of the recovery forecast shown at a given time of the sequence, from day 2 to month 12. */
export function recoveryDay(time: number) {
  const k = ease(span(time, 6.3, 9.6));
  return Math.exp(Math.log(2) + (Math.log(365) - Math.log(2)) * k);
}

export function heroView(W: number, yaw: number, pitch: number): View {
  return W < 640
    ? { yaw, pitch, cx: 1.5, cy: 0.7, w: 12.5, h: 14.5 }
    : { yaw, pitch, cx: 1.7, cy: 0.6, w: 15, h: 15.5 };
}

/* ---------- Workspace ---------- */

/** Profile framing. As the face turns toward the camera, the frame widens and moves with it. */
export function profileView(yaw: number, pitch: number): View {
  const t = (yaw - 0.8) / (1.45 - 0.8);
  return { yaw, pitch, cx: lerp(0, 1.9, t), cy: 1.0, w: lerp(12, 10.8, clamp(t, 0, 1)), h: 12.5 };
}
export function obliqueView(yaw: number, pitch: number): View {
  return { yaw, pitch, cx: lerp(-1.2, 0.2, (yaw - 0.3) / 0.6), cy: 1.0, w: 13, h: 13 };
}

/* ---------- Messages ---------- */

export type Kind = 'hero' | 'workspace';

/** One frame of the opening sequence. W and H are the canvas size in CSS pixels. */
export interface HeroParams {
  W: number;
  H: number;
  time: number;
  turn: number;
  pitch: number;
  /** Slow sway once the sequence has ended, in radians. */
  idle: number;
  /** Changes each time the sequence restarts, so the scene rebuilds the shape. */
  run: number;
}

/** What the page draws over the canvas. Points are x, y pairs in CSS pixels from the canvas top left. */
export interface HeroFrame {
  /** Opacity of today's profile, dashed over the plan. */
  dashed: number;
  profile: number[];
  /** Progress of the landmarks, from 0 (none) to 1 (all placed). */
  landmarks: number;
  points: number[];
  /** Opacity of the two measurements. */
  callouts: number;
  hump: [number, number];
  tip: [number, number];
  humpMm: number;
  tipMm: number;
  todayHumpMm: number;
}

export interface WorkspaceParams {
  W: number;
  H: number;
  mode: 'plan' | 'recovery';
  hump: number;
  tip: number;
  day: number;
  /** Slow-phase time constant of swelling for the selected skin thickness, in days. */
  tau: number;
  turn: number;
  pitch: number;
}

export interface WorkspaceFrame {
  /** Today's profile over the planned nose (plan view only). */
  profile: number[];
  humpMm: number;
  tipMm: number;
  todayHumpMm: number;
}
