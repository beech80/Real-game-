// REAL — reading-level helpers (no DOM). Used by the game to pick questions that fit the learner, and by tests to
// keep the words right for each level.
//  grade(text): an estimated school grade for the text (Flesch–Kincaid), clamped to 0–16.
//  hardWords(text): long, many-syllable words a young reader may stumble on.
//  difficulty(Q): how hard a question is to read and work out (reading grade + size of the numbers + steps).

export const syl = (w) => {
  w = w.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const m = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, m ? m.length : 1);
};
const words = (t) => String(t || '').replace(/[“”"()…—–]/g, ' ').split(/\s+/).map((w) => w.replace(/[^A-Za-z’'-]/g, '')).filter((w) => /[a-z]/i.test(w));
export function grade(text) {
  const ws = words(text); if (!ws.length) return 0;
  const sentences = Math.max(1, (String(text).match(/[.?!]+(\s|$)/g) || []).length);
  const sy = ws.reduce((a, w) => a + syl(w), 0);
  return Math.max(0, Math.min(16, 0.39 * (ws.length / sentences) + 11.8 * (sy / ws.length) - 15.59));
}
export function hardWords(text) { return words(text).filter((w) => !/^[A-Z]/.test(w) && syl(w) >= 4); }
/** text a learner must read for this question: the question, the answers and any card shown with it */
export function readText(Q) {
  const parts = [Q.q, Q.word, ...(Q.o || []).map(String), ...(Q.items || []).map((x) => (Array.isArray(x) ? x[0] : x)), ...((Q.v && Q.v.lines) || []), ...(Q.cursive || [])];
  return parts.filter(Boolean).join('. ');
}
export function difficulty(Q) {
  if (typeof Q.diff === 'number') return Q.diff * 3;   // hand-levelled items (K–2 banks)
  const t = readText(Q);
  const nums = (String(Q.q).match(/\d[\d,.]*/g) || []).map((n) => parseFloat(n.replace(/,/g, ''))).filter(Number.isFinite);
  const big = nums.length ? Math.log10(1 + Math.max(...nums.map(Math.abs))) : 0;
  const steps = (Q.items ? Q.items.length : 0) + (Q.type === 'budget' ? 3 : 0) + (Q.type === 'number' ? 1 : 0) + (Q.type === 'trace' && Q.word ? Q.word.length * 0.4 : 0);
  return grade(t) + big * 1.5 + steps * 0.3 + hardWords(t).length * 0.8 + (Q.dok ? (Q.dok - 1) * 3 : 0);   // depth: recall < apply < reason
}
