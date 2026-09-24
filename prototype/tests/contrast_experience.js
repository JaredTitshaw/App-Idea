// Pixel contrast for the Experience: each visible text run is compared with the pixels
// actually rendered behind it (text hidden), against both the darkest and the lightest
// 10% of those pixels, in the light and dark themes, at every station.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
const PAGE='file://'+path.resolve(process.env.EXP_PAGE||'wrapped-experience.html');
const lum=([r,g,b])=>{ const f=c=>{c/=255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4)}; return .2126*f(r)+.7152*f(g)+.0722*f(b); };
const cr=(a,b)=>{ const x=lum(a),y=lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
const SEL='.brand,.clock,.saved,.nextb span,.pill span,.nf-l,.nf select,.cut-in h2,.cut-in p,.big,.big span,.kick,.feat h2,.addr span,.feat-d,.facts li,.act span,.eb,.gfacts,.tile .t-t,.tile .t-m,.gscroll span,.gprog b,.mani-panel h2,.mani-panel p,.field-card h2,.field-card p,.cta,.notch-note';
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 let bad=0,n=0;
 for(const scheme of ['light','dark']) for(const vp of [{width:1440,height:900},{width:390,height:844}]){
  const ctx=await b.newContext({viewport:vp, reducedMotion:'reduce', colorScheme:scheme}); const pg=await ctx.newPage();
  await pg.route(/fonts\.(googleapis|gstatic)\.com/, r=>r.abort());
  await pg.goto(PAGE); await pg.waitForFunction(()=>window.__exp&&__exp.loaderDone()); await pg.waitForTimeout(700);
  await pg.addStyleTag({content:'.__hide, .__hide *{ color:transparent!important; text-shadow:none!important; -webkit-text-fill-color:transparent!important } .__hide::placeholder{color:transparent!important} .__hide .ic{ visibility:hidden!important }'});
  const sec=await pg.evaluate(()=>__exp.sec);
  const stations={ hero:0, free:sec.free+10, g0:await pg.evaluate(()=>__exp.stopY(0)), g4:await pg.evaluate(()=>__exp.stopY(4)), g8:await pg.evaluate(()=>__exp.stopY(8)), field:sec.field+10, out:1e7 };
  for(const [name,y] of Object.entries(stations)){
    await pg.evaluate(y=>scrollTo(0,y),y); await pg.waitForFunction(()=>__exp.settled); await pg.waitForTimeout(250);
    const els=await pg.$$(SEL);
    for(const el of els){
      const info=await el.evaluate(e=>{
        const r=e.getBoundingClientRect(), cs=getComputedStyle(e);
        let o=1, hid=false; for(let x=e;x;x=x.parentElement){ const s=getComputedStyle(x); o*=+s.opacity; if(s.visibility==='hidden'||s.display==='none') hid=true; }
        const hasText=[...e.childNodes].some(c=>c.nodeType===3&&c.textContent.trim()) || e.tagName==='SELECT';
        const col=cs.color.match(/[\d.]+/g).map(Number);
        const big=parseFloat(cs.fontSize)>=24 || (parseFloat(cs.fontSize)>=18.66 && +cs.fontWeight>=700);
        return {r:{x:r.x,y:r.y,w:r.width,h:r.height}, col, o, big, ok:!hid&&hasText&&r.width>2&&r.height>2&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth, label:(e.id||e.className||e.tagName)+' "'+(e.textContent||'').trim().slice(0,24)+'"'};
      });
      if(!info.ok || info.o<0.6) continue;
      await el.evaluate(e=>e.classList.add('__hide'));
      const clip={x:Math.max(0,info.r.x),y:Math.max(0,info.r.y),width:Math.max(1,Math.min(info.r.w,vp.width-Math.max(0,info.r.x))),height:Math.max(1,Math.min(info.r.h,vp.height-Math.max(0,info.r.y)))};
      const buf=await pg.screenshot({clip});
      await el.evaluate(e=>e.classList.remove('__hide'));
      const px=await pg.evaluate(async b64=>{ const im=new Image(); im.src='data:image/png;base64,'+b64; await im.decode(); const c=document.createElement('canvas'); c.width=im.width;c.height=im.height; const x=c.getContext('2d'); x.drawImage(im,0,0); const d=x.getImageData(0,0,c.width,c.height).data; const L=[]; for(let i=0;i<d.length;i+=4) L.push([d[i],d[i+1],d[i+2]]); return L; }, buf.toString('base64'));
      px.sort((a,b)=>lum(a)-lum(b));
      const lo=px[Math.floor(px.length*.1)], hi=px[Math.floor(px.length*.9)];
      const a=(info.col[3]??1)*info.o, tc=info.col.slice(0,3);
      const worst=Math.min(...[lo,hi].map(bg=>cr(tc.map((c,i)=>c*a+bg[i]*(1-a)), bg)));
      n++;
      const need=info.big?3:4.5;
      if(worst<need){ bad++; console.log(`  LOW ${scheme} ${vp.width} ${name} ${info.label} ${worst.toFixed(2)} lo=${lo} hi=${hi}`); }
    }
  }
  await ctx.close();
 }
 await b.close(); console.log(`${n} text runs measured, ${bad} below AA`); process.exit(bad?1:0);
})();
