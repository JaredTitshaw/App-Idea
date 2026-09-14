const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const ok = (n,c)=>console.log((c?'PASS':'FAIL')+' — '+n);
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1440,height:860} });
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  p.on('console',m=>{ if(m.type()==='error' && !/ERR_TUNNEL/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://'+path.resolve(__dirname,'wrapped-web.html'));
  await p.evaluate(()=>{ try{localStorage.clear();}catch(e){} });
  await p.reload(); await p.waitForTimeout(2600);

  ok('WebGL renderer active', await p.evaluate(()=>PLANET.usingGL()));
  ok('surface baked', await p.evaluate(()=>PLANET.ready()));
  ok('planet-mode dark chrome on', await p.evaluate(()=>document.body.classList.contains('planet-mode')));

  // drag the planet to orbit
  const before = await p.evaluate(()=>globe.rotY);
  const box = await (await p.$('#map-canvas')).boundingBox();
  await p.mouse.move(box.x+box.width*0.66, box.y+box.height*0.44);
  await p.mouse.down();
  await p.mouse.move(box.x+box.width*0.66+180, box.y+box.height*0.44, {steps:8});
  await p.mouse.up(); await p.waitForTimeout(200);
  ok('drag rotates the planet', await p.evaluate(r=>Math.abs(globe.rotY-r)>0.3, before));

  // wheel over the stage travels through time
  await p.mouse.move(box.x+box.width*0.5, box.y+box.height*0.5);
  await p.mouse.wheel(0,120); await p.waitForTimeout(420);
  ok('wheel travels through time', await p.evaluate(()=>windowIndex===1));

  // timeline drag
  const tb = await (await p.$('#timeline-track')).boundingBox();
  await p.mouse.move(tb.x+4, tb.y+5); await p.mouse.down();
  const seen=[];
  for(let f=0; f<=1.001; f+=0.25){ await p.mouse.move(tb.x+tb.width*f, tb.y+5); await p.waitForTimeout(45); seen.push(await p.evaluate(()=>windowIndex)); }
  await p.mouse.up(); await p.waitForTimeout(200);
  ok('timeline drag scrubs 0..4 ('+seen.join(',')+')', seen.join(',')==='0,1,2,3,4');

  // tap a point on the globe opens the event
  await p.evaluate(()=>{ setWindow(4,false); });
  await p.waitForTimeout(400);
  const pt = await p.evaluate(()=>globe.screenPoints[0]||null);
  if(pt){
    await p.mouse.click(box.x+pt.x, box.y+pt.y);
    await p.waitForTimeout(400);
    ok('tapping a point opens the event', await p.evaluate(()=>!!document.querySelector('.sheet-overlay.open, .modal-wrap.open, .drawer.open')||!!activeEventId));
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  } else ok('tapping a point opens the event', false);

  // tour
  await p.evaluate(()=>toggleTour()); await p.waitForTimeout(900);
  ok('tour runs and shows a card', await p.evaluate(()=>tour.on && !document.getElementById('tour-card').hidden));
  await p.evaluate(()=>toggleTour()); await p.waitForTimeout(200);

  // day & night
  await p.evaluate(()=>toggleDayNight()); await p.waitForTimeout(250);
  ok('day & night toggles off', await p.evaluate(()=>sun.on===false && document.getElementById('sun-ctl').hidden));
  await p.evaluate(()=>toggleDayNight()); await p.waitForTimeout(250);

  // keyboard + search
  await p.keyboard.press('/'); await p.waitForTimeout(300);
  ok('"/" focuses search', await p.evaluate(()=>document.activeElement.id==='hero-search'));
  await p.keyboard.type('tokyo'); await p.waitForTimeout(300);
  await p.evaluate(()=>go('gatherings')); await p.waitForTimeout(300);
  ok('search filters the list', await p.evaluate(()=>document.querySelectorAll('#discover-grid .event-card').length===1));

  // gatherings page is its own page, in the light theme
  ok('gatherings leaves planet mode', await p.evaluate(()=>!document.body.classList.contains('planet-mode')));
  await p.evaluate(()=>{ document.getElementById('hero-search').value=''; onHeroSearch(); go('discover'); });
  await p.waitForTimeout(400);
  ok('back to the planet re-enters planet mode', await p.evaluate(()=>document.body.classList.contains('planet-mode')));
  ok('globe loop alive after nav', await p.evaluate(()=>globe.raf!==null));

  // no wording below the globe: nothing between the globe and the timeline
  // The rule is about *visible* wording. Screen-reader-only text (.vh) is not on screen,
  // so it is counted out rather than counted as prose.
  ok('no prose under the globe', await p.evaluate(()=>{
    const els=[...document.querySelectorAll('.stage p, .stage .page-sub')]
      .filter(e=>!e.classList.contains('vh') && e.getBoundingClientRect().height>1);
    return els.length===1 && els[0].classList.contains('stage-sub');
  }));

  console.log('errors:', errs.length?errs:'none');
  await b.close();
})();
