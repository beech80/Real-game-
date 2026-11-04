// REAL — plush companion tag codes. Format REAL-XXXXXX (6 chars from a 32-letter alphabet, no 0/O/1/I).
// Char 1 encodes the species, chars 2–5 are the serial, char 6 is a weighted check digit.
// Codes are verified on the device only; nothing is sent anywhere.
export const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const PLUSH_KINDS = ['fox', 'cat', 'dog', 'horse', 'bird', 'elephant', 'lion', 'cow', 'dolphin'];
const check = (s) => ALPHA[[...s].reduce((a, ch, i) => a + (ALPHA.indexOf(ch) + 1) * (i * 7 + 3), 0) % 32];
export function makeCode(kindIndex, serial) {
  let body = ALPHA[kindIndex], n = serial;
  for (let i = 0; i < 4; i++) { body += ALPHA[n % 32]; n = Math.floor(n / 32); }
  return body + check(body);
}
export function readCode(code) {
  const c = String(code || '').toUpperCase().replace(/^REAL-?/, '');
  if (c.length !== 6 || [...c].some((ch) => !ALPHA.includes(ch))) return null;
  if (check(c.slice(0, 5)) !== c[5]) return null;
  const k = ALPHA.indexOf(c[0]); if (k >= PLUSH_KINDS.length) return null;
  return { kind: PLUSH_KINDS[k], code: 'REAL-' + c };
}
