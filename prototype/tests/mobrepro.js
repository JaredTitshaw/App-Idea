const { chromium, devices } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 // Artifact viewer chrome eats ~120px, so the real page viewport is short.
 for(const [name,w,h] of [['iphone_viewer',390,700],['iphone_full',390,844],['small',360,640]]){
   const pg=await b.newPage({viewport:{width:w,height:h}, deviceScaleFactor:2, isMobile:true, hasTouch:true});
   // The publisher wraps the file in a head carrying this meta; without it, mobile
   // emulation lays out at 980px and the test is not the real thing.
   await pg.goto('file://'+path.resolve('wrapped-web.html')); await pg.waitForTimeout(2600);
   await pg.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
   await pg.waitForTimeout(400);
   const m=await pg.evaluate(()=>{
     const st=document.querySelector('.stage'), tl=document.querySelector('.timeline'),
           bn=document.querySelector('.bottom-nav');
     const r=tl.getBoundingClientRect(), nb=bn.getBoundingClientRect();
     return {
       docH:document.documentElement.scrollHeight, winH:innerHeight,
       canScroll: document.documentElement.scrollHeight > innerHeight + 1,
       stageH: Math.round(st.getBoundingClientRect().height),
       stageTouchAction: getComputedStyle(st).touchAction,
       timelineBottom: Math.round(r.bottom), navTop: Math.round(nb.top),
       navH: Math.round(nb.height),
       mainPadBottom: getComputedStyle(document.querySelector('.main')).paddingBottom,
       timelineHiddenBehindNav: r.bottom > nb.top + 1,
       timelineBelowFold: r.bottom > innerHeight + 1
     };
   });
   console.log(name, JSON.stringify(m,null,0));
   await pg.screenshot({path:'m_'+name+'.jpg',quality:80,type:'jpeg'});
   await pg.close();
 }
 await b.close();
})();
