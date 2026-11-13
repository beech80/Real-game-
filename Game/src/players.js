// REAL — players: more than one child can keep a game on the same device (brothers and sisters, a class tablet).
// The game being played lives in the usual save slot; the others are "parked" in one list and swapped in when chosen.
// Nothing is ever replaced without asking: starting a new game parks the current one first.
const PK = 'real.players', SAVE = 'real.save.v2', MAX = 8;
const read = () => { try { const l = JSON.parse(localStorage.getItem(PK) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } };
const write = (l) => { try { localStorage.setItem(PK, JSON.stringify(l)); return true; } catch (e) { return false; } };
const info = (raw) => { try { const s = JSON.parse(raw); return s && s.v === 2 && s.name ? s : null; } catch (e) { return null; } };

/** the parked players: [{ id, name, day, money }] */
export const parked = () => read().map(({ id, name, day, money }) => ({ id, name, day, money }));
/** park the game in the save slot (if any). Returns false if it could not be kept (list full or no space). */
export function parkCurrent() {
  let raw = null; try { raw = localStorage.getItem(SAVE); } catch (e) { return false; }
  const s = raw && info(raw); if (!s) return true;                       // nothing to keep
  const l = read(); if (l.length >= MAX) return false;
  let tips = null; try { tips = localStorage.getItem('real.tips'); } catch (e) {}
  l.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: s.name, day: s.day, money: s.money, save: raw, tips, at: Date.now() });
  if (!write(l)) return false;                                           // keep the current game where it is
  try { localStorage.removeItem(SAVE); localStorage.removeItem(SAVE + '.bak'); localStorage.removeItem('real.tips'); } catch (e) {}
  return true;
}
/** make a parked player the current one (the current game is parked first) */
export function switchTo(id) {
  const e = read().find((x) => x.id === id); if (!e || !info(e.save)) return false;
  if (!parkCurrent()) return false;
  try { localStorage.setItem(SAVE, e.save); if (e.tips != null) localStorage.setItem('real.tips', e.tips); } catch (err) { return false; }
  write(read().filter((x) => x.id !== id));
  return true;
}
export function removePlayer(id) { return write(read().filter((x) => x.id !== id)); }
export const MAX_PLAYERS = MAX;
