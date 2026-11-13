import { Vector3 } from 'three';
import { FaceModel } from './face-model';
import { FaceStage, type Panel, type Surface } from './face-stage';
import type { FaceMesh } from './mesh';
import {
  END,
  TONE,
  clamp,
  ease,
  heroView,
  obliqueView,
  profileView,
  recoveryDay,
  span,
  type HeroFrame,
  type HeroParams,
  type Kind,
  type WorkspaceFrame,
  type WorkspaceParams
} from './protocol';

/*
  The two 3D scenes of the site. Each one draws a frame from plain parameters and returns what
  the page lays over the canvas. They run in a worker when the browser allows it, so the page
  stays free while the face is drawn, and on the page itself otherwise.
*/

/** Landmarks of the profile: glabella, nasion, dorsum, tip, subnasale, lips, chin, alar creases. */
const LANDMARKS = [9, 168, 6, 4, 1, 2, 0, 17, 152, 48, 278, 64, 294];
const MIDLINE = [9, 168, 6, 4, 1, 2, 0, 17, 152];

function flat(points: Array<[number, number]>): number[] {
  const out: number[] = [];
  for (const [x, y] of points) out.push(x, y);
  return out;
}

/**
 * Opening sequence of the home page, on the demo face:
 * scan (points become a surface), 3D model (landmarks), plan (the nose changes, today's profile
 * stays dashed, measured live), recovery (day 2 to month 12), then back to the plan at rest.
 */
export class HeroScene {
  private stage: FaceStage;
  private face: FaceModel;
  private today: FaceModel;
  private todayHump: number;
  private humpIndex: number;
  private visible: number[] | null = null;
  private shape = '';
  private run = -1;

  constructor(canvas: Surface, mesh: FaceMesh, pixelRatio: number) {
    this.stage = new FaceStage(canvas, TONE.bg, pixelRatio);
    this.face = new FaceModel(mesh, { ...TONE, pixelRatio });
    this.today = new FaceModel(mesh, TONE);
    this.today.setPlan(0, 0, false);
    const m = this.today.measure();
    this.todayHump = m.humpMm;
    this.humpIndex = m.humpIndex;
    this.stage.add(this.face);
  }

  /** Keeps the landmarks that face the camera in the resting view. */
  private findLandmarks(W: number) {
    const probe: Panel = { model: this.today, x: 0, y: 0, w: 1, h: 1 };
    this.stage.project(probe, heroView(W, 1.45, -0.03), this.today, [1]);
    const n = new Vector3();
    return LANDMARKS.filter((i) => this.today.worldNormal(i, n).z > 0.2 || MIDLINE.includes(i));
  }

  private setShape(key: string, apply: () => void) {
    if (key === this.shape) return;
    this.shape = key;
    apply();
  }

  frame(p: HeroParams): HeroFrame {
    const { stage, face, today } = this;
    stage.resize(p.W, p.H);
    if (!this.visible) this.visible = this.findLandmarks(p.W);
    if (p.run !== this.run) {
      this.run = p.run;
      this.shape = '';
    }

    const time = p.time;
    const v = heroView(p.W, 1.45 + p.turn + p.idle, p.pitch);
    const state = { landmarks: 0, dashed: 0, callouts: 0, hump: this.todayHump, tip: 0 };

    if (time < 2.2) {
      const r = ease(span(time, 0.25, 2.0));
      this.setShape('today', () => face.setPlan(0, 0, false));
      face.setReveal(9.2 + (-10 - 9.2) * r);
    } else if (time < 3.4) {
      face.setReveal(null);
      this.setShape('today', () => face.setPlan(0, 0, false));
      state.landmarks = span(time, 2.3, 3.2);
    } else if (time < 6.0) {
      face.setReveal(null);
      state.landmarks = 1 - span(time, 3.4, 3.7);
      state.dashed = span(time, 3.4, 3.8);
      const kh = ease(span(time, 3.7, 5.2));
      const kt = ease(span(time, 3.9, 5.4));
      this.setShape(`plan:${kh.toFixed(3)}:${kt.toFixed(3)}`, () => {
        face.setTintStrength(0.38);
        face.setPlan(kh, kt, true);
      });
      state.callouts = span(time, 3.9, 4.3);
    } else if (time < END - 0.6) {
      face.setReveal(null);
      state.dashed = 1 - span(time, 6.0, 6.3);
      state.callouts = 1 - span(time, 6.0, 6.3);
      const day = recoveryDay(time);
      this.setShape(`heal:${day.toFixed(2)}`, () => face.setHealingDay(day));
    } else {
      face.setReveal(null);
      const k = time >= END ? 1 : span(time, END - 0.6, END);
      this.setShape(`final:${k.toFixed(2)}`, () => {
        face.setTintStrength(0.38 * k);
        face.setPlan(1, 1, true);
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

    const out: HeroFrame = {
      dashed: state.dashed,
      profile: [],
      landmarks: state.landmarks,
      points: [],
      callouts: 0,
      hump: [0, 0],
      tip: [0, 0],
      humpMm: state.hump,
      tipMm: state.tip,
      todayHumpMm: this.todayHump
    };
    if (state.dashed > 0) out.profile = flat(stage.project(panel, v, today, today.noseProfile));
    if (state.landmarks > 0) out.points = flat(stage.project(panel, v, face, this.visible));
    if (state.callouts > 0 && this.humpIndex >= 0) {
      const [hump, tip] = stage.project(panel, v, face, [this.humpIndex, 1]);
      out.callouts = state.callouts;
      out.hump = hump;
      out.tip = tip;
    }
    return out;
  }
}

/**
 * The live demo of a consultation.
 * Plan: the nose today next to the planned nose. Recovery: the planned nose on a day of the
 * forecast, in three-quarter view and in profile.
 */
export class WorkspaceScene {
  private stage: FaceStage;
  private today: FaceModel;
  private planned: FaceModel;
  private healing: FaceModel;
  private todayHumpMm: number;
  private hump = NaN;
  private tip = NaN;
  private day = NaN;
  private tau = NaN;
  private humpMm = 0;
  private tipMm = 0;

  constructor(canvas: Surface, mesh: FaceMesh, pixelRatio: number) {
    this.stage = new FaceStage(canvas, TONE.bg, pixelRatio);
    this.today = new FaceModel(mesh, TONE);
    this.planned = new FaceModel(mesh, TONE);
    this.healing = new FaceModel(mesh, TONE);
    this.today.setPlan(0, 0, false);
    this.todayHumpMm = this.today.measure().humpMm;
    this.stage.add(this.today);
    this.stage.add(this.planned);
    this.stage.add(this.healing);
  }

  frame(p: WorkspaceParams): WorkspaceFrame {
    const { stage, today, planned, healing } = this;
    stage.resize(p.W, p.H);
    if (p.hump !== this.hump || p.tip !== this.tip) {
      this.hump = p.hump;
      this.tip = p.tip;
      planned.setPlan(p.hump, p.tip);
      const m = planned.measure();
      this.humpMm = m.humpMm;
      this.tipMm = m.tipLiftMm;
    }
    if (p.day !== this.day || p.tau !== this.tau) {
      this.day = p.day;
      this.tau = p.tau;
      healing.setHealingDay(p.day, p.tau);
    }

    const view = profileView(clamp(1.45 + p.turn, 0.8, 1.57), p.pitch);
    const panels: Panel[] =
      p.mode === 'plan'
        ? [
            { model: today, x: 0, y: 0, w: 0.5, h: 1 },
            { model: planned, x: 0.5, y: 0, w: 0.5, h: 1 }
          ]
        : [
            { model: healing, x: 0, y: 0, w: 0.5, h: 1, view: obliqueView(clamp(0.55 + p.turn, 0.3, 1.0), p.pitch) },
            { model: healing, x: 0.5, y: 0, w: 0.5, h: 1, view: profileView(clamp(1.45 + p.turn, 0.8, 1.57), p.pitch) }
          ];
    stage.draw(panels, view);

    return {
      profile: p.mode === 'plan' ? flat(stage.project(panels[1], view, today, today.noseProfile)) : [],
      humpMm: this.humpMm,
      tipMm: this.tipMm,
      todayHumpMm: this.todayHumpMm
    };
  }
}

export type Scene = HeroScene | WorkspaceScene;

export function createScene(kind: Kind, canvas: Surface, mesh: FaceMesh, pixelRatio: number): Scene {
  return kind === 'hero' ? new HeroScene(canvas, mesh, pixelRatio) : new WorkspaceScene(canvas, mesh, pixelRatio);
}
