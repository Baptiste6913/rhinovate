/**
 * Demo face mesh: the MediaPipe canonical face model (Apache License 2.0),
 * Loop-subdivided twice and packed into public/models/face-mesh.bin.
 *
 * Layout (little endian):
 *   "RHFM" | u32 version | u32 vertexCount | u32 triangleCount | u32 midlineCount
 *   f32[3] min | f32[3] max
 *   i16[vertexCount * 3]   positions, quantised between min and max (centimetres)
 *   u16[triangleCount * 3] indices
 *   u8[vertexCount]        edge fade (0 at the mask border, 255 inside)
 *   u8[vertexCount]        cavity (0..255 maps to -1..1, positive is concave)
 *   u16[midlineCount]      midline vertex indices, sorted top to bottom
 */
export interface FaceMesh {
  count: number;
  positions: Float32Array;
  indices: Uint16Array;
  fade: Float32Array;
  cavity: Float32Array;
  midline: Uint16Array;
}

let pending: Promise<FaceMesh> | null = null;

export function loadFaceMesh(url = '/models/face-mesh.bin'): Promise<FaceMesh> {
  if (!pending) {
    pending = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Face mesh request failed with status ${res.status}`);
        return res.arrayBuffer();
      })
      .then(decode);
  }
  return pending;
}

function decode(buffer: ArrayBuffer): FaceMesh {
  const view = new DataView(buffer);
  const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (magic !== 'RHFM') throw new Error('Unexpected face mesh format');
  const count = view.getUint32(8, true);
  const triangles = view.getUint32(12, true);
  const midCount = view.getUint32(16, true);
  const min = [view.getFloat32(20, true), view.getFloat32(24, true), view.getFloat32(28, true)];
  const max = [view.getFloat32(32, true), view.getFloat32(36, true), view.getFloat32(40, true)];

  let offset = 44;
  const quantised = new Int16Array(buffer.slice(offset, offset + count * 6));
  offset += count * 6;
  const indices = new Uint16Array(buffer.slice(offset, offset + triangles * 6));
  offset += triangles * 6;
  const fadeBytes = new Uint8Array(buffer, offset, count);
  offset += count;
  const cavityBytes = new Uint8Array(buffer, offset, count);
  offset += count;
  const midline = new Uint16Array(buffer.slice(offset, offset + midCount * 2));

  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    const k = i % 3;
    positions[i] = min[k] + ((quantised[i] + 32768) / 65535) * (max[k] - min[k]);
  }
  const fade = new Float32Array(count);
  const cavity = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    fade[i] = fadeBytes[i] / 255;
    cavity[i] = cavityBytes[i] / 127.5 - 1;
  }
  return { count, positions, indices, fade, cavity, midline };
}
