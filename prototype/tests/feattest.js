const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
let pass=0,fail=0; const ok=(c,m)=>c?pass++:(fail++,console.log('  FAIL: '+m));
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 // A viewer in New York: UTC-4/-5 should put the Americas under the centre.
 const ctx=await b.newContext({viewport:{width:1280,height:860},timezoneId:'America/New_York'});
 const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+path.resolve('wrapped-web.html')); await pg.waitForTimeout(2600);

 const r=await pg.evaluate(()=>myRegion());
 ok(r.lon<-60 && r.lon>-90, 'New York resolves to a western longitude: '+JSON.stringify(r));
 ok(r.lat>25 && r.lat<55, 'and a northern latitude');
 ok(r.place==='New York', 'names the place: '+r.place);

 const before=await pg.evaluate(()=>globe.rotY);
 await pg.click('#region-btn'); await pg.waitForTimeout(1800);
 const after=await pg.evaluate(()=>globe.rotY);
 ok(Math.abs(after-before)>0.1, `the planet actually turned (${before.toFixed(3)} -> ${after.toFixed(3)})`);
 ok((await pg.locator('#view-live').textContent()).includes('New York'), 'the turn is announced');

 // Tokyo should land on the other side of the world.
 const ctx2=await b.newContext({viewport:{width:1280,height:860},timezoneId:'Asia/Tokyo'});
 const pg2=await ctx2.newPage();
 await pg2.goto('file://'+path.resolve('wrapped-web.html')); await pg2.waitForTimeout(2200);
 const r2=await pg2.evaluate(()=>myRegion());
 ok(r2.lon>120 && r2.lon<150, 'Tokyo resolves to an eastern longitude: '+JSON.stringify(r2));

 // Reduced motion must silence the pulse, not the page.
 const ctx3=await b.newContext({viewport:{width:1280,height:860},reducedMotion:'reduce'});
 const pg3=await ctx3.newPage();
 await pg3.goto('file://'+path.resolve('wrapped-web.html')); await pg3.waitForTimeout(2200);
 ok(await pg3.evaluate(()=>motionOK===false), 'reduced motion is honoured');
 ok(await pg3.evaluate(()=>{const e=document.querySelector('.stage-title');
    return getComputedStyle(e).opacity==='1';}), 'copy is fully visible under reduced motion');

 ok(errs.length===0,'errors: '+errs.join(' | '));
 console.log(`\n${pass} passed, ${fail} failed`);
 await b.close(); process.exit(fail?1:0);
})();
