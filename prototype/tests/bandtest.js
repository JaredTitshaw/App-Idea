const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for(const w of [860,900,960,1000,1060,1140,1200,1440]){
   const pg=await b.newPage({viewport:{width:w,height:820}});
   await pg.goto('file://'+path.resolve('wrapped-web.html')); await pg.waitForTimeout(2400);
   const m=await pg.evaluate(()=>{
     const st=document.querySelector('.stage').getBoundingClientRect();
     const gap=document.querySelector('.stage-gap');
     const L=globeLayout();
     const copy=document.querySelector('.stage-copy').getBoundingClientRect();
     const stAbs=document.querySelector('.stage').getBoundingClientRect();
     // does the globe disc collide with the copy column?
     const cxAbs=stAbs.left+L.cx, cyAbs=stAbs.top+L.cy;
     const overlap = cxAbs-L.R < copy.right && cyAbs+L.R > copy.top && cyAbs-L.R < copy.bottom;
     return {stageW:Math.round(st.width), gapShown:gap.offsetParent!==null,
             R:Math.round(L.R), cy:Math.round(L.cy), stageH:Math.round(st.height),
             globeBelowStage: L.cy+L.R > st.height+2, overlapsCopy:overlap,
             overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
   });
   console.log(String(w).padStart(4), JSON.stringify(m));
   await pg.close();
 }
 await b.close();
})();
