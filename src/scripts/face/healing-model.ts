/**
 * Rhinovate healing model, V1 (see the healing-timeline repository, MODEL_CARD.md).
 * Deterministic parametric curves, illustrative only: not a medical device,
 * not patient-specific.
 */

/**
 * Slow-phase time constant of swelling, in days, by skin thickness (model card V1:
 * thin 60, thick 150, medium 90). Thicker skin holds swelling longer, mostly at the tip.
 */
export const SKIN_TAU = { thin: 60, medium: 90, thick: 150 } as const;
export type Skin = keyof typeof SKIN_TAU;

/** Swelling, bi-exponential decay: fast phase over weeks, slow phase over months. */
export function swelling(day: number, tauSlow: number = SKIN_TAU.medium): number {
  return 0.6 * Math.exp(-day / 7) + 0.4 * Math.exp(-day / tauSlow);
}

/** Bruising rises then falls, peaking at day 2.5 and fading out by day 12 to 14. */
export function bruising(day: number): number {
  if (day <= 0) return 0;
  const t = day / 2.5;
  return t * Math.exp(1 - t);
}

/** Peak swelling displacement for the "medium" intensity setting, in centimetres. */
export const MAX_SWELLING_CM = 0.4;

/** Relative swelling by anatomical zone. */
export const ZONE_WEIGHTS = { tip: 1.0, dorsum: 0.7, alar: 0.5, periorbital: 0.4 } as const;

type RGB = [number, number, number];
const BRUISE_KEYS: Array<{ day: number; rgb: RGB }> = [
  { day: 0, rgb: [0.4, 0.1, 0.3] },
  { day: 3, rgb: [0.3, 0.1, 0.4] },
  { day: 6.5, rgb: [0.2, 0.4, 0.2] },
  { day: 9.5, rgb: [0.6, 0.6, 0.1] },
  { day: 13, rgb: [0.7, 0.7, 0.3] }
];

/** Bruise colour for a given day: purple, then green, then yellow. */
export function bruiseColor(day: number): RGB {
  const keys = BRUISE_KEYS;
  if (day <= keys[0].day) return keys[0].rgb;
  for (let i = 1; i < keys.length; i++) {
    if (day <= keys[i].day) {
      const a = keys[i - 1], b = keys[i];
      const k = (day - a.day) / (b.day - a.day);
      return [0, 1, 2].map((c) => a.rgb[c] + (b.rgb[c] - a.rgb[c]) * k) as RGB;
    }
  }
  return keys[keys.length - 1].rgb;
}

export function bruisePhase(day: number): string {
  if (bruising(day) < 0.05) return 'Cleared';
  if (day < 3) return 'At its peak, red to purple';
  if (day < 5) return 'Blue to purple';
  if (day < 8) return 'Turning green';
  if (day < 11) return 'Yellow to green';
  return 'Fading';
}

export interface Stage {
  day: number;
  label: string;
  /** Label for narrow timelines. */
  short: string;
  text: string;
}

/** Typical course after rhinoplasty (ASPS; University of Utah Health). */
export const STAGES: Stage[] = [
  { day: 2, label: 'Day 2', short: 'D2', text: 'Swelling at its peak. The splint stays on for about a week.' },
  { day: 7, label: 'Week 1', short: 'W1', text: 'Splint and stitches come off. Some swelling and bruising remain.' },
  { day: 21, label: 'Week 3', short: 'W3', text: 'Most patients are back at work. The remaining swelling is mostly noticed by the patient.' },
  { day: 30, label: 'Month 1', short: 'M1', text: 'Most of the swelling has gone, and the new shape is easier to see.' },
  { day: 180, label: 'Month 6', short: 'M6', text: 'Close to the final contour. The tip is still refining.' },
  { day: 365, label: 'Month 12', short: 'M12', text: 'Residual tip swelling has resolved. This is the final result.' }
];

/** Slider position (0..1) to day, log-interpolated between evenly spaced stages. */
export function positionToDay(p: number): number {
  const n = STAGES.length - 1;
  const x = Math.min(1, Math.max(0, p)) * n;
  const i = Math.min(n - 1, Math.floor(x));
  const k = x - i;
  const a = Math.log(STAGES[i].day), b = Math.log(STAGES[i + 1].day);
  return Math.exp(a + (b - a) * k);
}

export function dayToPosition(day: number): number {
  const n = STAGES.length - 1;
  if (day <= STAGES[0].day) return 0;
  for (let i = 1; i <= n; i++) {
    if (day <= STAGES[i].day) {
      const a = Math.log(STAGES[i - 1].day), b = Math.log(STAGES[i].day);
      return (i - 1 + (Math.log(day) - a) / (b - a)) / n;
    }
  }
  return 1;
}

export function stageForDay(day: number): Stage {
  let current = STAGES[0];
  for (const s of STAGES) if (day + 1e-6 >= s.day) current = s;
  return current;
}

export function formatDay(day: number): string {
  if (day < 13.5) return `Day ${Math.round(day)}`;
  if (day < 27.5) return `Week ${Math.round(day / 7)}`;
  return `Month ${Math.max(1, Math.round(day / 30.44))}`;
}
