// REAL — school basics, with no accounts and no server (student data never leaves the device unless a student
// hands their report code to their teacher):
//  * School mode: smart (AI) character replies and live neighbors off, "Read to me" offered, a teacher PIN locks
//    the setting. Turn on in Settings › For grown-ups, or open the game with #school=CLASSCODE in the link.
//  * Progress report: per subject and per skill, with the standards each skill practises. Printable, and as a short
//    report code the student can paste into the teacher's dashboard.
//  * Teacher dashboard (title screen › For teachers): paste the class's report codes to see everyone at once,
//    skill-by-skill and standard-by-standard, and download a CSV. Saved only on the teacher's device.
import { h, UI } from './ui.js';
import { SKILLS, SUBJECTS } from './edu.js';
import { STANDARDS, GRADES, FRAMEWORKS } from './standards.js';

const IDS = Object.keys(SKILLS);                       // fixed order: a report code stores one digit per skill
const ST = ['Not started', 'Discovered', 'Developing', 'Proficient', 'Mastered'];
const b64 = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

// ------------------------------------------------------------------------------------------- school mode
export function schoolFromLink() {
  const m = (location.hash + '&' + location.search).match(/[#?&]school=([A-Za-z0-9-]{1,20})/);
  return m ? m[1].toUpperCase() : null;
}
export const isSchool = (s) => !!(s && s.school && s.school.on);
/** Turn school mode on for this save (class code optional). Applies the safe settings. */
export function enableSchool(G, classCode, pin) {
  const s = G.state; s.settings = s.settings || {};
  s.school = { ...(s.school || {}), on: true, cls: (classCode || (s.school && s.school.cls) || '').toUpperCase().slice(0, 20), pin: pin || (s.school && s.school.pin) || '' };
  s.settings.smart = false; s.settings.noNeighbors = true; s.settings.mic = false;
  G.hooks.applyA11y(s.settings); G.save();
}
export function disableSchool(G) { const s = G.state; if (s.school) s.school.on = false; G.save(); }

// ------------------------------------------------------------------------------------------- the report
export function reportData(G) {
  const s = G.state;
  return { v: 1, n: (s.school && s.school.nick) || s.name || 'Student', c: (s.school && s.school.cls) || '', d: s.day, ll: G.life().level,
    m: Math.round((s.stats.playSecs || 0) / 60), l: s.stats.lessons || 0, w: (s.words || []).length,
    k: IDS.map((id) => Math.min(4, G.edu.state(id))).join(''), t: new Date().toISOString().slice(0, 10) };
}
// a checksum makes casual edits to a report code visible on the teacher's dashboard (it is not cryptographic security)
const sum = (t) => { let h1 = 0x811c9dc5; for (const c of 'REAL·report·' + t) { h1 ^= c.charCodeAt(0); h1 = Math.imul(h1, 16777619) >>> 0; } return h1.toString(36); };
export const reportCode = (G) => { const d = reportData(G); d.s = sum(JSON.stringify({ ...d, s: undefined })); return 'REAL1-' + b64(JSON.stringify(d)); };
export function parseCode(code) {
  try { const m = String(code).trim().match(/^REAL1-([A-Za-z0-9_-]+)$/); if (!m) return null; const d = JSON.parse(unb64(m[1])); if (!(d && d.v === 1 && typeof d.k === 'string')) return null; d.edited = !d.s || d.s !== sum(JSON.stringify({ ...d, s: undefined, edited: undefined })); return d; } catch (e) { return null; }
}
const skillStates = (d) => Object.fromEntries(IDS.map((id, i) => [id, +(d.k[i] || 0)]));
function subjectRows(states) {
  return Object.entries(SUBJECTS).map(([k, sb]) => {
    const list = IDS.filter((id) => SKILLS[id].subj === k);
    const n = (min) => list.filter((id) => states[id] >= min).length;
    return { k, name: sb.name, icon: sb.icon, total: list.length, started: n(1), developing: list.filter((id) => states[id] === 2).length, proficient: n(3), mastered: n(4) };
  });
}

/** The student's progress report: printable, with a report code for the teacher. */
export function reportView(G) {
  const d = reportData(G), states = skillStates(d), code = reportCode(G);
  const box = h('div', { class: 'act report' },
    h('p', { class: 'lead' }, `${d.n}'s learning report`),
    h('p', { class: 'tip' }, `Day ${d.d} in the game · Life Level ${d.ll} · about ${d.m} minutes played · ${d.l} lessons · ${d.w} words learned${d.c ? ' · class ' + d.c : ''}`),
    h('table', { class: 'rtable' }, h('tr', {}, h('th', {}, 'Subject'), h('th', {}, 'Started'), h('th', {}, 'Proficient'), h('th', {}, 'Mastered')),
      subjectRows(states).map((r) => h('tr', {}, h('td', {}, `${r.icon} ${r.name}`), h('td', {}, `${r.started}/${r.total}`), h('td', {}, r.proficient), h('td', {}, r.mastered)))),
    h('div', { class: 'tier-h' }, 'For your teacher'),
    h('p', { class: 'tip' }, 'Copy this report code and give it to your teacher. It has no personal information, only your nickname and skill progress.'),
    h('textarea', { class: 'writebox codebox', rows: 3, readonly: true }, code),
    h('div', { class: 'row' },
      h('button', { class: 'primary sm', onclick: async () => { try { await navigator.clipboard.writeText(code); UI.toast('Report code copied.', 'good'); } catch (e) { const t = box.querySelector('.codebox'); t.select(); UI.toast('Select the code and copy it.', 'info'); } } }, 'Copy code'),
      h('button', { class: 'ghost sm', onclick: () => printReport(d) }, '🖨️ Print report')),
    h('div', { class: 'tier-h' }, 'Skills and standards'),
    h('div', { class: 'rskills' }, IDS.filter((id) => states[id] >= 1).sort((a, b) => states[b] - states[a]).map((id) => skillLine(id, states[id], false))));
  return box;
}
const skillLine = (id, st, teacher = true) => h('div', { class: 'rskill st' + st }, h('b', {}, SKILLS[id].name), h('span', { class: 'rst' }, ST[st]), h('small', {}, `${SUBJECTS[SKILLS[id].subj].name}${teacher ? ' · typical grades ' + GRADES[SKILLS[id].band] : ''} · ${(STANDARDS[id] || []).join(', ')}`));   // students never see grade labels

function printReport(d) {
  const states = skillStates(d);
  const rows = subjectRows(states).map((r) => `<tr><td>${r.icon} ${r.name}</td><td>${r.started}/${r.total}</td><td>${r.proficient}</td><td>${r.mastered}</td></tr>`).join('');
  const skills = IDS.filter((id) => states[id] >= 1).map((id) => `<tr><td>${SKILLS[id].name}</td><td>${SUBJECTS[SKILLS[id].subj].name}</td><td>${ST[states[id]]}</td><td>${GRADES[SKILLS[id].band]}</td><td>${(STANDARDS[id] || []).join('<br>')}</td></tr>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><title>REAL report · ${esc(d.n)}</title><style>body{font:14px system-ui;margin:24px;color:#111}table{border-collapse:collapse;width:100%;margin:10px 0 20px}td,th{border:1px solid #ccc;padding:5px 7px;text-align:left;vertical-align:top}th{background:#f2f0ea}h1{font-size:22px}small{color:#555}</style>
<h1>REAL learning report: ${esc(d.n)}</h1><p>${d.c ? 'Class ' + esc(d.c) + ' · ' : ''}Report date ${d.t} · Day ${d.d} in the game · Life Level ${d.ll} · about ${d.m} minutes · ${d.l} lessons · ${d.w} words learned</p>
<table><tr><th>Subject</th><th>Started</th><th>Proficient</th><th>Mastered</th></tr>${rows}</table>
<h2>Skills practised</h2><table><tr><th>Skill</th><th>Subject</th><th>Level</th><th>Grades</th><th>Standards (draft alignment)</th></tr>${skills}</table>
<p><small>Proficient: correct without hints in more than one place. Mastered: used correctly, without hints, in different places on different days. Speed is never measured. Standards are a draft alignment for educator review.</small></p>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => { try { w.print(); } catch (e) {} }, 400); }
  else download(`REAL-report-${d.n}.html`, html, 'text/html');
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function download(name, text, type) {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name }); document.body.append(a); a.click(); setTimeout(() => a.remove(), 500);
}

// ------------------------------------------------------------------------------------------- teacher dashboard
const TKEY = 'real.teacher.v1';
const loadClass = () => { try { return JSON.parse(localStorage.getItem(TKEY) || '[]'); } catch (e) { return []; } };
const saveClass = (list) => { try { localStorage.setItem(TKEY, JSON.stringify(list)); } catch (e) {} };
/** Add report codes (any text containing them); the newest report per nickname+class wins. */
export function addCodes(text) {
  const found = (String(text).match(/REAL1-[A-Za-z0-9_-]+/g) || []).map(parseCode).filter(Boolean);
  const list = loadClass();
  for (const d of found) { const i = list.findIndex((x) => x.n === d.n && x.c === d.c); if (i >= 0) { if ((list[i].t || '') <= (d.t || '')) list[i] = d; } else list.push(d); }
  saveClass(list); return found.length;
}
export function teacherDashboard() {
  return UI.sheet('Teacher dashboard', (close, body) => {
    const draw = () => {
      const list = loadClass();
      const ta = h('textarea', { class: 'writebox', rows: 3, placeholder: 'Paste report codes here (REAL1-…). You can paste many at once.' });
      const all = list.map((d) => ({ d, st: skillStates(d) }));
      const subj = Object.entries(SUBJECTS);
      const table = list.length ? h('div', { class: 'tscroll' }, h('table', { class: 'rtable tdash' },
        h('tr', {}, h('th', {}, 'Student'), h('th', {}, 'Class'), h('th', {}, 'Mins'), h('th', {}, 'Lessons'), h('th', {}, 'Words'), ...subj.map(([, s]) => h('th', { title: s.name }, s.icon))),
        all.map(({ d, st }) => h('tr', { class: 'trow', onclick: () => student(d) }, h('td', {}, h('b', {}, d.n), d.edited ? h('span', { class: 'warnline', title: 'This report code was changed after the game made it.' }, ' ⚠ edited') : null), h('td', {}, d.c || ''), h('td', {}, d.m), h('td', {}, d.l), h('td', {}, d.w),
          ...subjectRows(st).map((r) => h('td', { class: 'heat' + (r.proficient ? ' on' : ''), style: r.proficient ? { background: `rgba(80,190,120,${(0.35 + 0.6 * r.proficient / r.total).toFixed(2)})` } : null, title: `${r.name}: ${r.proficient} of ${r.total} proficient` }, `${r.proficient}/${r.total}`)))))) : h('p', { class: 'tip' }, 'No students yet. Each student opens 📱 Settings › For grown-ups › Progress report and copies their report code.');
      // standards: how many students are proficient in skills aligned to each standard
      const std = {}; for (const id of IDS) for (const c of STANDARDS[id] || []) { std[c] = std[c] || { ids: [], n: 0 }; std[c].ids.push(id); }
      for (const c of Object.keys(std)) std[c].n = all.filter(({ st }) => std[c].ids.every((id) => st[id] >= 3)).length;   // met only when every aligned skill is proficient
      const stdRows = Object.entries(std).filter(([, v]) => v.n > 0).sort((a, b) => b[1].n - a[1].n).slice(0, 60);
      body.replaceChildren(h('div', { class: 'act' },
        h('p', { class: 'lead' }, `Class progress: ${list.length} student${list.length === 1 ? '' : 's'}`),
        h('p', { class: 'tip' }, 'Saved only on this device. Students share a short report code with you; no names or accounts are needed.'),
        ta, h('div', { class: 'row' },
          h('button', { class: 'primary sm', onclick: () => { const n = addCodes(ta.value); UI.toast(n ? `Added ${n} report${n === 1 ? '' : 's'}.` : 'No report codes found in that text.', n ? 'good' : 'warn'); draw(); } }, 'Add reports'),
          list.length ? h('button', { class: 'ghost sm', onclick: () => download('REAL-class.csv', toCSV(list), 'text/csv') }, '⬇️ CSV') : null,
          list.length ? h('button', { class: 'danger sm', onclick: (e) => { if (e.currentTarget.dataset.arm) { saveClass([]); draw(); } else { e.currentTarget.dataset.arm = 1; e.currentTarget.textContent = 'Tap again to clear'; } } }, 'Clear class') : null),
        table,
        list.length ? h('div', { class: 'tier-h' }, 'Standards: students proficient') : null,
        list.length ? h('div', { class: 'tscroll' }, h('table', { class: 'rtable' }, h('tr', {}, h('th', {}, 'Standard'), h('th', {}, 'Skills'), h('th', {}, 'Students proficient in all its skills')),
          stdRows.map(([c, v]) => h('tr', {}, h('td', {}, c), h('td', {}, v.ids.map((id) => SKILLS[id].name).join(', ')), h('td', {}, `${v.n}/${list.length}`))))) : null,
        h('details', { class: 'tip' }, h('summary', {}, 'About the standards'), h('ul', { class: 'list' }, Object.values(FRAMEWORKS).map((f) => h('li', {}, f))), h('p', {}, 'Each skill is aligned to the standard(s) it practises. This is a draft alignment for educator review.')),
        h('div', { class: 'tier-h' }, 'School mode'),
        h('p', { class: 'tip' }, 'In school mode, AI character replies and live neighbors are off. Add #school=YOURCLASS to the end of the game link to turn it on for everyone who opens it, or turn it on in each game: 📱 Settings › For grown-ups.')));
    };
    const student = (d) => { const st = skillStates(d); body.replaceChildren(h('div', { class: 'act' }, h('button', { class: 'ghost sm', onclick: draw }, '‹ Class'), h('p', { class: 'lead' }, `${d.n}${d.c ? ' · ' + d.c : ''}`),
      h('p', { class: 'tip' }, `Report ${d.t} · Day ${d.d} · Life Level ${d.ll} · ${d.m} minutes · ${d.l} lessons · ${d.w} words`),
      h('button', { class: 'ghost sm', onclick: () => printReport(d) }, '🖨️ Print report'),
      h('div', { class: 'rskills' }, IDS.filter((id) => st[id] >= 1).sort((a, b) => st[b] - st[a]).map((id) => skillLine(id, st[id]))))); };
    draw();
    return h('div');
  }, { icon: '👩‍🏫', cls: 'wide' });
}
function toCSV(list) {
  const head = ['nickname', 'class', 'report_date', 'game_day', 'life_level', 'minutes', 'lessons', 'words', ...Object.values(SUBJECTS).map((s) => s.name + ' proficient'), ...IDS];
  const rows = list.map((d) => { const st = skillStates(d); return [d.n, d.c, d.t, d.d, d.ll, d.m, d.l, d.w, ...subjectRows(st).map((r) => r.proficient), ...IDS.map((id) => ST[st[id]])]; });
  return [head, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

// ------------------------------------------------------------------------------------------- settings page for grown-ups
export function schoolSettings(G, reopen) {
  const s = G.state, on = isSchool(s);
  const nick = h('input', { class: 'writebox', maxlength: 24, placeholder: 'Nickname (no last names)', value: (s.school && s.school.nick) || s.name || '' });
  const cls = h('input', { class: 'writebox', maxlength: 20, placeholder: 'Class code (optional)', value: (s.school && s.school.cls) || '' });
  const pin = h('input', { class: 'writebox', maxlength: 6, inputmode: 'numeric', placeholder: on ? 'Teacher PIN to turn off' : 'Teacher PIN (optional, 4–6 digits)' });
  return h('div', { class: 'school-set' },
    h('div', { class: 'tier-h' }, 'School'),
    h('p', { class: 'tip' }, on ? `School mode is ON${s.school.cls ? ' · class ' + s.school.cls : ''}. AI replies, the microphone and live neighbors are off.` : 'School mode turns off AI character replies, the microphone (speech goes through the browser’s speech service) and live neighbors. A teacher PIN keeps it on.'),
    nick, cls, pin,
    h('div', { class: 'row' },
      h('button', { class: 'primary sm', onclick: () => {
        s.school = { ...(s.school || {}), nick: nick.value.trim().slice(0, 24), cls: cls.value.trim().toUpperCase().slice(0, 20) };
        if (on) { if (s.school.pin && pin.value !== s.school.pin) return UI.toast('That PIN is not right.', 'warn'); disableSchool(G); UI.toast('School mode off.', 'info'); }
        else { if (pin.value && !/^\d{4,6}$/.test(pin.value)) return UI.toast('Use 4 to 6 digits for the PIN.', 'warn'); enableSchool(G, s.school.cls, pin.value); UI.toast('School mode on.', 'good'); }
        reopen();
      } }, on ? 'Turn school mode off' : 'Turn school mode on'),
      h('button', { class: 'ghost sm', onclick: () => { s.school = { ...(s.school || {}), nick: nick.value.trim().slice(0, 24), cls: cls.value.trim().toUpperCase().slice(0, 20) }; G.save(); UI.sheet('Progress report', () => reportView(G), { icon: '📋' }); } }, '📋 Progress report')));
}
