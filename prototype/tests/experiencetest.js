// Functional checks for the Convene Experience (framed-landscape build).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
const PAGE = 'file://'+path.resolve(process.env.EXP_PAGE || 'wrapped-experience.html');
let pass=0,fail=0; const ok=(c,m)=>c?pass++:(fail++,console.log('  FAIL: '+m));
const ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
async function open(b, opts={}){
  const ctx=await b.newContext({viewport:opts.vp||{width:1440,height:900}, reducedMotion:opts.rm===false?'no-preference':'reduce', colorScheme:opts.scheme||'light'});
  const pg=await ctx.newPage(); pg.errs=[];
  pg.on('pageerror',e=>pg.errs.push(e.message));
  pg.on('console',m=>{ if(m.type()==='warning' && /shader|program/i.test(m.text())) pg.errs.push(m.text()); });
  await pg.route(/fonts\.(googleapis|gstatic)\.com/, r=>r.abort());
  if(opts.nogl) await pg.addInitScript(()=>{ const g=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext=function(t,...a){ return /webgl/.test(t)?null:g.call(this,t,...a); }; });
  if(opts.init) await pg.addInitScript(opts.init);
  await pg.goto(PAGE + (opts.hash||''));
  await pg.waitForFunction(()=>window.__exp && __exp.loaderDone(),{timeout:30000});
  await pg.waitForTimeout(250);
  return pg;
}
const settle = async pg => { await pg.waitForTimeout(120); await pg.waitForFunction(()=>__exp.settled,{timeout:8000}); await pg.waitForTimeout(160); };
const to = async (pg, y) => { await pg.evaluate(y=>scrollTo(0,y), y); await settle(pg); };
const st = pg => pg.evaluate(()=>__exp.state);
const visible = (pg, g) => pg.evaluate(g=>!document.querySelector('#fui .grp[data-g="'+g+'"]').hasAttribute('data-off'), g);

(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:ARGS});

 // ── the timeline
 let pg=await open(b);
 ok(await pg.evaluate(()=>__exp.gl), 'WebGL landscape is running');
 await pg.waitForTimeout(600);
 ok(await pg.evaluate(()=>document.getElementById('loader').hidden), 'loader is gone after start');
 const keys=await pg.evaluate(()=>__exp.keys.map(k=>k.y));
 ok(keys.every((y,i)=>i===0||y>=keys[i-1]), 'stations rise monotonically down the page');
 const sec=await pg.evaluate(()=>__exp.sec);
 let s=await st(pg);
 ok(s.fr[0]===1 && s.gw.hero===1, 'opens on the resting frame');
 let g=await pg.evaluate(()=>__exp.geom);
 ok(g.nd>40 && g.cw>200 && g.bz>0, 'resting frame has the notch, the card bite and a bezel');
 ok(/^path\(/.test(await pg.evaluate(()=>document.getElementById('gl').style.clipPath)), 'the view is clipped to the notched outline');
 ok(await visible(pg,'hero') && await visible(pg,'top') && !await visible(pg,'gal'), 'only the opening screen\'s controls are reachable');
 ok(s.A.row===0 && s.A.al===1, 'TONIGHT stands in the landscape');
 const eb=await pg.evaluate(()=>{ const r=document.getElementById('ebA').getBoundingClientRect(), w=__exp.wordBox('A'), f=__exp.geom; return {mid:r.left+r.width/2, cx:w.cx+f.fx, bottom:r.bottom, top:w.top+f.fy, text:document.getElementById('ebA').textContent}; });
 ok(Math.abs(eb.mid-eb.cx)<2 && eb.bottom<=eb.top+2 && /walk into/i.test(eb.text), 'eyebrow sits centred above the word: '+JSON.stringify(eb));

 await to(pg, sec.free+10); s=await st(pg); g=await pg.evaluate(()=>__exp.geom);
 ok(s.fr[2]===1 && g.fw===1440 && g.fh===900 && g.nd===0, 'Free is full-bleed with no notch');
 ok(await pg.evaluate(()=>document.getElementById('chrome-top').style.visibility)==='hidden', 'chrome outside the frame steps away');
 ok(s.A.row===1, 'FREE is the word');
 ok(await visible(pg,'mani') && !await visible(pg,'hero'), 'manifesto panel shown alone');

 // ── the gallery
 for(const k of [0,3,8]){
   await to(pg, await pg.evaluate(k=>__exp.stopY(k),k)); s=await st(pg);
   ok(s.stop===k && Math.abs(s.pan-k)<1e-6 && s.A.row===k+2, 'stop '+k+' is centred with its word');
   ok(await pg.evaluate(()=>document.querySelector('#tiles .tile[aria-current="true"]').getAttribute('data-k'))===String(k), 'current tile is gathering '+k);
   ok(await pg.textContent('#g-count')===String(k+1).padStart(2,'0')+' / 09', 'counter reads '+(k+1));
 }
 const days=[]; for(const k of [0,3,5,8]){ await to(pg, await pg.evaluate(k=>__exp.stopY(k),k)); days.push((await st(pg)).day); }
 ok(days.every((d,i)=>i===0||d>d-1&&d>=days[i-1]) && days[3]>days[0]+.3, 'the sky darkens through the evening: '+days.map(d=>d.toFixed(2)));
 ok(/21:15/.test(await pg.textContent('#clock')), 'clock follows the gathering');
 await to(pg, await pg.evaluate(()=>__exp.stopY(2)));
 await pg.click('#g-next'); await settle(pg);
 ok((await st(pg)).stop===3, 'Next steps one gathering');
 await pg.click('#g-prev'); await settle(pg);
 ok((await st(pg)).stop===2, 'Previous steps back');
 await pg.mouse.move(5,5); await pg.keyboard.press('ArrowRight'); await settle(pg);
 ok((await st(pg)).stop===3, 'ArrowRight steps too');
 ok(/84 expected.*36% come alone.*Nadia on the door/.test(await pg.textContent('#g-facts')), 'facts strip tells what listings leave out');

 // clicking the word in the landscape opens that gathering
 const wb=await pg.evaluate(()=>{ const w=__exp.wordBox('A'), f=__exp.geom; return {x:f.fx+(w.left+w.right)/2, y:f.fy+(w.top+w.bottom)/2}; });
 await pg.mouse.click(wb.x, wb.y); await pg.waitForTimeout(400);
 ok(await pg.evaluate(()=>__exp.sheet)===3, 'clicking DOCKSIDE opens Dockside Swap Meet');
 ok(await pg.evaluate(()=>document.activeElement.id)==='sh-close', 'focus moves into the sheet');
 ok(await pg.evaluate(()=>document.getElementById('main').inert && document.getElementById('fui').inert), 'page behind is inert');
 await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
 ok(await pg.evaluate(()=>__exp.sheet)===null, 'Escape closes the sheet');

 // ── filters
 await pg.selectOption('#f-kind','Culture'); await pg.waitForTimeout(200);
 ok(JSON.stringify(await pg.evaluate(()=>__exp.matchList()))==='[2,7,8]', 'Culture = bairro, print, lantern');
 ok(/3 gatherings: culture/.test(await pg.textContent('#live')), 'filter change is announced');
 await settle(pg); await pg.waitForTimeout(800); await settle(pg);
 ok([2,7,8].includes((await st(pg)).stop), 'a hidden gathering is skipped to the nearest match: '+(await st(pg)).stop);
 ok((await st(pg)).A.al===1, 'matching word is at full strength');
 await pg.click('#g-next'); await settle(pg);
 ok((await st(pg)).stop===7, 'Next skips what the filter hides');
 await pg.selectOption('#f-kind','Any'); await pg.click('#p-run'); await pg.waitForTimeout(200);
 ok(JSON.stringify(await pg.evaluate(()=>__exp.matchList()))==='[0,1,2]', 'Running now = feria, repair, bairro');
 ok(await pg.getAttribute('#p-run','aria-pressed')==='true', 'the pill shows it is on');
 await pg.click('#p-run'); await pg.waitForTimeout(100);

 // ── ask
 await to(pg, 0);
 await pg.click('#rail-ask'); await pg.waitForTimeout(250);
 ok(await pg.evaluate(()=>document.activeElement.id)==='ask-in', 'Ask opens with the cursor in the box');
 const P = t => pg.evaluate(t=>{ const q=__exp.parseAsk(t); return {f:q.f, heard:q.heard, name:q.name}; }, t);
 let q=await P('something in Spanish for the kids'); ok(q.f.lang==='ES' && q.f.kind==='Family', 'Spanish + kids');
 q=await P("I'm going on my own, within 20 minutes"); ok(q.f.alone && q.f.reach===30, 'alone + 20 min → within 30');
 q=await P('lantern'); ok(q.name===8, 'a name is found');
 q=await P('blah'); ok(!q.heard && q.name<0, 'nonsense is not guessed at');
 await pg.fill('#ask-in','spanish'); await pg.press('#ask-in','Enter'); await pg.waitForTimeout(300);
 ok(await pg.inputValue('#f-lang')==='ES', 'asking sets the Speaking filter');
 ok(JSON.stringify(await pg.evaluate(()=>__exp.matchList()))==='[0,6]', 'Spanish → feria, screening');
 ok(/2 gatherings are in Spanish/.test(await pg.textContent('#ask-reply')), 'honest reply');
 await settle(pg); await pg.waitForTimeout(900); await settle(pg);
 ok((await st(pg)).stop===0, 'and travels to the first match');
 await pg.evaluate(()=>scrollTo(0,0)); await settle(pg);
 await pg.click('#rail-ask'); await pg.waitForTimeout(200);
 await pg.fill('#ask-in','german family'); await pg.press('#ask-in','Enter'); await pg.waitForTimeout(200);
 ok(/Nothing tonight is/.test(await pg.textContent('#ask-reply')) && await pg.inputValue('#f-lang')==='ES', 'no match leaves the filters alone');
 await pg.fill('#ask-in','zzz'); await pg.press('#ask-in','Enter'); await pg.waitForTimeout(150);
 ok(/didn’t catch/.test(await pg.textContent('#ask-reply')), 'nonsense gets a hint');
 await pg.keyboard.press('Escape'); await pg.waitForTimeout(200);
 ok(await pg.evaluate(()=>document.activeElement.id)==='rail-ask', 'Escape closes Ask and returns focus');
 await pg.selectOption('#f-lang','Any');

 // ── save and share, on this device
 await pg.click('#feat-save'); await pg.waitForTimeout(100);
 ok(await pg.textContent('#saved-n')==='1' && await pg.getAttribute('#feat-save','aria-pressed')==='true', 'saving counts it');
 ok(JSON.stringify(await pg.evaluate(()=>JSON.parse(localStorage.getItem('convene.saved'))))==='["dock"]', 'kept in this browser');

 // ── list dialog
 await pg.click('#rail-list'); await pg.waitForTimeout(300);
 ok(await pg.evaluate(()=>document.querySelectorAll('#rows button').length)===9, 'the list has all nine');
 ok(/Saved/.test(await pg.textContent('#rows li:nth-child(4)')), 'the saved one is marked');
 await pg.click('#rows button[data-k="5"]'); await settle(pg); await pg.waitForTimeout(900); await settle(pg);
 ok((await st(pg)).stop===5, 'choosing from the list travels there');
 ok(await pg.evaluate(()=>document.activeElement && document.activeElement.getAttribute('data-k'))==='5', 'focus lands on its tile');

 // ── theme
 const before=await pg.evaluate(()=>getComputedStyle(document.getElementById('bezel')).backgroundColor);
 await to(pg,0); await pg.click('#theme-btn'); await pg.waitForTimeout(100);
 const after=await pg.evaluate(()=>getComputedStyle(document.getElementById('bezel')).backgroundColor);
 ok(await pg.getAttribute('html','data-theme')==='dark' && before!==after, 'theme switch repaints the frame: '+before+' → '+after);
 ok(await pg.getAttribute('#theme-btn','aria-label')==='Switch to day theme', 'the button says what it will do');

 // ── Next and the outro
 await to(pg, 0); await pg.click('#next-btn'); await settle(pg);
 ok(Math.abs(await pg.evaluate(()=>scrollY) - sec.free) < 2, 'Next goes to the following station');
 await to(pg, 1e7); s=await st(pg);
 ok(s.gw.out===1 && s.A.row===11, 'the last station is the outro, with GO OUT');
 ok(await visible(pg,'out') && /Free to walk into/.test(await pg.textContent('#notch-note')), 'the outro fills its notch');
 ok(pg.errs.length===0, 'no page errors: '+pg.errs.join(' | '));
 await pg.context().close();

 // saved survives a reload; a deep link lands on its gathering
 pg=await open(b,{hash:'#lantern', init:()=>{ try{ localStorage.setItem('convene.saved','["dock","nope"]'); }catch(e){} }});
 ok((await st(pg)).stop===8, '#lantern opens on the Harbour Lantern Walk');
 ok(await pg.textContent('#saved-n')==='1', 'saved list is restored, unknown ids dropped');
 await pg.context().close();

 // ── layout at three widths
 for(const vp of [{width:1440,height:900},{width:1024,height:700},{width:390,height:844},{width:360,height:740}]){
   const p=await open(b,{vp});
   const sc=await p.evaluate(()=>__exp.sec);
   let worst=0, clipped=[];
   for(const y of [0, sc.free+10, await p.evaluate(()=>__exp.stopY(4)), sc.field+10, 1e7]){
     await to(p,y);
     worst=Math.max(worst, await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth));
     clipped=clipped.concat(await p.evaluate(()=>{
       const out=[], f=__exp.geom;
       document.querySelectorAll('#fui .grp:not([data-off]) :is(button,a,select,.feat,.tile,.gfacts,.mani-panel,.field-card)').forEach(el=>{
         const r=el.getBoundingClientRect(); if(!r.width || getComputedStyle(el).display==='none') return;
         if(el.closest('.badge')) return;
         if(r.left < f.fx-1 || r.right > f.fx+f.fw+1 || r.top < f.fy-1 || r.bottom > f.fy+f.fh+1) out.push((el.id||el.className)+'@'+Math.round(r.left)+','+Math.round(r.right));
       });
       document.querySelectorAll('#fui .grp:not([data-off]) select').forEach(el=>{
         const c=document.createElement('canvas').getContext('2d'), cs=getComputedStyle(el); c.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
         const need=c.measureText(el.options[el.selectedIndex].text).width + parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight);
         if(need > el.clientWidth + 1) out.push(el.id+' text clipped');
       });
       return out; }));
   }
   ok(worst<=0, vp.width+'px: no sideways scroll ('+worst+')');
   ok(clipped.length===0, vp.width+'px: controls stay inside the frame: '+[...new Set(clipped)].join(' '));
   // longest filter values still fit
   await to(p,0);
   await p.selectOption('#f-kind','Community'); await p.selectOption('#f-lang','PT'); await p.selectOption('#f-reach','45');
   const fit=await p.evaluate(()=>[...document.querySelectorAll('#notch select')].every(el=>{ const c=document.createElement('canvas').getContext('2d'), cs=getComputedStyle(el); c.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily; return c.measureText(el.options[el.selectedIndex].text).width + parseFloat(cs.paddingRight) <= el.clientWidth + 1; }));
   ok(fit, vp.width+'px: "Community", "Portuguese", "45 min" fit in the notch');
   await p.context().close();
 }

 // ── reduced motion: nothing moves on its own
 pg=await open(b);
 await to(pg, await pg.evaluate(()=>__exp.stopY(4)));
 const u1=await pg.screenshot({clip:{x:500,y:300,width:300,height:200}}); await pg.waitForTimeout(800);
 const u2=await pg.screenshot({clip:{x:500,y:300,width:300,height:200}});
 ok(u1.equals(u2), 'reduced motion: the scene holds still');
 await pg.context().close();
 pg=await open(b,{rm:false});
 await to(pg, await pg.evaluate(()=>__exp.stopY(4)));
 const m1=await pg.screenshot({clip:{x:500,y:300,width:300,height:200}}); await pg.waitForTimeout(900);
 const m2=await pg.screenshot({clip:{x:500,y:300,width:300,height:200}});
 ok(!m1.equals(m2), 'with motion allowed, water and sky move');
 await pg.context().close();

 // ── without WebGL
 pg=await open(b,{nogl:true});
 ok(!await pg.evaluate(()=>__exp.gl) && await pg.evaluate(()=>document.documentElement.classList.contains('no-gl')), 'falls back when WebGL is unavailable');
 ok(await pg.textContent('#fbword')==='TONIGHT', 'the word is still there, as text');
 await to(pg, await pg.evaluate(()=>__exp.stopY(6)));
 ok(await pg.textContent('#fbword')==='SCREENING', 'and follows the scroll');
 await pg.click('#tiles .tile[aria-current="true"]'); await pg.waitForTimeout(300);
 ok(await pg.evaluate(()=>__exp.sheet)===6, 'gatherings still open');
 ok(pg.errs.length===0, 'no page errors without WebGL: '+pg.errs.join(' | '));

 await b.close();
 console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
})();
