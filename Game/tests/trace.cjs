// Test helper: trace every step of a cursive pad (each letter, then the whole word) by dragging along the guide.
// Returns the list of steps traced, e.g. ['N', 'o', 'v', 'a', 'Nova'].
module.exports = async function traceSteps(p, scope = '') {
  const seen = [];
  for (let n = 0; n < 40; n++) {
    const c = await p.waitForSelector(`${scope} canvas.sig`, { timeout: 20000 }).catch(() => null); if (!c) return seen;
    const info = await c.evaluate((el) => { const r = el.getBoundingClientRect(); return { t: el.dataset.text, fit: +el.dataset.fit, final: el.dataset.final === '1', x: r.x, y: r.y, w: r.width, h: r.height }; });
    const pts = await p.evaluate(({ t, fit }) => {
      const cv = document.createElement('canvas'); cv.width = 640; cv.height = 220; const g = cv.getContext('2d');
      g.font = `${fit}px "Dancing Script", "Segoe Script", cursive`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 320, 115);
      const d = g.getImageData(0, 0, 640, 220).data, out = [];
      for (let x = 0; x < 640; x += 10) { const col = []; for (let y = 0; y < 220; y += 4) if (d[(y * 640 + x) * 4 + 3] > 100) col.push(y); if (col.length) out.push([x, col[0], col[col.length - 1]]); }
      return out;
    }, info);
    // drag along each column of the guide with real pointer events on the canvas (fast: one round trip)
    await c.evaluate((el, pts) => {
      const r = el.getBoundingClientRect(), at = (x, y) => ({ clientX: r.left + x / 640 * r.width, clientY: r.top + y / 220 * r.height, pointerId: 7, bubbles: true, isPrimary: true, pointerType: 'touch' });
      for (const [x, y0, y1] of pts) {
        el.dispatchEvent(new PointerEvent('pointerdown', at(x, y0)));
        for (let k = 1; k <= 3; k++) el.dispatchEvent(new PointerEvent('pointermove', at(x, y0 + (y1 - y0) * k / 3)));
        el.dispatchEvent(new PointerEvent('pointerup', at(x, y1)));
      }
    }, pts);
    seen.push(info.t); if (process.env.TRACE_LOG) console.log('traced', info.t);
    const btn = await c.evaluateHandle((el) => el.parentElement.querySelector('button.primary'));
    await btn.asElement().evaluate((b) => b.click());   // a direct click: the pad is busy drawing, so a pointer click can wait a long time on a slow machine
    if (info.final) return seen;
    await p.waitForFunction((el) => !el.isConnected, c, { timeout: 10000 }).catch(() => {});
  }
  return seen;
};
