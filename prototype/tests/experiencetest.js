// Functional checks for the Convene Experience (the scroll-driven 3D page).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
const THREE_LOCAL = process.env.THREE_LOCAL || path.resolve(__dirname,'three.min.js');
const PAGE = 'file://'+path.resolve(process.env.EXP_PAGE || 'wrapped-experience.html');
const CDN='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
let pass=0,fail=0; const ok=(c,m)=>c?pass++:(fail++,console.log('  FAIL: '+m));
async function open(b, opts={}){
  const ctx=await b.newContext({viewport:opts.vp||{width:1440,height:900}, reducedMotion:opts.rm?'reduce':'no-preference'});
  const pg=await ctx.newPage(); pg.errs=[];
  pg.on('pageerror',e=>pg.errs.push(e.message));
  await pg.route(CDN, r=> opts.nogl ? r.abort() : r.fulfill({path:THREE_LOCAL,contentType:'application/javascript'}));
  await pg.route(/fonts\.(googleapis|gstatic)\.com/, r=>r.abort());
  await pg.goto(PAGE);
  await pg.waitForFunction(()=>window.__exp && __exp.loaderDone(),{timeout:20000});
  return pg;
}
const settle = async pg => { await pg.waitForTimeout(120); await pg.waitForFunction(()=>__exp.settled, {timeout:8000}); await pg.waitForTimeout(80); };
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});

 // ── the timeline
 let pg=await open(b);
 ok(await pg.evaluate(()=>__exp.gl), 'WebGL scene is built');
 await pg.waitForTimeout(700);
 ok(await pg.evaluate(()=>document.getElementById('loader').hidden), 'loader is gone after start');
 const keys=await pg.evaluate(()=>__exp.keys);
 ok(keys.every((k,i)=>i===0||k[0]>=keys[i-1][0]) && keys.at(-1)[1]===5, 'keys rise monotonically to 5');
 const f=await pg.evaluate(()=>{ const o=[]; for(let y=0;y<=document.documentElement.scrollHeight;y+=37) o.push(__exp.fOf(y)); return o; });
 ok(f.every((v,i)=>i===0||v>=f[i-1]-1e-9), 'scroll → f never runs backwards');
 const sec=await pg.evaluate(()=>__exp.sec);
 for(const [name,want] of [['manifesto',2],['gallery',3],['lab',4]]){
   ok(Math.abs(await pg.evaluate(y=>__exp.fOf(y),sec[name])-want)<1e-6, name+' starts at f='+want);
 }

 // ── the gallery: each card can be scrolled to, and the caption follows
 for(const i of [0,3,8]){
   await pg.evaluate(i=>scrollTo(0,__exp.scrollForCard(i)),i); await settle(pg);
   ok(await pg.evaluate(()=>__exp.caption)===i, 'caption names card '+i);
   ok(await pg.evaluate(i=>__exp.cardAlpha(i),i)>0.9, 'card '+i+' is fully visible when in front');
 }
 ok(await pg.evaluate(()=>__exp.cardAlpha(0))<0.01, 'passed cards are gone');

 // next/prev
 await pg.evaluate(()=>scrollTo(0,__exp.scrollForCard(2))); await settle(pg);
 await pg.click('#cap-next'); await pg.waitForTimeout(1800); await settle(pg);
 ok(await pg.evaluate(()=>__exp.caption)===3, 'Next moves to the following gathering');
 await pg.click('#cap-prev'); await pg.waitForTimeout(1800); await settle(pg);
 ok(await pg.evaluate(()=>__exp.caption)===2, 'Previous moves back');

 // ── category filters
 await pg.click('#cats button[data-k="Running"]'); await pg.waitForTimeout(1800); await settle(pg);
 ok(JSON.stringify(await pg.evaluate(()=>__exp.matchList()))==='[4,6,7]', 'Running now = feria, repair, bairro');
 ok(await pg.evaluate(()=>__exp.caption)===4, 'filter travels to the first match');
 ok(await pg.evaluate(()=>document.querySelector('#cats [data-k="Running"]').getAttribute('aria-pressed'))==='true', 'the chosen filter is pressed');
 ok(/3 gatherings: running now/.test(await pg.textContent('#live')), 'filter is announced');
 await pg.click('#cap-next'); await pg.waitForTimeout(1800); await settle(pg);
 ok(await pg.evaluate(()=>__exp.caption)===6, 'Next skips gatherings the filter hides');

 // ── the ask box
 const P = t => pg.evaluate(t=>{ const q=__exp.parseAsk(t); return {langs:q.langs,kind:q.kind,running:q.running,alone:q.alone,door:q.door,name:q.name,empty:q.empty}; }, t);
 let q=await P('something in Spanish for the kids');
 ok(q.langs.join()==='ES' && q.kind==='Family', 'Spanish + kids → ES, Family');
 q=await P("I'm going on my own, want someone on the door"); ok(q.alone && q.door, 'alone + door');
 q=await P('lantern'); ok(q.name==='lantern', 'a name is found');
 q=await P('what is running right now'); ok(q.running, 'running now');
 q=await P('blah'); ok(q.empty, 'nonsense is recognised as empty');
 await pg.fill('#ask-in','spanish'); await pg.press('#ask-in','Enter'); await pg.waitForTimeout(1800); await settle(pg);
 ok(JSON.stringify(await pg.evaluate(()=>__exp.matchList()))==='[4,5]', 'Spanish → feria, screening');
 ok(/2 gatherings are in Spanish/.test(await pg.textContent('#ask-reply')), 'honest reply: '+await pg.textContent('#ask-reply'));
 ok(await pg.evaluate(()=>document.querySelectorAll('#cats [aria-pressed=true]').length)===0, 'ask releases the category filter');
 await pg.fill('#ask-in','german family'); await pg.press('#ask-in','Enter'); await pg.waitForTimeout(300);
 ok(/Nothing is/.test(await pg.textContent('#ask-reply')), 'no match is said plainly');
 ok(JSON.stringify(await pg.evaluate(()=>__exp.matchList()))==='[4,5]', 'and keeps the last result');
 await pg.fill('#ask-in','zzz'); await pg.press('#ask-in','Enter'); await pg.waitForTimeout(200);
 ok(/didn’t catch/.test(await pg.textContent('#ask-reply')), 'nonsense gets a hint');
 await pg.focus('#ask-in'); await pg.keyboard.press('Escape'); await pg.waitForTimeout(200);
 ok((await pg.evaluate(()=>__exp.matchList())).length===9, 'Escape in the box clears it');

 // ── the sheet
 await pg.evaluate(()=>scrollTo(0,__exp.scrollForCard(1))); await settle(pg);
 await pg.focus('#cap-open'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(400);
 ok(await pg.evaluate(()=>__exp.sheet)===1, 'Open shows the gathering in front');
 ok(await pg.evaluate(()=>document.activeElement.id)==='sh-close', 'focus moves into the sheet');
 ok(await pg.evaluate(()=>document.querySelector('main').inert && !document.getElementById('sheet').inert), 'page behind is inert');
 ok(/Riverside Founders Mixer/.test(await pg.textContent('#sh-title')), 'sheet has the title');
 ok(/48%/.test(await pg.textContent('#sh-body')), 'sheet shows who arrives alone');
 await pg.keyboard.press('Escape'); await pg.waitForTimeout(400);
 ok(await pg.evaluate(()=>__exp.sheet)===null, 'Escape closes');
 ok(await pg.evaluate(()=>document.activeElement.id)==='cap-open', 'focus returns to Open');

 // clicking a card in the scene opens it
 const box = await pg.evaluate(()=>{ const r=document.getElementById('gl').getBoundingClientRect(); return {w:r.width,h:r.height}; });
 let opened=false;
 for(const [fx,fy] of [[.6,.45],[.65,.5],[.55,.4],[.7,.45],[.35,.45],[.3,.5]]){
   await pg.mouse.move(box.w*fx, box.h*fy); await pg.waitForTimeout(150);
   if(await pg.evaluate(()=>document.body.style.cursor==='pointer')){ await pg.mouse.click(box.w*fx, box.h*fy); opened=true; break; }
 }
 await pg.waitForTimeout(300);
 ok(opened && await pg.evaluate(()=>__exp.sheet)!==null, 'a card in the scene can be clicked open');
 await pg.click('#sh-close'); await pg.waitForTimeout(300);

 // in-page links travel and move focus
 await pg.click('.navpill a[href="#lab"]'); await pg.waitForTimeout(2500); await settle(pg);
 ok(Math.abs(await pg.evaluate(()=>__exp.f)-4)<0.01, 'Field link travels to the lab');
 ok(await pg.evaluate(()=>document.activeElement.id)==='lab-h', 'and focuses its heading');
 await pg.click('#to-start'); await pg.waitForTimeout(2500); await settle(pg);
 ok(await pg.evaluate(()=>scrollY)===0, 'To the start goes to the top');
 ok(pg.errs.length===0, 'no page errors: '+pg.errs.join(' | '));

 // horizontal overflow at every scene
 for(const vp of [{width:1440,height:900},{width:390,height:844},{width:360,height:740}]){
   const p=await open(b,{vp});
   const sc=await p.evaluate(()=>__exp.sec);
   let worst=0;
   for(const y of Object.values(sc)){ await p.evaluate(y=>scrollTo(0,y+10),y); await p.waitForTimeout(100);
     worst=Math.max(worst, await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)); }
   ok(worst<=0, vp.width+'px: no sideways scroll ('+worst+')');
   const cap=await p.evaluate(()=>{ const r=document.getElementById('caption').getBoundingClientRect(); return [r.left,r.right]; });
   ok(cap[0]>=15 && cap[1]<=vp.width-15, vp.width+'px: caption stays inside the gutter');
   await p.context().close();
 }

 // ── reduced motion: no autonomous motion, f follows scroll exactly
 pg=await open(b,{rm:true});
 ok(!await pg.evaluate(()=>document.documentElement.classList.contains('fx')), 'no glitch class under reduced motion');
 await pg.evaluate(()=>scrollTo(0,__exp.sec.manifesto)); await pg.waitForTimeout(150);
 ok(Math.abs(await pg.evaluate(()=>__exp.f)-2)<1e-6, 'f jumps straight to the scroll position');
 const u1=await pg.screenshot({clip:{x:600,y:200,width:200,height:200}}); await pg.waitForTimeout(700);
 const u2=await pg.screenshot({clip:{x:600,y:200,width:200,height:200}});
 ok(u1.equals(u2), 'nothing moves on its own');
 await pg.context().close();

 // ── without WebGL: the flat list
 pg=await open(b,{nogl:true});
 ok(!await pg.evaluate(()=>__exp.gl) && await pg.evaluate(()=>document.documentElement.classList.contains('no-gl')), 'falls back when three.js cannot load');
 ok(await pg.evaluate(()=>document.querySelectorAll('#flatgrid button').length)===9, 'all nine gatherings listed');
 await pg.click('#cats button[data-k="Business"]'); await pg.waitForTimeout(200);
 ok(await pg.evaluate(()=>document.querySelectorAll('#flatgrid button').length)===1, 'filters narrow the list');
 await pg.click('#flatgrid button'); await pg.waitForTimeout(300);
 ok(await pg.evaluate(()=>__exp.sheet)===1, 'a listed gathering opens');
 ok(pg.errs.length===0, 'no page errors without WebGL: '+pg.errs.join(' | '));

 await b.close();
 console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
})();
