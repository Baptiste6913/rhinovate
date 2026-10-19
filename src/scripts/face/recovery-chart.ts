import { bruising, dayToPosition, positionToDay, swelling } from './healing-model';

const NS = 'http://www.w3.org/2000/svg';
const SWELL = '#cc6a50';
const BRUISE = '#8250a8';
const GRID = '#e4e9ed';
const INK_2 = '#55636e';
/** Horizontal inset, matching the slider track under the chart. */
const INSET = 10;

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  parent?.appendChild(n);
  return n;
}

/**
 * Swelling and bruising forecast from the healing model, on the same time axis as the
 * stage slider (stages evenly spaced, log time in between). Dragging on it scrubs the day.
 */
export class RecoveryChart {
  private width = 0;
  private height = 132;
  private top = 18;
  private bottom = 112;
  private day = 7;
  private tau: number | undefined;
  private cursor?: { line: SVGLineElement; s: SVGCircleElement; b: SVGCircleElement };

  constructor(private svg: SVGSVGElement, private onScrub: (day: number) => void) {
    new ResizeObserver(() => this.draw()).observe(svg);
    let dragging = false;
    const scrub = (e: PointerEvent) => {
      const r = svg.getBoundingClientRect();
      const p = (e.clientX - r.left - INSET) / Math.max(1, r.width - 2 * INSET);
      this.onScrub(positionToDay(Math.min(1, Math.max(0, p))));
    };
    svg.addEventListener('pointerdown', (e) => {
      dragging = true;
      svg.setPointerCapture?.(e.pointerId);
      scrub(e);
    });
    svg.addEventListener('pointermove', (e) => dragging && scrub(e));
    svg.addEventListener('pointerup', () => (dragging = false));
    svg.addEventListener('pointercancel', () => (dragging = false));
    this.draw();
  }

  private x(day: number) {
    return INSET + dayToPosition(day) * (this.width - 2 * INSET);
  }
  private y(v: number) {
    return this.bottom - v * (this.bottom - this.top);
  }

  draw() {
    const w = Math.round(this.svg.getBoundingClientRect().width);
    if (!w) return;
    this.width = w;
    const svg = this.svg;
    svg.setAttribute('viewBox', `0 0 ${w} ${this.height}`);
    svg.setAttribute('height', String(this.height));
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    for (const v of [0, 0.5, 1]) {
      el('line', { x1: INSET, x2: w - INSET, y1: this.y(v), y2: this.y(v), stroke: GRID, 'stroke-width': 1 }, svg);
    }
    const label = (text: string, v: number) => {
      const t = el('text', { x: w - INSET, y: this.y(v) - 5, fill: INK_2, 'font-size': 11, 'text-anchor': 'end' }, svg);
      t.textContent = text;
    };
    label('Peak', 1);
    label('Half of peak', 0.5);

    const samples = 160;
    const pts = (f: (d: number) => number) => {
      const out: string[] = [];
      for (let i = 0; i <= samples; i++) {
        const d = positionToDay(i / samples);
        out.push(`${(INSET + (i / samples) * (w - 2 * INSET)).toFixed(1)},${this.y(f(d)).toFixed(1)}`);
      }
      return out;
    };
    const s = pts((d) => swelling(d, this.tau));
    el('path', { d: `M${INSET},${this.bottom} L${s.join(' L')} L${w - INSET},${this.bottom} Z`, fill: SWELL, 'fill-opacity': 0.1, stroke: 'none' }, svg);
    el('path', { d: `M${s.join(' L')}`, fill: 'none', stroke: SWELL, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
    const b = pts(bruising);
    el('path', { d: `M${b.join(' L')}`, fill: 'none', stroke: BRUISE, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);

    const line = el('line', { y1: this.top - 6, y2: this.bottom, stroke: '#1a2732', 'stroke-width': 1 }, svg);
    const ring = { stroke: '#ffffff', 'stroke-width': 2, r: 4.5 };
    const sDot = el('circle', { ...ring, fill: SWELL }, svg);
    const bDot = el('circle', { ...ring, fill: BRUISE }, svg);
    this.cursor = { line, s: sDot, b: bDot };
    this.setDay(this.day);
  }

  /** Slow-phase time constant of swelling, which depends on skin thickness. */
  setSkin(tau: number) {
    this.tau = tau;
    this.draw();
  }

  setDay(day: number) {
    this.day = day;
    if (!this.cursor || !this.width) return;
    const x = this.x(day);
    this.cursor.line.setAttribute('x1', x.toFixed(1));
    this.cursor.line.setAttribute('x2', x.toFixed(1));
    this.cursor.s.setAttribute('cx', x.toFixed(1));
    this.cursor.s.setAttribute('cy', this.y(swelling(day, this.tau)).toFixed(1));
    this.cursor.b.setAttribute('cx', x.toFixed(1));
    this.cursor.b.setAttribute('cy', this.y(bruising(day)).toFixed(1));
    this.cursor.b.style.display = bruising(day) < 0.02 ? 'none' : '';
  }
}
