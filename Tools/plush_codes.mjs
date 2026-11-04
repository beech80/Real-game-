// Print tag codes for plush companions: node Tools/plush_codes.mjs <species> <count> [startSerial]
import { makeCode, PLUSH_KINDS } from '../Game/src/plush.js';
const [kind = 'fox', count = '20', start = '1'] = process.argv.slice(2);
const k = PLUSH_KINDS.indexOf(kind);
if (k < 0) { console.error('species must be one of: ' + PLUSH_KINDS.join(', ')); process.exit(1); }
for (let i = 0; i < +count; i++) console.log('REAL-' + makeCode(k, +start + i));
