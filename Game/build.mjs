// REAL game build: bundle (esbuild) -> dist/ (installable PWA) + dist/artifact.html (hosted page fragment).
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

await build({
  entryPoints: [path.join(root, 'src/main.js')], bundle: true, minify: true, format: 'esm', target: ['es2020', 'safari15'],
  outfile: path.join(dist, 'game.js'), legalComments: 'none', logLevel: 'warning',
});

const css = fs.readFileSync(path.join(root, 'src/style.css'), 'utf8');
const frag = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8').replace('/*__CSS__*/', css);
// Hosted artifact page: fragment only (the host adds doctype/head/body).
const bundle = fs.readFileSync(path.join(dist, 'game.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
fs.writeFileSync(path.join(dist, 'artifact.html'), frag.replace('<script type="module" src="game.js"></script>', () => `<script>window.__REAL_B64 = true;</script><script type="module">${bundle}</script>`));
// Standalone installable app.
const full = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png"><link rel="apple-touch-icon" href="icons/icon-192.png">
${frag}
<script>if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));</script>
</body></html>`;
fs.writeFileSync(path.join(dist, 'index.html'), full);

const cp = (src, dst) => { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.cpSync(src, dst, { recursive: true }); };
cp(path.join(root, 'public'), dist);
// service worker with a precache list (offline play after first load)
const files = [];
const walk = (d, rel = '') => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f), r = rel + f; if (fs.statSync(p).isDirectory()) walk(p, r + '/'); else if (!/^(sw\.js|artifact\.html|REAL-offline\.html)$/.test(r) && !r.startsWith('voice/')) files.push(r); } };
walk(dist);
const version = Date.now().toString(36);
fs.writeFileSync(path.join(dist, 'sw.js'), `const C='real-${version}';const F=${JSON.stringify(['./', ...files])};
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(res.ok&&/\\/voice\\//.test(e.request.url)){const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp));}return res;})));});`);   // narrator packs: cached as they're used
// base64 text copies of the binary assets for the hosted (artifact) build
const hostedDir = path.join(root, 'dist-hosted');
fs.rmSync(hostedDir, { recursive: true, force: true });
const walkGz = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walkGz(p); else if (f.endsWith('.gz')) {
  const rel = path.relative(dist, p).replace(/\.gz$/, '.b64.txt'), out = path.join(hostedDir, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, fs.readFileSync(p).toString('base64')); } } };
walkGz(path.join(dist, 'assets'));
fs.copyFileSync(path.join(dist, 'artifact.html'), path.join(hostedDir, 'index.html'));
fs.copyFileSync(path.join(dist, 'assets', 'world.json'), path.join(hostedDir, 'assets', 'world.json'));
if (fs.existsSync(path.join(dist, 'voice'))) fs.cpSync(path.join(dist, 'voice'), path.join(hostedDir, 'voice'), { recursive: true });   // recorded narrator packs
// one-file offline copy: the whole game and every asset in a single page you can save and open with no internet
{
  const pack = {};
  const walkPack = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walkPack(p); else if (f.endsWith('.gz')) pack[path.relative(dist, p).split(path.sep).join('/')] = fs.readFileSync(p).toString('base64'); } };
  walkPack(path.join(dist, 'assets'));
  pack['assets/world.json'] = fs.readFileSync(path.join(dist, 'assets', 'world.json'), 'utf8');
  const packJs = `window.__REAL_PACK=${JSON.stringify(pack)};window.__REAL_OFFLINE=true;`.replace(/<\/script/gi, '<\\/script');
  const one = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<title>REAL (offline copy)</title>
${frag.replace('<script type="module" src="game.js"></script>', () => `<script>${packJs}</script><script type="module">${bundle}</script>`)}
</body></html>`;
  fs.writeFileSync(path.join(dist, 'REAL-offline.html'), one);
  fs.copyFileSync(path.join(dist, 'REAL-offline.html'), path.join(hostedDir, 'REAL-offline.html'));
}
const size = (f) => (fs.statSync(path.join(dist, f)).size / 1024).toFixed(0) + ' KB';
console.log('built', { game: size('game.js'), page: size('index.html'), files: files.length });
