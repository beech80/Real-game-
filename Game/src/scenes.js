// REAL — story spaces built in-engine: The Club (prologue / invitation) and the wilderness (Chapter 1 / epilogue).
import * as THREE from 'three';
import { P2W } from './world.js';

// ---------------------------------------------------------------------------------------- helpers
export function textTexture(lines, { w = 512, h = 256, bg = '#155a2e', fg = '#ffffff', border = '#ffffff', font = 'bold 56px "Barlow Condensed", Arial', arrow = null, wood = false } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  if (wood) {
    g.fillStyle = '#7a5230'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(40,20,5,${Math.random() * 0.25})`; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.bezierCurveTo(w / 3, y + 6, 2 * w / 3, y - 6, w, y); g.stroke(); }
  } else { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = border; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = font;
  const lh = h / (lines.length + (arrow ? 1 : 0) + 0.6);
  lines.forEach((l, i) => g.fillText(l, w / 2, lh * (i + 0.8)));
  if (arrow) { g.font = 'bold 80px Arial'; g.fillText(arrow, w / 2, lh * (lines.length + 0.85)); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function signPost(text, x, y, rot, opts = {}) {
  const g = new THREE.Group();
  const pw = opts.pw || 2.4, ph = opts.ph || 1.2, height = opts.height || 2.4;
  const poleMat = new THREE.MeshStandardMaterial({ color: opts.wood ? 0x5a3a20 : 0x8a8f99, metalness: opts.wood ? 0 : 0.6, roughness: 0.5 });
  for (const dx of opts.twoPoles === false ? [0] : [-pw * 0.35, pw * 0.35]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, height + ph / 2, 8), poleMat);
    p.position.set(dx, (height + ph / 2) / 2, -0.05); g.add(p);
  }
  const tex = textTexture(text, opts);
  const board = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 0.06), [poleMat, poleMat, poleMat, poleMat, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), new THREE.MeshStandardMaterial({ color: 0x3a3f4a })]);
  board.position.y = height; g.add(board);
  g.position.copy(P2W(x, y, 0)); g.rotation.y = rot;
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}
function polyDist(px, py, pts) { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segDist(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return d; }

function ribbon(pts, width, mat, yOff = 0.03, heightFn) {
  // smooth polyline -> strip mesh following the terrain
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, 0, y)), false, 'centripetal');
  const N = Math.max(20, Math.round(curve.getLength() / 2));
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, p = curve.getPoint(t), d = curve.getTangent(t);
    const nx = -d.z, ny = d.x, L = Math.hypot(nx, ny);
    for (const s of [-1, 1]) {
      const x = p.x + nx / L * width / 2 * s, y = p.z + ny / L * width / 2 * s;
      const w = P2W(x, y, (heightFn ? heightFn(x, y) : 0) + yOff);
      pos.push(w.x, w.y, w.z); uv.push(s < 0 ? 0 : 1, t * curve.getLength() / width);
    }
    if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true;
  return { mesh: m, curve };
}

// ---------------------------------------------------------------------------------------- wilderness
export const WILD = {
  start: { x: 0, y: -402 }, fork: { x: 0, y: -330 }, join: { x: 0, y: -128 }, edge: -84,
  road: [[0, -418], [0, -330], [28, -292], [38, -225], [26, -165], [0, -128], [0, -82]],
  trail: [[0, -330], [-14, -282], [-9, -232], [-3, -178], [0, -128]],
  creekY: -250,
  bounds: { x0: -150, x1: 150, y0: -425, y1: -80 },
};

export function wildHeight(x, y) {
  if (y > WILD.edge - 4) return 0.0;
  const dRoad = Math.min(polyDist(x, y, WILD.road), polyDist(x, y, WILD.trail));
  const flat = THREE.MathUtils.smoothstep(dRoad, 5, 22);
  const edgeBlend = THREE.MathUtils.smoothstep(WILD.edge - y, 4, 40);
  const hills = 2.4 * Math.sin(x * 0.045 + 1.3) * Math.cos(y * 0.031) + 4.5 * Math.sin(x * 0.012 - y * 0.009) + 1.2 * Math.sin(x * 0.11) * Math.sin(y * 0.09);
  const bowl = Math.max(0, Math.abs(x) - 60) * 0.12;
  return Math.max(0, (hills + 3.5 + bowl) * flat * edgeBlend);
}

export function buildWilderness(tex) {
  const g = new THREE.Group(); g.name = 'wilderness';
  const W = 300, H = 345, cx = 0, cy = -252.5;
  const geo = new THREE.PlaneGeometry(W, H, 120, 138); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = [];
  const cGrass = new THREE.Color(0x4a7a32), cDry = new THREE.Color(0xa89a52), cField = new THREE.Color(0xc9b062), cDark = new THREE.Color(0x355e26);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + cx, y = -(pos.getZ(i)) + cy;
    const h = wildHeight(x, y);
    const wv = P2W(x, y, h); pos.setXYZ(i, wv.x, wv.y, wv.z);
    // fields: wheat strips east of the road, meadow west, darker in hollows
    const strip = (Math.floor((x + 300) / 9) % 3 === 0) && x > 45 && y < -150 && y > -380;
    const c = strip ? cField.clone() : cGrass.clone().lerp(cDry, THREE.MathUtils.clamp(0.5 + 0.5 * Math.sin(x * 0.05 + y * 0.03), 0, 1) * 0.45);
    c.lerp(cDark, THREE.MathUtils.clamp(0.3 - h * 0.05, 0, 0.3));
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * W / 2, uv.getY(i) * H / 2);
  const grassTex = tex.grass.clone(); grassTex.needsUpdate = true; grassTex.repeat.set(1, 1);
  const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map: grassTex, roughness: 0.95 }));
  terrain.receiveShadow = true; g.add(terrain);

  const asphalt = new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.95, map: tex.asphalt });
  const dirt = new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 1 });
  const road = ribbon(WILD.road, 6.5, asphalt, 0.04, wildHeight); g.add(road.mesh);
  const line = ribbon(WILD.road, 0.18, new THREE.MeshStandardMaterial({ color: 0xc9a43a, roughness: 0.8 }), 0.055, wildHeight); g.add(line.mesh);
  const trail = ribbon(WILD.trail, 2.2, dirt, 0.05, wildHeight); g.add(trail.mesh);
  // creek across the trail
  const creek = new THREE.Mesh(new THREE.PlaneGeometry(90, 3.2), new THREE.MeshStandardMaterial({ color: 0x3a6f8f, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.85 }));
  creek.rotation.x = -Math.PI / 2; creek.position.copy(P2W(-40, WILD.creekY, 0.08)); g.add(creek);
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8f8d86, roughness: 0.9 });
  for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.25, 8), stoneMat); s.position.copy(P2W(-9.6 + i * 0.3, WILD.creekY - 1.2 + i * 0.8, 0.12)); s.castShadow = true; g.add(s); }

  const colliders = [];
  // fences along Route 1
  const postGeo = new THREE.BoxGeometry(0.12, 1.1, 0.12), railGeo = new THREE.BoxGeometry(0.06, 0.08, 4);
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6e5236, roughness: 0.9 });
  const posts = new THREE.InstancedMesh(postGeo, woodMat, 260), rails = new THREE.InstancedMesh(railGeo, woodMat, 520);
  let np = 0, nr = 0; const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1);
  for (let t = 0.02; t < 0.92 && np < 256; t += 0.0075) {
    const p = road.curve.getPoint(t), d = road.curve.getTangent(t), nx = -d.z, ny = d.x, L = Math.hypot(nx, ny);
    for (const s of [-1, 1]) {
      const x = p.x + nx / L * 5.2 * s, y = p.z + ny / L * 5.2 * s, h = wildHeight(x, y);
      const ang = Math.atan2(d.x, -d.z);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), ang);
      m.compose(P2W(x, y, h + 0.55), q, sc); posts.setMatrixAt(np++, m);
      for (const hh of [0.45, 0.85]) { m.compose(P2W(x, y, h + hh), q, sc); if (nr < 520) rails.setMatrixAt(nr++, m); }
    }
  }
  posts.count = np; rails.count = nr; posts.castShadow = rails.castShadow = true; g.add(posts, rails);
  // power poles along the road
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a3626, roughness: 0.9 });
  for (let t = 0.05; t < 0.95; t += 0.06) {
    const p = road.curve.getPoint(t), d = road.curve.getTangent(t), nx = -d.z, ny = d.x, L = Math.hypot(nx, ny);
    const x = p.x + nx / L * 8, y = p.z + ny / L * 8, h = wildHeight(x, y);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 8, 8), poleMat); pole.position.copy(P2W(x, y, h + 4)); pole.castShadow = true; g.add(pole);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2, 0.12, 0.12), poleMat); bar.position.copy(P2W(x, y, h + 7.6)); bar.rotation.y = Math.atan2(d.x, -d.z) + Math.PI / 2; g.add(bar);
    colliders.push({ t: 'circle', x, y, r: 0.3, n: 'pole' });
  }
  // trees and rocks scattered away from the paths
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 3, 7), crownGeo = new THREE.IcosahedronGeometry(2.1, 1), rockGeo = new THREE.DodecahedronGeometry(0.8, 0);
  const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ color: 0x5a3e28, roughness: 0.9 }), 180);
  const crowns = new THREE.InstancedMesh(crownGeo, new THREE.MeshStandardMaterial({ color: 0x3f6f2e, roughness: 0.85, flatShading: true }), 180);
  const rocks = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({ color: 0x8a8780, roughness: 0.95, flatShading: true }), 80);
  let nt = 0, nk = 0; let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 900 && (nt < 180 || nk < 80); i++) {
    const x = -140 + rnd() * 280, y = -420 + rnd() * 320;
    const dr = Math.min(polyDist(x, y, WILD.road), polyDist(x, y, WILD.trail));
    if (dr < 9 || Math.abs(y - WILD.creekY) < 3) continue;
    const h = wildHeight(x, y), s = 0.7 + rnd() * 0.8;
    if (rnd() < 0.72 && nt < 180) {
      m.compose(P2W(x, y, h + 1.5 * s), q.identity(), new THREE.Vector3(s, s, s)); trunks.setMatrixAt(nt, m);
      m.compose(P2W(x, y, h + 3.6 * s), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * 6), new THREE.Vector3(s, s * 0.9, s)); crowns.setMatrixAt(nt, m); nt++;
      colliders.push({ t: 'circle', x, y, r: 0.35 * s, n: 'tree' });
    } else if (nk < 80) {
      m.compose(P2W(x, y, h + 0.3), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * 6), new THREE.Vector3(s, s * 0.7, s)); rocks.setMatrixAt(nk++, m);
      colliders.push({ t: 'circle', x, y, r: 0.7 * s, n: 'rock' });
    }
  }
  trunks.count = crowns.count = nt; rocks.count = nk;
  for (const im of [trunks, crowns, rocks]) { im.castShadow = true; im.receiveShadow = true; g.add(im); }
  // a lonely barn in the fields
  const barn = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0x8e2a1e, roughness: 0.85 });
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 14), red); b1.position.y = 3; barn.add(b1);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.6, 14.4, 3, 1), new THREE.MeshStandardMaterial({ color: 0x3a3a3e, roughness: 0.7 }));
  roof.rotation.x = Math.PI / 2; roof.rotation.y = Math.PI / 2; roof.position.y = 7.4; roof.scale.set(1, 1, 0.6); barn.add(roof);
  barn.position.copy(P2W(92, -300, wildHeight(92, -300))); barn.rotation.y = 0.4; barn.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.add(barn); colliders.push({ t: 'box', x: 92, y: -300, hx: 5.5, hy: 7.5, r: 0.4, n: 'barn' });

  // signs — the first educational interactions
  const signs = [
    { key: 'sign_start', ...WILD.start, x: 4.6, y: -388, rot: 0, text: ['STARTING DISTRICT', 'AHEAD'], arrow: '↑', q: 'Which way is the Starting District?', a: 'Straight ahead (north)', o: ['Straight ahead (north)', 'Back the way I came', 'Into the fields', 'There is no city'], skill: 'read.signs' },
    { key: 'sign_fork', x: 4.5, y: -337, rot: 0, text: ['ROUTE 1 → STARTING DISTRICT', 'PUBLIC ROAD · 3 KM'], arrow: '↗', q: 'Route 1 is longer but marked. The trail is shorter but unmarked. What do you notice?', a: 'The road has signs and fences; the trail has a creek and no signs', o: ['The road has signs and fences; the trail has a creek and no signs', 'Both are exactly the same', 'Neither goes anywhere'], skill: 'think.observe', opts: { pw: 3.2 } },
    { key: 'sign_trail', x: -5, y: -336, rot: 0.5, text: ['OLD FIELD TRAIL', 'NO SERVICES'], wood: true, q: 'What does “No services” tell you about the trail?', a: 'There are no shops, help or water along it', o: ['There are no shops, help or water along it', 'It is closed', 'It is a shortcut with a bus'], skill: 'read.vocab', opts: { wood: true, pw: 2, twoPoles: false, fg: '#f4e2c0' } },
    { key: 'sign_km', x: 33, y: -230, rot: -0.3, text: ['STARTING DISTRICT', '1 KM'], arrow: '↑', q: 'The sign says 1 km. Walking about 1 km takes most people…', a: 'About 12 to 15 minutes', o: ['About 12 to 15 minutes', 'About 2 hours', 'About 10 seconds'], skill: 'read.signs' },
    { key: 'sign_welcome', x: 7, y: -96, rot: 0, text: ['WELCOME TO THE', 'STARTING DISTRICT'], bg: '#13214a', border: '#e9a93a', fg: '#ffd27a', q: null },
  ];
  for (const s of signs) {
    const post = signPost(s.text, s.x, s.y, s.rot, { arrow: s.arrow, bg: s.bg, border: s.border, fg: s.fg, wood: s.wood, ...(s.opts || {}) });
    post.position.y = wildHeight(s.x, s.y);
    g.add(post); colliders.push({ t: 'circle', x: s.x, y: s.y, r: 0.4, n: 'sign' });
  }
  return { group: g, colliders, signs };
}

// ---------------------------------------------------------------------------------------- The Club (prologue + invitation)
// Built 2 km north of the city (plan y ≈ 2000), its own space.
export const CLUB = { ox: 0, oy: 2000, hallStart: { x: 0, y: 2026 }, councilDoor: { x: 0, y: 2052 }, seat: { x: 0, y: 2060 }, rep: { x: 0, y: 2066 }, gateOut: { x: 0, y: 1978 } };

export function buildClub(tex) {
  const g = new THREE.Group(); g.name = 'club';
  const { ox, oy } = CLUB;
  const marbleC = document.createElement('canvas'); marbleC.width = marbleC.height = 256; const mg = marbleC.getContext('2d');
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { mg.fillStyle = (i + j) % 2 ? '#e9e3d8' : '#cfc6b6'; mg.fillRect(i * 128, j * 128, 128, 128); }
  for (let k = 0; k < 60; k++) { mg.strokeStyle = `rgba(120,110,100,${Math.random() * 0.25})`; mg.beginPath(); mg.moveTo(Math.random() * 256, Math.random() * 256); mg.bezierCurveTo(Math.random() * 256, Math.random() * 256, Math.random() * 256, Math.random() * 256, Math.random() * 256, Math.random() * 256); mg.stroke(); }
  const marble = new THREE.CanvasTexture(marbleC); marble.wrapS = marble.wrapT = THREE.RepeatWrapping; marble.repeat.set(10, 18); marble.colorSpace = THREE.SRGBColorSpace;
  const floorM = new THREE.MeshStandardMaterial({ map: marble, roughness: 0.18, metalness: 0.05 });
  const wallM = new THREE.MeshStandardMaterial({ color: 0xefe6d6, roughness: 0.6 });
  const goldM = new THREE.MeshStandardMaterial({ color: 0xe0a83a, metalness: 1, roughness: 0.25 });
  const navyM = new THREE.MeshStandardMaterial({ color: 0x14204a, roughness: 0.5 });
  const carpetM = new THREE.MeshStandardMaterial({ color: 0x5a1020, roughness: 0.9 });
  const add = (geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.copy(P2W(ox + x, oy + y, z)); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  const colliders = [];
  const wall = (x0, y0, x1, y1, h = 12) => { const L = Math.hypot(x1 - x0, y1 - y0); const m = add(new THREE.BoxGeometry(L, h, 0.6), wallM, (x0 + x1) / 2, (y0 + y1) / 2, h / 2, -Math.atan2(y1 - y0, x1 - x0)); colliders.push({ t: 'box', x: ox + (x0 + x1) / 2, y: oy + (y0 + y1) / 2, hx: L / 2, hy: 0.3, r: Math.atan2(y1 - y0, x1 - x0), n: 'clubwall' }); return m; };
  // grand hall 36 x 56 (y 0..56), council room y 56..74
  add(new THREE.BoxGeometry(36, 0.2, 76), floorM, 0, 37, -0.1);
  add(new THREE.BoxGeometry(36, 0.3, 76), wallM, 0, 37, 12.2);
  add(new THREE.BoxGeometry(3.2, 0.03, 52), carpetM, 0, 28, 0.02);
  wall(-18, 0, -18, 74); wall(18, 0, 18, 74); wall(-18, 74, 18, 74);
  wall(-18, 0, -3, 0); wall(3, 0, 18, 0);
  wall(-18, 56, -2.2, 56); wall(2.2, 56, 18, 56);
  add(new THREE.BoxGeometry(4.4, 4, 0.7), wallM, 0, 56, 10);
  // council doors (gold), grand entrance
  for (const s of [-1, 1]) { add(new THREE.BoxGeometry(2.1, 5.8, 0.15), goldM, s * 1.1, 56, 2.9); }
  // columns with gold capitals, gold trim, chandeliers, banners
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) {
    const y = 6 + i * 8.6;
    add(new THREE.CylinderGeometry(0.55, 0.65, 11, 16), wallM, s * 9, y, 5.5);
    add(new THREE.BoxGeometry(1.6, 0.5, 1.6), goldM, s * 9, y, 11.1);
    add(new THREE.BoxGeometry(1.5, 0.3, 1.5), goldM, s * 9, y, 0.15);
    colliders.push({ t: 'circle', x: ox + s * 9, y: oy + y, r: 0.7, n: 'column' });
  }
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.1, 0.25, 74), goldM, s * 17.6, 37, 9);
  const lampM = new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffd890, emissiveIntensity: 3 });
  for (let i = 0; i < 4; i++) {
    const y = 9 + i * 13;
    add(new THREE.SphereGeometry(1.0, 16, 10), lampM, 0, y, 9.5);
    add(new THREE.TorusGeometry(1.6, 0.08, 8, 24), goldM, 0, y, 9.5).rotation.x = Math.PI / 2;
    const l = new THREE.PointLight(0xffd9a0, 140, 30, 1.8); l.position.copy(P2W(ox, oy + y, 9)); g.add(l);
  }
  const crownTex = textTexture(['♛', 'THE CLUB'], { w: 256, h: 512, bg: '#14204a', border: '#e0a83a', fg: '#e0a83a', font: 'bold 64px "Barlow Condensed", Arial' });
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
    const b = add(new THREE.PlaneGeometry(2.4, 4.8), new THREE.MeshStandardMaterial({ map: crownTex, roughness: 0.7, side: THREE.DoubleSide }), s * 17.6, 10 + i * 13, 7, s > 0 ? -Math.PI / 2 : Math.PI / 2);
  }
  // lounge furniture
  const sofaM = new THREE.MeshStandardMaterial({ color: 0x1d2a5c, roughness: 0.8 });
  for (const [x, y] of [[-13, 14], [13, 14], [-13, 34], [13, 34]]) {
    add(new THREE.BoxGeometry(4, 0.8, 1.4), sofaM, x, y, 0.4); add(new THREE.BoxGeometry(1.6, 0.6, 1.6), goldM, x, y + 2.2, 0.3);
    colliders.push({ t: 'box', x: ox + x, y: oy + y + 1, hx: 2.2, hy: 1.8, r: 0, n: 'sofa' });
  }
  // council room: long table and the representative's chair
  add(new THREE.BoxGeometry(10, 0.15, 3), new THREE.MeshStandardMaterial({ color: 0x3a2214, roughness: 0.4 }), 0, 64, 0.85);
  add(new THREE.BoxGeometry(9.6, 0.8, 2.6), new THREE.MeshStandardMaterial({ color: 0x2a180e, roughness: 0.5 }), 0, 64, 0.4);
  add(new THREE.BoxGeometry(1.4, 3.2, 0.3), navyM, 0, 67.5, 1.6);
  colliders.push({ t: 'box', x: ox, y: oy + 64, hx: 5.2, hy: 1.7, r: 0, n: 'table' });
  const sealTex = textTexture(['♛'], { w: 512, h: 512, bg: '#14204a', border: '#e0a83a', fg: '#e0a83a', font: 'bold 300px Arial' });
  add(new THREE.PlaneGeometry(5, 5), new THREE.MeshStandardMaterial({ map: sealTex, roughness: 0.6 }), 0, 73.6, 6, Math.PI);
  // outside: plaza, gardens, gates, facade, cars
  add(new THREE.BoxGeometry(80, 0.2, 60), floorM, 0, -26, -0.12);
  const hedgeM = new THREE.MeshStandardMaterial({ color: 0x2f5e2a, roughness: 0.9 });
  for (const s of [-1, 1]) { add(new THREE.BoxGeometry(14, 1.4, 1.2), hedgeM, s * 11, -8, 0.7); add(new THREE.BoxGeometry(1.2, 1.4, 16), hedgeM, s * 4.5, -16, 0.7); }
  add(new THREE.CylinderGeometry(2.6, 3, 0.8, 24), wallM, 0, -14, 0.4); add(new THREE.CylinderGeometry(0.5, 0.6, 2.6, 12), goldM, 0, -14, 1.6);
  // facade over the hall entrance
  add(new THREE.BoxGeometry(44, 18, 1), wallM, 0, -0.6, 9);
  for (let i = 0; i < 8; i++) add(new THREE.CylinderGeometry(0.6, 0.7, 12, 16), wallM, -17.5 + i * 5, -2.5, 6);
  add(new THREE.BoxGeometry(44, 1.2, 4), goldM, 0, -2, 12.5);
  add(new THREE.SphereGeometry(7, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), goldM, 0, 20, 12.2);
  // gates (animated)
  const gate = new THREE.Group(); gate.userData.halves = [];
  for (const s of [-1, 1]) {
    const half = new THREE.Group();
    for (let k = 0; k < 9; k++) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.2, 8), goldM); bar.position.set(s * (0.25 + k * 0.42), 2.1, 0); bar.castShadow = true; half.add(bar); }
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.18, 0.12), goldM); top.position.set(s * 1.9, 4.1, 0); half.add(top);
    const crest = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 8, 20), goldM); crest.position.set(s * 1.9, 2.6, 0); half.add(crest);
    gate.add(half); gate.userData.halves.push({ half, s });
  }
  for (const s of [-1, 1]) { const pillar = new THREE.Mesh(new THREE.BoxGeometry(1, 5.2, 1), wallM); pillar.position.set(s * 4.4, 2.6, 0); pillar.castShadow = true; gate.add(pillar); const cap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), goldM); cap.position.set(s * 4.4, 5.5, 0); gate.add(cap); }
  gate.position.copy(P2W(ox, oy - 22, 0));
  g.add(gate);
  for (const s of [-1, 1]) { add(new THREE.BoxGeometry(26, 3.4, 0.6), wallM, s * 17.6, -22, 1.7); }
  return { group: g, colliders, gate, bounds: [ox - 17, oy - 40, ox + 17, oy + 73] };
}

export function setGate(gate, open01) {
  for (const { half, s } of gate.userData.halves) half.position.x = s * open01 * 3.6;
}
