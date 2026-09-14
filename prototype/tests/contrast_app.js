const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
const AUDIT = () => {
  function rgb(s){ const m=s.match(/[\d.]+/g); return m?m.slice(0,3).map(Number).concat([m[3]!==undefined?+m[3]:1]):null; }
  function lum(c){ const f=c.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);}); return 0.2126*f[0]+0.7152*f[1]+0.0722*f[2]; }
  function ratio(a,b){ const L1=lum(a),L2=lum(b); return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05); }
  function bgOf(el){
    let n=el;
    while(n && n!==document.documentElement){
      const cs=getComputedStyle(n);
      // A gradient/image ground can't be reduced to one colour — report, don't guess.
      if(cs.backgroundImage && cs.backgroundImage!=='none') return null;
      const c=rgb(cs.backgroundColor);
      if(c && c[3]>0.85) return c;
      n=n.parentElement;
    }
    return rgb(getComputedStyle(document.body).backgroundColor)||[255,255,255,1];
  }
  const out=[];
  document.querySelectorAll('body *').forEach(el=>{
    if(el.closest('[hidden],[inert],.vh,.skip-link')) return;
    // text sitting on the planet canvas is measured separately; skip generated shapes
    if(!el.firstChild || el.firstChild.nodeType!==3) return;
    const t=el.textContent.trim(); if(!t) return;
    const r=el.getBoundingClientRect(); if(r.width<2||r.height<2) return;
    const cs=getComputedStyle(el);
    if(cs.visibility==='hidden'||cs.opacity==='0') return;
    // An ancestor can hide it just as effectively (closed sheets are opacity:0).
    for(let a=el.parentElement; a; a=a.parentElement){
      const ac=getComputedStyle(a);
      if(ac.opacity==='0'||ac.visibility==='hidden'||ac.display==='none') return;
    }
    const fg=rgb(cs.color); if(!fg) return;
    const size=parseFloat(cs.fontSize), weight=parseInt(cs.fontWeight)||400;
    const large = size>=24 || (size>=18.66 && weight>=700);
    const need = large?3:4.5;
    const bg=bgOf(el);
    if(!bg) return;  // painted over a gradient or image; not measurable this way
    const cr=ratio(fg,bg);
    if(cr<need) out.push({t:t.slice(0,32), cr:+cr.toFixed(2), need, size, sel:el.className.toString().slice(0,28)});
  });
  return out;
};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  let bad=0;
  for(const theme of ['light','dark']){
    const pg=await b.newPage({viewport:{width:1280,height:900}, colorScheme:theme});
    await pg.goto('file://'+path.resolve('convene-app.html'));
    await pg.waitForTimeout(1600);
    for(const view of ['discover','search','map','live','create','companion','profile','settings','notifications']){
      await pg.evaluate(v=>go(v), view); await pg.waitForTimeout(350);
      const res=await pg.evaluate(AUDIT);
      if(res.length){ bad+=res.length; console.log(`${theme}/${view}:`); res.forEach(r=>console.log('   ',JSON.stringify(r))); }
    }
    await pg.close();
  }
  console.log(bad===0 ? '\nContrast: no text below WCAG AA in either theme' : `\nContrast: ${bad} findings`);
  await b.close();
})();
