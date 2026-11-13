import { openFaceLink, type FaceLink } from './face-link';
import { formatDay, swelling } from './healing-model';
import { END, PHASES, clamp, recoveryDay, span, type HeroFrame, type HeroParams } from './protocol';

/*
  Opening sequence of the home page, on the demo face:
  scan (points become a surface), 3D model (landmarks), plan (the nose changes, today's profile
  stays dashed, measured live), recovery (day 2 to month 12), then back to the plan at rest.

  This file keeps the page side: the clock, the captions, the overlay and the pointer.
  The face itself is drawn by the scene in scenes.ts.
*/

const mm = (v: number) => (Math.abs(v) < 0.05 ? '0' : v.toFixed(1));
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';

export function initHero(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-canvas]')!;
  const overlay = root.querySelector<SVGSVGElement>('[data-overlay]')!;
  const capTitle = root.querySelector<HTMLElement>('[data-cap-title]')!;
  const capText = root.querySelector<HTMLElement>('[data-cap-text]')!;
  const steps = [...root.querySelectorAll<HTMLButtonElement>('[data-step]')];
  const compact = root.querySelector<HTMLElement>('[data-compact]');

  let link: FaceLink<HeroParams> | null = null;

  let t = 0;
  let playing = false;
  let last = 0;
  let idleStart = 0;
  let raf = 0;
  let onScreen = true;
  let turn = 0;
  let pitch = -0.03;
  let run = 0;

  /* ---------- Overlay ---------- */

  const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, String(attrs[k]));
    overlay.appendChild(n);
    return n;
  };

  function drawOverlay(f: HeroFrame, { W, H }: HeroParams) {
    overlay.setAttribute('viewBox', `0 0 ${W} ${H}`);
    overlay.replaceChildren();

    if (f.dashed > 0) {
      let d = '';
      for (let i = 0; i < f.profile.length; i += 2) d += `${i ? ' L' : 'M'}${f.profile[i].toFixed(1)},${f.profile[i + 1].toFixed(1)}`;
      el('path', {
        d,
        fill: 'none', stroke: '#1a2732', 'stroke-width': 1.5, 'stroke-dasharray': '5 4',
        'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: f.dashed
      });
    }

    if (f.landmarks > 0) {
      const count = f.points.length / 2;
      for (let k = 0; k < count; k++) {
        const a = clamp(f.landmarks * count - k);
        if (a <= 0) continue;
        el('circle', { cx: f.points[k * 2].toFixed(1), cy: f.points[k * 2 + 1].toFixed(1), r: (2 + 2 * a).toFixed(2), fill: '#23628f', stroke: '#ffffff', 'stroke-width': 1.5, opacity: a });
      }
    }

    if (f.callouts > 0) {
      const [hx, hy] = f.hump, [tx, ty] = f.tip;
      const wide = W >= 640;
      if (compact) compact.hidden = wide;
      const callout = (x: number, y: number, label: string, value: string, plan: string) => {
        el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 4, fill: '#23628f', stroke: '#ffffff', 'stroke-width': 1.5, opacity: f.callouts });
        if (!wide) return;
        const lx = Math.min(W - 196, tx + 56);
        el('line', { x1: x + 6, y1: y, x2: lx - 10, y2: y, stroke: '#1a2732', 'stroke-width': 1, opacity: 0.55 * f.callouts });
        const t1 = el('text', { x: lx, y: y - 9, fill: '#55636e', 'font-size': 13, opacity: f.callouts });
        t1.textContent = label;
        const t2 = el('text', { x: lx, y: y + 15, fill: '#1a2732', 'font-size': 21, 'font-weight': 400, opacity: f.callouts });
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
      callout(hx, hy, 'Dorsal hump', `${mm(f.todayHumpMm)}`, `${mm(f.humpMm)} mm`);
      callout(tx, ty, 'Tip lift', '', `+${mm(f.tipMm)} mm`);
      if (compact) {
        compact.style.opacity = String(f.callouts);
        compact.textContent = `Dorsal hump ${mm(f.todayHumpMm)} → ${mm(f.humpMm)} mm · Tip lift +${mm(f.tipMm)} mm`;
      }
    } else if (compact) {
      compact.style.opacity = '0';
    }
  }

  /* ---------- Sequence ---------- */

  function phaseAt(time: number) {
    if (time >= PHASES[3].end) return 2;
    return Math.max(0, PHASES.findIndex((p) => time >= p.start && time < p.end));
  }

  /* The page is written only where something changed, so a frame of the sequence costs it next to nothing. */
  const texts = new Map<Element, string>();
  const setText = (node: HTMLElement, value: string) => {
    if (texts.get(node) === value) return;
    texts.set(node, value);
    node.textContent = value;
  };
  const fills: string[] = [];
  const pressed: string[] = [];

  function caption(time: number) {
    const i = phaseAt(time);
    const p = PHASES[i];
    setText(capTitle, p.title);
    if (p.id === 'recovery' && time < END) {
      const day = recoveryDay(time);
      setText(capText, `${formatDay(day)}: swelling at ${Math.round(swelling(day) * 100)}% of its peak.`);
    } else {
      setText(capText, p.text);
    }
    steps.forEach((b, k) => {
      const ph = PHASES[k];
      const fill = (time >= END ? 1 : span(time, ph.start, ph.end)).toFixed(3);
      if (fills[k] !== fill) {
        fills[k] = fill;
        b.style.setProperty('--p', fill);
      }
      const on = k === i ? 'true' : 'false';
      if (pressed[k] !== on) {
        pressed[k] = on;
        b.setAttribute('aria-pressed', on);
      }
    });
  }

  function render(time: number) {
    if (!link) return;
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (W && H) {
      const idle = time >= END && !reduceMotion() ? 0.07 * Math.sin(((performance.now() - idleStart) / 1000) * 0.5) : 0;
      link.request({ W, H, time, turn, pitch, idle, run });
    }
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
    run++;
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
    b.addEventListener('click', () => (reduceMotion() ? (run++, (t = STILL[k]), render(t)) : playFrom(PHASES[k].start)))
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
    try {
      link = await openFaceLink<HeroParams, HeroFrame>(canvas, 'hero', drawOverlay);
      if (!link) return fail();
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
