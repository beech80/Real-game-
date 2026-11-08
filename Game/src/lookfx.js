// REAL — look upgrade: cheap shader touches that make the world read richer on phones.
//  * ground and walls: large-scale colour variation in world space (no more obvious 1 m tiling)
//  * trees: per-tree hue, darker undersides
//  * glass: sky reflection with a fresnel edge
//  * characters: soft rim light (warm by day, cool at night) and a thin ink outline (medium/high quality)
//  * parks: instanced grass tufts and flowers that sway in the wind
import * as THREE from 'three';

export const LOOK = {
  time: { value: 0 }, rimCol: { value: new THREE.Color(0xffe2c0) }, rimStr: { value: 0.55 },
  skyTop: { value: new THREE.Color(0x6f9ad8) }, skyMid: { value: new THREE.Color(0xc9dcf0) },
};

export const LK_NOISE = `
float lk_h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float lk_n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(lk_h(i), lk_h(i + vec2(1, 0)), f.x), mix(lk_h(i + vec2(0, 1)), lk_h(i + vec2(1, 1)), f.x), f.y); }
float lk_fbm(vec2 p){ return lk_n(p) * 0.55 + lk_n(p * 2.03 + 7.1) * 0.3 + lk_n(p * 4.1 + 3.3) * 0.15; }
`;

/** Adds world position/normal varyings and a colour tweak after the base colour is read. */
function patch(m, key, colorGLSL, extra = {}) {
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    Object.assign(sh.uniforms, { lkTime: LOOK.time, lkSkyTop: LOOK.skyTop, lkSkyMid: LOOK.skyMid, lkRim: LOOK.rimCol, lkRimStr: LOOK.rimStr });
    sh.vertexShader = 'varying vec3 lkW; varying vec3 lkN; varying vec3 lkO;\n' + sh.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\n  lkW = (modelMatrix * vec4(transformed, 1.0)).xyz;\n  lkN = normalize(mat3(modelMatrix) * objectNormal);\n  lkO = position;');
    sh.fragmentShader = 'varying vec3 lkW; varying vec3 lkN; varying vec3 lkO; uniform float lkTime; uniform vec3 lkSkyTop; uniform vec3 lkSkyMid; uniform vec3 lkRim; uniform float lkRimStr;\n' + LK_NOISE + sh.fragmentShader;
    if (colorGLSL) sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n' + colorGLSL);
    if (extra.emissive) sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + extra.emissive);
    if (extra.out) sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', extra.out + '\n#include <opaque_fragment>');
  };
  const pk = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : () => '';
  m.customProgramCacheKey = () => pk() + '|lk:' + key;
  m.needsUpdate = true;
}

const GROUND = {
  grass: `{ float a = lk_fbm(lkW.xz * 0.06), b = lk_n(lkW.xz * 0.7);
    vec3 dry = vec3(1.16, 1.08, 0.78), lush = vec3(0.78, 0.95, 0.72);
    diffuseColor.rgb *= mix(lush, dry, smoothstep(0.35, 0.8, a)) * (0.88 + 0.22 * b); }`,
  paving: `{ float a = lk_fbm(lkW.xz * 0.12), s = lk_n(lkW.xz * 1.7);
    diffuseColor.rgb *= (0.9 + 0.16 * a) * (1.0 - 0.07 * smoothstep(0.7, 0.95, s)); }`,
  asphalt: `{ float a = lk_fbm(lkW.xz * 0.08), p = lk_n(lkW.xz * 0.9);
    diffuseColor.rgb *= (0.84 + 0.22 * a) * (1.0 - 0.1 * smoothstep(0.75, 0.95, p)); }`,
  wall: `{ float a = lk_fbm(lkW.xz * 0.05 + lkW.y * 0.02), g = smoothstep(0.0, 1.6, lkW.y);
    diffuseColor.rgb *= (0.9 + 0.14 * a) * mix(0.82, 1.0, g); }`,   // per-building tint, darker where walls meet the ground
  leaf: `{ float a = lk_n(floor(lkW.xz * 0.25) + 0.5) , up = lkN.y * 0.5 + 0.5;
    vec3 tint = mix(vec3(0.78, 1.0, 0.82), vec3(1.2, 1.12, 0.66), a);
    float clump = lk_n(lkW.xz * 1.6 + lkW.y * 1.9);
    diffuseColor.rgb *= tint * mix(0.45, 1.2, up * up) * (0.78 + 0.4 * clump); }`,
  bark: `{ diffuseColor.rgb *= 0.85 + 0.25 * lk_n(vec2(lkW.y * 9.0, atan(lkN.z, lkN.x) * 3.0)); }`,
};

/** Called for every world material (from enhanceMaterial). */
export function lookMaterial(m) {
  const n = m.name || '';
  if (m.userData.look || !m.isMeshStandardMaterial) return;
  m.userData.look = true;
  if (/Grass/.test(n)) patch(m, 'grass', GROUND.grass);
  else if (/Sidewalk|Concrete|Paving/.test(n)) patch(m, 'paving', GROUND.paving);
  else if (/Asphalt/.test(n)) patch(m, 'asphalt', GROUND.asphalt);
  else if (/Brick|Plaster/.test(n)) patch(m, 'wall', GROUND.wall);
  else if (/Leaf/.test(n)) patch(m, 'leaf', GROUND.leaf);
  else if (/Bark/.test(n)) patch(m, 'bark', GROUND.bark);
  else if (/Glass$/.test(n)) {
    patch(m, 'glass', null, { out: `{ vec3 V = normalize(vViewPosition); float f = pow(1.0 - abs(dot(V, normal)), 2.0);
      float up = clamp(reflect(-normalize(cameraPosition - lkW), lkN).y * 0.5 + 0.5, 0.0, 1.0);
      vec3 sky = mix(lkSkyMid, lkSkyTop, up) * 0.95;
      float streak = smoothstep(0.45, 0.5, fract((lkW.x + lkW.z) * 0.35 + lkW.y * 0.2)) * 0.12;
      vec2 cell = floor(vec2((lkW.x + lkW.z) / 2.6, lkW.y / 3.1)); float h1 = lk_h(cell), h2 = lk_h(cell + 17.3);
      vec2 inCell = fract(vec2((lkW.x + lkW.z) / 2.6, lkW.y / 3.1));
      vec3 room = mix(vec3(0.05, 0.07, 0.1), vec3(0.75, 0.58, 0.36), smoothstep(0.5, 0.75, h1));          // dark office or warm lamp-lit room
      room = mix(room, room * 0.6 + vec3(0.02), smoothstep(0.0, 0.5, 1.0 - inCell.y) * 0.5);              // floor darker than ceiling
      if (h2 > 0.62) room = mix(room, mix(vec3(0.55, 0.42, 0.36), vec3(0.32, 0.44, 0.5), fract(h2 * 7.0)), step(abs(inCell.x - 0.5), 0.5 - 0.22 * fract(h2 * 3.0)) * 0.85);   // curtains
      float diag = smoothstep(0.0, 0.08, abs(fract((lkW.x + lkW.z) * 0.18 - lkW.y * 0.12) - 0.5) - 0.32) * 0.25;
      outgoingLight = mix(room, sky * (0.85 + diag) + streak, 0.3 + 0.5 * f); diffuseColor.a = max(diffuseColor.a, 0.82); }` });
  }
}

/** Rim light + outline for a character's meshes. */
export function lookCharacter(root) {
  const add = [];
  root.traverse((o) => {
    if (!o.isMesh || !o.material || o.userData.lkOutline) return;
    const m = o.material, n = m.name || '';
    if (/Eye_(Sclera|Iris|Pupil)/.test(n)) { m.roughness = 0.12; m.envMapIntensity = 1.6; }
    if (/Eye_Highlight/.test(n)) { m.emissive = new THREE.Color(0xffffff); m.emissiveIntensity = 0.9; }
    if (/Clothing_Gold|Gold$/.test(n)) { m.metalness = 0.75; m.roughness = 0.32; m.envMapIntensity = 1.4; }
    if (/Clothing|Shoe/.test(n)) m.roughness = Math.max(0.62, m.roughness * 0.92);
    if (!m.userData.lkRim && m.isMeshStandardMaterial && !/Eye|Mouth|Highlight/.test(n)) {
      m.userData.lkRim = true;
      const POP = 'diffuseColor.rgb = mix(vec3(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114))), diffuseColor.rgb, 1.18);';   // bolder: richer colour that reads on a small screen
      const tone = /Fur_/.test(n) ? POP + 'diffuseColor.rgb *= mix(vec3(1.06, 1.0, 0.94), vec3(0.86, 0.85, 0.9), smoothstep(0.25, 1.45, lkO.y));'   // fur: warmer below, deeper on top
        : /Clothing|Shoe/.test(n) ? POP + 'diffuseColor.rgb = max(diffuseColor.rgb, vec3(0.022, 0.022, 0.027)) * (0.94 + 0.12 * lk_n(lkO.xy * 9.0 + lkO.z * 5.0));' : '';   // charcoal, never flat black; soft fabric variation
      patch(m, 'rim' + (tone ? (/Fur_/.test(n) ? 'F' : 'C') : ''), tone || null, { emissive: `{ float r = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.5); totalEmissiveRadiance += lkRim * r * lkRimStr * (0.6 + 0.4 * diffuseColor.r); }` });
    }
    if (o.isSkinnedMesh && /Body|Head|Jacket|Pants|Tail|Hands|Shoes/.test(o.name)) add.push(o);
  });
  if (!root.getObjectByName('LK_contact')) {
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), CONTACT()); blob.name = 'LK_contact';
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.012; blob.renderOrder = 1; blob.userData.lkOutline = true; root.add(blob);
  }
  for (const o of add) {
    const ol = new THREE.SkinnedMesh(o.geometry, OUTLINE());
    ol.bind(o.skeleton, o.bindMatrix);
    if (o.morphTargetInfluences) { ol.morphTargetInfluences = o.morphTargetInfluences; ol.morphTargetDictionary = o.morphTargetDictionary; }
    ol.frustumCulled = false; ol.castShadow = false; ol.receiveShadow = false; ol.userData.lkOutline = true; ol.name = o.name + '_outline';
    o.parent.add(ol); ol.position.copy(o.position); ol.quaternion.copy(o.quaternion); ol.scale.copy(o.scale);
  }
}
/** Bolder buildings: thin ink lines on the corners and edges of walls, roofs, trim and signs, so every building reads
 *  like a clear illustration from far away. Ground, glass, plants and small props are left alone. */
let inkMat = null;
const INK_OK = /Brick|Plaster|Concrete|Navy|Teal|Red$|Cream|White$|Wood|FreshMartGreen|Gold$|Metal|Tile|Roof|Wall|Trim|Awning/i;
const INK_SKIP = /Asphalt|Sidewalk|Grass|Road|Glass|Leaf|Bark|Emit|Food|Pack|Rubber|Fabric|Lamp|Screen|Sign/i;
export function inkEdges(group, { angle = 30, maxTris = 60000 } = {}) {
  if (!group) return 0;
  if (!inkMat) { inkMat = new THREE.LineBasicMaterial({ color: 0x241c2c, transparent: true, opacity: 0.55, depthWrite: false }); inkMat.visible = lkQuality !== 'low'; }
  let n = 0; const list = [];
  group.traverse((o) => { if (o.isMesh && !o.isSkinnedMesh && !o.userData.lkInk && o.geometry && o.material && !Array.isArray(o.material)) { const nm = o.material.name || ''; if (INK_OK.test(nm) && !INK_SKIP.test(nm)) list.push(o); } });
  for (const o of list) {
    const g = o.geometry, tris = (g.index ? g.index.count : g.attributes.position.count) / 3;
    if (tris > maxTris) continue;
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(g, angle), inkMat);
    e.userData.lkInk = true; e.renderOrder = 2; e.frustumCulled = o.frustumCulled; e.raycast = () => {};
    o.add(e); o.userData.lkInk = true; n++;
  }
  return n;
}
let contactMat = null;
function CONTACT() {
  if (contactMat) return contactMat;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  contactMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  return contactMat;
}
let outlineMat = null, lkQuality = 'medium';
export function setLookQuality(q) { lkQuality = q; if (outlineMat) outlineMat.visible = q !== 'low'; if (inkMat) inkMat.visible = q !== 'low'; }   // low = weak phones: speed first
function OUTLINE() {
  if (outlineMat) return outlineMat;
  outlineMat = new THREE.MeshBasicMaterial({ color: 0x1a1420, side: THREE.BackSide }); outlineMat.visible = lkQuality !== 'low';
  outlineMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <skinning_vertex>', '#include <skinning_vertex>\n  #ifdef USE_SKINNING\n  transformed += normalize(objectNormal) * 0.017;\n  #endif');
  };
  outlineMat.customProgramCacheKey = () => 'lk-outline';
  return outlineMat;
}

/** Grass tufts and flowers scattered over every grass surface of a (merged, world-space) district group. */
export function scatterFlora(group, { tufts = 3500, flowers = 700, seed = 3 } = {}) {
  let s = seed >>> 0; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const tris = []; let total = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nn = new THREE.Vector3();
  group.updateMatrixWorld(true);
  group.traverse((o) => {
    if (!o.isMesh || !/Grass/.test((o.material && o.material.name) || '')) return;
    const p = o.geometry.attributes.position, idx = o.geometry.index, mw = o.matrixWorld;
    const cnt = idx ? idx.count : p.count;
    for (let i = 0; i < cnt; i += 3) {
      const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
      a.fromBufferAttribute(p, i0).applyMatrix4(mw); b.fromBufferAttribute(p, i1).applyMatrix4(mw); c.fromBufferAttribute(p, i2).applyMatrix4(mw);
      e1.subVectors(b, a); e2.subVectors(c, a); nn.crossVectors(e1, e2); const ar = nn.length() / 2;
      if (ar < 0.05 || Math.abs(nn.y / (ar * 2)) < 0.9) continue;   // flat ground only
      total += ar; tris.push([a.clone(), b.clone(), c.clone(), total]);
    }
  });
  if (!tris.length) return null;
  const cover = new Map(), CELL = 2, ck = (x, z) => Math.floor(x / CELL) + ',' + Math.floor(z / CELL);
  group.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || /Grass|Leaf|Bark/.test((o.material && o.material.name) || '')) return;
    const p = o.geometry.attributes.position, idx = o.geometry.index, mw = o.matrixWorld, cnt = idx ? idx.count : p.count;
    for (let i = 0; i < cnt; i += 3) {
      const A = new THREE.Vector3().fromBufferAttribute(p, idx ? idx.getX(i) : i).applyMatrix4(mw), B = new THREE.Vector3().fromBufferAttribute(p, idx ? idx.getX(i + 1) : i + 1).applyMatrix4(mw), C = new THREE.Vector3().fromBufferAttribute(p, idx ? idx.getX(i + 2) : i + 2).applyMatrix4(mw);
      if (Math.max(A.y, B.y, C.y) > 4) continue;   // roofs and awnings don't cover the lawn
      const t = [A, B, C], x0 = Math.min(A.x, B.x, C.x), x1 = Math.max(A.x, B.x, C.x), z0 = Math.min(A.z, B.z, C.z), z1 = Math.max(A.z, B.z, C.z);
      if ((x1 - x0) * (z1 - z0) < 1e-4) continue;
      for (let x = Math.floor(x0 / CELL); x <= Math.floor(x1 / CELL); x++) for (let z = Math.floor(z0 / CELL); z <= Math.floor(z1 / CELL); z++) { const k = x + ',' + z; if (!cover.has(k)) cover.set(k, []); cover.get(k).push(t); }
    }
  });
  const inTri = (px, pz, [A, B, C]) => { const d = (P, Q, R) => (px - R.x) * (Q.z - R.z) - (Q.x - R.x) * (pz - R.z); const d1 = d(0, A, B), d2 = d(0, B, C), d3 = d(0, C, A); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
  const covered = (p) => (cover.get(ck(p.x, p.z)) || []).some((t) => Math.max(t[0].y, t[1].y, t[2].y) > p.y + 0.01 && inTri(p.x, p.z, t));
  const pick = () => { for (let k = 0; k < 12; k++) { const p = pick1(); if (!covered(p)) return p; } return pick1(); };
  const pick1 = () => { const t = rnd() * total; let lo = 0, hi = tris.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (tris[mid][3] < t) lo = mid + 1; else hi = mid; }
    const [A, B, C] = tris[lo]; let u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    return A.clone().addScaledVector(B.clone().sub(A), u).addScaledVector(C.clone().sub(A), v); };
  const out = new THREE.Group(); out.name = 'LOOK_flora';
  const sway = (m) => { m.onBeforeCompile = (sh) => { sh.uniforms.lkTime = LOOK.time;
    sh.vertexShader = 'uniform float lkTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
      { vec2 ip = instanceMatrix[3].xz; float k = max(position.y, 0.0) * 3.0; transformed.x += sin(lkTime * 1.7 + ip.x * 0.35 + ip.y * 0.2) * 0.05 * k; transformed.z += cos(lkTime * 1.3 + ip.y * 0.3) * 0.03 * k; }
      #endif`); }; m.customProgramCacheKey = () => 'lk-sway'; };
  // a tuft = three crossed blades (tapered triangles)
  const blades = []; for (let i = 0; i < 6; i++) { const ang = i * 2.4, ox = Math.cos(ang * 1.7) * 0.05, oz = Math.sin(ang * 1.3) * 0.05, cx = Math.cos(ang) * 0.012, cz = Math.sin(ang) * 0.012, lean = 0.04 * (i % 3 - 1);
    blades.push(ox - cx, 0, oz - cz, ox + cx, 0, oz + cz, ox + lean, 0.1 + (i % 3) * 0.035, oz + lean * 0.5); }
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(blades, 3)); tg.computeVertexNormals();
  const tn = []; for (let i = 0; i < 18; i++) tn.push(0, 1, 0); tg.setAttribute('normal', new THREE.Float32BufferAttribute(tn, 3));   // lit like the ground
  const tm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, side: THREE.DoubleSide }); sway(tm);
  const T = new THREE.InstancedMesh(tg, tm, tufts); const M = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), col = new THREE.Color();
  for (let i = 0; i < tufts; i++) { const p = pick(); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * 6.28); const k = 0.8 + rnd() * 0.6; sc.set(k, k * (0.7 + rnd() * 0.6), k); M.compose(p, q, sc); T.setMatrixAt(i, M);
    T.setColorAt(i, col.setHSL(0.25 + rnd() * 0.05, 0.5 + rnd() * 0.15, 0.12 + rnd() * 0.07)); }
  T.receiveShadow = true; T.matrixAutoUpdate = false; out.add(T);
  // a flower = a short stem and a little 5-petal head facing up
  const fg = new THREE.CylinderGeometry(0.04, 0.015, 0.02, 5); fg.translate(0, 0.15, 0);
  const sg = new THREE.CylinderGeometry(0.006, 0.006, 0.16, 3); sg.translate(0, 0.08, 0);
  const fm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }); sway(fm);
  const sm = new THREE.MeshStandardMaterial({ color: 0x4f7a32, roughness: 0.9 }); sway(sm);
  const F = new THREE.InstancedMesh(fg, fm, flowers), S = new THREE.InstancedMesh(sg, sm, flowers);
  const PAL = [0xc9a63a, 0xc8c4b4, 0xc4506c, 0x8a68c4, 0xc46a32, 0x5f8cc4];   // kept below the bloom threshold in full sun
  let clump = null, left = 0;
  for (let i = 0; i < flowers; i++) {
    if (left <= 0) { clump = pick(); left = 4 + Math.floor(rnd() * 8); clump.c = PAL[Math.floor(rnd() * PAL.length)]; }   // flowers grow in little patches
    left--; const p = clump.clone().add(new THREE.Vector3((rnd() - 0.5) * 1.4, 0, (rnd() - 0.5) * 1.4)); p.y = clump.y;
    const k = 0.8 + rnd() * 0.5; q.identity(); sc.set(k, k, k); M.compose(p, q, sc); F.setMatrixAt(i, M); S.setMatrixAt(i, M); F.setColorAt(i, col.setHex(clump.c));
  }
  for (const m of [F, S]) { m.matrixAutoUpdate = false; out.add(m); }
  return out;
}

/** Per-frame: wind time, rim colour from the sun, sky colours for glass. */
export function updateLook(engine, dt) {
  LOOK.time.value += dt;
  const U = engine.skyUniforms; if (!U) return; U.ctime.value = LOOK.time.value;
  LOOK.skyTop.value.copy(U.top.value); LOOK.skyMid.value.copy(U.mid.value);
  const day = Math.min(1, engine.sun.intensity / 2.2);
  LOOK.rimCol.value.copy(engine.sun.color).lerp(new THREE.Color(0x9fb8ff), 1 - day);
  LOOK.rimStr.value = 0.5 + 0.45 * day;
}
