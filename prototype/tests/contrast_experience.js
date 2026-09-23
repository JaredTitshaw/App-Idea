// Pixel contrast: text colour vs the 90th-percentile-brightest pixel behind it, with the text hidden.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
const THREE_LOCAL=process.env.THREE_LOCAL || path.resolve(__dirname,'three.min.js'), PAGE='file://'+path.resolve(process.env.EXP_PAGE||'wrapped-experience.html');
const lum=([r,g,b])=>{ const f=c=>{c/=255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4)}; return .2126*f(r)+.7152*f(g)+.0722*f(b); };
const cr=(a,b)=>{ const x=lum(a),y=lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 let bad=0,n=0;
 for(const vp of [{width:1440,height:900},{width:390,height:844}]){
  const ctx=await b.newContext({viewport:vp, reducedMotion:'reduce'}); const pg=await ctx.newPage();
  await pg.route('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', r=>r.fulfill({path:THREE_LOCAL,contentType:'application/javascript'}));
  await pg.route(/fonts\.(googleapis|gstatic)\.com/, r=>r.abort());
  await pg.goto(PAGE); await pg.waitForFunction(()=>window.__exp&&__exp.loaderDone()); await pg.waitForTimeout(700);
  const scenes={ hero:['#hero-h','.scroll-cue','.hero-foot span'],
    manifesto:['#mani-h','.mani-copy p'],
    gallery:['#gal-sub','#cats-h','.cats button','.cats .n','#cap-i','#cap-t','#cap-m','#ask-in'],
    gallery8:['#cats-h','.cats button','#cap-t','#cap-m'],
    lab:['.labtext .kick','.labtext p'], outro:['.outtext p','.outtext .cta:not(.solid)'] };
  for(const [sc,sels] of Object.entries(scenes)){
    await pg.evaluate(sc=>{ const s=__exp.sec; scrollTo(0, sc==='gallery'?__exp.scrollForCard(0): sc==='gallery8'?__exp.scrollForCard(8): sc==='manifesto'? s.manifesto+40 : (s[sc]||0)+ (sc==='outro'?1e6:10)); }, sc);
    await pg.waitForTimeout(250);
    for(const sel of sels){
      const els=await pg.$$(sel);
      for(const el of els.slice(0,6)){
        const info=await el.evaluate(e=>{ const r=e.getBoundingClientRect(); const cs=getComputedStyle(e);
          let o=1; for(let x=e;x;x=x.parentElement) o*=+getComputedStyle(x).opacity;
          const col=(e.tagName==='INPUT'?getComputedStyle(e,'::placeholder').color:cs.color).match(/[\d.]+/g).map(Number);
          return {r:{x:r.x,y:r.y,w:r.width,h:r.height}, col, o, vis:r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight}; });
        if(!info.vis || info.o<0.5) continue;
        await el.evaluate(e=>{ e.dataset.oc=e.style.cssText; e.style.setProperty('color','transparent','important'); e.style.setProperty('text-shadow','none','important'); e.style.setProperty('-webkit-text-fill-color','transparent','important');
          e.querySelectorAll('*').forEach(c=>{ c.style.setProperty('color','transparent','important'); c.style.setProperty('text-shadow','none','important'); }); if(e.tagName==='INPUT') e.classList.add('__ph'); });
        await pg.addStyleTag({content:'.__ph::placeholder{color:transparent!important}'});
        const clip={x:Math.max(0,info.r.x),y:Math.max(0,info.r.y),width:Math.min(info.r.w,vp.width-info.r.x),height:Math.min(info.r.h,vp.height-info.r.y)};
        const buf=await pg.screenshot({clip});
        await el.evaluate(e=>{ e.style.cssText=e.dataset.oc; e.querySelectorAll('*').forEach(c=>{c.style.removeProperty('color');c.style.removeProperty('text-shadow');}); e.classList.remove('__ph'); });
        const px=await pg.evaluate(async b64=>{ const im=new Image(); im.src='data:image/png;base64,'+b64; await im.decode(); const c=document.createElement('canvas'); c.width=im.width;c.height=im.height; const x=c.getContext('2d'); x.drawImage(im,0,0); const d=x.getImageData(0,0,c.width,c.height).data; const L=[]; for(let i=0;i<d.length;i+=4) L.push([d[i],d[i+1],d[i+2]]); return L; }, buf.toString('base64'));
        px.sort((a,b)=>lum(a)-lum(b)); const bg=px[Math.floor(px.length*0.9)];
        const tc=info.col.slice(0,3); const a=(info.col[3]??1)*info.o; const eff=tc.map((c,i)=>c*a+bg[i]*(1-a));
        const c=cr(eff,bg); n++;
        const need = /mani-h|gal-h/.test(sel)?3:4.5;
        if(c<need){ bad++; console.log(`  LOW ${vp.width} ${sc} ${sel} ${c.toFixed(2)} bg=${bg}`); }
      }
    }
  }
  await ctx.close();
 }
 await b.close(); console.log(`${n} text runs measured, ${bad} below AA`); process.exit(bad?1:0);
})();
