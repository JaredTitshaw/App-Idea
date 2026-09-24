// The Field's hero: the lake scene, the notch pickers, the rail and the cards.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
const PAGE='file://'+path.resolve('wrapped-new.html')+'#field';
let pass=0,fail=0; const ok=(c,m)=>c?pass++:(fail++,console.log('  FAIL: '+m));
const ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
async function open(b,o={}){
  const ctx=await b.newContext({viewport:o.vp||{width:1440,height:900}, reducedMotion:'reduce'}); const pg=await ctx.newPage(); pg.errs=[];
  pg.on('pageerror',e=>pg.errs.push(e.message));
  await pg.route(/fonts\.(googleapis|gstatic)\.com/, r=>r.abort());
  if(o.nogl) await pg.addInitScript(()=>{ const g=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext=function(t,...a){ return /webgl/.test(t)?null:g.call(this,t,...a); }; });
  await pg.goto(PAGE); await pg.waitForFunction(()=>window.__hero); await pg.waitForTimeout(400); return pg;
}
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:ARGS});
 let pg=await open(b);
 ok(await pg.evaluate(()=>__hero.gl), 'the lake is drawn in WebGL');
 const now=await pg.textContent('#leave-time-text');
 ok(await pg.evaluate(()=>__hero.word)===now, 'the word in the landscape is the departure time: '+now);
 ok(/^path\(/.test(await pg.evaluate(()=>document.getElementById('hero-gl').style.clipPath)), 'the scene has the notched outline');
 ok(await pg.textContent('#hero-eb')==='If you leave now', 'eyebrow says now while the clock is live');
 await pg.selectOption('#f-leave','120'); await pg.waitForTimeout(250);
 const st=await pg.evaluate(()=>__convene.state());
 ok(st.leaveAt===120 && !st.leaveLive, 'Leave at moves the departure');
 ok(await pg.evaluate(()=>__hero.word)===await pg.textContent('#leave-time-text'), 'and the word follows');
 ok(await pg.textContent('#hero-eb')==='If you leave at', 'eyebrow changes to "at"');
 await pg.evaluate(()=>{ const r=document.getElementById('leave-range'); r.value=95; r.dispatchEvent(new Event('input',{bubbles:true})); }); await pg.waitForTimeout(200);
 ok(await pg.inputValue('#f-leave')==='x' && (await pg.textContent('#f-leave option[value="x"]'))===await pg.textContent('#leave-time-text'), 'the slider and the picker stay in step off the half hour');
 await pg.selectOption('#f-leave','0'); await pg.waitForTimeout(200);
 ok((await pg.evaluate(()=>__convene.state())).leaveLive, '"Now" goes back to live');
 await pg.selectOption('#f-kind','Culture'); await pg.waitForTimeout(200);
 ok((await pg.evaluate(()=>__convene.filterState())).tag==='Culture', 'Kind filters the field');
 ok(await pg.evaluate(()=>document.querySelector('#filters .chip[aria-pressed="true"]').textContent)==='Culture', 'and the chip row agrees');
 ok(await pg.evaluate(()=>{ const f=__hero.feat; const e=__convene.events.find(x=>x.id===f); return !f || e.t==='Culture'; }), 'the featured card respects the filter');
 await pg.selectOption('#f-kind',''); await pg.selectOption('#f-lang','ES'); await pg.waitForTimeout(200);
 ok((await pg.evaluate(()=>__convene.filterState())).lang==='ES', 'Speaking filters the field');
 await pg.selectOption('#f-lang','');
 await pg.click('#hp-run'); await pg.waitForTimeout(150);
 ok(await pg.getAttribute('#hp-run','aria-pressed')==='true' && (await pg.evaluate(()=>__convene.filterState())).runningOnly, 'Running now pill toggles the filter');
 await pg.click('#hp-run');
 const feat=await pg.evaluate(()=>__hero.feat);
 await pg.click('#feat-route'); await pg.waitForTimeout(150);
 ok((await pg.evaluate(()=>__convene.state().thread)).includes(feat) && await pg.textContent('#feat-route')==='On your route', 'Add to your route adds the featured gathering');
 await pg.click('#feat-open'); await pg.waitForTimeout(400);
 ok(await pg.evaluate(()=>document.getElementById('sheet').classList.contains('open')), 'the arrow opens it');
 await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
 await pg.click('#rail-list'); await pg.waitForTimeout(300);
 ok((await pg.evaluate(()=>__convene.state())).view==='list' && await pg.getAttribute('#rail-list','aria-label')==='Show the field', 'the rail flips to the list and says what it will do next');
 await pg.evaluate(()=>scrollTo(0,0)); await pg.click('#rail-list'); await pg.waitForTimeout(200);
 await pg.evaluate(()=>scrollTo(0,0)); await pg.click('#theme-btn'); await pg.waitForTimeout(150);
 ok(await pg.getAttribute('html','data-theme')==='dark', 'the rail switches the theme');
 const eb=await pg.evaluate(()=>{ const r=document.getElementById('hero-eb').getBoundingClientRect(), s=document.getElementById('scene').getBoundingClientRect(), w=__hero.wordBox(); return { mid:r.left+r.width/2-s.left, cx:w.cx, gap:(s.top+w.top)-r.bottom }; });
 ok(Math.abs(eb.mid-eb.cx)<2 && eb.gap>=0, 'eyebrow is centred above the word');
 ok(pg.errs.length===0, 'no errors: '+pg.errs.join('|'));
 await pg.context().close();

 for(const vp of [{width:1440,height:900},{width:1024,height:700},{width:768,height:1000},{width:390,height:844},{width:360,height:740}]){
   const p=await open(b,{vp});
   const r=await p.evaluate(()=>{
     const s=document.getElementById('hero').getBoundingClientRect(), out=[];
     document.querySelectorAll('#hero :is(a,button,select,.feat,.cut,.rail,.notch)').forEach(el=>{
       const cs=getComputedStyle(el); if(cs.display==='none'||cs.visibility==='hidden'||el.closest('.norail .rail')) return;
       const q=el.getBoundingClientRect(); if(!q.width) return;
       if(q.left<s.left-1||q.right>s.right+1||q.top<s.top-1||q.bottom>s.bottom+1) out.push(el.id||el.className);
     });
     document.querySelectorAll('#notch select').forEach(el=>{ const c=document.createElement('canvas').getContext('2d'), cs=getComputedStyle(el); c.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
       const t=[...el.options].filter(o=>!o.hidden).map(o=>c.measureText(o.text).width).reduce((a,b)=>Math.max(a,b),0);
       if(t+parseFloat(cs.paddingRight) > el.clientWidth+1) out.push(el.id+' clips its longest option'); });
     const a=document.querySelector('.hpill.l').getBoundingClientRect(), n=document.getElementById('notch').getBoundingClientRect(), z=document.getElementById('hp-run').getBoundingClientRect();
     const hit=(p,q)=>!(p.right<=q.left||q.right<=p.left||p.bottom<=q.top||q.bottom<=p.top);
     if(hit(a,n)||hit(z,n)) out.push('pills collide with the notch');
     return { sx:document.documentElement.scrollWidth-innerWidth, out };
   });
   ok(r.sx<=0, vp.width+'px: no sideways scroll');
   ok(r.out.length===0, vp.width+'px: hero controls fit: '+r.out.join(' '));
   await p.context().close();
 }
 pg=await open(b,{nogl:true});
 ok(!await pg.evaluate(()=>__hero.gl) && await pg.evaluate(()=>getComputedStyle(document.getElementById('hero-word')).display)==='block', 'without WebGL the time is shown as text');
 ok(await pg.textContent('#hero-word')===await pg.textContent('#leave-time-text'), 'and it is the departure time');
 ok(pg.errs.length===0, 'no errors without WebGL');
 await b.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
})();
