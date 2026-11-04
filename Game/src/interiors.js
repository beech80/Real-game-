// REAL — walk-in interiors for every building in Midtown, the Opportunity District and The Heights.
// Each room is built from a type (office, garage, clinic…) with a staff member at the counter,
// work stations, decor, and the door you came in through. Merged by material for phones.
import * as THREE from 'three';
import { P2W, mergeStatic } from './world.js';
import { textTexture } from './scenes.js';
import { carMesh } from './city.js';
import { makePet } from './pets.js';

export const ROOM = { w: 16, d: 14, h: 4.2 };
// building key → [room type, staff species, floor, wall color, accent]
export const BUILDING_ROOMS = {
  express: ['depot', 'Horse', 'concrete', 0xe9e3d6, 0xc2362a], kitchen: ['kitchen', 'Cow', 'tile', 0xf3efe6, 0x2f8f5a],
  motors: ['garage', 'Lion', 'concrete', 0xd9d4c8, 0x2a5bd2], clinic: ['clinic', 'Bird', 'tile', 0xf4f7f9, 0x2a9fd6],
  thread: ['shop', 'Cat', 'wood', 0xefe6d6, 0x14204a], lofts: ['lobby', 'Dog', 'wood', 0xe8ddd0, 0x5a3fd2],
  shelter: ['shelter', 'Dog', 'tile', 0xfff4e0, 0xd24f2f], library: ['library', 'Bird', 'wood', 0xe8dcc4, 0x3a2a6a],
  logistics: ['warehouse', 'Elephant', 'concrete', 0xc9c4bd, 0xe8a33a], buildright: ['workshop', 'Horse', 'concrete', 0xd2c8b8, 0xe8b23a],
  tower: ['office', 'Dolphin', 'carpet', 0xeef0f2, 0x13325a], brightline: ['tech', 'Cat', 'carpet', 0xf1f4f6, 0x0f5c5c],
  voltworks: ['workshop', 'Lion', 'concrete', 0xcfd3d8, 0xe8a33a], lumen: ['studio', 'Fox', 'wood', 0xf6f2ea, 0x1b1b1f],
  thinktank: ['arena', 'Lion', 'carpet', 0x2a2550, 0x5a3fd2], sbc: ['office', 'Elephant', 'carpet', 0xeef3ee, 0x1f6b35],
  bootcamp: ['classroom', 'Dolphin', 'tile', 0xeef0f4, 0x2a5bd2], college: ['classroom', 'Elephant', 'wood', 0xe9e1cc, 0x5a1020],
  medical: ['clinic', 'Elephant', 'tile', 0xf4f7f9, 0x2a9fd6], engineering: ['office', 'Dog', 'carpet', 0xeceff3, 0x14204a],
  bank: ['bank', 'Horse', 'marble', 0xefe6d6, 0xe0a83a], legal: ['office', 'Bird', 'wood', 0xe3d6bb, 0x14204a],
  form: ['studio', 'Dolphin', 'wood', 0xf4f4f2, 0x1b1b1f], residences: ['lobby', 'Cow', 'marble', 0xf0e6d2, 0xe0a83a],
  // Starting District walk-ins (counter runs the shop's own action)
  Door_CoffeeShop: ['cafe', 'Dog', 'wood', 0xf3e9dc, 0x0f5c5c], Door_Diner: ['diner', 'Cow', 'tile', 0xf6efe4, 0xd23b2a],
  Door_Clothing: ['shop', 'Cat', 'wood', 0xefe6d6, 0x14204a], Door_Gym: ['gym', 'Lion', 'carpet', 0xe9ecef, 0x2a5bd2],
};
// interaction stations per room type: [x, y, label, action]
const STATIONS = {
  depot: [[-5, 6, 'Sort packages', 'work']], kitchen: [[-5, 9.6, 'Work the line', 'work'], [5, 4, 'Sit and eat', 'eat']],
  garage: [[-4, 6, 'Work on a car', 'work'], [4.5, 6, 'Look at the cars for sale', 'cars']], clinic: [[-5, 6, 'Help a patient', 'work'], [5, 6, 'Get a check-up', 'checkup']],
  shop: [[-5, 5, 'Help a customer', 'work'], [4.5, 5, 'Browse jackets', 'rack']], lobby: [[-4.5, 5, 'See the model home', 'home'], [4.5, 9, 'Mailboxes', 'mail']],
  shelter: [[-4.5, 7, 'Meet the animals', 'pets']], library: [[-4.5, 5, 'Study at a table', 'study'], [4.5, 9.6, 'Learning Lab', 'zones']],
  warehouse: [[-4, 7, 'Load the truck', 'work']], workshop: [[-4.5, 7, 'Start the job', 'work']], office: [[-5, 5, 'Sit at your desk', 'work']],
  tech: [[-5, 5, 'Sit at your desk', 'work']], studio: [[-4.5, 6, 'Set up the shoot', 'work']], arena: [[0, 9.6, 'Enter a challenge zone', 'zones']],
  classroom: [[-3.5, 5.5, 'Take a seat in class', 'class']], bank: [[4.5, 5, 'Savings desk', 'savings']],
  cafe: [[4.2, 4.2, 'Sit by the window', 'sit']], diner: [[-5, 4.2, 'Sit in a booth', 'sit']], gym: [[-4.5, 6, 'Work out', 'door'], [4.5, 6, 'Run on the treadmill', 'door']],
};

const M = {};
function mat(name, color, o = {}) {
  const k = name + color.toString(16) + (o.ei || '');
  if (!M[k]) { M[k] = new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.75, metalness: o.metal ?? 0, emissive: o.emissive ?? 0, emissiveIntensity: o.ei ?? 1 }); M[k].name = name; }
  return M[k];
}
function uvBox(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d), p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)); if (ax > 0.5) uv.setXY(i, p.getZ(i), p.getY(i)); else if (ay > 0.5) uv.setXY(i, p.getX(i), p.getZ(i)); else uv.setXY(i, p.getX(i), p.getY(i)); }
  return g;
}
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const PAL = [0xd23b2a, 0x2a5bd2, 0xe8b23a, 0x2f8f5a, 0x7b3fb0, 0xf1f1f1, 0x1b1b1f, 0xe8823a, 0x2a9fd6];

export function buildInterior(key, name, ox, textures) {
  const [type, staff, floorKind, wallC, accent] = BUILDING_ROOMS[key];
  seed = key.length * 131 + 7;
  const { w: W, d: D, h: H } = ROOM;
  const root = new THREE.Group(), loose = new THREE.Group(), colliders = [], points = [];
  const add = (geo, m, x, y, z, ry = 0, parent = root) => { const o = new THREE.Mesh(geo, m); o.position.copy(P2W(ox + x, y, z)); o.rotation.y = ry; parent.add(o); return o; };
  const box = (w, d, hgt, m, x, y, z0 = 0, parent) => add(uvBox(w, hgt, d), m, x, y, z0 + hgt / 2, 0, parent);
  const solid = (w, d, hgt, m, x, y, z0 = 0) => { box(w, d, hgt, m, x, y, z0); colliders.push({ t: 'box', x: ox + x, y, hx: w / 2, hy: d / 2, r: 0, n: 'furn' }); };
  const floorM = { wood: mat('MAT_I_Wood', 0xb08060), tile: mat('MAT_I_Tile', 0xe8e6e0, { rough: 0.3 }), concrete: mat('MAT_I_Concrete', 0x9a978f), carpet: mat('MAT_I_Carpet', 0x4a5570, { rough: 1 }), marble: mat('MAT_I_Tile', 0xf2ede4, { rough: 0.15 }) }[floorKind];
  const wallM = mat('MAT_I_Plaster', new THREE.Color(wallC).multiplyScalar(0.78).getHex(), { rough: 0.95 }), acc = mat('MAT_I_Accent', accent, { rough: 0.6 }), dark = mat('MAT_I_Dark', 0x2a2d33, { rough: 0.5, metal: 0.3 });
  const metal = mat('MAT_I_Metal', 0xb8bec6, { metal: 0.8, rough: 0.3 }), woodM = mat('MAT_I_Wood', 0x8a5a3a), white = mat('MAT_I_White', 0xf4f4f2);
  const screen = mat('MAT_I_ScreenEmit', 0x8fd0ff, { emissive: 0x6fb8ff, ei: 1.4 }), panel = mat('MAT_I_PanelEmit', 0xfff6e6, { emissive: 0xfff0d8, ei: 0.8 });
  // shell
  box(W, D, 0.1, floorM, 0, D / 2, -0.1);
  box(W, D, 0.15, wallM, 0, D / 2, H);
  const wall = (x, y, w, d) => solid(w, d, H, wallM, x, y);
  wall(-W / 2 - 0.15, D / 2, 0.3, D); wall(W / 2 + 0.15, D / 2, 0.3, D); wall(0, D + 0.15, W + 0.6, 0.3);
  wall(-W / 4 - 0.8, -0.15, W / 2 - 1.6, 0.3); wall(W / 4 + 0.8, -0.15, W / 2 - 1.6, 0.3); box(3.2, 0.3, H - 2.7, wallM, 0, -0.15, 2.7);
  box(W, 0.06, 0.15, acc, 0, D - 0.02, 0.0); box(0.06, D, 0.15, acc, -W / 2 + 0.02, D / 2, 0); box(0.06, D, 0.15, acc, W / 2 - 0.02, D / 2, 0);
  box(2.2, 0.08, 2.5, mat('MAT_I_DoorGlass', 0x9fc4e0, { rough: 0.05, metal: 0.4 }), 0, -0.12, 0.05);
  for (const [x, y] of [[-4, 3.5], [4, 3.5], [-4, 10], [4, 10], [0, 7]]) box(2.2, 1.0, 0.04, panel, x, y, H - 0.06);
  // south-wall "windows" glowing with daylight
  for (const x of [-5.5, 5.5]) box(2.6, 0.05, 1.8, mat('MAT_I_WindowEmit', 0xdbe9ff, { emissive: 0xcfe2ff, ei: 1.2 }), x, 0.02, 1.1);
  // back-wall sign with the building's name
  const st = textTexture([name], { w: 1024, h: 160, bg: '#' + accent.toString(16).padStart(6, '0'), border: '#ffffff', font: 'bold 72px "Barlow Condensed", Arial' });
  add(new THREE.PlaneGeometry(7, 1.1), new THREE.MeshStandardMaterial({ map: st, emissive: 0xffffff, emissiveMap: st, emissiveIntensity: 0.35 }), 0, D - 0.04, 3.1, Math.PI, loose);
  // the counter with the staff member behind it
  solid(5, 0.8, 1.05, acc, 0, 9.6); box(5.3, 1.0, 0.06, type === 'bank' ? mat('MAT_I_Marble', 0xf2ede4, { rough: 0.1 }) : woodM, 0, 9.6, 1.05);
  points.push({ act: 'counter', x: ox, y: 8.6, label: name });
  points.push({ act: 'exit', x: ox, y: 0.9, label: 'Go outside' });
  const plant = (x, y) => { box(0.5, 0.5, 0.5, mat('MAT_I_Pot', 0xc46a3a), x, y); add(new THREE.IcosahedronGeometry(0.5, 1), mat('MAT_I_Leaves', 0x3d7a34, { rough: 0.9 }), x, y, 1.0); colliders.push({ t: 'circle', x: ox + x, y, r: 0.35, n: 'plant' }); };
  const desk = (x, y, r = 0) => { solid(1.6, 0.8, 0.75, woodM, x, y); box(0.7, 0.05, 0.45, dark, x, y + 0.15, 0.78); box(0.66, 0.02, 0.4, screen, x, y + 0.12, 0.8); box(0.5, 0.5, 0.5, dark, x, y - 0.75, 0); };
  const shelf = (x, y, w, h2 = 2.2, items = true) => { solid(w, 0.5, h2, woodM, x, y); if (items) for (let r = 0; r < 4; r++) for (let k = -w / 2 + 0.25; k < w / 2 - 0.2; k += 0.32) if (rnd() < 0.8) box(0.24, 0.1, 0.3 + rnd() * 0.15, mat('MAT_I_Item', PAL[(((r * 7 + Math.round(k * 10)) % PAL.length) + PAL.length) % PAL.length]), x + k, y - 0.27, 0.15 + r * 0.52); };
  const chairs = (x, y) => { box(0.5, 0.5, 0.45, acc, x, y); box(0.5, 0.08, 0.5, acc, x, y + 0.22, 0.45); };
  // furniture by type
  const T = {
    depot: () => { for (let i = 0; i < 3; i++) shelf(-6.5 + i * 2.6, 12.5, 2.2); for (let k = 0; k < 8; k++) box(0.6, 0.5, 0.45, mat('MAT_I_Cardboard', 0xb88a55), -5.5 + (k % 4) * 0.7, 5.2 + Math.floor(k / 4) * 0.7, 0); solid(2.4, 1.2, 0.9, metal, -5, 7.2); plant(6.8, 1.2); },
    kitchen: () => { solid(6, 0.9, 0.95, metal, -4.5, 11.8); for (let k = 0; k < 4; k++) box(0.5, 0.5, 0.04, dark, -6.8 + k * 1.5, 11.8, 0.96); solid(1.2, 0.9, 2.0, metal, -7.2, 9); for (const [x, y] of [[4, 3.2], [5.8, 5.4], [3.6, 6.4]]) { add(new THREE.CylinderGeometry(0.6, 0.6, 0.06, 20), woodM, x, y, 0.75); add(new THREE.CylinderGeometry(0.06, 0.06, 0.75, 8), dark, x, y, 0.37); colliders.push({ t: 'circle', x: ox + x, y, r: 0.6, n: 'table' }); chairs(x + 0.8, y); } },
    garage: () => { const car = carMesh(0xd23b2a); car.position.copy(P2W(ox - 4, 7.8, 0.6)); loose.add(car); solid(2.2, 4.4, 0.6, mat('MAT_I_Lift', 0xe8b23a), -4, 7.8); const car2 = carMesh(0x2f8f5a); car2.position.copy(P2W(ox + 4.5, 7.8, 0)); loose.add(car2); colliders.push({ t: 'box', x: ox + 4.5, y: 7.8, hx: 1, hy: 2.2, r: 0, n: 'car' }); shelf(7.2, 12.8, 1.6); solid(1.5, 0.6, 1.0, mat('MAT_I_Toolbox', 0xd23b2a), -7, 12.8); },
    clinic: () => { for (const x of [-6, -3.6]) { solid(1.0, 2.0, 0.6, white, x, 6); box(0.9, 0.5, 0.15, mat('MAT_I_Pillow', 0xdfeaf2), x, 6.7, 0.6); box(0.05, 2.2, 2.0, mat('MAT_I_Curtain', 0x9ad0e8), x + 0.7, 6, 0.4); } for (let k = 0; k < 4; k++) chairs(4.2 + k * 0.8, 3); plant(7, 1.2); },
    shop: () => { for (const y of [4, 7]) { solid(3.2, 0.3, 1.6, metal, -4.5, y); for (let k = 0; k < 7; k++) box(0.08, 0.5, 0.9, mat('MAT_I_Cloth', PAL[(k + y) % PAL.length], { rough: 0.95 }), -5.9 + k * 0.45, y, 0.65); } for (const y of [4, 7]) { solid(3.2, 0.3, 1.6, metal, 4.5, y); for (let k = 0; k < 7; k++) box(0.08, 0.5, 0.9, mat('MAT_I_Cloth', PAL[(k * 3 + y) % PAL.length], { rough: 0.95 }), 3.1 + k * 0.45, y, 0.65); } box(1.2, 0.05, 2, mat('MAT_I_Mirror', 0xcfe3f0, { rough: 0.02, metal: 1 }), 7.9, 11, 0.3); },
    lobby: () => { solid(3, 1.0, 0.45, acc, -4.5, 4.2); box(3, 0.25, 0.5, acc, -4.5, 3.8, 0.45); box(2.6, 2, 0.02, mat('MAT_I_Rug', 0x5a1020, { rough: 1 }), -4.5, 5.6, 0.01); solid(1.2, 1.2, 0.45, woodM, -4.5, 6.4); for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) box(0.35, 0.05, 0.3, metal, 3.4 + k * 0.4, D - 0.05, 1.0 + r * 0.35); box(1.6, 0.06, 2.5, metal, 6.5, D - 0.04, 0.05); plant(-7, 1.2); plant(7, 1.2); },
    shelter: () => { for (let k = 0; k < 4; k++) { const x = -6.5 + k * 1.9; solid(1.6, 1.4, 1.1, white, x, 12.6); for (let b = 0; b < 5; b++) box(0.04, 0.04, 1.0, metal, x - 0.6 + b * 0.3, 11.88, 0.05); } const pets = [['puppy', 0xc98a4a], ['kitten', 0x8a8d96], ['bunny', 0xf1ece4], ['puppy', 0x3a2a1a]]; pets.forEach(([t, c], i) => { const p = makePet(t, c); p.position.copy(P2W(ox - 6.5 + i * 1.9, 12.4, 0.0)); p.rotation.y = Math.PI; loose.add(p); }); const play = makePet('puppy', 0xe6dccb); play.position.copy(P2W(ox - 3, 6.5, 0)); play.rotation.y = 2.4; loose.add(play); box(3, 3, 0.02, mat('MAT_I_Mat', 0x2f8f5a, { rough: 1 }), -3.5, 6.5, 0.01); },
    library: () => { for (const x of [-7.6, 7.6]) for (let k = 0; k < 4; k++) { const y = 2.5 + k * 2.8; solid(0.5, 2.4, 2.6, woodM, x, y); for (let r = 0; r < 5; r++) for (let b = 0; b < 7; b++) box(0.25, 0.28, 0.32 + rnd() * 0.12, mat('MAT_I_Book', PAL[(b + r * 3 + k) % PAL.length]), x - Math.sign(x) * 0.02, y - 1.0 + b * 0.31, 0.15 + r * 0.5); } for (const [x, y] of [[-4, 5], [-4, 8], [1.5, 5]]) { solid(2.2, 1.1, 0.75, woodM, x, y); chairs(x - 0.6, y - 0.9); chairs(x + 0.6, y - 0.9); box(0.25, 0.25, 0.3, mat('MAT_I_LampEmit', 0xfff0c8, { emissive: 0xffd08a, ei: 1.5 }), x, y, 0.78); } },
    warehouse: () => { for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) { const x = -6 + k * 1.7, y = 11.4 + r * 1.6; box(1.3, 1.3, 0.15, woodM, x, y); for (let s2 = 0; s2 < 2 + ((k + r) % 2); s2++) box(1.2, 1.2, 0.6, mat('MAT_I_Cardboard', 0xb88a55), x, y, 0.15 + s2 * 0.6); colliders.push({ t: 'box', x: ox + x, y, hx: 0.7, hy: 0.7, r: 0, n: 'pallet' }); } solid(3, 1.4, 2.4, mat('MAT_I_Truck', 0xe8e8e8), 5.6, 12.8); box(0.12, 4, 0.02, mat('MAT_I_Line', 0xe8b23a), -2.2, 7, 0.01); },
    workshop: () => { solid(3.5, 1.0, 0.9, woodM, -4.5, 7.8); for (let k = 0; k < 5; k++) box(0.08, 0.6, 0.08, metal, -5.8 + k * 0.6, 8.3, 0.95); box(3.6, 0.06, 1.8, mat('MAT_I_Pegboard', 0xd7c5a5), -4.5, D - 0.04, 1.0); shelf(5.5, 12.8, 3); for (let k = 0; k < 4; k++) box(2.4, 0.2, 0.2, woodM, 4.2, 4 + k * 0.3, 0); solid(0.6, 0.6, 1.1, mat('MAT_I_Cone', 0xe8823a), 6.8, 2); },
    office: () => { for (const [x, y] of [[-5.5, 4.4], [-2.8, 4.4], [-5.5, 7], [-2.8, 7]]) desk(x, y); solid(3.2, 1.4, 0.75, woodM, 4.5, 5.5); for (const dx of [-1, 0, 1]) { chairs(4.5 + dx, 4.4); chairs(4.5 + dx, 6.6); } box(2.4, 0.05, 1.4, white, 4.5, D - 0.05, 1.3); plant(7, 1.2); plant(-7, 12.6); },
    tech: () => { for (const [x, y] of [[-5.5, 4.4], [-2.8, 4.4], [-5.5, 7], [-2.8, 7], [3.2, 4.4], [5.9, 4.4]]) desk(x, y); solid(2.6, 1.6, 0.4, mat('MAT_I_Beanbag', 0x2fd2b0, { rough: 1 }), 5, 7.6); box(3, 0.05, 1.6, white, -4, D - 0.05, 1.2); box(2, 0.05, 1.2, screen, 4.5, D - 0.06, 1.6); plant(-7, 1.2); },
    studio: () => { box(4, 0.06, 3.2, white, -4.5, D - 0.06, 0); box(4, 3, 0.02, white, -4.5, 11.4, 0.0); for (const x of [-6.2, -2.8]) { add(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6), dark, x, 8.6, 0.9); box(0.6, 0.4, 0.5, mat('MAT_I_SoftboxEmit', 0xffffff, { emissive: 0xffffff, ei: 1.2 }), x, 8.7, 1.9); } box(0.3, 0.4, 0.25, dark, -4.5, 6.5, 1.3); add(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 6), dark, -4.5, 6.5, 0.65); solid(2.6, 1.2, 0.9, woodM, 4.6, 6); for (let k = 0; k < 3; k++) box(0.8, 0.04, 0.6, mat('MAT_I_Photo', PAL[k + 2]), 3.2 + k * 1.4, D - 0.05, 2.0); },
    arena: () => { for (let k = 0; k < 5; k++) { const x = -6 + k * 3; box(2.0, 0.3, 3.0, mat('MAT_I_ZoneDoor', PAL[k + 1]), x, D - 0.2, 0); box(1.4, 0.05, 0.5, mat('MAT_I_ZoneEmit', 0xffffff, { emissive: PAL[k + 1], ei: 1.4 }), x, D - 0.38, 3.2); } for (let k = 0; k < 6; k++) chairs(-5 + k * 2, 4); box(10, 6, 0.02, mat('MAT_I_Rug', 0x5a3fd2, { rough: 1 }), 0, 7, 0.01); },
    classroom: () => { for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { const x = -5.4 + k * 2.4, y = 3.2 + r * 1.9; solid(1.4, 0.6, 0.72, woodM, x, y); chairs(x, y - 0.6); } box(5, 0.05, 1.6, mat('MAT_I_Board', 0x1f3a2a), 4.4, D - 0.05, 1.1); box(5.2, 0.08, 1.8, woodM, 4.4, D - 0.02, 1.0); plant(-7.2, 12.8); },
    cafe: () => { box(1.0, 0.6, 0.55, metal, -1.2, 9.6, 1.1); box(1.4, 0.6, 0.5, mat('MAT_I_CaseGlass', 0xcfe3f0, { rough: 0.05 }), 1.4, 9.4, 1.1); for (let k = 0; k < 4; k++) box(0.25, 0.25, 0.12, mat('MAT_I_Pastry', [0xd8a657, 0xc4793a, 0xe8c27a, 0x7a4a2a][k]), 0.9 + k * 0.32, 9.4, 1.2); box(5, 0.06, 1.4, mat('MAT_I_MenuBoard', 0x1f2a22), 0, D - 0.05, 2.2); for (const [x, y] of [[3.6, 3.2], [5.6, 3.2], [4.6, 5.6], [-4.4, 4], [-5.8, 6.4]]) { add(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 18), woodM, x, y, 0.75); add(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 8), dark, x, y, 0.37); colliders.push({ t: 'circle', x: ox + x, y, r: 0.45, n: 'table' }); chairs(x + 0.65, y); chairs(x - 0.65, y); } plant(7, 12.6); plant(-7, 12.6); },
    diner: () => { for (const y of [3.4, 6.2]) for (const x of [-5.4, 5.4]) { solid(2.2, 0.9, 0.75, mat('MAT_I_Table', 0xf1f1f1, { rough: 0.3 }), x, y); box(2.2, 0.5, 1.1, acc, x, y - 0.8, 0); box(2.2, 0.5, 1.1, acc, x, y + 0.8, 0); colliders.push({ t: 'box', x: ox + x, y, hx: 1.1, hy: 1.3, r: 0, n: 'booth' }); } for (let k = 0; k < 4; k++) { add(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 14), acc, -1.8 + k * 1.2, 8.6, 0.75); add(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 8), metal, -1.8 + k * 1.2, 8.6, 0.37); } solid(4, 0.8, 1.0, metal, 0, D - 0.6); },
    gym: () => { for (let k = 0; k < 3; k++) { const x = 3 + k * 1.8; solid(0.8, 2.0, 0.25, dark, x, 6); box(0.7, 0.1, 1.3, dark, x, 5.1, 0.25); box(0.5, 0.05, 0.3, screen, x, 5.12, 1.25); } for (let k = 0; k < 6; k++) box(0.6, 0.25, 0.15, metal, -6.5 + k * 0.7, D - 0.4, 0.4); solid(4.4, 0.5, 0.35, woodM, -4.6, D - 0.4); for (const y of [5, 7.5]) { solid(1.8, 0.5, 0.45, acc, -4.5, y); add(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8), metal, -4.5, y, 1.1).rotation.z = Math.PI / 2; } box(4, 3.4, 0.02, mat('MAT_I_Mat', 0x2a5bd2, { rough: 1 }), -4.5, 6.2, 0.01); box(0.05, 3, 2, mat('MAT_I_Mirror', 0xcfe3f0, { rough: 0.02, metal: 1 }), -7.95, 6.5, 0.3); },
    bank: () => { for (const x of [-1.6, 0, 1.6]) box(0.04, 0.5, 0.8, mat('MAT_I_Glass', 0xcfe3f0, { rough: 0.05 }), x, 9.6, 1.1); for (const x of [-6.6, 6.6]) for (const y of [3, 7, 11]) { add(new THREE.CylinderGeometry(0.35, 0.4, H, 16), mat('MAT_I_Marble', 0xf2ede4, { rough: 0.1 }), x, y, H / 2); colliders.push({ t: 'circle', x: ox + x, y, r: 0.42, n: 'col' }); } solid(2, 1, 0.75, woodM, 4.5, 5); chairs(4.5, 4); box(2, 1.2, 2.4, mat('MAT_I_Vault', 0x8a8d96, { metal: 0.9, rough: 0.3 }), -5.2, D - 0.6, 0); },
  };
  (T[type] || T.office)();
  for (const [x, y, label, act] of STATIONS[type] || []) points.push({ act, x: ox + x, y, label });
  const merged = mergeStatic(root, textures, 100);
  merged.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
  const lights = new THREE.Group();
  for (const [x, y, i] of [[-4, 4, 6], [4, 4, 6], [0, 10, 7]]) { const l = new THREE.PointLight(0xfff0dc, i, 13, 1.6); l.position.copy(P2W(ox + x, y, H - 0.4)); lights.add(l); }
  const group = new THREE.Group(); group.name = 'interior_' + key; group.add(merged, loose, lights);
  loose.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { key, type, staff, group, colliders, points, lampMats: merged.userData.lamps || [], bounds: [ox - W / 2 + 0.35, 0.35, ox + W / 2 - 0.35, D - 0.35], spawn: { x: ox, y: 4.4 }, staffPos: { x: ox, y: 10.6 }, ox };
}
