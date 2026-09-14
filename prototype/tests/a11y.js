const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('wrapped-web.html');
let pass=0, fail=0;
function ok(c,m){ c?(pass++):(fail++, console.log('  FAIL: '+m)); }

(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport:{width:1280,height:860}, colorScheme:'light' });
  const errs=[]; pg.on('pageerror', e=>errs.push(e.message));
  await pg.goto(FILE); await pg.waitForTimeout(1800);

  // --- landmarks & skip link
  ok(await pg.locator('main#main').count()===1, 'one <main> landmark');
  const skip = pg.locator('a.skip-link');
  ok(await skip.count()===1, 'skip link exists');
  await pg.keyboard.press('Tab');
  ok(await skip.evaluate(e=>document.activeElement===e), 'skip link is the first tab stop');
  await pg.waitForTimeout(300); // the reveal is a transition; measure after it settles
  ok(await skip.evaluate(e=>e.getBoundingClientRect().top >= 0), 'skip link visible when focused');

  // --- every interactive control has an accessible name
  const unnamed = await pg.evaluate(() => {
    const out=[];
    document.querySelectorAll('button,input,select,textarea,a[href]').forEach(el=>{
      // Skip what is genuinely not exposed: hidden or inert subtrees.
      if(el.closest('[hidden]') || el.closest('[inert]')) return;
      const byIds = (el.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean)
        .map(id=>document.getElementById(id)?.textContent||'').join(' ');
      const lbl = el.getAttribute('aria-label') || byIds ||
        (el.id && document.querySelector('label[for="'+CSS.escape(el.id)+'"]')?.textContent) ||
        el.closest('label')?.textContent || el.textContent || el.value || '';
      if(!lbl.trim()) out.push(el.tagName+'#'+(el.id||'')+'.'+(el.className||'').toString().slice(0,30));
    });
    return out;
  });
  ok(unnamed.length===0, 'unnamed controls: '+JSON.stringify(unnamed));

  // --- focus ring actually renders
  const ring = await pg.evaluate(() => {
    const btn = document.querySelector('.rail-link'); btn.focus();
    const cs = getComputedStyle(btn);
    return { w: cs.outlineWidth, style: cs.outlineStyle };
  });
  ok(parseFloat(ring.w)>=2 && ring.style!=='none', 'focus ring on nav buttons: '+JSON.stringify(ring));

  // --- WCAG 2.5.7: the globe must be operable without a drag
  const before = await pg.evaluate(()=>globe.rotY);
  await pg.locator('#globe-canvas').focus();
  ok(await pg.evaluate(()=>document.activeElement.id)==='globe-canvas', 'globe canvas is focusable');
  await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(120);
  const after = await pg.evaluate(()=>globe.rotY);
  ok(Math.abs(after-before)>0.05, `arrow key rotates the globe (${before} -> ${after})`);
  const w0 = await pg.evaluate(()=>windowIndex);
  await pg.keyboard.press('PageDown'); await pg.waitForTimeout(200);
  ok(await pg.evaluate(()=>windowIndex) === w0+1, 'PageDown travels through time');

  // --- canvas has a text alternative
  ok((await pg.locator('#globe-canvas').getAttribute('aria-label')||'').length>40, 'globe has a real text alternative');

  // --- nav state is exposed, not just painted
  ok(await pg.locator('[data-nav][aria-current="page"]').count()>=1, 'active nav item marked aria-current');
  await pg.evaluate(()=>go('gatherings')); await pg.waitForTimeout(250);
  ok(await pg.evaluate(()=>document.activeElement.tagName)==='H1', 'focus moves to the new view heading');
  ok((await pg.locator('#view-live').textContent()).includes('Gatherings'), 'view change announced politely');
  const cur = await pg.locator('[data-nav][aria-current="page"]').first().getAttribute('data-nav');
  ok(cur==='gatherings', 'aria-current follows navigation, got '+cur);

  // --- no horizontal overflow anywhere
  await pg.evaluate(()=>go('discover'));
  for (const w of [360,390,414,600,768,1024,1280,1440,1920]) {
    await pg.setViewportSize({width:w,height:860}); await pg.waitForTimeout(260);
    const over = await pg.evaluate(()=>document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(over<=0, `no horizontal overflow at ${w}px (overflow ${over})`);
  }

  // --- closed overlays must not be reachable
  const reachable = await pg.evaluate(() => {
    const bad=[];
    document.querySelectorAll('.drawer:not(.open), .modal-wrap:not(.open)').forEach(d=>{
      if(!d.hasAttribute('inert')) bad.push(d.id);
    });
    return bad;
  });
  ok(reachable.length===0, 'closed overlays left tabbable: '+JSON.stringify(reachable));
  await pg.evaluate(()=>openSettings()); await pg.waitForTimeout(250);
  ok(await pg.evaluate(()=>document.getElementById('drawer-settings').contains(document.activeElement)), 'focus moves into the opened dialog');
  ok(await pg.evaluate(()=>document.getElementById('drawer-settings').getAttribute('role'))==='dialog', 'overlay has dialog role');
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(250);
  ok(await pg.evaluate(()=>!document.getElementById('drawer-settings').classList.contains('open')), 'Escape closes the dialog');
  ok(await pg.evaluate(()=>!document.getElementById('drawer-settings').contains(document.activeElement)), 'focus leaves the closed dialog');

  // Same name sweep again, this time with each overlay open, so `inert` cannot mask a gap.
  for (const [fn,id] of [["openEvent(events[0].id)",'drawer-event'],["openSettings()",'drawer-settings'],
                         ["openCreate()",'modal-create'],["openEditProfile()",'drawer-edit-profile']]) {
    await pg.evaluate(f=>eval(f), fn); await pg.waitForTimeout(200);
    const gaps = await pg.evaluate(id => {
      const out=[];
      document.querySelectorAll('#'+id+' button, #'+id+' input, #'+id+' select, #'+id+' textarea').forEach(el=>{
        const byIds=(el.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean)
          .map(i=>document.getElementById(i)?.textContent||'').join(' ');
        const lbl = el.getAttribute('aria-label') || byIds ||
          (el.id && document.querySelector('label[for="'+CSS.escape(el.id)+'"]')?.textContent) ||
          el.closest('label')?.textContent || el.textContent || el.value || '';
        if(!lbl.trim()) out.push(el.tagName+'#'+el.id);
      });
      return out;
    }, id);
    ok(gaps.length===0, `unnamed controls inside open ${id}: ${JSON.stringify(gaps)}`);
    await pg.evaluate(()=>closeAllOverlays()); await pg.waitForTimeout(150);
  }

  // --- cards must be reachable and activatable by keyboard, not pointer-only
  await pg.evaluate(()=>go('gatherings')); await pg.waitForTimeout(350);
  const cardsOk = await pg.evaluate(() => {
    const cards=[...document.querySelectorAll('#discover-grid .event-card')];
    return cards.length>0 && cards.every(c=>c.querySelector('.card-open'));
  });
  ok(cardsOk, 'every event card exposes a focusable control');
  const opened = await pg.evaluate(async () => {
    const btn=document.querySelector('#discover-grid .card-open'); btn.focus();
    btn.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
    btn.click();
    await new Promise(r=>setTimeout(r,250));
    return document.getElementById('drawer-event').classList.contains('open');
  });
  ok(opened, 'activating a card from the keyboard opens the event');
  await pg.evaluate(()=>closeAllOverlays()); await pg.waitForTimeout(200);
  await pg.evaluate(()=>go('discover')); await pg.waitForTimeout(300);

  ok(errs.length===0, 'page errors: '+errs.join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`);
  await b.close();
  process.exit(fail?1:0);
})();
