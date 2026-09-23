const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
let pass=0,fail=0; const ok=(c,m)=>c?pass++:(fail++,console.log('  FAIL: '+m));
const FILE='file://'+path.resolve('wrapped-new.html');
async function ready(pg){ await pg.goto(FILE); await pg.waitForTimeout(200);
  await pg.keyboard.press('Space'); await pg.waitForTimeout(900); }
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await b.newPage({viewport:{width:1440,height:900}});
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await ready(pg);

 // ── odometer: one column per character, each rolled to its digit
 const odo = await pg.evaluate(()=>{
   const host=document.getElementById('leave-time');
   const text=document.getElementById('leave-time-text').textContent;
   const cols=[...host.children];
   return { text, cols:cols.length,
     digits: cols.map((c,i)=>{
       const ch=text[i];
       if(ch<'0'||ch>'9') return {sep:true, ch:c.textContent};
       const t=c.firstChild.style.transform||'';
       const m=t.match(/-?([\d.]+)%/);
       return { ch, shift:m?Number(m[1]):null };
     })};
 });
 ok(odo.cols===odo.text.length, `one column per character (${odo.cols} vs ${odo.text.length})`);
 const wrong = odo.digits.filter(d=>!d.sep && d.shift !== Number(d.ch)*10);
 ok(wrong.length===0, 'every digit column is rolled to its own figure: '+JSON.stringify(wrong));
 ok(odo.digits.some(d=>d.sep && d.ch===':'), 'the separator is not a rolling column');
 // a column narrower than its glyph clips the digit sideways
 const fits = await pg.evaluate(()=>{
   const bad=[];
   document.querySelectorAll('#leave-time .od').forEach(c=>{
     const glyph=c.querySelector('i');
     if(glyph.scrollWidth > c.clientWidth + 0.5) bad.push(glyph.textContent+' '+glyph.scrollWidth+'>'+c.clientWidth);
   });
   document.querySelectorAll('#leave-time .od-sep').forEach(c=>{
     if(c.scrollWidth > c.clientWidth + 0.5) bad.push('sep '+c.scrollWidth+'>'+c.clientWidth);
   });
   return bad;
 });
 ok(fits.length===0, 'no digit is clipped by its column: '+JSON.stringify(fits));

 // it follows the departure
 await pg.evaluate(()=>{const r=document.getElementById('leave-range'); r.value=125; r.dispatchEvent(new Event('input',{bubbles:true}));});
 await pg.waitForTimeout(600);
 const after = await pg.evaluate(()=>{
   const text=document.getElementById('leave-time-text').textContent;
   const cols=[...document.getElementById('leave-time').children];
   return cols.every((c,i)=>{
     const ch=text[i]; if(ch<'0'||ch>'9') return true;
     const m=(c.firstChild.style.transform||'').match(/-?([\d.]+)%/);
     return m && Number(m[1])===Number(ch)*10;
   });
 });
 ok(after, 'the odometer tracks the departure time');
 ok(await pg.evaluate(()=>document.getElementById('leave-time').getAttribute('aria-hidden'))==='true',
    'the rolling digits are hidden from assistive technology');
 ok((await pg.evaluate(()=>document.getElementById('leave-time-text').textContent)).match(/^\d\d:\d\d$/)!==null,
    'a plain-text clock is exposed alongside');

 // ── magnetism: bounded, and only near the pointer
 const nodeBox = await pg.evaluate(()=>{
   const n=document.querySelector('.node'); const r=n.getBoundingClientRect();
   return {x:r.left+r.width/2, y:r.top+r.height/2, id:n.dataset.id};
 });
 await pg.mouse.move(nodeBox.x+18, nodeBox.y+8); await pg.waitForTimeout(220);
 const pulled = await pg.evaluate(id=>{
   const n=document.querySelector('.node[data-id="'+id+'"]');
   return { mx:parseFloat(n.style.getPropertyValue('--mx'))||0,
            my:parseFloat(n.style.getPropertyValue('--my'))||0,
            cls:n.classList.contains('pulled') };
 }, nodeBox.id);
 ok(pulled.cls, 'a node near the pointer is marked as pulled');
 ok(Math.hypot(pulled.mx,pulled.my) > 0.5, 'and it actually moves: '+JSON.stringify(pulled));
 ok(Math.hypot(pulled.mx,pulled.my) <= 7.5, 'but never far enough to misplace it on the plot');

 await pg.mouse.move(20, 20); await pg.waitForTimeout(260);
 const released = await pg.evaluate(id=>{
   const n=document.querySelector('.node[data-id="'+id+'"]');
   return Math.abs(parseFloat(n.style.getPropertyValue('--mx'))||0);
 }, nodeBox.id);
 ok(released < 0.6, 'and it returns when the pointer leaves: '+released);

 // ── grab and fling
 const sc = await pg.locator('#scroller').boundingBox();
 const before = await pg.evaluate(()=>document.getElementById('scroller').scrollLeft);
 await pg.mouse.move(sc.x+sc.width*0.6, sc.y+sc.height*0.8);
 await pg.mouse.down();
 for(let i=0;i<8;i++){ await pg.mouse.move(sc.x+sc.width*0.6-i*22, sc.y+sc.height*0.8); await pg.waitForTimeout(16); }
 await pg.mouse.up();
 const mid = await pg.evaluate(()=>document.getElementById('scroller').scrollLeft);
 ok(mid>before+60, `dragging the field scrubs time (${Math.round(before)} -> ${Math.round(mid)})`);
 await pg.waitForTimeout(700);
 const coasted = await pg.evaluate(()=>document.getElementById('scroller').scrollLeft);
 ok(coasted>=mid, `and it keeps gliding after release (${Math.round(mid)} -> ${Math.round(coasted)})`);

 // a fling must not open a gathering
 ok(await pg.evaluate(()=>!document.getElementById('sheet').classList.contains('open')),
    'flinging the field does not open anything');

 // a genuine tap still does
 await pg.evaluate(()=>{const n=document.querySelector('.node'); n.click();});
 await pg.waitForTimeout(350);
 ok(await pg.evaluate(()=>document.getElementById('sheet').classList.contains('open')), 'a tap still opens a gathering');
 ok(await pg.evaluate(()=>document.querySelectorAll('.flyer').length)<=1, 'the fly-in cleans up after itself');
 await pg.keyboard.press('Escape'); await pg.waitForTimeout(600);
 ok(await pg.evaluate(()=>document.querySelectorAll('.flyer').length)===0, 'no flyer is left behind');

 // ── sweep wake
 await pg.click('#sweep-btn'); await pg.waitForTimeout(900);
 const ghosts = await pg.evaluate(()=>document.querySelectorAll('#overlay line').length);
 ok(ghosts>1, 'the sweeping line leaves a wake: '+ghosts+' lines');
 await pg.click('#sweep-btn'); await pg.waitForTimeout(400);
 const settled = await pg.evaluate(()=>document.querySelectorAll('#overlay line').length);
 ok(settled===1, 'and the wake clears when it stops: '+settled);

 ok(errs.length===0, 'errors: '+errs.join(' | '));
 await pg.close();

 // ── reduced motion turns all of it off
 const ctx=await b.newContext({viewport:{width:1440,height:900}, reducedMotion:'reduce'});
 const p2=await ctx.newPage();
 await p2.goto(FILE); await p2.waitForTimeout(800);
 ok(await p2.evaluate(()=>!document.body.classList.contains('fx')), 'reduced motion disables the effects layer');
 const box = await p2.evaluate(()=>{const n=document.querySelector('.node'); const r=n.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2,id:n.dataset.id};});
 await p2.mouse.move(box.x+16, box.y+6); await p2.waitForTimeout(220);
 ok(await p2.evaluate(id=>Math.abs(parseFloat(document.querySelector('.node[data-id="'+id+'"]').style.getPropertyValue('--mx'))||0), box.id) === 0,
    'nodes do not chase the pointer under reduced motion');
 ok((await p2.evaluate(()=>document.getElementById('leave-time-text').textContent)).match(/^\d\d:\d\d$/)!==null,
    'the clock still reads correctly');

 console.log(`\n${pass} passed, ${fail} failed`);
 await b.close(); process.exit(fail?1:0);
})();
