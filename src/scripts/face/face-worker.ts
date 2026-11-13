/*
  Draws a 3D scene away from the page, on a canvas the page handed over.
  The renderer is loaded only once the browser has shown it can draw WebGL from a worker.
*/
import type { Kind } from './protocol';

interface Scene {
  frame(params: never): unknown;
}

const scope = self as unknown as {
  postMessage(message: unknown): void;
  onmessage: ((event: MessageEvent) => void) | null;
};

let scene: Scene | null = null;

function canDrawHere(): boolean {
  try {
    const canvas = new OffscreenCanvas(1, 1);
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

async function open(kind: Kind, canvas: OffscreenCanvas, buffer: ArrayBuffer, pixelRatio: number) {
  try {
    const [{ createScene }, { decodeFaceMesh }] = await Promise.all([import('./scenes'), import('./mesh')]);
    scene = createScene(kind, canvas, decodeFaceMesh(buffer), pixelRatio) as Scene;
    scope.postMessage({ type: 'ready' });
  } catch {
    scene = null;
    scope.postMessage({ type: 'fail' });
  }
}

scope.onmessage = (event) => {
  const message = event.data;
  if (message.type === 'probe') {
    scope.postMessage({ type: 'probe', ok: canDrawHere() });
  } else if (message.type === 'open') {
    open(message.kind, message.canvas, message.mesh, message.pixelRatio);
  } else if (message.type === 'frame' && scene) {
    scope.postMessage({ type: 'frame', frame: scene.frame(message.params as never) });
  }
};
