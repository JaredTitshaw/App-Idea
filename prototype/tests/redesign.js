const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
let pass=0,fail=0; const ok=(c,m)=>c?pass++:(fail++,console.log('  FAIL: '+m));
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await b.newPage({viewport:{width:1440,height:900}});
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+path.resolve('wrapped-web.html')); await pg.waitForTimeout(2800);

 // --- removals
 ok(await pg.locator('#view-companion').count()===0, 'Companion view is gone');
 ok(await pg.locator('#view-moments').count()===0, 'Moments view is gone');
 ok(await pg.locator('[data-nav]').count()/2===3, 'three destinations, not five');

 // --- the timeline reaches into the past
 ok(await pg.evaluate(()=>WINDOWS.length)===7, 'seven windows');
 ok(await pg.evaluate(()=>windowIndex)===2, 'opens on Right now');
 ok(await pg.evaluate(()=>isPast())===false, 'Right now is not a past window');
 await pg.evaluate(()=>setWindow(1,false)); await pg.waitForTimeout(400);
 ok(await pg.evaluate(()=>isPast())===true, 'Last night is a past window');
 const pastList = await pg.evaluate(()=>visibleEvents().map(e=>e.id));
 ok(pastList.length>0 && pastList.every(id=>id.startsWith('p')), 'past window shows only past gatherings: '+JSON.stringify(pastList));
 ok(await pg.evaluate(()=>document.body.classList.contains('echo-mode')), 'echo mode is marked on the body');
 const cnt = await pg.locator('#window-count').textContent();
 ok(/people came/.test(cnt), 'past window counts people, not invitations: '+cnt);

 // Echo reaches the card and the drawer
 await pg.evaluate(()=>go('gatherings')); await pg.waitForTimeout(400);
 ok(await pg.locator('.echo-foot').count()>0, 'cards carry the echo');
 await pg.evaluate(()=>openEvent(pastEvents[0].id)); await pg.waitForTimeout(400);
 const reading = await pg.locator('#ed-reading').textContent();
 ok(/came/.test(reading) && /stayed past the end/.test(reading), 'drawer shows what came of it');
 ok(await pg.evaluate(()=>document.getElementById('drawer-event').classList.contains('is-past')), 'a past gathering cannot be joined');
 await pg.evaluate(()=>closeAllOverlays()); await pg.waitForTimeout(200);

 // --- Threshold on a future gathering
 await pg.evaluate(()=>{ go('discover'); setWindow(2,false); }); await pg.waitForTimeout(400);
 await pg.evaluate(()=>go('gatherings')); await pg.waitForTimeout(400);
 ok(await pg.locator('.thr').count()>0, 'cards carry a walk-in reading');
 ok(await pg.locator('.thr-door').count()>0, 'somebody is on the door somewhere');
 const lv = await pg.evaluate(()=>[thresholdOf(events.find(e=>e.id==='e1')).level, thresholdOf(events.find(e=>e.id==='e3')).level]);
 ok(lv[0]==='open' && lv[2-1]==='tight', 'threshold separates an open room from a tight one: '+JSON.stringify(lv));

 // --- Ride the dusk
 await pg.evaluate(()=>go('discover')); await pg.waitForTimeout(600);
 const before = await pg.evaluate(()=>({m:sun.minutes, y:globe.rotY}));
 await pg.click('#dusk-btn'); await pg.waitForTimeout(1600);
 const during = await pg.evaluate(()=>({m:sun.minutes, y:globe.rotY, on:dusk.on, lon:dusk.lon}));
 ok(during.on, 'the ride starts');
 ok(during.m!==before.m, `the sun moves (${before.m} -> ${during.m})`);
 ok(Math.abs(during.y-before.y)>0.05, 'the planet follows the dusk line');
 ok(await pg.evaluate(()=>document.body.classList.contains('riding-dusk')), 'chrome steps back while riding');
 // the dusk meridian really is at local evening
 const hr = await pg.evaluate(()=>solarHourAt(dusk.lon, currentSun().lon));
 ok(Math.abs(hr-18.5)<0.3, 'the dusk meridian sits at local evening: '+hr.toFixed(2)+'h');
 await pg.click('#dusk-btn'); await pg.waitForTimeout(400);
 ok(await pg.evaluate(()=>!dusk.on), 'the ride stops');

 ok(errs.length===0, 'errors: '+errs.join(' | '));
 console.log(`\n${pass} passed, ${fail} failed`);
 await b.close(); process.exit(fail?1:0);
})();
