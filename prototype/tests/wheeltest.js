const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
let pass=0,fail=0; const ok=(c,m)=>c?pass++:(fail++,console.log('  FAIL: '+m));
const BASE='file://'+path.resolve('wrapped-new.html');
const S = pg => pg.evaluate(()=>__convene.explore());
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const errs=[];

 // ── first visit: watching the self-test through lands on the wheel
 let pg=await b.newPage({viewport:{width:1440,height:900}});
 pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(BASE);
 await pg.waitForFunction(()=>__convene.explore().open, {timeout:9000}).catch(()=>{});
 ok((await S(pg)).open, 'a first visit that watches the boot lands on the wheel');
 ok(await pg.evaluate(()=>document.getElementById('main').hasAttribute('inert')), 'the field is inert behind it');
 ok(await pg.evaluate(()=>document.activeElement.id)==='ex-wheel', 'focus is on the wheel');
 const count = (await S(pg)).count;
 ok(count>=8, 'the wheel carries every feature: '+count);

 // every face is a real option, and exactly one is selected
 const opts = await pg.evaluate(()=>{
   const o=[...document.querySelectorAll('#ex-drum [role=option]')];
   return { n:o.length, sel:o.filter(x=>x.getAttribute('aria-selected')==='true').length,
            active:document.getElementById('ex-wheel').getAttribute('aria-activedescendant') };
 });
 ok(opts.n===count && opts.sel===1, 'one selected option among '+opts.n);
 ok(opts.active==='ex-o0', 'the listbox points at the selected face');

 // ── keyboard turns it one detent at a time
 await pg.keyboard.press('ArrowDown'); await pg.waitForTimeout(500);
 ok((await S(pg)).index===1, 'ArrowDown turns one face');
 await pg.keyboard.press('End'); await pg.waitForTimeout(600);
 ok((await S(pg)).index===count-1, 'End goes to the last face');
 await pg.keyboard.press('ArrowDown'); await pg.waitForTimeout(500);
 ok((await S(pg)).index===count-1, 'and it stops there rather than wrapping past');
 await pg.keyboard.press('Home'); await pg.waitForTimeout(600);
 ok((await S(pg)).index===0, 'Home goes back to the first');

 // the detail follows the wheel
 const t0 = await pg.locator('.ex-title').textContent();
 await pg.keyboard.press('ArrowDown'); await pg.waitForTimeout(500);
 const t1 = await pg.locator('.ex-title').textContent();
 ok(t0 && t1 && t0!==t1, `the description changes with the face (${t0} → ${t1})`);

 // ── scroll wheel input, snapped to a whole face
 const box = await pg.locator('#ex-wheel').boundingBox();
 await pg.mouse.move(box.x+box.width/2, box.y+box.height/2);
 const before = (await S(pg)).index;
 await pg.mouse.wheel(0, 240); await pg.waitForTimeout(700);
 const afterWheel = await pg.evaluate(()=>{ const s=__convene.explore(); return s; });
 ok(afterWheel.index>before, `scrolling turns the drum (${before} → ${afterWheel.index})`);
 const settled = await pg.evaluate(()=>{
   const d=document.getElementById('ex-drum').style.transform;
   const m=d.match(/rotateX\(([-\d.]+)deg\)/); return m ? Number(m[1]) : null;
 });
 ok(settled!==null && Math.abs(settled/22 - Math.round(settled/22))<0.02, 'it settles exactly on a face, not between two: '+settled);

 // ── drag
 await pg.keyboard.press('Home'); await pg.waitForTimeout(600);
 await pg.mouse.move(box.x+box.width/2, box.y+box.height*0.7);
 await pg.mouse.down();
 for(let k=1;k<=6;k++){ await pg.mouse.move(box.x+box.width/2, box.y+box.height*0.7 - k*24); await pg.waitForTimeout(16); }
 await pg.mouse.up(); await pg.waitForTimeout(700);
 ok((await S(pg)).index>=2, 'dragging up turns it forward: '+(await S(pg)).index);

 // ── "Show me" closes the wheel and performs the feature on the live field
 const idxOf = async k => pg.evaluate(k=>{
   const o=[...document.querySelectorAll('#ex-drum [role=option]')];
   return o.findIndex(x=>x.textContent.includes(k));
 }, k);

 async function showMe(label){
   await pg.evaluate(()=>{ if(!__convene.explore().open) openExplore(); });
   await pg.waitForTimeout(200);
   const i = await idxOf(label);
   await pg.evaluate(i=>{ document.getElementById('ex-wheel').focus(); }, i);
   await pg.keyboard.press('Home'); await pg.waitForTimeout(300);
   for(let k=0;k<i;k++){ await pg.keyboard.press('ArrowDown'); await pg.waitForTimeout(60); }
   await pg.waitForTimeout(350);
   await pg.click('#ex-show'); await pg.waitForTimeout(1100);
 }

 await showMe('Route');
 ok(!(await S(pg)).open, 'Show me closes the wheel');
 ok(!(await pg.evaluate(()=>document.getElementById('main').hasAttribute('inert'))), 'and hands the field back');
 ok(await pg.evaluate(()=>__convene.state().thread.length)>=2, 'Route: a route was actually built');

 await showMe('Running now');
 ok(await pg.evaluate(()=>__convene.filterState().runningOnly), 'Running now: the filter is on');
 ok(await pg.evaluate(()=>__convene.events.some(e=>e.came==null && __convene.running(e))), 'and there is something running to show');

 await showMe('Spoken here');
 const f = await pg.evaluate(()=>__convene.filterState());
 ok(f.lang==='ES' && !f.runningOnly, 'Spoken here: the language filter, with the previous demo cleared: '+JSON.stringify(f));

 await showMe('Threshold');
 ok(await pg.evaluate(()=>document.getElementById('sheet').classList.contains('open')), 'Threshold: a gathering sheet opens');
 ok(/someone on the door/.test(await pg.locator('#sheet-b').textContent()), 'showing the walk-in reading');
 await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);

 await showMe('List');
 ok(await pg.evaluate(()=>__convene.state().view)==='list', 'List: the list view is shown');

 await showMe('Leave line');
 ok(await pg.evaluate(()=>document.getElementById('sweep-btn').classList.contains('on')), 'Leave line: the sweep runs');
 await pg.evaluate(()=>toggleSweep()); await pg.waitForTimeout(200);

 // Escape closes it and returns focus to where you were
 await pg.focus('#explore-btn');
 await pg.click('#explore-btn'); await pg.waitForTimeout(300);
 ok((await S(pg)).open, 'the header button reopens the wheel any time');
 await pg.keyboard.press('Escape'); await pg.waitForTimeout(450);
 ok(!(await S(pg)).open, 'Escape closes it');
 ok(await pg.evaluate(()=>document.activeElement.id)==='explore-btn', 'and focus goes back to the button');
 await pg.close();

 // ── it is shown once, not on every visit
 const ctx = await b.newContext({viewport:{width:1440,height:900}});
 const p1 = await ctx.newPage();
 await p1.goto(BASE);
 await p1.waitForFunction(()=>__convene.explore().open, {timeout:9000});
 await p1.evaluate(()=>closeExplore()); await p1.waitForTimeout(400);
 await p1.reload(); await p1.waitForTimeout(3600);
 ok(!(await p1.evaluate(()=>__convene.explore().open)), 'a returning visitor goes straight to the field');
 await ctx.close();

 // skipping the boot means "just the field"
 const p2=await b.newPage({viewport:{width:1440,height:900}});
 await p2.goto(BASE); await p2.waitForTimeout(250);
 await p2.keyboard.press('Space'); await p2.waitForTimeout(1400);
 ok(!(await p2.evaluate(()=>__convene.explore().open)), 'skipping the boot skips the tour too');
 await p2.close();

 // ── phone: the wheel fits, nothing overflows
 const p3=await b.newPage({viewport:{width:390,height:760}, isMobile:true, hasTouch:true});
 await p3.goto(BASE+'#field'); await p3.waitForTimeout(250); await p3.keyboard.press('Space'); await p3.waitForTimeout(800);
 await p3.evaluate(()=>openExplore()); await p3.waitForTimeout(400);
 const fit = await p3.evaluate(()=>{
   const d=document.getElementById('ex-detail').getBoundingClientRect(), w=document.getElementById('ex-wheel').getBoundingClientRect();
   return { over:document.documentElement.scrollWidth-document.documentElement.clientWidth,
            detailOn: d.bottom <= innerHeight + 2 && d.top >= 0, wheelOn: w.top >= 0 };
 });
 ok(fit.over<=0, 'no sideways scroll on a phone');
 ok(fit.wheelOn && fit.detailOn, 'wheel and description both fit on a phone screen: '+JSON.stringify(fit));
 await p3.close();

 // ── reduced motion: still fully usable, just instant
 const rctx=await b.newContext({viewport:{width:1440,height:900}, reducedMotion:'reduce'});
 const p4=await rctx.newPage();
 await p4.goto(BASE); await p4.waitForTimeout(600);
 ok(await p4.evaluate(()=>__convene.explore().open), 'reduced motion still gets the tour on a first visit');
 await p4.keyboard.press('ArrowDown'); await p4.waitForTimeout(80);
 ok(await p4.evaluate(()=>__convene.explore().index)===1, 'and the wheel turns instantly');

 ok(errs.length===0, 'errors: '+errs.join(' | '));
 console.log(`\n${pass} passed, ${fail} failed`);
 await b.close(); process.exit(fail?1:0);
})();
