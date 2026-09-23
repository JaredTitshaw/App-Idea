const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
let pass=0,fail=0; const ok=(c,m)=>c?pass++:(fail++,console.log('  FAIL: '+m));
const FILE='file://'+path.resolve('wrapped-new.html')+'#field';
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await b.newPage({viewport:{width:1440,height:900}});
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(FILE); await pg.waitForTimeout(900);

 // ── the rule the whole product rests on
 const rule = await pg.evaluate(()=>{
   const out=[];
   document.querySelectorAll('.node').forEach(n=>{
     const id=n.dataset.id;
     out.push({id, gone:n.classList.contains('is-gone'), past:n.classList.contains('is-past')});
   });
   return out;
 });
 ok(rule.length>0, 'the field draws nodes');

 // reachable ⟺ start − travel ≥ departure, checked against what is painted
 const consistent = await pg.evaluate(()=>{
   const bad=[]; const L = __convene.state().leaveAt;
   document.querySelectorAll('.node').forEach(n=>{
     const e = __convene.events.find(x=>x.id===n.dataset.id);
     if(e.came!=null) return;
     const shouldReach = (e.at - e.reach) >= L;
     const painted = !n.classList.contains('is-gone');
     if(shouldReach !== painted) bad.push(e.id);
   });
   return bad;
 });
 ok(consistent.length===0, 'painted state matches the reachability rule: '+JSON.stringify(consistent));

 // ── moving the departure later can only ever remove options
 const counts=[];
 for(const v of [0,120,240,360,480]){
   await pg.evaluate(x=>{ const r=document.getElementById('leave-range'); r.value=x; r.dispatchEvent(new Event('input',{bubbles:true})); }, v);
   await pg.waitForTimeout(120);
   counts.push(await pg.evaluate(()=>{const L=__convene.state().leaveAt; return __convene.events.filter(e=>e.came==null && (e.at-e.reach)>=L).length;}));
 }
 ok(counts.every((c,i)=> i===0 || c<=counts[i-1]), 'leaving later never adds options: '+counts.join(','));
 ok(counts[0]>counts[counts.length-1], 'and it does remove some: '+counts.join(','));

 // the readout agrees with the field
 await pg.waitForTimeout(450);   // the counters tween; read them once they settle
 const shown = await pg.evaluate(()=>document.getElementById('leave-read').textContent);
 const live = await pg.evaluate(()=>{const L=__convene.state().leaveAt; return __convene.events.filter(e=>e.came==null && (e.at-e.reach)>=L).length;});
 ok(shown.includes(String(live)), `readout matches (${shown.trim()} vs ${live})`);

 await pg.evaluate(()=>{ const r=document.getElementById('leave-range'); r.value=0; r.dispatchEvent(new Event('input',{bubbles:true})); });
 await pg.waitForTimeout(150);

 // ── the route, and whether it joins up
 const gapMath = await pg.evaluate(()=>{
   const a={at:60,dur:120,reach:20}, b1={at:200,dur:60,reach:30}, b2={at:185,dur:60,reach:70};
   return [__convene.legGap(a,b1), __convene.legGap(a,b2)];
 });
 ok(gapMath[0].ok===true, 'a route with room to travel is fine');
 ok(gapMath[1].ok===false, 'a route that needs more travel than it has is flagged');

 await pg.evaluate(()=>{ const r=__convene.events.filter(e=>e.came==null).sort((x,y)=>x.at-y.at); toggleThread(r[0].id); toggleThread(r[3].id); });
 await pg.waitForTimeout(250);
 ok(await pg.evaluate(()=>__convene.state().thread.length)===2, 'two stops go into the route');
 const tb = await pg.locator('#thread-b').textContent();
 ok(/min hop|leave early|min free|overlap by/.test(tb), 'the route states the hop between stops: '+tb.slice(0,120));
 ok(/Leave home by/.test(tb), 'and when to leave home');
 ok(await pg.locator('.node.in-thread').count()===2, 'the field marks what is in the route');

 // ── list view carries the same information
 await pg.evaluate(()=>setView('list')); await pg.waitForTimeout(200);
 const rows = await pg.locator('#list .row').count();
 const future = await pg.evaluate(()=>__convene.events.filter(e=>e.came==null).length);
 ok(rows===future, `list holds every upcoming gathering (${rows}/${future})`);
 const first = await pg.locator('#list .row').first().textContent();
 ok(/leave by|gone/.test(first), 'each row says when to leave');
 await pg.evaluate(()=>setView('field')); await pg.waitForTimeout(150);

 // ── the sheet
 await pg.evaluate(()=>openEvent(__convene.events.find(e=>e.came==null).id)); await pg.waitForTimeout(350);
 ok(await pg.evaluate(()=>document.getElementById('sheet').contains(document.activeElement)), 'focus moves into the sheet');
 ok(await pg.evaluate(()=>!document.getElementById('sheet').hasAttribute('inert')), 'open sheet is not inert');
 const sb = await pg.locator('#sheet-b').textContent();
 ok(/arrive alone/.test(sb) && /someone on the door/.test(sb), 'the sheet states how hard it is to walk in');
 ok(/leave by/i.test(sb), 'and when to leave');
 await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
 ok(await pg.evaluate(()=>document.getElementById('sheet').hasAttribute('inert')), 'closed sheet is inert again');
 ok(await pg.evaluate(()=>!document.getElementById('sheet').contains(document.activeElement)), 'focus leaves the closed sheet');

 // a gathering that already happened offers no way to join it
 await pg.evaluate(()=>openEvent(__convene.events.find(e=>e.came!=null).id)); await pg.waitForTimeout(300);
 const sf = await pg.locator('#sheet-f').textContent();
 ok(!/Add to/.test(sf), 'a past gathering cannot be added to a route');
 ok(/came/.test(await pg.locator('#sheet-b').textContent()), 'it reports what came of it instead');
 await pg.keyboard.press('Escape'); await pg.waitForTimeout(250);

 // ── every control has a name
 const unnamed = await pg.evaluate(()=>{
   const out=[];
   document.querySelectorAll('button,input,select,textarea,a[href]').forEach(el=>{
     if(el.closest('[inert],[hidden]')) return;
     const lbl = el.getAttribute('aria-label') ||
       (el.id && document.querySelector('label[for="'+CSS.escape(el.id)+'"]')?.textContent) ||
       el.closest('label')?.textContent || el.textContent || '';
     if(!lbl.trim()) out.push(el.tagName+'#'+el.id+'.'+String(el.className).slice(0,20));
   });
   return out;
 });
 ok(unnamed.length===0, 'unnamed controls: '+JSON.stringify(unnamed));

 // skip link first, focus ring real
 await pg.keyboard.press('Tab');
 ok(await pg.evaluate(()=>document.activeElement.classList.contains('skip')), 'skip link is the first tab stop');
 const ring = await pg.evaluate(()=>{ const n=document.querySelector('.node'); n.focus();
   const c=getComputedStyle(n); return parseFloat(c.outlineWidth)>=2 && c.outlineStyle!=='none'; });
 ok(ring, 'nodes show a focus ring');

 // ── the page itself must never scroll sideways, even though the field does
 for(const w of [360,390,414,768,1024,1440]){
   await pg.setViewportSize({width:w,height:840}); await pg.waitForTimeout(250);
   const over = await pg.evaluate(()=>document.documentElement.scrollWidth - document.documentElement.clientWidth);
   ok(over<=0, `no page-level horizontal overflow at ${w}px (${over})`);
 }

 // ── the leave line must stay on screen as the departure moves
 await pg.setViewportSize({width:390,height:760}); await pg.waitForTimeout(300);
 for(const v of [0,180,360,600]){
   await pg.evaluate(x=>{ const r=document.getElementById('leave-range'); r.value=x; r.dispatchEvent(new Event('input',{bubbles:true})); }, v);
   await pg.waitForTimeout(220);
   const vis = await pg.evaluate(()=>{
     const sc=document.getElementById('scroller');
     const line=document.querySelector('#overlay line');
     const x1=parseFloat(line.getAttribute('x1')), x2=parseFloat(line.getAttribute('x2'));
     const lo=Math.min(x1,x2), hi=Math.max(x1,x2);
     return hi>=sc.scrollLeft && lo<=sc.scrollLeft+sc.clientWidth;
   });
   ok(vis, `the leave line stays in view at departure ${v}`);
 }

 ok(errs.length===0, 'errors: '+errs.join(' | '));
 console.log(`\n${pass} passed, ${fail} failed`);
 await b.close(); process.exit(fail?1:0);
})();
