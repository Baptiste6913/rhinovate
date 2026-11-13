import { openFaceLink, type FaceLink } from './face-link';
import { RecoveryChart } from './recovery-chart';
import { SKIN_TAU, STAGES, bruisePhase, dayToPosition, formatDay, positionToDay, stageForDay, swelling, type Skin } from './healing-model';
import { clamp, type WorkspaceFrame, type WorkspaceParams } from './protocol';

/*
  The live demo of a consultation, page side: tabs, sliders, readouts and the overlay.
  The faces are drawn by the scene in scenes.ts.
*/

type Mode = 'plan' | 'recovery';

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mm = (v: number) => `${Math.abs(v) < 0.05 ? '0' : v.toFixed(1)} mm`;

/** Coalesces draw requests into one per animation frame. */
function scheduler(draw: () => void) {
  let queued = false;
  return () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      draw();
    });
  };
}

export function initWorkspace(root: HTMLElement) {
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel);
  const canvas = q<HTMLCanvasElement>('[data-canvas]')!;
  const overlay = q<SVGSVGElement>('[data-overlay]')!;
  const tagA = q<HTMLElement>('[data-tag="a"]')!;
  const tagB = q<HTMLElement>('[data-tag="b"]')!;
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const body = q<HTMLElement>('[role="tabpanel"]')!;
  const panes = [...root.querySelectorAll<HTMLElement>('[data-pane]')];
  const humpCtl = q<HTMLInputElement>('[data-ctl="hump"]')!;
  const tipCtl = q<HTMLInputElement>('[data-ctl="tip"]')!;
  const dayCtl = q<HTMLInputElement>('[data-ctl="day"]')!;
  const ticks = q<HTMLElement>('[data-ticks]')!;
  const skinInputs = [...root.querySelectorAll<HTMLInputElement>('[data-skin]')];
  const out = (key: string) => q<HTMLElement>(`[data-out="${key}"]`);

  let mode: Mode = root.dataset.mode === 'recovery' ? 'recovery' : 'plan';
  let hump = 1;
  let tip = 1;
  let day = Number(root.dataset.day ?? 7);
  let skin: Skin = 'medium';
  let turn = 0;
  let pitch = -0.03;
  let intro = 0;

  let link: FaceLink<WorkspaceParams> | null = null;

  const chart = new RecoveryChart(q<SVGSVGElement>('[data-chart]')!, (d) => {
    cancelAnimationFrame(intro);
    setDay(d);
  });

  /* ---------- Drawing ---------- */

  /* Readouts are written only when their text changes. */
  const texts = new Map<Element, string>();
  const setText = (node: Element | null, value: string) => {
    if (!node || texts.get(node) === value) return;
    texts.set(node, value);
    node.textContent = value;
  };
  const setValueText = (node: Element, value: string) => {
    if (node.getAttribute('aria-valuetext') !== value) node.setAttribute('aria-valuetext', value);
  };

  function drawOverlay(f: WorkspaceFrame, p: WorkspaceParams) {
    /* A frame asked for before the tab changed no longer matches what the canvas will show. */
    if (p.mode !== mode) return;
    overlay.setAttribute('viewBox', `0 0 ${p.W} ${p.H}`);
    if (p.mode !== 'plan' || !f.profile.length) {
      overlay.innerHTML = '';
      return;
    }
    let d = '';
    for (let i = 0; i < f.profile.length; i += 2) d += `${i ? ' L' : 'M'}${f.profile[i].toFixed(1)},${f.profile[i + 1].toFixed(1)}`;
    overlay.innerHTML = `<path d="${d}" fill="none" stroke="#1a2732" stroke-width="1.5" stroke-dasharray="5 4" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  /** The scene has drawn a frame: the page shows what was measured on it. */
  function onFrame(f: WorkspaceFrame, p: WorkspaceParams) {
    setText(out('hump-today'), mm(f.todayHumpMm));
    setText(out('hump-plan'), mm(f.humpMm));
    setText(out('tip-plan'), mm(f.tipMm));
    setValueText(humpCtl, `${Math.round(p.hump * 100)}% of the planned reduction. Dorsal hump ${mm(f.humpMm)}, ${mm(f.todayHumpMm)} today`);
    setValueText(tipCtl, `${Math.round(p.tip * 100)}% of the planned lift. Tip lifted by ${mm(f.tipMm)}`);
    drawOverlay(f, p);
  }

  function draw() {
    if (!link) return;
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W || !H) return;
    link.request({ W, H, mode, hump, tip, day, tau: SKIN_TAU[skin], turn, pitch });
  }
  const requestDraw = scheduler(draw);

  /* ---------- Plan ---------- */

  function setPlan(h: number, t: number) {
    hump = h;
    tip = t;
    humpCtl.value = String(Math.round(h * 100));
    tipCtl.value = String(Math.round(t * 100));
    humpCtl.style.setProperty('--fill', `${h * 100}%`);
    tipCtl.style.setProperty('--fill', `${t * 100}%`);
    if (link) requestDraw();
  }

  humpCtl.addEventListener('input', () => {
    cancelAnimationFrame(intro);
    setPlan(Number(humpCtl.value) / 100, tip);
  });
  tipCtl.addEventListener('input', () => {
    cancelAnimationFrame(intro);
    setPlan(hump, Number(tipCtl.value) / 100);
  });

  function playIntro() {
    if (reduceMotion() || mode !== 'plan') return setPlan(1, 1);
    setPlan(0, 0);
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const start = performance.now() + 600;
    const step = (now: number) => {
      const k = clamp((now - start) / 1700, 0, 1);
      const e = ease(k);
      setPlan(e, ease(clamp(k * 1.15 - 0.15, 0, 1)));
      if (k < 1) intro = requestAnimationFrame(step);
    };
    intro = requestAnimationFrame(step);
  }

  /* ---------- Recovery ---------- */

  STAGES.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span class="t-long">${s.label}</span><span class="t-short" aria-hidden="true">${s.short}</span>`;
    b.setAttribute('aria-label', s.label);
    b.style.left = `calc(10px + (100% - 20px) * ${i / (STAGES.length - 1)})`;
    b.addEventListener('click', () => goTo(s.day));
    ticks.appendChild(b);
  });

  function setDay(d: number) {
    day = d;
    const s = stageForDay(d);
    const tau = SKIN_TAU[skin];
    out('when')!.textContent = s.label;
    out('what')!.textContent = s.text;
    out('swelling')!.textContent = `${Math.round(swelling(d, tau) * 100)}% of peak`;
    out('bruising')!.textContent = bruisePhase(d);
    const p = dayToPosition(d);
    dayCtl.value = String(Math.round(p * 1000));
    dayCtl.style.setProperty('--fill', `${p * 100}%`);
    dayCtl.setAttribute('aria-valuetext', `${formatDay(d)}. ${s.text}`);
    [...ticks.children].forEach((b, i) => b.setAttribute('aria-pressed', STAGES[i] === s ? 'true' : 'false'));
    chart.setDay(d);
    if (mode === 'recovery') tagA.textContent = `Forecast, ${formatDay(d).toLowerCase()}`;
    if (link) requestDraw();
  }

  function goTo(target: number) {
    cancelAnimationFrame(intro);
    if (reduceMotion()) return setDay(target);
    const a = Math.log(day), b = Math.log(target), t0 = performance.now();
    const step = (now: number) => {
      const k = clamp((now - t0) / 500, 0, 1);
      setDay(Math.exp(a + (b - a) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) intro = requestAnimationFrame(step);
    };
    intro = requestAnimationFrame(step);
  }

  dayCtl.addEventListener('input', () => {
    cancelAnimationFrame(intro);
    setDay(positionToDay(Number(dayCtl.value) / 1000));
  });
  skinInputs.forEach((input) =>
    input.addEventListener('change', () => {
      if (!input.checked) return;
      skin = input.value as Skin;
      chart.setSkin(SKIN_TAU[skin]);
      setDay(day);
    })
  );

  /* ---------- Tabs ---------- */

  function setMode(next: Mode, focus = false) {
    mode = next;
    root.dataset.mode = next;
    tabs.forEach((t) => {
      const on = t.dataset.tab === next;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on) {
        body.setAttribute('aria-labelledby', t.id);
        if (focus) t.focus();
      }
    });
    panes.forEach((p) => (p.hidden = p.dataset.pane !== next));
    turn = 0;
    if (next === 'plan') {
      tagA.textContent = 'Today';
      tagB.textContent = 'Planned';
      tagB.hidden = false;
      canvas.setAttribute('aria-label', 'Two 3D views of the demo face in profile: the nose today, and the planned nose with today’s profile dashed over it. Use the arrow keys to turn them.');
    } else {
      tagB.hidden = true;
      overlay.innerHTML = '';
      canvas.setAttribute('aria-label', 'The planned nose on the demo face, at the selected point of the recovery forecast, in three-quarter view and in profile. Use the arrow keys to turn them.');
      chart.draw();
      setDay(day);
    }
    requestDraw();
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => {
      cancelAnimationFrame(intro);
      setMode(t.dataset.tab as Mode);
      if (mode === 'plan') setPlan(hump, tip);
    });
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      cancelAnimationFrame(intro);
      setMode(next.dataset.tab as Mode, true);
    });
  });

  root.querySelector<HTMLButtonElement>('[data-goto="recovery"]')?.addEventListener('click', () => {
    cancelAnimationFrame(intro);
    setMode('recovery');
    tabs.find((t) => t.dataset.tab === 'recovery')?.focus();
  });

  /* ---------- Turning the face ---------- */

  let last: { x: number; y: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => {
    last = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!last) return;
    turn = clamp(turn + (e.clientX - last.x) * 0.008, -0.65, 0.12);
    pitch = clamp(pitch + (e.clientY - last.y) * 0.004, -0.25, 0.2);
    last = { x: e.clientX, y: e.clientY };
    requestDraw();
  });
  const end = () => (last = null);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    turn = clamp(turn + (e.key === 'ArrowRight' ? 0.1 : -0.1), -0.65, 0.12);
    requestDraw();
  });
  new ResizeObserver(requestDraw).observe(canvas);

  /* ---------- Start ---------- */

  setMode(mode);
  setDay(day);

  async function start() {
    try {
      link = await openFaceLink<WorkspaceParams, WorkspaceFrame>(canvas, 'workspace', onFrame);
      if (!link) return fail();
      root.classList.add('is-live');
      if (mode === 'plan') playIntro();
      else setPlan(1, 1);
      requestDraw();
    } catch {
      fail();
    }
  }

  function fail() {
    q<HTMLElement>('[data-no3d]')?.removeAttribute('hidden');
    humpCtl.disabled = true;
    tipCtl.disabled = true;
  }

  if (root.hasAttribute('data-eager') || !('IntersectionObserver' in window)) {
    start();
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: '300px' }
    );
    io.observe(root);
  }
}
