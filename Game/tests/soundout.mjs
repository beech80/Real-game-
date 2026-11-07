// Sound-it-out splitting: one-syllable words split into sounds (graphemes), longer words into syllables,
// using the rules a K–2 reading specialist expects (closed syllables, ck/x, suffixes, -ed, vowel-vowel splits).
import fs from 'fs';
const src = fs.readFileSync(new URL('../src/readalong.js', import.meta.url), 'utf8');
const body = src.slice(src.indexOf('const DIGRAPH'), src.indexOf('// how to make the device voice')).replace(/export /g, '');
const { chunks, sounds } = new Function(body + '; return { chunks, sounds };')();
const SYL = { banana: 'ba·nan·a', table: 'ta·ble', little: 'lit·tle', basket: 'bas·ket', seven: 'sev·en', lemon: 'lem·on', nickel: 'nick·el', pocket: 'pock·et', jumping: 'jump·ing', boxes: 'box·es',
  playing: 'play·ing', jumped: 'jumped', asked: 'asked', helped: 'helped', wanted: 'want·ed', lion: 'li·on', giant: 'gi·ant', baby: 'ba·by', happy: 'hap·py', rabbit: 'rab·bit', sunset: 'sun·set',
  napkin: 'nap·kin', pencil: 'pen·cil', tiger: 'ti·ger', robot: 'ro·bot', music: 'mu·sic', apartment: 'a·part·ment', simple: 'sim·ple', hopeful: 'hope·ful', cat: 'cat', make: 'make', ship: 'ship' };
const SND = { cat: 'c·a·t', ship: 's​h'.replace('​', '') + '·i·p', fish: 'f·i·sh', rain: 'r·ai·n', cake: 'c·a·ke', night: 'n·igh·t', chick: 'ch·i·ck', boat: 'b·oa·t', star: 's·t·ar', frog: 'f·r·o·g' };
const bad = [];
for (const [w, want] of Object.entries(SYL)) { const got = chunks(w).join('·'); if (got !== want) bad.push(`chunks(${w}) = ${got}, want ${want}`); }
for (const [w, want] of Object.entries(SND)) { const got = sounds(w).join('·'); if (got !== want) bad.push(`sounds(${w}) = ${got}, want ${want}`); }
for (const b of bad) console.log(b);
console.log(bad.length ? 'SOUNDOUT FAILED' : `SOUNDOUT PASSED (${Object.keys(SYL).length + Object.keys(SND).length} words)`);
process.exit(bad.length ? 1 : 0);
