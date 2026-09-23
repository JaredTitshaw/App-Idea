const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
let pass=0,fail=0; const ok=(c,m)=>c?pass++:(fail++,console.log('  FAIL: '+m));
const FILE='file://'+path.resolve('wrapped-new.html');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});

 // ── boot
 let pg=await b.newPage({viewport:{width:1280,height:900}});
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(FILE); await pg.waitForTimeout(120);
 ok(await pg.locator('#boot').isVisible(), 'the self-test shows on load');
 const reported = await pg.waitForFunction(()=>{
   const t=document.getElementById('b2').querySelector('b').textContent;
   return t!=='—' ? t : null;
 }, {timeout:4000}).then(h=>h.jsonValue());
 const real = await pg.evaluate(()=>__convene.events.length);
 ok(Number(reported)===real, `the self-test reports the real count (${reported} vs ${real})`);
 await pg.waitForFunction(()=>document.getElementById('boot').hidden, {timeout:6000});
 ok(true, 'the self-test clears on its own');
 ok(await pg.evaluate(()=>document.body.classList.contains('anim')), 'motion is enabled after boot');
 await pg.waitForTimeout(1300);
 ok(await pg.evaluate(()=>!document.body.classList.contains('revealing')),
    'the settle is one-time, not re-fired on every render');
 await pg.close();

 // skippable
 pg=await b.newPage({viewport:{width:1280,height:900}});
 await pg.goto(FILE); await pg.waitForTimeout(150);
 await pg.keyboard.press('Space'); await pg.waitForTimeout(700);
 ok(await pg.evaluate(()=>document.getElementById('boot').hidden), 'a keypress skips the self-test');
 await pg.close();

 // ── solve
 pg=await b.newPage({viewport:{width:1280,height:900}});
 pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(FILE); await pg.keyboard.press('Space'); await pg.waitForTimeout(700);
 await pg.click('#solve-btn'); await pg.waitForTimeout(500);
 const route = await pg.evaluate(()=>__convene.state().thread);
 ok(route.length>=2, 'the solver builds a route of at least two stops: '+route.length);

 // every hop in the produced route must actually join up
 const hops = await pg.evaluate(()=>{
   const t=__convene.state().thread, ev=__convene.events, bad=[];
   for(let i=0;i<t.length-1;i++){
     const a=ev.find(e=>e.id===t[i]), b=ev.find(e=>e.id===t[i+1]);
     if(!__convene.legGap(a,b).ok) bad.push(a.id+'->'+b.id);
   }
   return bad;
 });
 ok(hops.length===0, 'every hop in the solved route joins up: '+JSON.stringify(hops));

 // and the first stop is reachable from the chosen departure
 const okFirst = await pg.evaluate(()=>{
   const t=__convene.state().thread, L=__convene.state().leaveAt;
   const a=__convene.events.find(e=>e.id===t[0]);
   return (a.at-a.reach)>=L;
 });
 ok(okFirst, 'the first stop is reachable from the departure time');

 // the solver is not beaten by a hand-built pair
 const optimal = await pg.evaluate(()=>{
   const L=__convene.state().leaveAt;
   const best=__convene.solveFrom(L);
   const pool=__convene.events.filter(e=>e.came==null && (e.at-e.reach)>=L);
   let pairs=0;
   for(const a of pool) for(const c of pool) if(a!==c && __convene.legGap(a,c).ok) pairs=2;
   return best.n>=pairs;
 });
 ok(optimal, 'the solver finds at least as many stops as any single pair');

 // solving later in the night yields fewer or equal stops
 const shrink = await pg.evaluate(()=>{
   const a=__convene.solveFrom(0).n, b=__convene.solveFrom(420).n;
   return {a,b};
 });
 ok(shrink.b<=shrink.a, `leaving later cannot give a longer route (${shrink.a} -> ${shrink.b})`);

 // ── sweep
 const before = await pg.evaluate(()=>__convene.state().leaveAt);
 await pg.click('#sweep-btn'); await pg.waitForTimeout(900);
 const during = await pg.evaluate(()=>__convene.state().leaveAt);
 ok(during>before, `sweep moves the departure forward (${before} -> ${Math.round(during)})`);
 // a human hand interrupts it
 await pg.evaluate(()=>{ const r=document.getElementById('leave-range'); r.value=90; r.dispatchEvent(new Event('input',{bubbles:true})); });
 await pg.waitForTimeout(500);
 const after = await pg.evaluate(()=>__convene.state().leaveAt);
 ok(Math.abs(after-90)<2, 'dragging the slider stops the sweep and wins: '+Math.round(after));

 // ── countdown
 const clocks = await pg.evaluate(()=>{
   const L=__convene.state().leaveAt;
   const soon=__convene.events.filter(e=>e.came==null && (e.at-e.reach)>=L && __convene.edgeMinutes(e)<=45);
   return { soon:soon.length, shown:document.querySelectorAll('.clock').length };
 });
 ok(clocks.shown === Math.min(3, clocks.soon), `countdowns shown match what is close (${clocks.shown}/${clocks.soon})`);

 ok(errs.length===0, 'errors: '+errs.join(' | '));
 await pg.close();

 // ── reduced motion: no self-test, no pulse, still usable
 const ctx=await b.newContext({viewport:{width:1280,height:900}, reducedMotion:'reduce'});
 const pg2=await ctx.newPage();
 await pg2.goto(FILE); await pg2.waitForTimeout(700);
 ok(await pg2.evaluate(()=>document.getElementById('boot').hidden), 'reduced motion skips the self-test entirely');
 ok(await pg2.evaluate(()=>!document.body.classList.contains('anim')), 'and leaves motion off');
 ok(await pg2.locator('.node').count()>0, 'the field is still drawn');
 await pg2.click('#sweep-btn'); await pg2.waitForTimeout(300);
 ok(await pg2.evaluate(()=>__convene.state().leaveAt)===600, 'sweep jumps to the end instead of animating');

 console.log(`\n${pass} passed, ${fail} failed`);
 await b.close(); process.exit(fail?1:0);
})();
