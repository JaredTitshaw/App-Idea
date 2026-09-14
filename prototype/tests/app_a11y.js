const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
let pass=0,fail=0;
const ok=(c,m)=>c?pass++:(fail++,console.log('  FAIL: '+m));
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await b.newPage({viewport:{width:1280,height:900},colorScheme:'light'});
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+path.resolve('wrapped-app.html'));
 await pg.waitForTimeout(1500);
 await pg.evaluate(()=>go('discover')); await pg.waitForTimeout(1200);

 // closed sheets must be out of the tab order
 const leaky = await pg.evaluate(()=>[...document.querySelectorAll('.sheet-overlay:not(.open)')]
    .filter(e=>!e.hasAttribute('inert')).map(e=>e.id));
 ok(leaky.length===0, 'closed sheets left tabbable: '+JSON.stringify(leaky));

 // opening a sheet exposes it and moves focus in
 await pg.evaluate(()=>openEvent(events[0].id)); await pg.waitForTimeout(400);
 ok(await pg.evaluate(()=>!document.getElementById('sheet-event').hasAttribute('inert')), 'opened sheet is exposed');
 ok(await pg.evaluate(()=>document.getElementById('sheet-event').contains(document.activeElement)), 'focus moves into the opened sheet');
 await pg.evaluate(()=>closeEvent()); await pg.waitForTimeout(300);
 ok(await pg.evaluate(()=>document.getElementById('sheet-event').hasAttribute('inert')), 'closed sheet is inert again');

 // every exposed control has an accessible name
 const screens=['discover','search','map','live','create','companion','profile','settings','notifications'];
 let unnamed=[];
 for(const v of screens){
   await pg.evaluate(x=>go(x), v); await pg.waitForTimeout(320);
   const u=await pg.evaluate(()=>{
     const out=[];
     document.querySelectorAll('.screen.active button, .screen.active input, .screen.active select, .screen.active textarea').forEach(el=>{
       if(el.closest('[inert],[hidden]')) return;
       const byIds=(el.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean)
         .map(i=>document.getElementById(i)?.textContent||'').join(' ');
       const lbl=el.getAttribute('aria-label')||byIds||
         (el.id&&document.querySelector('label[for="'+CSS.escape(el.id)+'"]')?.textContent)||
         el.closest('label')?.textContent||el.textContent||el.value||'';
       if(!lbl.trim()) out.push(el.tagName+'#'+el.id+'.'+String(el.className).slice(0,24));
     });
     return out;
   });
   if(u.length) unnamed.push(v+': '+JSON.stringify(u));
 }
 ok(unnamed.length===0, 'unnamed controls -> '+unnamed.join(' | '));

 // globe operable without a drag
 await pg.evaluate(()=>go('map')); await pg.waitForTimeout(1200);
 const before=await pg.evaluate(()=>globe.rotY);
 await pg.locator('#globe-canvas').focus();
 ok(await pg.evaluate(()=>document.activeElement.id)==='globe-canvas','globe canvas focusable');
 await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(150);
 ok(Math.abs(await pg.evaluate(()=>globe.rotY)-before)>0.05,'arrow key rotates the phone globe');

 // focus ring renders
 const ring=await pg.evaluate(()=>{const n=document.querySelector('.screen.active button');n.focus();
   const c=getComputedStyle(n);return {w:c.outlineWidth,s:c.outlineStyle};});
 ok(parseFloat(ring.w)>=2&&ring.s!=='none','focus ring present: '+JSON.stringify(ring));

 ok(errs.length===0,'page errors: '+errs.join(' | '));
 console.log(`\n${pass} passed, ${fail} failed`);
 await b.close(); process.exit(fail?1:0);
})();
