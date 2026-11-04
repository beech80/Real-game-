// Loads the exported Fox GLB in three.js (headless Chromium/WebGL) to verify skinning, clips and morphs outside Blender.
// usage: node Tests/web_glb_check.js <three_node_modules_dir>
const {chromium}=require('playwright'); const http=require('http'); const fs=require('fs'); const path=require('path');
const ROOT=path.resolve(__dirname,'..'); const THREE=process.argv[2];
const types={'.html':'text/html','.js':'text/javascript','.glb':'model/gltf-binary'};
const srv=http.createServer((q,res)=>{ let u=decodeURIComponent(q.url.split('?')[0]);
  let f=u.startsWith('/three/')? path.join(THREE,'three',u.slice(7)) : path.join(ROOT,u);
  fs.readFile(f,(e,b)=>{ if(e){res.writeHead(404);return res.end();} res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'}); res.end(b);});
}).listen(8765, async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']}); const p=await b.newPage({viewport:{width:640,height:760}});
  const shots=[['Walk',0.27,''],['Run',0.2,''],['Idle',0.5,'Happy'],['Wave',0.8,'Surprised']]; let report=null;
  for(const [clip,t,expr] of shots){
    await p.goto(`http://localhost:8765/Tests/web/glb_check.html?f=/Blender/Exports/Characters/SK_REAL_Fox.glb&clip=${clip}&t=${t}&expr=${expr}`);
    await p.waitForFunction(()=>window.__out,null,{timeout:60000}); report=await p.evaluate(()=>window.__out);
    await p.screenshot({path:path.join(ROOT,'Tests','reports',`web_fox_${clip}.png`)});
  }
  fs.writeFileSync(path.join(ROOT,'Tests','reports','web_glb_check.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({ok:report.ok,error:report.error,bones:report.bones,skinned:report.skinned,clips:report.clips.length,morphs:report.morphs.length}));
  await b.close(); srv.close(); process.exit(report.ok?0:1);
});
