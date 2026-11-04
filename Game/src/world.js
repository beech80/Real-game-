// REAL — world loading: GLB levels -> chunked merged static meshes, colliders, ground, sockets.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { enhanceMaterial } from './engine.js';

export const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

/** Load a GLB. Assets ship gzip-compressed (.glb.gz) and are inflated with the browser's native
 *  DecompressionStream — no WebAssembly decoder needed. If the server already inflated it, the gzip
 *  magic bytes are absent and the buffer is parsed directly. */
export async function loadGLB(url, onProgress) {
  // Hosted builds (claude.ai artifacts) only serve text/media types: assets ship as base64 text there.
  const b64 = typeof window !== 'undefined' && window.__REAL_B64 && url.endsWith('.gz');
  if (b64) url = url.replace(/\.gz$/, '.b64.txt');
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`${url}: HTTP ${resp.status}`);
  const total = +resp.headers.get('content-length') || 0;
  const reader = resp.body.getReader(), chunks = [];
  let got = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); got += value.length; if (onProgress && total) onProgress(Math.min(1, got / total)); }
  let buf = new Uint8Array(got); let o = 0; for (const c of chunks) { buf.set(c, o); o += c.length; }
  if (b64) {
    const txt = new TextDecoder().decode(buf), bin = atob(txt.trim());
    buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  }
  if (buf[0] === 0x1f && buf[1] === 0x8b) {
    const ds = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
    buf = new Uint8Array(await new Response(ds).arrayBuffer());
  }
  return new Promise((res, rej) => loader.parse(buf.buffer, '', res, rej));
}

// plan (Blender XY) <-> three
export const P2W = (x, y, h = 0) => new THREE.Vector3(x, h, -y);
export const W2P = (v) => ({ x: v.x, y: -v.z });

/** Merge all static meshes by (material, spatial cell) for low draw calls with useful culling. */
export function mergeStatic(root, textures, cell = 40) {
  root.updateMatrixWorld(true);
  const groups = new Map();
  const lamps = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    const mat = o.material;
    if (!mat.userData.enhanced) { enhanceMaterial(mat, textures); mat.userData.enhanced = true; }
    const g = o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.index) g.setIndex([...Array(g.attributes.position.count).keys()]);
    // quantized (meshopt) attributes -> float for merging
    for (const k of ['position', 'normal', 'uv']) {
      const a = g.attributes[k];
      if (a.isInterleavedBufferAttribute || a.normalized || !(a.array instanceof Float32Array)) {
        const f = new Float32Array(a.count * a.itemSize);
        const get = [a.getX, a.getY, a.getZ, a.getW];
        for (let i = 0; i < a.count; i++) for (let j = 0; j < a.itemSize; j++) f[i * a.itemSize + j] = get[j].call(a, i);
        g.setAttribute(k, new THREE.BufferAttribute(f, a.itemSize));
      }
    }
    // transform AFTER de-quantizing: int16 attributes would clamp world coordinates to [-1, 1]
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(o.matrixWorld);
    g.computeBoundingBox();
    const c = new THREE.Vector3(); g.boundingBox.getCenter(c);
    const key = `${mat.uuid}|${Math.floor(c.x / cell)}|${Math.floor(c.z / cell)}`;
    if (!groups.has(key)) groups.set(key, { mat, geos: [] });
    groups.get(key).geos.push(g);
  });
  const out = new THREE.Group();
  out.name = root.name + '_merged';
  for (const { mat, geos } of groups.values()) {
    const merged = mergeGeometries(geos, false);
    if (!merged) continue;
    merged.computeBoundingSphere();
    const m = new THREE.Mesh(merged, mat);
    const transparent = mat.transparent;
    m.castShadow = !transparent && !/Emit|Glass|Road|Line|Asphalt|Grass|Sidewalk|Lot/.test(mat.name);
    m.receiveShadow = !transparent;
    m.matrixAutoUpdate = false;
    out.add(m);
    if (mat.userData.lamp !== undefined) lamps.push(mat);
  }
  out.userData.lamps = [...new Set(lamps)];
  return out;
}

/** 2D collision world in plan coordinates. */
export class Collision {
  constructor(colliders) {
    this.items = colliders.map((c) => ({ ...c, cos: Math.cos(c.r || 0), sin: Math.sin(c.r || 0) }));
    this.dynamic = [];
  }
  resolve(p, radius) {   // p = {x,y}; mutates
    for (let iter = 0; iter < 2; iter++) {
      for (const c of this.items.concat(this.dynamic)) {
        if (c.t === 'circle') {
          const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy), m = c.r + radius;
          if (d < m && d > 1e-5) { p.x = c.x + dx / d * m; p.y = c.y + dy / d * m; }
        } else {
          const dx = p.x - c.x, dy = p.y - c.y;
          if (Math.abs(dx) > c.hx + c.hy + radius + 1 || Math.abs(dy) > c.hx + c.hy + radius + 1) continue;
          const lx = dx * c.cos + dy * c.sin, ly = -dx * c.sin + dy * c.cos;
          const qx = Math.max(-c.hx, Math.min(c.hx, lx)), qy = Math.max(-c.hy, Math.min(c.hy, ly));
          let ex = lx - qx, ey = ly - qy, d = Math.hypot(ex, ey);
          if (d < radius) {
            let nx, ny, push;
            if (d > 1e-5) { nx = ex / d; ny = ey / d; push = radius - d; }
            else {   // inside: push out along the shallowest axis
              const px = c.hx - Math.abs(lx), py = c.hy - Math.abs(ly);
              if (px < py) { nx = Math.sign(lx) || 1; ny = 0; push = px + radius; } else { nx = 0; ny = Math.sign(ly) || 1; push = py + radius; }
            }
            const nlx = lx + nx * push, nly = ly + ny * push;
            p.x = c.x + nlx * c.cos - nly * c.sin; p.y = c.y + nlx * c.sin + nly * c.cos;
          }
        }
      }
    }
    return p;
  }
}

/** Ground height in the district (roads at 0, everything else raised by curb/lot). */
export function districtGround(x, y, info) {
  const h = info.roads.half, E = info.roads.extent;
  const onRoad = (Math.abs(y) < h && Math.abs(x) < E + 6) || (Math.abs(x) < h && Math.abs(y) < E + 6);
  return onRoad ? 0.0 : 0.13;
}

/** Interaction points from sockets. */
export function buildInteractions(sockets) {
  return sockets.map((s) => ({ ...s, kind: s.n.split('_')[1], key: s.n.replace(/^SOCKET_/, '') }));
}
