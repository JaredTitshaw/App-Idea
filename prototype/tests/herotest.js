// The Field as one framed screen: the lake scene, the notch pickers, the rail
// that switches screens, the leave card, and panes that never overlap it.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
const BASE='file://'+path.resolve('wrapped-new.html');
let pass=0,fail=0; const ok=(c,m)=>c?pass++:(fail++,console.log('  FAIL: '+m));
const ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
async function open(b,o={}){
  const ctx=await b.newContext({viewport:o.vp||{width:1440,height:900}, reducedMotion:'reduce'}); const pg=await ctx.newPage(); pg.errs=[];
  pg.on('pageerror',e=>pg.errs.push(e.message));
  await pg.route(/fonts\.(googleapis|gstatic)\.com/, r=>r.abort());
  if(o.nogl) await pg.addInitScript(()=>{ const g=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext=function(t,...a){ return /webgl/.test(t)?null:g.call(this,t,...a); }; });
  await pg.addInitScript(()=>{ try{ localStorage.setItem('convene.explored','1'); }catch(e){} });
  await pg.goto(BASE+(o.hash||'')); await pg.waitForFunction(()=>window.__hero); await pg.waitForTimeout(400); return pg;
}
const screen = pg => pg.evaluate(()=>__convene.screen());
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:ARGS});
 let pg=await open(b);
 ok(await screen(pg)==='tonight', 'opens on Tonight');
 ok(await pg.evaluate(()=>__hero.gl), 'the lake is drawn in WebGL');
 ok(await pg.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1), 'the whole page is one screen: nothing to scroll');
 const now=await pg.textContent('#leave-time-text');
 ok(await pg.evaluate(()=>__hero.word)===now, 'the word in the landscape is the departure time: '+now);
 ok(/^path\(/.test(await pg.evaluate(()=>document.getElementById('hero-gl').style.clipPath)), 'the scene has the notched outline');
 ok(await pg.textContent('#hero-eb')==='If you leave now', 'eyebrow says now while the clock is live');

 // the notch pickers
 await pg.selectOption('#f-leave','120'); await pg.waitForTimeout(250);
 let st=await pg.evaluate(()=>__convene.state());
 ok(st.leaveAt===120 && !st.leaveLive, 'Leave at moves the departure');
 ok(await pg.evaluate(()=>__hero.word)===await pg.textContent('#leave-time-text') && await pg.textContent('#hero-eb')==='If you leave at', 'the word and eyebrow follow');
 await pg.evaluate(()=>{ const r=document.getElementById('leave-range'); r.value=95; r.dispatchEvent(new Event('input',{bubbles:true})); }); await pg.waitForTimeout(200);
 ok(await pg.inputValue('#f-leave')==='x' && (await pg.textContent('#f-leave option[value="x"]'))===await pg.textContent('#leave-time-text'), 'slider and picker stay in step off the half hour');
 await pg.selectOption('#f-leave','0'); await pg.waitForTimeout(200);
 ok((await pg.evaluate(()=>__convene.state())).leaveLive, '"Now" goes back to live');
 await pg.selectOption('#f-kind','Culture'); await pg.waitForTimeout(200);
 ok((await pg.evaluate(()=>__convene.filterState())).tag==='Culture', 'Kind filters');
 ok(await pg.evaluate(()=>document.querySelector('#filters .chip[aria-pressed="true"]').textContent)==='Culture', 'and the chip row agrees');
 ok(await pg.evaluate(()=>{ const f=__hero.feat; const e=__convene.events.find(x=>x.id===f); return !f || e.t==='Culture'; }), 'the featured card respects it');
 await pg.selectOption('#f-kind',''); await pg.selectOption('#f-lang','ES'); await pg.waitForTimeout(200);
 ok((await pg.evaluate(()=>__convene.filterState())).lang==='ES', 'Speaking filters');
 await pg.selectOption('#f-lang','');
 await pg.click('#hp-run'); await pg.waitForTimeout(150);
 ok(await pg.getAttribute('#hp-run','aria-pressed')==='true' && (await pg.evaluate(()=>__convene.filterState())).runningOnly, 'Running now pill toggles');
 await pg.click('#hp-run');

 // the featured card
 const feat=await pg.evaluate(()=>__hero.feat);
 await pg.click('#feat-route'); await pg.waitForTimeout(150);
 ok((await pg.evaluate(()=>__convene.state().thread)).includes(feat) && await pg.textContent('#feat-route')==='On your route', 'Add to your route');
 ok(/1 stop/.test(await pg.textContent('#c-route-n')), 'the footer counts the route');
 await pg.click('#feat-open'); await pg.waitForTimeout(400);
 ok(await pg.evaluate(()=>document.getElementById('sheet').classList.contains('open')), 'the arrow opens it');
 await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);

 // screens
 for(const s of ['field','list','route','tonight']){
   await pg.click('[data-screen-btn="'+s+'"]'); await pg.waitForTimeout(250);
   const r=await pg.evaluate(s=>({ cur:__convene.screen(), shown:[...document.querySelectorAll('.screen')].filter(e=>!e.hidden).map(e=>e.id),
     pressed:document.querySelector('[data-screen-btn][aria-current="page"]').getAttribute('data-screen-btn'), eb:getComputedStyle(document.getElementById('hero-eb')).visibility }), s);
   ok(r.cur===s && r.shown.length===1 && r.shown[0]==='s-'+s && r.pressed===s, 'the rail shows '+s+' alone and marks it');
   ok((r.eb!=='hidden')===(s==='tonight'), 'the word belongs to Tonight only ('+s+')');
 }
 await pg.click('#c-next'); await pg.waitForTimeout(200);
 ok(await screen(pg)==='field', 'Next goes to the following screen');
 ok(/The list/.test(await pg.textContent('#c-next-l')), 'and names the one after');
 const fit=await pg.evaluate(()=>{ const p=document.querySelector('.s-field .pane').getBoundingClientRect(), c=document.getElementById('cut').getBoundingClientRect(),
   f=document.getElementById('field').getBoundingClientRect(), v=document.getElementById('field-view').getBoundingClientRect();
   return { clear:p.bottom<=c.top+1, inside:f.bottom<=v.bottom+1 && f.top>=v.top-1, fh:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fh')) }; });
 ok(fit.clear, 'the chart pane stays clear of the leave card');
 ok(fit.inside && fit.fh>=170, 'the chart fits its pane: '+JSON.stringify(fit));
 await pg.keyboard.press('l'); await pg.waitForTimeout(200);
 ok(await screen(pg)==='list', 'L flips to the list');
 await pg.click('.s-list .pane-h .pill'); await pg.waitForTimeout(200);
 ok(await screen(pg)==='field', 'and "Back to the field" returns');
 await pg.click('#c-route'); await pg.waitForTimeout(200);
 ok(await screen(pg)==='route', 'the footer heart opens your route');
 await pg.click('#route-build'); await pg.waitForTimeout(200);
 ok((await pg.evaluate(()=>__convene.state().thread)).length>=2, 'Build me a route works from the route screen');
 await pg.click('#theme-btn'); await pg.waitForTimeout(150);
 ok(await pg.getAttribute('html','data-theme')==='dark', 'the rail switches the theme');
 ok(pg.errs.length===0, 'no errors: '+pg.errs.join('|'));
 await pg.context().close();

 for(const h of ['field','list','route']){
   const p=await open(b,{hash:'#'+h}); ok(await screen(p)===h, '#'+h+' opens on that screen'); await p.context().close();
 }

 // layout at every width: one screen, nothing spilling out of the frame
 for(const vp of [{width:1440,height:900},{width:1280,height:800},{width:1024,height:700},{width:768,height:1000},{width:390,height:844},{width:360,height:740}]){
   const p=await open(b,{vp});
   let out=[], sy=0, sx=0;
   for(const s of ['tonight','field','list','route']){
     await p.evaluate(s=>goScreen(s), s); await p.waitForTimeout(150);
     const r=await p.evaluate(()=>{
       const f=document.getElementById('main').getBoundingClientRect(), bad=[];
       document.querySelectorAll('#main :is(a,button,select,.feat,.cut,.notch,.pane,.route-grid,.clocks)').forEach(el=>{
         const cs=getComputedStyle(el); if(el.closest('[hidden]')||cs.display==='none'||cs.visibility==='hidden'||cs.position==='fixed'||el.closest('.rail')) return;
         const q=el.getBoundingClientRect(); if(!q.width) return;
         if(el.closest('.pane,.route-grid,.clocks,#list,.list') && !el.matches('.pane,.route-grid,.clocks')) return;   // inside a scrolling pane
         if(q.left<f.left-1||q.right>f.right+1||q.top<f.top-1||q.bottom>f.bottom+1) bad.push(el.id||el.className);
       });
       const cut=document.getElementById('cut').getBoundingClientRect();
       document.querySelectorAll('.screen:not([hidden]) :is(.pane,.route-grid)').forEach(el=>{ if(el.getBoundingClientRect().bottom>cut.top+1) bad.push('pane over the leave card'); });
       const a=document.querySelector('.hpill.l').getBoundingClientRect(), n=document.getElementById('notch').getBoundingClientRect(), z=document.getElementById('hp-run').getBoundingClientRect();
       const hit=(p,q)=>!(p.right<=q.left||q.right<=p.left||p.bottom<=q.top||q.bottom<=p.top);
       if(hit(a,n)||hit(z,n)) bad.push('pills collide with the notch');
       document.querySelectorAll('#notch select').forEach(el=>{ const c=document.createElement('canvas').getContext('2d'), cs=getComputedStyle(el); c.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
         const t=[...el.options].filter(o=>!o.hidden).map(o=>c.measureText(o.text).width).reduce((a,b)=>Math.max(a,b),0);
         if(t+parseFloat(cs.paddingRight) > el.clientWidth+1) bad.push(el.id+' clips its longest option'); });
       const rail=document.getElementById('rail').getBoundingClientRect();
       if(rail.bottom>innerHeight+1||rail.right>innerWidth+1) bad.push('rail off screen');
       if(getComputedStyle(document.getElementById('rail')).position!=='fixed' && rail.bottom>cut.top+1) bad.push('rail runs into the leave card');
       return { bad, sy:document.documentElement.scrollHeight-innerHeight, sx:document.documentElement.scrollWidth-innerWidth };
     });
     out=out.concat(r.bad.map(x=>s+':'+x)); sy=Math.max(sy,r.sy); sx=Math.max(sx,r.sx);
   }
   ok(sx<=0, vp.width+'px: no sideways scroll');
   ok(sy<=1 || vp.height<720, vp.width+'x'+vp.height+': one screen, no page scroll ('+sy+')');
   ok(out.length===0, vp.width+'px: everything fits its place: '+[...new Set(out)].join(' '));
   await p.context().close();
 }
 pg=await open(b,{nogl:true});
 ok(!await pg.evaluate(()=>__hero.gl) && await pg.evaluate(()=>getComputedStyle(document.getElementById('hero-word')).display)==='block', 'without WebGL the time is shown as text');
 ok(await pg.textContent('#hero-word')===await pg.textContent('#leave-time-text'), 'and it is the departure time');
 ok(pg.errs.length===0, 'no errors without WebGL');
 await b.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
})();
