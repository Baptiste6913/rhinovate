import { BufferAttribute, BufferGeometry, DoubleSide, Group, Mesh, ShaderMaterial, Vector3 } from 'three';
import type { FaceMesh } from './mesh';
import { MAX_SWELLING_CM, ZONE_WEIGHTS, bruiseColor, bruising, swelling } from './healing-model';

/** sRGB hex to a plain vector: the shader writes these tones as they are. */
export function rgb(hex: string): Vector3 {
  const n = parseInt(hex.replace('#', ''), 16);
  return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const VERTEX = /* glsl */ `
  attribute float fade;
  attribute float cav;
  attribute float tintA;
  attribute float tintB;
  varying vec3 vN;
  varying float vFade;
  varying float vCav;
  varying float vTintA;
  varying float vTintB;
  void main() {
    vN = normalize(normalMatrix * normal);
    vFade = fade; vCav = cav; vTintA = tintA; vTintB = tintB;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uBg;
  uniform vec3 uShadow;
  uniform vec3 uLight;
  uniform vec3 uTintA;
  uniform float uTintAAmt;
  uniform vec3 uTintB;
  uniform float uTintBAmt;
  varying vec3 vN;
  varying float vFade;
  varying float vCav;
  varying float vTintA;
  varying float vTintB;
  void main() {
    vec3 n = normalize(vN);
    if (!gl_FrontFacing) n = -n;
    vec3 L1 = normalize(vec3(-0.55, 0.55, 0.62));
    vec3 L2 = normalize(vec3(0.85, 0.05, 0.45));
    float w1 = clamp((dot(n, L1) + 0.25) / 1.25, 0.0, 1.0);
    float d2 = max(dot(n, L2), 0.0);
    float lum = 0.34 + 0.54 * w1 * w1 + 0.12 * d2 + 0.10 * (0.5 + 0.5 * n.y);
    lum -= 0.22 * clamp(vCav, 0.0, 1.0);
    lum -= 0.10 * pow(1.0 - clamp(n.z, 0.0, 1.0), 3.0);
    float spec = pow(max(dot(n, normalize(L1 + vec3(0.0, 0.0, 1.0))), 0.0), 38.0) * 0.05;
    vec3 c = mix(uShadow, uLight, clamp(lum, 0.0, 1.0)) + spec;
    c = mix(c, c * uTintA, clamp(vTintA * uTintAAmt, 0.0, 1.0));
    c = mix(c, c * uTintB, clamp(vTintB * uTintBAmt, 0.0, 1.0));
    gl_FragColor = vec4(mix(uBg, c, vFade), 1.0);
  }
`;

const gauss = (d2: number, s: number) => Math.exp(-d2 / (2 * s * s));

/** Planning morph. The canonical face is the plan; "today" adds a dorsal hump and a lower tip. */
const MORPH = { hump: 0.42, tipDy: -0.26, tipDz: 0.05, flat: -0.22 };

export interface ModelOptions {
  /** Background the mask edge fades into. */
  bg?: string;
  shadow?: string;
  light?: string;
  /** Tint for planned changes (plan mode) or swelling (healing mode). */
  changeTint?: string;
  swellTint?: string;
}

/** One instance of the demo face, with its own shape state (today, plan, or a healing day). */
export class FaceModel {
  readonly object = new Group();
  private geometry = new BufferGeometry();
  private material: ShaderMaterial;
  private pos: Float32Array;
  private tintA: Float32Array;
  private tintB: Float32Array;
  private base: Float32Array;
  private fields: Record<'flat' | 'hump' | 'tip' | 'dorsum' | 'tipZone' | 'alar' | 'peri' | 'bruise', Float32Array>;
  private baseTipY = 0;
  private opts: Required<ModelOptions>;
  private face: Mesh;
  /** Midline vertices from above the nasion to the subnasale, top to bottom: the nasal profile. */
  readonly noseProfile: number[];

  constructor(private mesh: FaceMesh, options: ModelOptions = {}) {
    this.opts = {
      bg: options.bg ?? '#ffffff',
      shadow: options.shadow ?? '#aab4bc',
      light: options.light ?? '#ffffff',
      changeTint: options.changeTint ?? '#a7c6dd',
      swellTint: options.swellTint ?? '#ecc3b7'
    };
    this.base = mesh.positions;
    this.pos = new Float32Array(mesh.positions);
    this.tintA = new Float32Array(mesh.count);
    this.tintB = new Float32Array(mesh.count);
    this.fields = this.buildFields();

    const g = this.geometry;
    g.setAttribute('position', new BufferAttribute(this.pos, 3));
    g.setAttribute('fade', new BufferAttribute(mesh.fade, 1));
    g.setAttribute('cav', new BufferAttribute(mesh.cavity, 1));
    g.setAttribute('tintA', new BufferAttribute(this.tintA, 1));
    g.setAttribute('tintB', new BufferAttribute(this.tintB, 1));
    g.setIndex(new BufferAttribute(mesh.indices, 1));

    this.material = new ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      side: DoubleSide,
      uniforms: {
        uBg: { value: rgb(this.opts.bg) },
        uShadow: { value: rgb(this.opts.shadow) },
        uLight: { value: rgb(this.opts.light) },
        uTintA: { value: rgb(this.opts.changeTint) },
        uTintAAmt: { value: 0.38 },
        uTintB: { value: rgb('#ffffff') },
        uTintBAmt: { value: 0 }
      }
    });
    this.face = new Mesh(g, this.material);
    this.face.position.set(0, 0.4, -3.2);
    this.object.add(this.face);
    this.noseProfile = Array.from(mesh.midline).filter((i) => {
      const y = this.base[i * 3 + 1];
      return y < 4.4 && y > -2.35;
    });

    this.setPlan(0);
    this.baseTipY = this.pos[1 * 3 + 1];
  }

  private buildFields() {
    const n = this.mesh.count, B = this.base;
    const make = () => new Float32Array(n);
    const f = { flat: make(), hump: make(), tip: make(), dorsum: make(), tipZone: make(), alar: make(), peri: make(), bruise: make() };
    for (let i = 0; i < n; i++) {
      const x = B[i * 3], y = B[i * 3 + 1], z = B[i * 3 + 2];
      const front = z > 4.6 ? 1 : 0;
      const dy = y + 0.95, dz = z - 7.35;
      f.flat[i] = front * gauss(x * x, 0.55) * gauss((y - 0.55) ** 2, 0.55);
      f.hump[i] = front * gauss(x * x, 0.6) * gauss((y - 1.4) ** 2, 0.8);
      f.tip[i] = gauss(x * x, 0.95) * gauss(dy * dy + dz * dz * 0.6, 0.85);
      f.dorsum[i] = front * gauss(x * x, 0.85) * gauss((y - 1.4) ** 2, 1.25);
      f.tipZone[i] = gauss(x * x, 1.05) * gauss(dy * dy + dz * dz * 0.5, 0.95);
      const ax = Math.abs(x) - 1.5;
      f.alar[i] = gauss(ax * ax + (y + 1.0) ** 2 + (z - 5.6) ** 2, 0.6);
      const ex = Math.abs(x) - 3.0;
      f.peri[i] = gauss(ex * ex + (y - 1.85) ** 2 + (z - 3.9) ** 2, 0.95);
      const sx = Math.abs(x) - 1.35;
      f.bruise[i] = Math.max(f.peri[i], 0.8 * gauss(sx * sx + (y - 1.6) ** 2 + (z - 5.0) ** 2, 0.6));
    }
    return f;
  }

  /**
   * Planned change, from 0 (the nose today) to 1 (the plan), set separately for the dorsal hump
   * and the tip. Changed areas are tinted when tint is on.
   */
  setPlan(hump: number, tip = hump, tint = true) {
    const { pos, base, fields: F } = this;
    const kh = 1 - hump, kt = 1 - tip, n = this.mesh.count;
    for (let i = 0; i < n; i++) {
      pos[i * 3] = base[i * 3];
      pos[i * 3 + 1] = base[i * 3 + 1] + F.tip[i] * MORPH.tipDy * kt;
      pos[i * 3 + 2] = base[i * 3 + 2] + F.flat[i] * MORPH.flat + F.hump[i] * MORPH.hump * kh + F.tip[i] * MORPH.tipDz * kt;
      const changed = F.hump[i] * MORPH.hump * hump + F.tip[i] * -MORPH.tipDy * 0.8 * tip;
      this.tintA[i] = tint ? Math.min(1, changed / 0.2) : 0;
      this.tintB[i] = 0;
    }
    (this.material.uniforms.uTintA.value as Vector3).copy(rgb(this.opts.changeTint));
    this.material.uniforms.uTintAAmt.value = 0.38;
    this.material.uniforms.uTintBAmt.value = 0;
    this.commit();
  }

  /** Planned nose, swollen and bruised as the healing model predicts for the given day. */
  setHealingDay(day: number, tauSlow?: number) {
    const { pos, base, fields: F } = this;
    const n = this.mesh.count;
    for (let i = 0; i < n; i++) {
      pos[i * 3] = base[i * 3];
      pos[i * 3 + 1] = base[i * 3 + 1];
      pos[i * 3 + 2] = base[i * 3 + 2] + F.flat[i] * MORPH.flat;
    }
    this.geometry.getAttribute('position').needsUpdate = true;
    this.geometry.computeVertexNormals();
    const nr = this.geometry.getAttribute('normal').array as Float32Array;
    const s = swelling(day, tauSlow) * MAX_SWELLING_CM;
    const w = ZONE_WEIGHTS;
    const b = bruising(day);
    for (let i = 0; i < n; i++) {
      const zone = Math.max(w.tip * F.tipZone[i], w.dorsum * F.dorsum[i], w.alar * F.alar[i], w.periorbital * F.peri[i]);
      const d = s * zone;
      pos[i * 3] += nr[i * 3] * d;
      pos[i * 3 + 1] += nr[i * 3 + 1] * d;
      pos[i * 3 + 2] += nr[i * 3 + 2] * d;
      this.tintA[i] = Math.min(1, d / MAX_SWELLING_CM);
      this.tintB[i] = b * F.bruise[i];
    }
    const [r, g, bl] = bruiseColor(day);
    (this.material.uniforms.uTintA.value as Vector3).copy(rgb(this.opts.swellTint));
    this.material.uniforms.uTintAAmt.value = 0.5;
    (this.material.uniforms.uTintB.value as Vector3).set(1 - 0.6 * (1 - r), 1 - 0.6 * (1 - g), 1 - 0.6 * (1 - bl));
    this.material.uniforms.uTintBAmt.value = 0.55;
    this.commit();
  }

  /** World position of a vertex, with the model's current shape and rotation. */
  worldVertex(i: number, out: Vector3) {
    return out.set(this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2]).applyMatrix4(this.face.matrixWorld);
  }

  /** World direction of a vertex normal, to tell whether the vertex faces the camera. */
  worldNormal(i: number, out: Vector3) {
    const n = this.geometry.getAttribute('normal').array as Float32Array;
    return out.set(n[i * 3], n[i * 3 + 1], n[i * 3 + 2]).transformDirection(this.face.matrixWorld);
  }

  private commit() {
    this.geometry.getAttribute('position').needsUpdate = true;
    this.geometry.getAttribute('tintA').needsUpdate = true;
    this.geometry.getAttribute('tintB').needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  /** Dorsal hump above the nasion-to-tip line, and tip lift against the nose today, in mm. */
  measure() {
    const { pos } = this;
    let N: [number, number] | null = null, T: [number, number] | null = null;
    const pts: Array<[number, number]> = [];
    for (const i of this.mesh.midline) {
      const p: [number, number] = [pos[i * 3 + 2], pos[i * 3 + 1]];
      pts.push(p);
      if (p[1] > 2.8 && p[1] < 4.5 && (!N || p[0] < N[0])) N = p;
      if (p[1] > -2.0 && p[1] < 0.5 && (!T || p[0] > T[0])) T = p;
    }
    let hump = 0;
    if (N && T) {
      const dx = T[0] - N[0], dy = T[1] - N[1], L = Math.hypot(dx, dy);
      for (const p of pts) {
        if (p[1] < N[1] - 0.2 && p[1] > T[1] + 0.9) {
          const d = -((p[0] - N[0]) * dy - (p[1] - N[1]) * dx) / L;
          if (d > hump) hump = d;
        }
      }
    }
    return { humpMm: hump * 10, tipLiftMm: (pos[1 * 3 + 1] - this.baseTipY) * 10 };
  }
}
