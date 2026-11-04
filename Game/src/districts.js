// REAL — Chapter 7 "A bigger world": Midtown, Opportunity District and The Heights.
// Built in-engine from a compact plan (streets, buildings with storefronts and windows, trees, lamps,
// parked cars, a far skyline), then merged by material for phone-friendly draw counts.
import * as THREE from 'three';
import { P2W, mergeStatic } from './world.js';
import { textTexture } from './scenes.js';
import { carMesh } from './city.js';

const rnd = (a, b) => a + Math.random() * (b - a);
let seed = 1; const srand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// Plan: avenue along local x=0 (y -8..128), cross street at y=60 (x -40..40). Buildings start 9 m from centre lines.
export const AVE = { half: 5, walk: 9, y0: -8, y1: 128, crossY: 60, crossX: 40 };

// Building: side W/E, y0..y1 along the avenue, depth, floors, style (brick|glass|stone), key = interaction id
export const DISTRICTS = {
  midtown: {
    name: 'Midtown', ox: 3000, life: 3, fare: 2.75, sky: 0x6a7fa8,
    tag: 'Busy streets, small businesses, skilled jobs.',
    buildings: [
      { key: 'express', side: 'W', y0: -6, y1: 20, depth: 16, floors: 4, style: 'brick', color: 0xb5583c, awning: 0xe8a33a, sign: ['MIDTOWN EXPRESS', 'COURIERS · HIRING'], bg: '#c2362a' },
      { key: 'kitchen', side: 'W', y0: 23, y1: 50, depth: 18, floors: 5, style: 'brick', color: 0xc9a37a, awning: 0x2f8f5a, sign: ['CORNER KITCHEN', 'DINER · LINE COOKS WANTED'], bg: '#1f6b35' },
      { key: 'motors', side: 'E', y0: -6, y1: 24, depth: 20, floors: 2, style: 'stone', color: 0xd9d4c8, awning: 0x2a5bd2, sign: ['MIDTOWN MOTORS', 'VEHICLES · SERVICE'], bg: '#2a5bd2', lot: true },
      { key: 'clinic', side: 'E', y0: 27, y1: 50, depth: 16, floors: 6, style: 'stone', color: 0xe9ecef, awning: 0x2a9fd6, sign: ['CITY CLINIC', 'CARE FOR EVERYONE'], bg: '#2a9fd6' },
      { key: 'thread', side: 'W', y0: 70, y1: 92, depth: 16, floors: 4, style: 'brick', color: 0x8c3b3b, awning: 0x14204a, sign: ['THREAD & CO', 'MIDTOWN FLAGSHIP'], bg: '#14204a' },
      { key: 'lofts', side: 'W', y0: 95, y1: 126, depth: 18, floors: 7, style: 'brick', color: 0x9c6b4e, awning: 0x5a3fd2, sign: ['MIDTOWN LOFTS', 'NOW LEASING'], bg: '#5a3fd2' },
      { key: 'shelter', side: 'E', y0: 70, y1: 90, depth: 14, floors: 3, style: 'brick', color: 0xd8a657, awning: 0xd24f2f, sign: ['PAWS & FRIENDS', 'ANIMAL SHELTER · ADOPT'], bg: '#d24f2f' },
      { key: 'library', side: 'E', y0: 93, y1: 126, depth: 20, floors: 4, style: 'stone', color: 0xcfc6b0, awning: 0x14204a, sign: ['MIDTOWN LIBRARY', 'LEARNING LAB · FREE'], bg: '#3a2a6a' },
    ],
    friends: [{ id: 'Marcus', species: 'Horse', x: 6.5, y: 34, role: 'Courier', outfit: { jacket: 0xc2362a, hoodie: 0x0b0b0e } }, { id: 'Ms. Lindqvist', species: 'Bird', x: -6.5, y: 98, role: 'Librarian', outfit: { jacket: 0x3a2a6a, hoodie: 0xe6dccb } }],
  },
  opportunity: {
    name: 'Opportunity District', ox: 6000, life: 5, fare: 2.75, sky: 0x7d9cc4,
    tag: 'Glass towers, technology, trades and big ideas.',
    buildings: [
      { key: 'logistics', side: 'W', y0: -6, y1: 22, depth: 22, floors: 3, style: 'glass', color: 0x8a8f99, awning: 0xe8a33a, sign: ['OPPORTUNITY LOGISTICS', 'WAREHOUSE · NOW HIRING'], bg: '#e8a33a' },
      { key: 'buildright', side: 'W', y0: 25, y1: 50, depth: 16, floors: 4, style: 'brick', color: 0x7a7f88, awning: 0xe8b23a, sign: ['BUILD RIGHT CO', 'CONSTRUCTION'], bg: '#c48a12' },
      { key: 'tower', side: 'E', y0: -6, y1: 22, depth: 20, floors: 14, style: 'glass', color: 0x2c4a70, awning: 0x2a9fd6, sign: ['OPPORTUNITY TOWER', 'OFFICES · LEDGER & CO'], bg: '#13325a' },
      { key: 'brightline', side: 'E', y0: 25, y1: 50, depth: 18, floors: 11, style: 'glass', color: 0x1d6b74, awning: 0x2fd2b0, sign: ['BRIGHTLINE TECH', 'BUILD THE FUTURE'], bg: '#0f5c5c' },
      { key: 'voltworks', side: 'W', y0: 70, y1: 88, depth: 14, floors: 3, style: 'brick', color: 0x4f5560, awning: 0xe8a33a, sign: ['VOLT WORKS', 'ELECTRICAL'], bg: '#1b1b1f' },
      { key: 'lumen', side: 'W', y0: 91, y1: 108, depth: 14, floors: 4, style: 'stone', color: 0xe6dccb, awning: 0x1b1b1f, sign: ['STUDIO LUMEN', 'PHOTOGRAPHY'], bg: '#1b1b1f' },
      { key: 'thinktank', side: 'W', y0: 111, y1: 126, depth: 16, floors: 3, style: 'glass', color: 0x5a3fd2, awning: 0xe8a33a, sign: ['THE THINK TANK', 'CHALLENGE ZONES'], bg: '#5a3fd2' },
      { key: 'sbc', side: 'E', y0: 70, y1: 96, depth: 18, floors: 6, style: 'glass', color: 0x3a6a4a, awning: 0x2f8f5a, sign: ['SMALL BUSINESS CENTER', 'START SOMETHING'], bg: '#1f6b35' },
      { key: 'bootcamp', side: 'E', y0: 99, y1: 126, depth: 18, floors: 8, style: 'glass', color: 0x34405a, awning: 0x2a5bd2, sign: ['CITY TECH INSTITUTE', 'CODE · TRADES · NIGHT CLASSES'], bg: '#2a5bd2' },
    ],
    friends: [{ id: 'Priya', species: 'Cat', x: 6.5, y: 47, role: 'Developer', outfit: { jacket: 0x0f5c5c, hoodie: 0xe6dccb } }, { id: 'Coach Bo', species: 'Lion', x: -6.5, y: 116, role: 'Challenge coach', outfit: { jacket: 0x5a3fd2, hoodie: 0xe8a33a } }],
  },
  heights: {
    name: 'The Heights', ox: 9000, life: 8, fare: 2.75, sky: 0x9ab4d8,
    tag: 'Professional careers, elegant streets, views over the whole city.',
    buildings: [
      { key: 'college', side: 'W', y0: -6, y1: 28, depth: 22, floors: 5, style: 'stone', color: 0xd8cfb8, awning: 0x5a1020, sign: ['HEIGHTS COLLEGE', 'MEDICINE · LAW · ENGINEERING'], bg: '#5a1020', ornate: true },
      { key: 'medical', side: 'W', y0: 31, y1: 50, depth: 18, floors: 9, style: 'stone', color: 0xeef0f2, awning: 0x2a9fd6, sign: ['HEIGHTS MEDICAL', 'HOSPITAL'], bg: '#2a9fd6' },
      { key: 'engineering', side: 'E', y0: -6, y1: 18, depth: 20, floors: 12, style: 'glass', color: 0x46566e, awning: 0xe8a33a, sign: ['HEIGHTS ENGINEERING'], bg: '#14204a' },
      { key: 'bank', side: 'E', y0: 21, y1: 50, depth: 18, floors: 6, style: 'stone', color: 0xe3d6bb, awning: 0xe8a33a, sign: ['HEIGHTS BANK', 'SAVINGS · INVESTING'], bg: '#14204a', ornate: true },
      { key: 'legal', side: 'W', y0: 70, y1: 94, depth: 18, floors: 8, style: 'stone', color: 0xcbbfa6, awning: 0x14204a, sign: ['HEIGHTS LEGAL', 'ATTORNEYS AT LAW'], bg: '#14204a', ornate: true },
      { key: 'form', side: 'W', y0: 97, y1: 126, depth: 18, floors: 10, style: 'glass', color: 0x6a7480, awning: 0xe6dccb, sign: ['FORM STUDIO', 'ARCHITECTURE'], bg: '#1b1b1f' },
      { key: 'residences', side: 'E', y0: 104, y1: 126, depth: 18, floors: 9, style: 'stone', color: 0xf0e6d2, awning: 0xe8a33a, sign: ['HEIGHTS RESIDENCES', 'HOMES FOR SALE & LEASE'], bg: '#5a1020', ornate: true },
      { key: 'park', side: 'E', y0: 70, y1: 101, depth: 18, park: true },
    ],
    friends: [{ id: 'Dr. Amara', species: 'Elephant', x: -6.5, y: 41, role: 'Doctor', outfit: { jacket: 0xf1f1f1, hoodie: 0x2a9fd6 } }, { id: 'Theo', species: 'Dolphin', x: 6.5, y: 86, role: 'Architect', outfit: { jacket: 0x1b1b1f, hoodie: 0xe8a33a } }],
  },
};

// ------------------------------------------------------------------------------------- geometry helpers
function uvBox(w, h, d) {   // box with metre-scaled planar UVs so tiling textures keep real-world size
  const g = new THREE.BoxGeometry(w, h, d), p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    if (ax > 0.5) uv.setXY(i, p.getZ(i), p.getY(i)); else if (ay > 0.5) uv.setXY(i, p.getX(i), p.getZ(i)); else uv.setXY(i, p.getX(i), p.getY(i));
  }
  return g;
}
const M = {};
function mat(name, color, o = {}) {
  const k = name + color.toString(16);
  if (!M[k]) { M[k] = new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.8, metalness: o.metal ?? 0, emissive: o.emissive ?? 0, emissiveIntensity: o.ei ?? 1 }); M[k].name = name; }
  return M[k];
}
function skylineTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#0d1220'; g.fillRect(0, 0, 64, 128);
  for (let y = 4; y < 128; y += 8) for (let x = 3; x < 64; x += 8) { const lit = srand() < 0.35; g.fillStyle = lit ? `rgba(255,${200 + srand() * 40},${120 + srand() * 60},0.9)` : 'rgba(90,110,140,0.35)'; g.fillRect(x, y, 5, 5); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ------------------------------------------------------------------------------------- builder
export function buildDistrict(id, textures) {
  const D = DISTRICTS[id], ox = D.ox; seed = id.length * 977 + 13;
  const root = new THREE.Group(); root.name = 'district_' + id;
  const loose = new THREE.Group();   // unmerged: signs (unique textures), transparent glass
  const colliders = [], points = [], lamps = [], walk = [[-AVE.walk + 0.35, AVE.y0, AVE.walk - 0.35, AVE.y1], [-AVE.crossX, AVE.crossY - AVE.walk + 0.35, AVE.crossX, AVE.crossY + AVE.walk - 0.35]];
  const add = (geo, m, x, y, z, ry = 0, parent = root) => { const o = new THREE.Mesh(geo, m); o.position.copy(P2W(ox + x, y, z)); o.rotation.y = ry; parent.add(o); return o; };
  const box = (w, d, hgt, m, x, y, z0 = 0, ry = 0, parent) => add(uvBox(w, hgt, d), m, x, y, z0 + hgt / 2, ry, parent);
  const collide = (x, y, hx, hy, n = 'D') => colliders.push({ t: 'box', x: ox + x, y, hx, hy, r: 0, n });

  const asphalt = mat('MAT_D_Asphalt', 0x3a3d44, { rough: 0.95 }), walkM = mat('MAT_D_Sidewalk', 0xb9b4ab), line = mat('MAT_D_RoadLine', 0xe8b23a), white = mat('MAT_D_RoadLineW', 0xe8e8e8);
  const curb = mat('MAT_D_Concrete', 0x9a978f), grass = mat('MAT_D_Grass', 0x4f8a3a, { rough: 0.95 });
  // ground: a big lot, then roads and sidewalks
  box(260, 220, 0.1, mat('MAT_D_Concrete', 0x6c6b68), 0, 60, -0.12);
  box(AVE.half * 2, AVE.y1 - AVE.y0 + 20, 0.02, asphalt, 0, 60, -0.02);
  box(AVE.crossX * 2 + 20, AVE.half * 2, 0.021, asphalt, 0, AVE.crossY, -0.02);
  for (const s of [-1, 1]) {
    box(AVE.walk - AVE.half, AVE.crossY - AVE.half - AVE.y0, 0.13, walkM, s * (AVE.half + AVE.walk) / 2, (AVE.y0 + AVE.crossY - AVE.half) / 2);
    box(AVE.walk - AVE.half, AVE.y1 - AVE.crossY - AVE.half, 0.13, walkM, s * (AVE.half + AVE.walk) / 2, (AVE.y1 + AVE.crossY + AVE.half) / 2);
    for (const dir of [-1, 1]) box(AVE.crossX - AVE.half, AVE.walk - AVE.half, 0.13, walkM, s * (AVE.crossX + AVE.half) / 2, AVE.crossY + dir * (AVE.half + AVE.walk) / 2);
    box(0.18, AVE.y1 - AVE.y0, 0.15, curb, s * AVE.half, 60, 0);
  }
  for (let y = AVE.y0; y < AVE.y1; y += 6) if (Math.abs(y - AVE.crossY) > 8) box(0.15, 3, 0.012, line, 0, y, 0);
  for (let x = -AVE.crossX; x < AVE.crossX; x += 6) if (Math.abs(x) > 8) box(3, 0.15, 0.012, line, x, AVE.crossY, 0);
  for (const cy of [AVE.crossY - 7.2, AVE.crossY + 7.2]) for (let x = -4; x <= 4; x += 1.1) box(0.55, 2.4, 0.013, white, x, cy, 0);
  for (const cx of [-7.2, 7.2]) for (let y = AVE.crossY - 4; y <= AVE.crossY + 4; y += 1.1) box(2.4, 0.55, 0.013, white, cx, y, 0);

  const trunkM = mat('MAT_D_Trunk', 0x5a3d26), leafM = [mat('MAT_D_Leaves', 0x3d7a34, { rough: 0.9 }), mat('MAT_D_Leaves', 0x4f8f3a, { rough: 0.9 }), mat('MAT_D_Leaves', 0x2f6a30, { rough: 0.9 })];
  // buildings
  const glassDark = mat('MAT_D_WinDark', 0x1d2838, { rough: 0.15, metal: 0.6 }), glassLit = mat('MAT_D_WinGlassLit', 0xffe2b0, { emissive: 0xffc27a, ei: 0.9, rough: 0.3 });
  const frame = mat('MAT_D_Frame', 0x2a2d33, { rough: 0.5, metal: 0.4 }), trim = mat('MAT_D_Plaster', 0xe9e3d6), gold = mat('MAT_D_Gold', 0xe0a83a, { metal: 1, rough: 0.3 });
  const shopGlass = new THREE.MeshStandardMaterial({ color: 0x9fc4e0, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.3, depthWrite: false });
  const shopLit = mat('MAT_D_ShopGlassLit', 0xfff1d6, { emissive: 0xffd9a0, ei: 0.55 });
  for (const b of D.buildings) {
    const s = b.side === 'E' ? 1 : -1, len = b.y1 - b.y0, cy = (b.y0 + b.y1) / 2, cx = s * (AVE.walk + b.depth / 2), face = s * AVE.walk;
    if (b.park) { buildPark(b, s, cx, cy, len); continue; }
    const fh = 3.5, gh = 4.4, H = gh + (b.floors - 1) * fh;
    const wallM = b.style === 'brick' ? mat('MAT_D_Brick', b.color, { rough: 0.9 }) : b.style === 'stone' ? mat('MAT_D_Plaster', b.color, { rough: 0.85 }) : mat('MAT_D_Concrete', b.color, { rough: 0.4, metal: 0.3 });
    box(b.depth, len, H, wallM, cx, cy);
    collide(cx, cy, b.depth / 2, len / 2, 'bld_' + b.key);
    // storefront: lit back panel behind glass, frame, door, awning, sign
    box(0.1, len - 2, 3.2, shopLit, face + s * 0.35, cy, 0.2);
    box(0.06, len - 2, 3.2, shopGlass, face - s * 0.02, cy, 0.2, 0, loose);
    for (let y = b.y0 + 1; y <= b.y1 - 1 + 0.01; y += (len - 2) / Math.max(1, Math.round((len - 2) / 4))) box(0.16, 0.14, 3.3, frame, face - s * 0.05, y, 0.15);
    box(0.2, len - 1.6, 0.2, frame, face - s * 0.08, cy, 3.35);
    box(0.14, 2.0, 2.7, mat('MAT_D_Door', 0x1f2228, { rough: 0.4, metal: 0.5 }), face - s * 0.09, cy, 0.13);
    const aw = box(1.2, len - 1, 0.12, mat('MAT_D_Awning', b.awning, { rough: 0.7 }), face - s * 0.6, cy, 3.75);
    aw.rotation.z = -s * 0.25;
    const tex = textTexture(b.sign, { w: 1024, h: 192, bg: b.bg, border: '#ffffff', font: 'bold 64px "Barlow Condensed", Arial' });
    const signM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35 });
    const sw = Math.min(len - 3, 14);
    const sg = add(new THREE.PlaneGeometry(sw, sw * 0.1875), signM, face - s * 0.12, cy, 4.35, s > 0 ? -Math.PI / 2 : Math.PI / 2, loose);
    sg.userData.signMat = signM;
    // upper floors: windows on the street face and the cross-street ends
    if (b.style === 'glass') {
      const glassWall = mat('MAT_D_Curtain', 0x2b3d55, { rough: 0.08, metal: 0.85 });
      box(0.12, len - 0.6, H - gh, glassWall, face - s * 0.04, cy, gh);
      for (let f = 1; f < b.floors; f++) box(0.3, len - 0.4, 0.25, trim, face - s * 0.1, cy, gh + f * fh - 0.25);
      for (let f = 1; f < b.floors; f++) for (let y = b.y0 + 1.5; y < b.y1 - 1; y += 3) if (srand() < 0.3) box(0.05, 2.6, 2.2, glassLit, face - s * 0.11, y + 1.3, gh + (f - 1) * fh + 0.5);
      box(b.depth * 0.6, len * 0.5, 2.5, mat('MAT_D_Concrete', 0x8a8f99), cx, cy, H);
    } else {
      for (let f = 1; f < b.floors; f++) for (let y = b.y0 + 2; y < b.y1 - 1.5; y += 3.2) {
        const lit = srand() < 0.32;
        box(0.12, 1.5, 2.0, lit ? glassLit : glassDark, face - s * 0.03, y + 0.75, gh + (f - 1) * fh + 0.6);
        box(0.25, 1.8, 0.14, trim, face - s * 0.1, y + 0.75, gh + (f - 1) * fh + 0.48);
        if (b.ornate) box(0.3, 1.9, 0.16, trim, face - s * 0.11, y + 0.75, gh + (f - 1) * fh + 2.7);
      }
      box(0.7, len + 0.4, 0.6, b.ornate ? trim : mat('MAT_D_Concrete', 0x77736d), face - s * 0.15, cy, H - 0.6);
      if (b.ornate) box(0.4, len + 0.2, 0.15, gold, face - s * 0.3, cy, 3.95);
      for (let k = 0; k < 2 + srand() * 3; k++) box(2, 2, 1.2, mat('MAT_D_Concrete', 0x8a8f99), cx + rnd(-b.depth / 4, b.depth / 4), cy + rnd(-len / 4, len / 4), H);
    }
    // windows on both end walls too, so corners never look blank
    for (const e of [-1, 1]) {
      const ey = cy + e * (len / 2 + 0.03);
      for (let f = 1; f < b.floors; f++) for (let x = 1.6; x < b.depth - 1.2; x += 3.2) {
        const wx = face + s * x;
        box(1.5, 0.12, 2.0, srand() < 0.3 ? glassLit : glassDark, wx + s * 0.75, ey, gh + (f - 1) * fh + 0.6);
      }
      box(b.depth, 0.2, 0.25, trim, cx, ey, gh - 0.3);
    }
    // the door is the interaction point
    points.push({ key: b.key, x: ox + s * (AVE.walk - 1.3), y: cy, sign: b.sign[0] });
    if (b.lot) for (let k = 0; k < 2; k++) { const cy2 = cy + 5.5 + k * 5.5, car = carMesh([0xd23b2a, 0x2a5bd2][k], false); car.position.copy(P2W(ox + s * (AVE.half + 2.3), cy2, 0.13)); car.userData.dealer = true; loose.add(car); colliders.push({ t: 'box', x: ox + s * (AVE.half + 2.3), y: cy2, hx: 1, hy: 2.2, r: 0, n: 'car' }); }
  }
  function buildPark(b, s, cx, cy, len) {
    box(b.depth + 20, len, 0.14, grass, s * (AVE.walk + (b.depth + 20) / 2), cy);
    walk.push([s > 0 ? AVE.walk - 1 : -AVE.walk - 28, b.y0 + 0.5, s > 0 ? AVE.walk + 28 : -AVE.walk + 1, b.y1 - 0.5]);
    const fx = s * (AVE.walk + 14);
    add(new THREE.CylinderGeometry(4, 4.4, 0.8, 32), trim, fx, cy, 0.4); add(new THREE.CylinderGeometry(3.6, 3.6, 0.1, 32), mat('MAT_D_Water', 0x3f86c4, { rough: 0.05, metal: 0.3 }), fx, cy, 0.78);
    add(new THREE.CylinderGeometry(0.4, 0.6, 2.6, 16), gold, fx, cy, 1.5);
    colliders.push({ t: 'circle', x: ox + fx, y: cy, r: 4.5, n: 'fountain' });
    points.push({ key: 'overlook', x: ox + fx - s * 5.5, y: cy, sign: 'Overlook Park' });
    for (const [dx, dy] of [[-8, -10], [8, -10], [-8, 10], [8, 10], [0, -13], [0, 13]]) tree(fx + dx, cy + dy, 1.3);
    for (const dy of [-6, 6]) { box(0.6, 2.2, 0.45, mat('MAT_D_Wood', 0x7a5230), fx - s * 7, cy + dy, 0.0); points.push({ key: 'bench', x: ox + fx - s * 6.2, y: cy + dy, sign: 'Bench' }); }
    for (const dx of [-12, 12]) box(1.2, len - 2, 1.0, mat('MAT_D_Hedge', 0x2f5e2a, { rough: 0.9 }), fx + dx, cy, 0);
  }
  // trees, lamps, benches along the avenue
  function tree(x, y, sc = 1) {
    add(new THREE.CylinderGeometry(0.12 * sc, 0.18 * sc, 3.6 * sc, 7), trunkM, x, y, 1.8 * sc);
    for (let k = 0; k < 3; k++) add(new THREE.IcosahedronGeometry(rnd(0.9, 1.25) * sc, 1), leafM[k], x + rnd(-0.5, 0.5) * sc, y + rnd(-0.5, 0.5) * sc, (3.9 + k * 0.55) * sc);
    colliders.push({ t: 'circle', x: ox + x, y, r: 0.35 * sc, n: 'tree' });
  }
  const pole = mat('MAT_D_Pole', 0x2a2d33, { metal: 0.6, rough: 0.4 }), lampM = mat('MAT_D_LampEmit', 0xfff0c8, { emissive: 0xffd08a, ei: 2.2 });
  for (const s of [-1, 1]) for (let y = AVE.y0 + 4; y < AVE.y1; y += 16) {
    if (Math.abs(y - AVE.crossY) < 10) continue;
    const x = s * (AVE.half + 0.7);
    add(new THREE.CylinderGeometry(0.07, 0.1, 5.4, 8), pole, x, y, 2.7);
    box(0.9, 0.12, 0.08, pole, x - s * 0.45, y, 5.3); box(0.5, 0.3, 0.14, lampM, x - s * 0.85, y, 5.12);
    lamps.push({ x: ox + x - s * 0.85, y }); colliders.push({ t: 'circle', x: ox + x, y, r: 0.15, n: 'pole' });
    if (id !== 'opportunity' || (y / 16) % 2 < 1) tree(s * (AVE.half + 0.75), y + 8, 0.9);
  }
  // bus stop (south end, east side)
  const shelterM = mat('MAT_D_Frame', 0x2a2d33, { metal: 0.6, rough: 0.4 });
  box(0.12, 4, 2.6, shelterM, AVE.walk - 0.4, 2, 0); box(1.8, 4.4, 0.1, mat('MAT_D_Concrete', 0x2a5bd2), AVE.walk - 1.1, 2, 2.6);
  box(0.5, 3, 0.45, mat('MAT_D_Wood', 0x7a5230), AVE.walk - 0.9, 2, 0);
  const busTex = textTexture(['🚌 BUS', D.name.toUpperCase()], { w: 512, h: 256, bg: '#2a5bd2', font: 'bold 54px "Barlow Condensed", Arial' });
  add(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshStandardMaterial({ map: busTex, emissive: 0xffffff, emissiveMap: busTex, emissiveIntensity: 0.3 }), AVE.walk - 1.95, 0.2, 2.2, 0, loose).rotation.y = Math.PI;
  colliders.push({ t: 'box', x: ox + AVE.walk - 0.4, y: 2, hx: 0.1, hy: 2, r: 0, n: 'shelter' });
  points.push({ key: 'bus', x: ox + AVE.walk - 2.2, y: 1.2, sign: 'Bus stop' });
  // district welcome sign
  const welcome = textTexture(['WELCOME TO', D.name.toUpperCase()], { w: 1024, h: 256, bg: '#14204a', border: '#e8a33a', fg: '#ffffff', font: 'bold 84px "Barlow Condensed", Arial' });
  add(new THREE.PlaneGeometry(7, 1.75), new THREE.MeshStandardMaterial({ map: welcome, emissive: 0xffffff, emissiveMap: welcome, emissiveIntensity: 0.3, side: THREE.DoubleSide }), -AVE.walk + 2, -4, 3.4, Math.PI / 2 + 0.6, loose);
  for (const dy of [-0.8, 0.8]) add(new THREE.CylinderGeometry(0.06, 0.06, 4.2, 8), pole, -AVE.walk + 2 + dy * 0.55, -4 + dy * 0.85, 2.1);
  // benches on the cross street
  for (const s of [-1, 1]) { box(2.2, 0.6, 0.45, mat('MAT_D_Wood', 0x7a5230), s * 24, AVE.crossY + AVE.walk - 1.2, 0.1); points.push({ key: 'bench', x: ox + s * 24, y: AVE.crossY + AVE.walk - 2, sign: 'Bench' }); colliders.push({ t: 'box', x: ox + s * 24, y: AVE.crossY + AVE.walk - 1.2, hx: 1.1, hy: 0.3, r: 0, n: 'bench' }); }
  // the cross street ends in buildings; far skyline in every direction
  const skyT = skylineTexture();
  const skyM = new THREE.MeshStandardMaterial({ map: skyT, emissive: 0xffffff, emissiveMap: skyT, emissiveIntensity: 0.6, roughness: 0.6, metalness: 0.2 }); skyM.name = 'MAT_D_SkylineGlassLit';
  const skyline = new THREE.Group();
  for (let k = 0; k < 46; k++) {
    const a = srand() * Math.PI * 2, r = rnd(95, 160), w = rnd(10, 22), hgt = rnd(18, id === 'opportunity' ? 120 : id === 'heights' ? 80 : 55);
    const x = Math.cos(a) * r, y = 60 + Math.sin(a) * r * 0.9;
    const geo = new THREE.BoxGeometry(w, hgt, w); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 8, uv.getY(i) * hgt / 16);
    const o = new THREE.Mesh(geo, skyM); o.position.copy(P2W(ox + x, y, hgt / 2 - 0.2)); skyline.add(o);
  }
  for (const s of [-1, 1]) { box(14, 30, 26, mat('MAT_D_Brick', 0x7d6a5a), s * (AVE.crossX + 7), AVE.crossY, 0); collide(s * (AVE.crossX + 7), AVE.crossY, 7, 15); }
  box(40, 12, 30, mat('MAT_D_Concrete', 0x5a5f6a), 0, AVE.y1 + 6, 0); collide(0, AVE.y1 + 6, 20, 6);
  // the south end closes with a row of buildings behind a small plaza
  for (const [x, w, hgt, c] of [[-22, 26, 18, 0x8c6a55], [0, 18, 26, 0x6a7480], [22, 26, 14, 0xb59a7a]]) {
    box(w, 12, hgt, mat('MAT_D_Brick', c, { rough: 0.9 }), x, AVE.y0 - 14, 0);
    for (let f = 1; f < hgt / 3.5 - 0.5; f++) for (let k = -w / 2 + 2; k < w / 2 - 1; k += 3.2) box(1.5, 0.12, 2.0, srand() < 0.35 ? glassLit : glassDark, x + k + 0.75, AVE.y0 - 7.95, f * 3.5);
  }
  box(60, 6, 0.13, walkM, 0, AVE.y0 - 5, 0); collide(0, AVE.y0 - 8.5, 40, 0.5);

  const merged = mergeStatic(root, textures, 40);
  const group = new THREE.Group(); group.name = id; group.add(merged, loose, skyline);
  group.traverse((o) => { if (o.isMesh && o.parent === loose && !o.material.transparent) { o.castShadow = true; o.receiveShadow = true; } });
  skyline.traverse((o) => { o.castShadow = false; o.receiveShadow = false; });
  const routes = [];
  for (const s of [-1, 1]) for (const lane of [6.8, 7.8]) routes.push([{ x: ox + s * lane, y: AVE.y0 + 2 }, { x: ox + s * lane, y: AVE.crossY - 6 }, { x: ox + s * lane, y: AVE.y1 - 3 }]);
  routes.push([{ x: ox - 36, y: AVE.crossY - 7 }, { x: ox + 36, y: AVE.crossY - 7 }]);
  routes.push([{ x: ox - 36, y: AVE.crossY + 7 }, { x: ox + 36, y: AVE.crossY + 7 }]);
  return { id, def: D, group, colliders, points, lamps, walk: walk.map(([a, b, c, d]) => [ox + a, b, ox + c, d]), routes, lampMats: merged.userData.lamps || [], spawn: { x: ox + AVE.walk - 2.4, y: 3.2 }, buildings: D.buildings.filter((b) => !b.park).map((b) => ({ x: ox + (b.side === 'E' ? 1 : -1) * (AVE.walk + b.depth / 2), y: (b.y0 + b.y1) / 2, hx: b.depth / 2, hy: (b.y1 - b.y0) / 2, key: b.key })) };
}

/** Keep a point inside the walkable rectangles of a district. */
export function clampToWalk(p, walk) {
  let best = null, bd = 1e9;
  for (const [x0, y0, x1, y1] of walk) {
    const x = Math.max(x0, Math.min(x1, p.x)), y = Math.max(y0, Math.min(y1, p.y)), d = (x - p.x) ** 2 + (y - p.y) ** 2;
    if (d === 0) return; if (d < bd) { bd = d; best = { x, y }; }
  }
  if (best) { p.x = best.x; p.y = best.y; }
}
export function districtHeight(x, y, D) {
  const lx = x - D.ox;
  const road = (Math.abs(lx) < AVE.half && y > AVE.y0 - 10 && y < AVE.y1 + 10) || (Math.abs(y - AVE.crossY) < AVE.half && Math.abs(lx) < AVE.crossX + 10);
  return road ? 0 : 0.13;
}
