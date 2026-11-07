// REAL — keyboard-only play. Everything a player can tap, they can also reach with the keyboard:
//  * Tab / Shift+Tab move between the buttons of the open screen (focus stays inside it), with a clear focus ring
//  * 1–9 (or A–D in dialogs) choose an answer; Enter continues; Escape closes the top screen
//  * on number pads, digit keys, “.”, Backspace and Enter work the pad
//  * in the world (no screen open): WASD / arrows move, E or Space to interact, P to open the phone
// A new screen focuses its first useful control, so screen readers and keyboard users land in the right place.
const FOCUSABLE = 'button:not([disabled]):not([hidden]), [href], input:not([disabled]), textarea:not([disabled]), select, [tabindex]:not([tabindex="-1"])';
const visible = (e) => !!(e && e.offsetParent !== null && !e.closest('[hidden]'));
const topLayer = () => {
  const card = document.querySelector('.wcard-wrap');
  if (card) return card;
  const sheets = [...document.querySelectorAll('#modal .modal')];
  if (sheets.length) return sheets[sheets.length - 1];
  const d = document.getElementById('dialog'); if (d && !d.hidden) return d;
  for (const id of ['creator', 'title']) { const el = document.getElementById(id); if (el && !el.hidden) return el; }
  return null;
};
export const screenOpen = () => { const t = topLayer(); return !!t && !/^(title|creator)$/.test(t.id || ''); };
const focusables = (root) => [...root.querySelectorAll(FOCUSABLE)].filter(visible);
function focusFirst(root) {
  if (!root || root.contains(document.activeElement)) return;
  const pick = root.querySelector('.opt:not([disabled]), .d-choice, .d-next, .key, textarea, input, button.primary:not([hidden])') || focusables(root)[0];
  if (pick && visible(pick)) try { pick.focus({ preventScroll: true }); } catch (e) {}
}
export function installKeyboard() {
  document.body.classList.add('kbd-ready');
  // land focus in each new screen
  const obs = new MutationObserver(() => { const t = topLayer(); if (t && t.id !== 'title' && t.id !== 'creator') setTimeout(() => focusFirst(topLayer()), 30); });
  obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('keydown', (e) => {
    const t = topLayer(); if (!t) return;
    const inText = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if (e.key === 'Tab') {   // keep focus inside the open screen
      const f = focusables(t); if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      const n = i < 0 ? 0 : (i + (e.shiftKey ? -1 : 1) + f.length) % f.length;
      e.preventDefault(); e.stopPropagation(); f[n].focus(); return;
    }
    if (e.key === 'Escape') {
      const x = t.querySelector('.sh-x') || t.querySelector('.wcard button:last-child'); if (x) { e.preventDefault(); x.click(); }
      return;
    }
    if (inText) return;
    // number pads
    const pad = t.querySelector('.keypad, .keys');
    if (pad && /^[0-9.]$|^Backspace$|^Enter$/.test(e.key)) {
      const label = e.key === 'Backspace' ? ['⌫', '←', 'Del'] : e.key === 'Enter' ? null : [e.key];
      const k = e.key === 'Enter' ? t.querySelector('.key.ok') : [...t.querySelectorAll('.key')].find((b) => label.includes(b.textContent.trim()));
      if (k) { e.preventDefault(); e.stopPropagation(); k.click(); return; }
    }
    // answers: 1–9, or A–D for dialog choices
    const opts = [...t.querySelectorAll('.opt:not([disabled]), .d-choice, .wp-opt:not([disabled])')].filter(visible);
    const num = /^[1-9]$/.test(e.key) ? +e.key - 1 : /^[a-d]$/i.test(e.key) && t.id === 'dialog' ? e.key.toLowerCase().charCodeAt(0) - 97 : -1;
    if (num >= 0 && opts[num]) { e.preventDefault(); e.stopPropagation(); opts[num].focus(); opts[num].click(); return; }
    if (e.key === 'Enter' && !(document.activeElement && t.contains(document.activeElement) && document.activeElement.tagName === 'BUTTON')) {
      const go = [...t.querySelectorAll('.d-next, button.primary')].filter(visible).pop(); if (go) { e.preventDefault(); e.stopPropagation(); go.click(); }
    }
  }, true);
}
