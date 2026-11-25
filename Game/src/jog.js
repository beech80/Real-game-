// REAL — Park Jog: a short running game in Brighter Park. Three lanes; move left and right to grab water, fruit and stars,
// and step around cones and puddles. Nobody loses: bumping a cone just makes you stumble for a moment. 40 seconds a run.
// Controls: swipe or tap the left/right half of the track, or the arrow keys / A and D, or a game controller.
import { h, UI } from './ui.js';
import { tr } from './i18n.js';
import { isCalm } from './calm.js';

const LANES = 3, RUN_S = 40;
const ITEMS = [
  { e: '💧', pts: 1, good: true, w: 5 }, { e: '🍎', pts: 1, good: true, w: 4 }, { e: '🍌', pts: 1, good: true, w: 3 },
  { e: '⭐', pts: 3, good: true, w: 1.2 }, { e: '🚧', good: false, w: 2.4 }, { e: '💦', good: false, w: 1.6, puddle: true },
];
const pickItem = () => { const t = ITEMS.reduce((a, i) => a + i.w, 0); let r = Math.random() * t; for (const i of ITEMS) { if ((r -= i.w) < 0) return i; } return ITEMS[0]; };

/** play one run; resolves { score, stars, bumps } (or null if closed before starting) */
export function parkJog(G) {
  const best = (G.state.stats && G.state.stats.jogBest) || 0;
  return UI.sheet('Park Jog', (close) => {
    const cv = h('canvas', { class: 'jog-cv', width: 360, height: 520, 'aria-label': tr('Running game: move left and right to collect water, fruit and stars') });
    const hud = h('div', { class: 'jog-hud' }, h('b', { id: 'jog-score' }, '0'), h('span', { id: 'jog-time' }, `${RUN_S}s`));
    const startBtn = h('button', { class: 'primary', id: 'jog-start' }, '▶ ' + tr('Start running'));
    const intro = h('p', { class: 'lead' }, 'Grab 💧 🍎 🍌 and ⭐. Step around 🚧 and 💦. Swipe or tap left and right.');
    const lr = (d, lbl, id) => h('button', { class: 'ghost jog-lr', id, 'aria-label': tr(lbl), onpointerdown: (e) => { e.preventDefault(); move(d); } }, d < 0 ? '◀' : '▶');
    const pads = h('div', { class: 'jog-pads' }, lr(-1, 'Move left', 'jog-left'), lr(1, 'Move right', 'jog-right'));
    const wrap = h('div', { class: 'act jog' }, intro, hud, cv, pads, h('div', { class: 'row' }, h('small', { class: 'jog-best' }, best ? `${tr('Best')}: ${best}` : ''), startBtn));
    const g = cv.getContext('2d'), W = 360, H = 520, laneX = (l) => W * (l + 0.5) / LANES;
    const S = { lane: 1, x: laneX(1), items: [], t: 0, score: 0, stars: 0, bumps: 0, slow: 0, combo: 0, spawn: 0.6, running: false, over: false, pop: [] };
    const calm = isCalm();
    const move = (d) => { if (S.running) S.lane = Math.max(0, Math.min(LANES - 1, S.lane + d)); };
    const key = (e) => { if (!wrap.isConnected) return document.removeEventListener('keydown', key); if (/ArrowLeft|^a$|^A$/.test(e.key)) { move(-1); e.preventDefault(); } if (/ArrowRight|^d$|^D$/.test(e.key)) { move(1); e.preventDefault(); } };
    document.addEventListener('keydown', key);
    let sx = null;
    cv.addEventListener('pointerdown', (e) => { sx = e.clientX; e.preventDefault(); });
    cv.addEventListener('pointerup', (e) => { const r = cv.getBoundingClientRect(); const dx = sx == null ? 0 : e.clientX - sx; if (Math.abs(dx) > 24) move(dx > 0 ? 1 : -1); else move(e.clientX - r.left < r.width / 2 ? -1 : 1); sx = null; });
    let padPrev = 0;
    const pad = () => { try { const p = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(Boolean); if (!p) return; const x = p.axes[0] || 0, d = (p.buttons[14] && p.buttons[14].pressed) ? -1 : (p.buttons[15] && p.buttons[15].pressed) ? 1 : x < -0.5 ? -1 : x > 0.5 ? 1 : 0; if (d && d !== padPrev) move(d); padPrev = d; } catch (e) {} };
    const draw = () => {
      // the park path: grass on both sides, a sandy path with lane lines that move as you run
      g.fillStyle = '#3f8f4f'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#d8c39a'; g.fillRect(18, 0, W - 36, H);
      g.strokeStyle = 'rgba(120,96,60,.35)'; g.lineWidth = 3; g.setLineDash([24, 22]); g.lineDashOffset = -(S.t * (calm ? 120 : 180)) % 46;
      for (let l = 1; l < LANES; l++) { g.beginPath(); g.moveTo(W * l / LANES, 0); g.lineTo(W * l / LANES, H); g.stroke(); }
      g.setLineDash([]);
      g.font = '38px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const it of S.items) g.fillText(it.k.e, laneX(it.lane), it.y);
      // the runner (your REAL), with a little bounce
      const bob = calm ? 0 : Math.sin(S.t * 14) * 3;
      g.globalAlpha = S.slow > 0 ? 0.6 : 1; g.font = '46px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
      g.save(); g.translate(S.x, H - 70 + bob); g.scale(-1, 1); g.fillText('🏃', 0, 0); g.restore(); g.globalAlpha = 1;
      g.font = 'bold 20px system-ui, sans-serif';
      for (const p of S.pop) { g.globalAlpha = Math.max(0, 1 - p.t / 0.7); g.fillStyle = p.c; g.fillText(p.s, p.x, p.y - p.t * 50); }
      g.globalAlpha = 1;
    };
    let last = 0, raf = 0;
    const frame = (now) => {
      if (!wrap.isConnected) { cancelAnimationFrame(raf); return; }
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; pad();
      if (S.running) {
        S.t += dt; S.slow = Math.max(0, S.slow - dt);
        const speed = (calm ? 170 : 210) + S.t * (calm ? 2 : 4), v = speed * (S.slow > 0 ? 0.45 : 1);
        S.x += (laneX(S.lane) - S.x) * Math.min(1, dt * 14);
        if ((S.spawn -= dt) <= 0) { S.spawn = Math.max(0.42, 0.85 - S.t * 0.008) * (calm ? 1.25 : 1); const lane = Math.floor(Math.random() * LANES); if (!S.items.some((i) => i.lane === lane && i.y < 60)) S.items.push({ k: pickItem(), lane, y: -30 }); }
        for (const it of S.items) it.y += v * dt;
        for (const it of S.items) if (!it.hit && it.lane === S.lane && Math.abs(it.y - (H - 70)) < 30) {
          it.hit = true;
          if (it.k.good) { S.combo++; const pts = it.k.pts * (S.combo >= 5 ? 2 : 1); S.score += pts; if (it.k.e === '⭐') S.stars++; S.pop.push({ s: '+' + pts, x: laneX(it.lane), y: H - 110 - S.pop.length * 26, t: 0, c: '#1b5e2a' }); G.sfx('coin'); }
          else { S.combo = 0; S.bumps++; S.slow = it.k.puddle ? 0.8 : 1.1; S.pop.push({ s: tr(it.k.puddle ? 'Splash!' : 'Oops!'), x: laneX(it.lane), y: H - 110 - S.pop.length * 26, t: 0, c: '#7a3b1b' }); G.sfx('click'); }
        }
        S.items = S.items.filter((i) => !i.hit && i.y < H + 40);
        for (const p of S.pop) p.t += dt; S.pop = S.pop.filter((p) => p.t < 0.7);
        hud.firstChild.textContent = String(S.score) + (S.combo >= 5 ? ' ×2' : ''); hud.lastChild.textContent = `${Math.max(0, Math.ceil(RUN_S - S.t))}s`;
        if (S.t >= RUN_S) { S.running = false; S.over = true; finish(); }
      }
      draw(); raf = requestAnimationFrame(frame);
    };
    const finish = () => {
      const res = { score: S.score, stars: S.stars, bumps: S.bumps }, newBest = S.score > best;
      G.sfx('good');
      wrap.replaceChildren(
        h('p', { class: 'lead' }, newBest && best ? `🏅 ${tr('New best!')} ${S.score}` : `${tr('Great run!')} ${S.score} ${tr('points')}`),
        h('div', { class: 'jog-sum' }, h('span', {}, `⭐ ${S.stars}`), h('span', {}, `💧🍎🍌 ${S.score - S.stars * 3 < 0 ? 0 : S.score - S.stars * 3}`), h('span', {}, `🚧 ${S.bumps}`)),
        h('p', { class: 'tip' }, 'Running is good for your heart and your mood. Drink water after you run.'),
        h('div', { class: 'row' }, h('button', { class: 'ghost', id: 'jog-again', onclick: () => close({ ...res, again: true }) }, '↻ ' + tr('Run again')), h('button', { class: 'primary', id: 'jog-done', onclick: () => close(res) }, tr('Done'))));
    };
    startBtn.onclick = () => { intro.hidden = true; startBtn.hidden = true; S.running = true; last = 0; };
    window.__jog = S;   // tests can see the run
    raf = requestAnimationFrame(frame);
    return wrap;
  }, { icon: '🏃' });
}
