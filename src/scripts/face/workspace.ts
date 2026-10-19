import { FaceModel } from './face-model';
import { FaceStage, webglAvailable, type Panel, type View } from './face-stage';
import { loadFaceMesh } from './mesh';
import { RecoveryChart } from './recovery-chart';
import { SKIN_TAU, STAGES, bruisePhase, dayToPosition, formatDay, positionToDay, stageForDay, swelling, type Skin } from './healing-model';

/** Clay on a cool gray viewport: reads as a 3D model, not as a photo. */
export const TONE = { bg: '#eef1f4', shadow: '#a39c96', light: '#fdfcfa', changeTint: '#a7c6dd', swellTint: '#f0b4a2' };

type Mode = 'plan' | 'recovery';

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mm = (v: number) => `${Math.abs(v) < 0.05 ? '0' : v.toFixed(1)} mm`;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Profile framing. As the face turns toward the camera, the frame widens and moves with it. */
export function profileView(yaw: number, pitch: number): View {
  const t = (yaw - 0.8) / (1.45 - 0.8);
  return { yaw, pitch, cx: lerp(0, 1.9, t), cy: 1.0, w: lerp(12, 10.8, clamp(t, 0, 1)), h: 12.5 };
}
export function obliqueView(yaw: number, pitch: number): View {
  return { yaw, pitch, cx: lerp(-1.2, 0.2, (yaw - 0.3) / 0.6), cy: 1.0, w: 13, h: 13 };
}

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
  let todayHumpMm = 0;

  let stage: FaceStage | null = null;
  let today: FaceModel | null = null;
  let planned: FaceModel | null = null;
  let healing: FaceModel | null = null;

  const chart = new RecoveryChart(q<SVGSVGElement>('[data-chart]')!, (d) => {
    cancelAnimationFrame(intro);
    setDay(d);
  });

  /* ---------- Drawing ---------- */

  function panels(): Panel[] {
    if (mode === 'plan') {
      return [
        { model: today!, x: 0, y: 0, w: 0.5, h: 1 },
        { model: planned!, x: 0.5, y: 0, w: 0.5, h: 1 }
      ];
    }
    return [
      { model: healing!, x: 0, y: 0, w: 0.5, h: 1, view: obliqueView(clamp(0.55 + turn, 0.3, 1.0), pitch) },
      { model: healing!, x: 0.5, y: 0, w: 0.5, h: 1, view: profileView(clamp(1.45 + turn, 0.8, 1.57), pitch) }
    ];
  }

  function drawOverlay(list: Panel[], view: View) {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    overlay.setAttribute('viewBox', `0 0 ${W} ${H}`);
    if (mode !== 'plan' || !today || !stage) {
      overlay.innerHTML = '';
      return;
    }
    const pts = stage.project(list[1], view, today, today.noseProfile);
    const d = `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L')}`;
    overlay.innerHTML = `<path d="${d}" fill="none" stroke="#1a2732" stroke-width="1.5" stroke-dasharray="5 4" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  function draw() {
    if (!stage) return;
    const view = profileView(clamp(1.45 + turn, 0.8, 1.57), pitch);
    const list = panels();
    stage.draw(list, view);
    drawOverlay(list, view);
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
    if (!planned) return;
    planned.setPlan(h, t);
    const m = planned.measure();
    out('hump-plan')!.textContent = mm(m.humpMm);
    out('tip-plan')!.textContent = mm(m.tipLiftMm);
    humpCtl.setAttribute('aria-valuetext', `${Math.round(h * 100)}% of the planned reduction. Dorsal hump ${mm(m.humpMm)}, ${mm(todayHumpMm)} today`);
    tipCtl.setAttribute('aria-valuetext', `${Math.round(t * 100)}% of the planned lift. Tip lifted by ${mm(m.tipLiftMm)}`);
    requestDraw();
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
    if (healing) {
      healing.setHealingDay(d, tau);
      requestDraw();
    }
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
    if (!webglAvailable()) return fail();
    try {
      const mesh = await loadFaceMesh();
      stage = new FaceStage(canvas, TONE.bg);
      today = new FaceModel(mesh, TONE);
      planned = new FaceModel(mesh, TONE);
      healing = new FaceModel(mesh, TONE);
      today.setPlan(0, 0, false);
      todayHumpMm = today.measure().humpMm;
      out('hump-today')!.textContent = mm(todayHumpMm);
      stage.add(today);
      stage.add(planned);
      stage.add(healing);
      healing.setHealingDay(day, SKIN_TAU[skin]);
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
