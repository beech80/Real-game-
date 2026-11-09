// REAL — the big learning data (why-not reasons, Heart's knowledge) lives in assets/learn.json, not in the game file,
// so the game starts faster. It loads while the city loads. The one-file offline copy carries it inside the page.
import { WW } from './ww/index.js';
import { KB } from './heart.js';
let done = null;
export function fillLearnData(d) { if (d && d.ww) Object.assign(WW, d.ww); if (d && Array.isArray(d.kb)) KB.splice(0, KB.length, ...d.kb); }
export function loadLearnData() {
  if (done) return done;
  const packed = window.__REAL_PACK && window.__REAL_PACK['assets/learn.json'];
  done = (packed ? Promise.resolve(JSON.parse(packed)) : fetch('assets/learn.json').then((r) => (r.ok ? r.json() : null)))
    .then(fillLearnData).catch((e) => { console.warn('learning data not loaded', e); done = null; });
  return done;
}
export const learnCount = () => Object.keys(WW).length + KB.length;   // for tests
