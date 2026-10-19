import { Vector3 } from 'three';
import { FaceModel } from './face-model';
import { FaceStage, webglAvailable, type Panel, type View } from './face-stage';
import { loadFaceMesh } from './mesh';
import { formatDay, swelling } from './healing-model';
import { TONE } from './workspace';

/*
  Opening sequence of the home page, on the demo face:
  scan (points become a surface), 3D model (landmarks), plan (the nose changes, today's profile
  stays dashed, measured live), recovery (day 2 to month 12), then back to the plan at rest.
*/

const PHASES = [
  { id: 'scan', start: 0, end: 2.2, title: 'Guided scan', text: 'Five head positions on an iPhone, captured automatically.' },
  { id: 'model', start: 2.2, end: 3.4, title: '3D model', text: 'Facial landmarks placed automatically.' },
  { id: 'plan', start: 3.4, end: 6.0, title: 'Plan', text: "The planned nose, with today's profile dashed." },
  { id: 'recovery', start: 6.0, end: 10.0, title: 'Recovery forecast', text: '' }
] as const;
const END = 10.6;
/** Landmarks of the profile: glabella, nasion, dorsum, tip, subnasale, lips, chin, alar creases. */
const LANDMARKS = [9, 168, 6, 4, 1, 2, 0, 17, 152, 48, 278, 64, 294];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const span = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const mm = (v: number) => (Math.abs(v) < 0.05 ? '0' : v.toFixed(1));
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';

function view(W: number, yaw: number, pitch: number): View {
  return W < 640
    ? { yaw, pitch, cx: 1.5, cy: 0.7, w: 12.5, h: 14.5 }
    : { yaw, pitch, cx: 1.7, cy: 0.6, w: 15, h: 15.5 };
}

export function initHero(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-canvas]')!;
  const overlay = root.querySelector<SVGSVGElement>('[data-overlay]')!;
  const capTitle = root.querySelector<HTMLElement>('[data-cap-title]')!;
  const capText = root.querySelector<HTMLElement>('[data-cap-text]')!;
  const steps = [...root.querySelectorAll<HTMLButtonElement>('[data-step]')];
  const compact = root.querySelector<HTMLElement>('[data-compact]');

  let stage: FaceStage | null = null;
  let face: FaceModel | null = null;
  let today: FaceModel | null = null;
  let todayHump = 0;
  let humpIndex = -1;
  let visibleLandmarks: number[] = [];

  let t = 0;
  let playing = false;
  let last = 0;
  let idleStart = 0;
  let raf = 0;
  let onScreen = true;
  let turn = 0;
  let pitch = -0.03;
  let shape = '';

  /* ---------- Overlay ---------- */

  const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, String(attrs[k]));
    overlay.appendChild(n);
    return n;
  };

  function drawOverlay(panel: Panel, v: View, state: { landmarks: number; dashed: number; callouts: number; hump: number; tip: number }) {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    overlay.setAttribute('viewBox', `0 0 ${W} ${H}`);
    overlay.replaceChildren();
    if (!face || !today || !stage) return;

    if (state.dashed > 0) {
      const pts = stage.project(panel, v, today, today.noseProfile);
      el('path', {
        d: `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L')}`,
        fill: 'none', stroke: '#1a2732', 'stroke-width': 1.5, 'stroke-dasharray': '5 4',
        'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: state.dashed
      });
    }

    if (state.landmarks > 0) {
      const pts = stage.project(panel, v, face, visibleLandmarks);
      pts.forEach(([x, y], k) => {
        const a = clamp(state.landmarks * visibleLandmarks.length - k);
        if (a <= 0) return;
        el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: (2 + 2 * a).toFixed(2), fill: '#23628f', stroke: '#ffffff', 'stroke-width': 1.5, opacity: a });
      });
    }

    if (state.callouts > 0 && humpIndex >= 0) {
      const [[hx, hy], [tx, ty]] = stage.project(panel, v, face, [humpIndex, 1]);
      const wide = W >= 640;
      if (compact) compact.hidden = wide;
      const callout = (x: number, y: number, label: string, value: string, plan: string) => {
        el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 4, fill: '#23628f', stroke: '#ffffff', 'stroke-width': 1.5, opacity: state.callouts });
        if (!wide) return;
        const lx = Math.min(W - 196, tx + 56);
        el('line', { x1: x + 6, y1: y, x2: lx - 10, y2: y, stroke: '#1a2732', 'stroke-width': 1, opacity: 0.55 * state.callouts });
        const t1 = el('text', { x: lx, y: y - 9, fill: '#55636e', 'font-size': 13, opacity: state.callouts });
        t1.textContent = label;
        const t2 = el('text', { x: lx, y: y + 15, fill: '#1a2732', 'font-size': 21, 'font-weight': 400, opacity: state.callouts });
        if (value) {
          const a = document.createElementNS(NS, 'tspan');
          a.textContent = `${value} → `;
          t2.appendChild(a);
        }
        const b = document.createElementNS(NS, 'tspan');
        b.setAttribute('fill', '#23628f');
        b.setAttribute('font-weight', '560');
        b.textContent = plan;
        t2.appendChild(b);
      };
      callout(hx, hy, 'Dorsal hump', `${mm(todayHump)}`, `${mm(state.hump)} mm`);
      callout(tx, ty, 'Tip lift', '', `+${mm(state.tip)} mm`);
      if (compact) {
        compact.style.opacity = String(state.callouts);
        compact.textContent = `Dorsal hump ${mm(todayHump)} → ${mm(state.hump)} mm · Tip lift +${mm(state.tip)} mm`;
      }
    } else if (compact) {
      compact.style.opacity = '0';
    }
  }

  /* ---------- Sequence ---------- */

  function setShape(key: string, apply: () => void) {
    if (key === shape) return;
    shape = key;
    apply();
  }

  function phaseAt(time: number) {
    if (time >= PHASES[3].end) return 2;
    return Math.max(0, PHASES.findIndex((p) => time >= p.start && time < p.end));
  }

  function caption(time: number) {
    const i = phaseAt(time);
    const p = PHASES[i];
    capTitle.textContent = p.title;
    if (p.id === 'recovery' && time < END) {
      const day = recoveryDay(time);
      capText.textContent = `${formatDay(day)}: swelling at ${Math.round(swelling(day) * 100)}% of its peak.`;
    } else {
      capText.textContent = p.text;
    }
    steps.forEach((b, k) => {
      const ph = PHASES[k];
      const fill = time >= END ? 1 : span(time, ph.start, ph.end);
      b.style.setProperty('--p', fill.toFixed(3));
      b.setAttribute('aria-pressed', k === i ? 'true' : 'false');
    });
  }

  function recoveryDay(time: number) {
    const k = ease(span(time, 6.3, 9.6));
    return Math.exp(Math.log(2) + (Math.log(365) - Math.log(2)) * k);
  }

  function render(time: number) {
    if (!stage || !face || !today) return;
    const W = canvas.clientWidth;
    const idle = time >= END && !reduceMotion() ? 0.07 * Math.sin((performance.now() - idleStart) / 1000 * 0.5) : 0;
    const v = view(W, 1.45 + turn + idle, pitch);
    const state = { landmarks: 0, dashed: 0, callouts: 0, hump: todayHump, tip: 0 };

    if (time < 2.2) {
      const r = ease(span(time, 0.25, 2.0));
      setShape('today', () => face!.setPlan(0, 0, false));
      face.setReveal(9.2 + (-10 - 9.2) * r);
    } else if (time < 3.4) {
      face.setReveal(null);
      setShape('today', () => face!.setPlan(0, 0, false));
      state.landmarks = span(time, 2.3, 3.2);
    } else if (time < 6.0) {
      face.setReveal(null);
      state.landmarks = 1 - span(time, 3.4, 3.7);
      state.dashed = span(time, 3.4, 3.8);
      const kh = ease(span(time, 3.7, 5.2));
      const kt = ease(span(time, 3.9, 5.4));
      setShape(`plan:${kh.toFixed(3)}:${kt.toFixed(3)}`, () => {
        face!.setTintStrength(0.38);
        face!.setPlan(kh, kt, true);
      });
      state.callouts = span(time, 3.9, 4.3);
    } else if (time < END - 0.6) {
      face.setReveal(null);
      state.dashed = 1 - span(time, 6.0, 6.3);
      state.callouts = 1 - span(time, 6.0, 6.3);
      const day = recoveryDay(time);
      setShape(`heal:${day.toFixed(2)}`, () => face!.setHealingDay(day));
    } else {
      face.setReveal(null);
      const k = time >= END ? 1 : span(time, END - 0.6, END);
      setShape(`final:${k.toFixed(2)}`, () => {
        face!.setTintStrength(0.38 * k);
        face!.setPlan(1, 1, true);
      });
      state.dashed = k;
      state.callouts = k;
    }

    if (state.callouts > 0) {
      const m = face.measure();
      state.hump = m.humpMm;
      state.tip = m.tipLiftMm;
    }

    const panel: Panel = { model: face, x: 0, y: 0, w: 1, h: 1 };
    stage.draw([panel], v);
    drawOverlay(panel, v, state);
    caption(time);
  }

  function loop(now: number) {
    raf = 0;
    if (!onScreen) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (playing) {
      t += dt;
      if (t >= END) {
        t = END;
        playing = false;
        idleStart = now;
      }
    }
    render(t);
    const idling = !playing && t >= END && !reduceMotion() && now - idleStart < 45000;
    if (playing || idling) raf = requestAnimationFrame(loop);
  }

  function kick() {
    if (raf || !onScreen) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function playFrom(time: number) {
    t = time;
    shape = '';
    if (reduceMotion()) {
      playing = false;
      render(time);
      return;
    }
    playing = true;
    kick();
  }

  /* Reduced motion: each step shows one still frame. */
  const STILL = [1.25, 3.3, END, 7.4];
  steps.forEach((b, k) =>
    b.addEventListener('click', () => (reduceMotion() ? (shape = '', (t = STILL[k]), render(t)) : playFrom(PHASES[k].start)))
  );

  /* ---------- Turning the face ---------- */

  let drag: { x: number; y: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    turn = clamp(turn + (e.clientX - drag.x) * 0.008, -0.65, 0.12);
    pitch = clamp(pitch + (e.clientY - drag.y) * 0.004, -0.25, 0.2);
    drag = { x: e.clientX, y: e.clientY };
    if (!raf) render(t);
  });
  const end = () => (drag = null);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  /* ---------- Start ---------- */

  caption(reduceMotion() ? END : 0);

  async function start() {
    if (!webglAvailable()) return fail();
    try {
      const mesh = await loadFaceMesh();
      stage = new FaceStage(canvas, TONE.bg);
      face = new FaceModel(mesh, TONE);
      today = new FaceModel(mesh, TONE);
      today.setPlan(0, 0, false);
      const m = today.measure();
      todayHump = m.humpMm;
      humpIndex = m.humpIndex;
      stage.add(face);
      /* Keep the landmarks that face the camera in the resting view. */
      const probe: Panel = { model: today, x: 0, y: 0, w: 1, h: 1 };
      stage.project(probe, view(canvas.clientWidth, 1.45, -0.03), today, [1]);
      const n = new Vector3();
      visibleLandmarks = LANDMARKS.filter((i) => today!.worldNormal(i, n).z > 0.2 || [9, 168, 6, 4, 1, 2, 0, 17, 152].includes(i));
      root.classList.add('is-live');
      new ResizeObserver(() => {
        if (!raf) render(t);
      }).observe(canvas);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          onScreen = entries.some((e) => e.isIntersecting);
          if (onScreen && (playing || (t >= END && !reduceMotion()))) kick();
        }).observe(root);
      }
      if (reduceMotion()) {
        t = END;
        render(t);
      } else {
        playFrom(0);
      }
    } catch {
      fail();
    }
  }

  function fail() {
    root.classList.add('no-3d');
    root.querySelector<HTMLElement>('[data-fallback]')?.removeAttribute('hidden');
    caption(END);
  }

  start();
}
