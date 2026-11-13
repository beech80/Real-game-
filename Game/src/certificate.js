// REAL — a certificate of learning the child can print: their name, what they can do now, the date, signed by Heart.
import { heartSVG, medalSVG } from './art.js';
import { lang } from './i18n.js';
import { h, UI } from './ui.js';

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function certificateHTML(G) {
  const s = G.state, es = lang() === 'es';
  const rows = [
    [G.edu.masteredCount(), es ? 'habilidades dominadas' : 'skills mastered'],
    [G.edu.proficientCount(), es ? 'habilidades que hace solo' : 'skills done without help'],
    [s.stats.lessons || 0, es ? 'lecciones' : 'lessons'],
    [(s.words || []).length, es ? 'palabras nuevas' : 'new words'],
    [(s.streak || {}).best || 0, es ? 'días seguidos (mejor racha)' : 'days in a row (best streak)'],
  ].filter(([n]) => n > 0);
  const date = new Date().toLocaleDateString(es ? 'es' : 'en', { year: 'numeric', month: 'long', day: 'numeric' });
  return `<div class="cert"><div class="cert-in">
<div class="cert-art">${medalSVG('gold')}</div>
<div class="cert-k">${es ? 'CERTIFICADO DE APRENDIZAJE' : 'CERTIFICATE OF LEARNING'}</div>
<div class="cert-to">${es ? 'Este certificado es para' : 'This certificate goes to'}</div>
<div class="cert-name">${esc(s.name)}</div>
<div class="cert-for">${es ? 'por aprender y crecer en REAL' : 'for learning and growing in REAL'}</div>
<div class="cert-rows">${rows.length ? rows.map(([n, t]) => `<div><b>${n}</b><span>${t}</span></div>`).join('') : `<div><span>${es ? '¡Tu aventura apenas empieza!' : 'Your adventure is just beginning!'}</span></div>`}</div>
<div class="cert-foot"><div><span class="cert-heart">${heartSVG('cheer')}</span><i>Heart</i><small>${es ? 'tu guía de lectura' : 'your reading guide'}</small></div><div><b>${date}</b><small>REAL · Learn · Live · Grow</small></div></div>
</div></div>`;
}
const CSS = `.cert{font-family:Georgia,'Times New Roman',serif;color:#2a2140;background:#fffaf0;border:6px solid #2a2140;border-radius:18px;padding:10px;max-width:760px;margin:0 auto}
.cert-in{border:2px dashed #e6a100;border-radius:12px;padding:22px 20px;text-align:center}
.cert-art{width:86px;height:86px;margin:0 auto 4px}.cert svg{width:100%;height:100%;display:block;overflow:visible}
.cert-k{letter-spacing:.22em;font-weight:700;font-size:17px;color:#b8692e}.cert-to{margin-top:14px;font-size:15px}
.cert-name{font-size:40px;font-weight:700;margin:6px 0;border-bottom:2px solid #2a2140;display:inline-block;padding:0 22px 4px}.cert-for{font-size:16px;margin-bottom:14px}
.cert-rows{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:10px 0 18px}.cert-rows div{background:#fff;border:2px solid #2a2140;border-radius:12px;padding:8px 14px;min-width:120px}
.cert-rows b{display:block;font-size:28px}.cert-rows span{font-size:13.5px}
.cert-foot{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;text-align:center}.cert-foot>div{flex:1}.cert-heart{display:inline-block;width:56px;height:56px}
.cert-foot i{display:block;font-size:22px;font-family:'Brush Script MT',cursive}.cert-foot small{display:block;font-size:12px;color:#5b4a8a}.cert-foot b{display:block;font-size:16px;margin-bottom:4px}`;
/** show the certificate, with a Print button (opens a clean page to print or save as PDF) */
export function showCertificate(G) {
  const es = lang() === 'es', html = certificateHTML(G);
  return UI.sheet(es ? 'Mi certificado' : 'My certificate', () => {
    const box = h('div', { class: 'cert-wrap' }); box.innerHTML = `<style>${CSS}</style>${html}`;
    return h('div', { class: 'act' }, box,
      h('button', { class: 'primary', onclick: () => {
        const page = `<!doctype html><meta charset="utf-8"><title>REAL · ${esc(G.state.name)}</title><style>body{margin:24px;background:#fff}${CSS}@page{margin:12mm}</style>${html}`;
        let w = null; try { w = window.open('', '_blank'); } catch (e) {}
        if (w) { w.document.write(page); w.document.close(); setTimeout(() => { try { w.print(); } catch (e) {} }, 500); }
        else UI.toast(es ? 'No se pudo abrir la página para imprimir. Toma una captura de pantalla.' : 'Could not open the print page here. Take a screenshot instead.', 'info', 5000);
      } }, es ? '🖨️ Imprimir o guardar' : '🖨️ Print or save'));
  }, { icon: '📜' });
}
