import { Color, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';
import type { FaceModel } from './face-model';

/** Where the camera looks. The region w by h (in cm, around cx, cy) always stays in frame. */
export interface View {
  yaw: number;
  pitch: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
}

/** A rectangle of the canvas, as fractions of its size from the top left, showing one model. */
export interface Panel {
  model: FaceModel;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Overrides the stage view for this panel. */
  view?: View;
}

const FOV = 20;
const TAN = Math.tan((FOV * Math.PI) / 360);

/** One WebGL canvas that draws one face, or several faces in separate panels. */
export class FaceStage {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(FOV, 1, 1, 400);
  private models: FaceModel[] = [];
  private v = new Vector3();

  constructor(readonly canvas: HTMLCanvasElement, background: string) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(new Color(background), 1);
  }

  add(model: FaceModel) {
    this.models.push(model);
    this.scene.add(model.object);
  }

  /** Points the camera at the panel and turns the model to the view. */
  private aim(panel: Panel, view: View, W: number, H: number) {
    const aspect = (panel.w * W) / (panel.h * H);
    const dist = Math.max(view.h / 2 / TAN, view.w / 2 / (TAN * aspect));
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(view.cx, view.cy, dist);
    this.camera.lookAt(view.cx, view.cy, 0);
    this.camera.updateMatrixWorld();
    panel.model.object.rotation.set(view.pitch, view.yaw, 0);
    panel.model.object.updateMatrixWorld(true);
  }

  draw(panels: Panel[], view: View) {
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight;
    if (!W || !H) return;
    const ratio = this.renderer.getPixelRatio();
    if (this.canvas.width !== Math.round(W * ratio) || this.canvas.height !== Math.round(H * ratio)) {
      this.renderer.setSize(W, H, false);
    }
    this.renderer.setScissorTest(false);
    this.renderer.clear();
    this.renderer.setScissorTest(true);
    for (const panel of panels) {
      const left = Math.round(panel.x * W), width = Math.round(panel.w * W);
      const top = Math.round(panel.y * H), height = Math.round(panel.h * H);
      const bottom = H - top - height;
      this.renderer.setViewport(left, bottom, width, height);
      this.renderer.setScissor(left, bottom, width, height);
      for (const m of this.models) m.object.visible = m === panel.model;
      this.aim(panel, panel.view ?? view, W, H);
      this.renderer.render(this.scene, this.camera);
    }
    this.renderer.setScissorTest(false);
  }

  /** Projects vertices of a model into a panel, in CSS pixels from the canvas top left. */
  project(panel: Panel, view: View, model: FaceModel, indices: ArrayLike<number>): Array<[number, number]> {
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight;
    this.aim({ ...panel, model }, panel.view ?? view, W, H);
    const left = panel.x * W, top = panel.y * H, pw = panel.w * W, ph = panel.h * H;
    const out: Array<[number, number]> = [];
    for (let k = 0; k < indices.length; k++) {
      model.worldVertex(indices[k], this.v).project(this.camera);
      out.push([left + ((this.v.x + 1) / 2) * pw, top + ((1 - this.v.y) / 2) * ph]);
    }
    return out;
  }
}

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
