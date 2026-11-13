import { decodeFaceMesh, loadFaceMeshBuffer } from './mesh';
import type { Kind } from './protocol';

/*
  The page's side of a 3D scene. The page asks for frames and gets back what to lay over the
  canvas. Where the browser is known to draw WebGL from a worker, the scene runs there and the
  page never loads the renderer. Otherwise the scene runs on the page, as it always did.
*/

export interface FaceLink<P> {
  /** Asks for a frame. While one is being drawn, only the latest request is kept. */
  request(params: P): void;
}

/** How long the worker gets to answer before the page draws the scene itself. */
const WORKER_WAIT_MS = 8000;

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Drawing from a worker was tested on Chromium-based browsers, which are the ones that expose
 * navigator.userAgentData. Other engines keep drawing on the page until they are tested too.
 */
const testedEngine = () => 'userAgentData' in navigator;

/** Starts a worker and keeps it only if it can draw WebGL on a canvas of its own. */
function startWorker(): Promise<Worker | null> {
  if (!testedEngine() || !('Worker' in window) || !('OffscreenCanvas' in window) || !('transferControlToOffscreen' in HTMLCanvasElement.prototype)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL('./face-worker.ts', import.meta.url), { type: 'module' });
    } catch {
      resolve(null);
      return;
    }
    const settle = (ok: boolean) => {
      clearTimeout(timer);
      worker.onmessage = null;
      worker.onerror = null;
      if (ok) {
        resolve(worker);
      } else {
        worker.terminate();
        resolve(null);
      }
    };
    const timer = setTimeout(() => settle(false), WORKER_WAIT_MS);
    worker.onerror = () => settle(false);
    worker.onmessage = (event) => settle(event.data?.type === 'probe' && event.data.ok === true);
    worker.postMessage({ type: 'probe' });
  });
}

function workerLink<P, F>(
  worker: Worker,
  canvas: HTMLCanvasElement,
  kind: Kind,
  mesh: ArrayBuffer,
  onFrame: (frame: F, params: P) => void
): Promise<FaceLink<P> | null> {
  return new Promise((resolve) => {
    let surface: OffscreenCanvas;
    try {
      surface = canvas.transferControlToOffscreen();
    } catch {
      worker.terminate();
      resolve(null);
      return;
    }
    let drawing: P | null = null;
    let waiting: P | null = null;
    const send = (params: P) => {
      drawing = params;
      worker.postMessage({ type: 'frame', params });
    };
    const stop = () => {
      worker.terminate();
      resolve(null);
    };
    worker.onerror = stop;
    worker.onmessage = (event) => {
      const message = event.data;
      if (message.type === 'ready') {
        resolve({
          request(params) {
            if (drawing) waiting = params;
            else send(params);
          }
        });
      } else if (message.type === 'fail') {
        stop();
      } else if (message.type === 'frame' && drawing) {
        const params = drawing;
        drawing = null;
        if (waiting) {
          const next = waiting;
          waiting = null;
          send(next);
        }
        onFrame(message.frame as F, params);
      }
    };
    worker.postMessage({ type: 'open', kind, canvas: surface, mesh, pixelRatio: window.devicePixelRatio || 1 }, [surface, mesh]);
  });
}

/**
 * Opens a scene on a canvas. Resolves to null when the browser cannot draw it, so the caller
 * can show its static fallback.
 */
export async function openFaceLink<P, F>(
  canvas: HTMLCanvasElement,
  kind: Kind,
  onFrame: (frame: F, params: P) => void
): Promise<FaceLink<P> | null> {
  const [buffer, worker] = await Promise.all([loadFaceMeshBuffer(), startWorker()]);
  if (worker) return workerLink(worker, canvas, kind, buffer.slice(0), onFrame);

  if (!webglAvailable()) return null;
  const { createScene } = await import('./scenes');
  const scene = createScene(kind, canvas, decodeFaceMesh(buffer), window.devicePixelRatio || 1) as unknown as { frame(params: P): F };
  return {
    request(params) {
      onFrame(scene.frame(params), params);
    }
  };
}
