const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
let pass=0,fail=0; const ok=(c,m)=>c?pass++:(fail++,console.log('  FAIL: '+m));
const FILE='file://'+path.resolve('wrapped-new.html')+'#field';
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});

 // ── the wheel
 let pg=await b.newPage({viewport:{width:1280,height:900}});
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(FILE); await pg.waitForTimeout(400);
 const reels = await pg.evaluate(()=>['r1','r2','r3'].map(id=>{
   const el=document.getElementById(id);
   return { rows:el.children.length, moved:(el.style.transform||'').includes('translateY') };
 }));
 ok(reels.every(r=>r.rows>0), 'every reel is filled');
 ok(reels.every(r=>r.moved), 'every reel is spinning');
 // what lands must be a real gathering, not invented copy
 const landed = await pg.evaluate(()=>{
   const titles=[...document.querySelectorAll('#r1 .reel-i')].map(n=>n.textContent);
   const real=new Set(__convene.events.map(e=>e.title));
   return titles.every(t=>real.has(t));
 });
 ok(landed, 'the wheel only shows gatherings that exist in the set');
 const venues = await pg.evaluate(()=>{
   const v=[...document.querySelectorAll('#r2 .reel-i')].map(n=>n.textContent);
   const real=new Set(__convene.events.map(e=>e.venue));
   return v.every(t=>real.has(t));
 });
 ok(venues, 'and real venues');
 await pg.waitForFunction(()=>document.getElementById('boot').hidden, {timeout:8000});
 ok(true, 'the wheel settles and the self-test clears');
 await pg.close();

 // ── already running
 pg=await b.newPage({viewport:{width:1280,height:900}});
 pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(FILE); await pg.keyboard.press('Space'); await pg.waitForTimeout(900);

 // push the departure late enough that long gatherings are underway
 await pg.evaluate(()=>{const r=document.getElementById('leave-range'); r.value=240; r.dispatchEvent(new Event('input',{bubbles:true}));});
 await pg.waitForTimeout(500);
 const model = await pg.evaluate(()=>{
   const bad=[];
   document.querySelectorAll('.node').forEach(n=>{
     const e=__convene.events.find(x=>x.id===n.dataset.id);
     if(e.came!=null) return;
     const run=__convene.running(e), join=__convene.joinable(e);
     if(n.classList.contains('is-running') !== run) bad.push('running '+e.id);
     if(n.classList.contains('is-gone') !== !join) bad.push('gone '+e.id);
   });
   return bad;
 });
 ok(model.length===0, 'painted state matches joinable/running: '+JSON.stringify(model));

 const runCount = await pg.evaluate(()=>__convene.events.filter(e=>e.came==null && __convene.running(e)).length);
 ok(runCount>0, 'some gatherings are genuinely underway at this departure: '+runCount);

 // a running gathering must still be reachable, and report what is left of it
 const check = await pg.evaluate(()=>{
   const e=__convene.events.find(x=>x.came==null && __convene.running(x));
   return { join:__convene.joinable(e), id:e.id, title:e.title };
 });
 ok(check.join, 'a running gathering is still joinable');
 await pg.evaluate(id=>openEvent(id), check.id); await pg.waitForTimeout(350);
 const sheet = await pg.locator('#sheet-b').textContent();
 ok(/Already running/.test(sheet), 'the sheet says it is already running');
 ok(/min<\/b> of it|min of it/.test(await pg.locator('#sheet-b').innerHTML()), 'and how much of it you would get');
 ok(/Spoken/.test(sheet), 'and what is spoken in the room');
 await pg.keyboard.press('Escape'); await pg.waitForTimeout(250);

 // nothing that has ended is joinable
 const ended = await pg.evaluate(()=>{
   const L=__convene.state().leaveAt;
   return __convene.events.filter(e=>e.came==null && __convene.joinable(e))
     .every(e=> L + e.reach <= e.at + e.dur);
 });
 ok(ended, 'nothing already finished is offered as joinable');

 // ── filters
 const langs = await pg.evaluate(()=>[...document.querySelectorAll('.chip.lang')].map(c=>c.textContent));
 ok(langs.length>2, 'a language chip per language in the set: '+langs.join(','));
 await pg.evaluate(()=>setFilter('lang','ES')); await pg.waitForTimeout(300);
 const filtered = await pg.evaluate(()=>{
   const shown=[...document.querySelectorAll('.node:not(.is-off):not(.is-past)')].map(n=>n.dataset.id);
   return shown.every(id=>{
     const e=__convene.events.find(x=>x.id===id);
     return (e.langs||[]).includes('ES');
   });
 });
 ok(filtered, 'filtering by a language shows only rooms where it is spoken');
 ok(await pg.evaluate(()=>__convene.filterState().lang)==='ES', 'the filter state is held');
 await pg.evaluate(()=>setFilter('lang','ES')); await pg.waitForTimeout(250);
 ok(await pg.evaluate(()=>__convene.filterState().lang)===null, 'and clicking it again clears it');

 await pg.evaluate(()=>setFilter('running')); await pg.waitForTimeout(300);
 const onlyRunning = await pg.evaluate(()=>{
   const shown=[...document.querySelectorAll('.node:not(.is-off):not(.is-past)')].map(n=>n.dataset.id);
   return shown.length>0 && shown.every(id=>__convene.running(__convene.events.find(x=>x.id===id)));
 });
 ok(onlyRunning, 'running-now shows only what is underway');
 await pg.evaluate(()=>setFilter('running')); await pg.waitForTimeout(200);

 // every chip is a real control with a pressed state
 const chips = await pg.evaluate(()=>[...document.querySelectorAll('#filters .chip')]
   .every(c=>c.tagName==='BUTTON' && c.hasAttribute('aria-pressed') && c.textContent.trim()));
 ok(chips, 'filter chips are named buttons with a pressed state');

 // ── on a phone the chips are one scrolling strip, not three wrapped rows.
 // A media query adds no specificity, so this regressed once when the base
 // rule was declared after the override.
 await pg.setViewportSize({width:390,height:760}); await pg.waitForTimeout(350);
 const strip = await pg.evaluate(()=>{
   const f=document.getElementById('filters'), cs=getComputedStyle(f);
   const chip=f.querySelector('.chip').getBoundingClientRect().height;
   return { wrap:cs.flexWrap, rows:Math.round(f.getBoundingClientRect().height/chip),
            scrolls:f.scrollWidth>f.clientWidth };
 });
 ok(strip.wrap==='nowrap', 'the chip row does not wrap on a phone');
 ok(strip.rows<=1, 'it occupies a single row: '+strip.rows);
 ok(strip.scrolls, 'and scrolls sideways instead');
 const over = await pg.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 ok(over<=0, 'without making the page itself scroll sideways: '+over);

 ok(errs.length===0, 'errors: '+errs.join(' | '));
 console.log(`\n${pass} passed, ${fail} failed`);
 await b.close(); process.exit(fail?1:0);
})();
