const assert=require('assert'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('dist/assets/project-deck.js','utf8');
function setup({width=390,height=844,reduce=false}={}){
 const cards=Array.from({length:3},()=>({style:{setProperty(k,v){this[k]=v},removeProperty(k){delete this[k]}}}));const vars={};let y=200, frame, mutation;const events={};
 const deck={isConnected:true,querySelectorAll:()=>cards,getBoundingClientRect:()=>({top:y}),setAttribute(k,v){this[k]=v},style:{setProperty(k,v){vars[k]=v}}};
 const document={body:{},documentElement:{clientHeight:height},querySelector:q=>q.includes('header')?{getBoundingClientRect:()=>({height:68})}:deck,addEventListener:(e,f)=>events[e]=f};
 const ctx={document,matchMedia:q=>({matches:q.includes('reduced')?reduce:width<=759,addEventListener(){}}),innerHeight:height,scrollY:0,window:{scrollTo(o){ctx.scrollY=o.top}},addEventListener:(e,f)=>events[e]=f,requestAnimationFrame:f=>(frame=f,1),MutationObserver:class{constructor(f){mutation=f}observe(){}}};
 vm.runInNewContext(source,ctx);const flush=()=>{const f=frame;frame=null;f?.()};flush();return{cards,vars,deck,events,ctx,flush,setY(v){y=v;events.scroll();flush()}};
}
const s=setup();assert.equal(s.deck['data-stack'],'true');assert(s.cards[0].style.transform.includes('0.00px'));assert(s.cards[1].style.transform.includes('20.00px'));assert(s.cards[2].style.transform.includes('40.00px'));
const step=parseFloat(s.vars['--card-height'])+30;s.setY(108-step*.4);assert(Number(s.cards[0].style.opacity)>0&&Number(s.cards[0].style.opacity)<1);assert.equal(s.cards[0].style.pointerEvents,'auto');s.setY(108-step);assert(s.cards[1].style.transform.includes('0.00px'));assert.equal(s.cards[1].style.pointerEvents,'auto');s.setY(108-step*2);assert(s.cards[2].style.transform.includes('0.00px'));assert.equal(s.cards[2].style.pointerEvents,'auto');s.setY(200);assert.equal(s.cards[0].style.pointerEvents,'auto');
for(const options of [{width:1440},{reduce:true},{height:420}]){const a=setup(options);assert.equal(a.deck['data-stack'],'false');assert(a.cards.every(c=>c.style.transform===''));}
for(const height of [568,667,740,844,932]){const a=setup({height});assert(parseFloat(a.vars['--stage-height'])+108<=height);}
s.events.focusin({target:{closest:()=>s.cards[2]}});assert.equal(s.ctx.scrollY,200-108+step*2);
console.log('PASS: separated initial stack, full reveal of each card, reverse scroll, keyboard focus, viewport fit, desktop and reduced-motion fallback.');
