const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('dist/assets/localization.js','utf8');
const dict=fs.readFileSync('dist/assets/translations.js','utf8');
function setup({manual=null,browser=['en'],country='ES',pending=false,blockedStorage=false,failure=false}={}){
 const values=new Map(manual?[['kprojects.language.v1',manual]]:[]);const nodes=[];let observer,controlClass,selectElement,finish,fetches=0;
 const parent={closest:()=>null};
 const root={querySelectorAll:()=>[]};
 const document={body:{},documentElement:{},getElementById:()=>root,querySelector:()=>null,querySelectorAll:()=>[],createTreeWalker:()=>{let i=0;return {nextNode(){return i<nodes.length?(this.currentNode=nodes[i++],true):false}}},createElement(tag){if(tag==='select'){selectElement={options:[],setAttribute(){},appendChild(o){this.options.push(o)},addEventListener(_,f){this.change=f}};return selectElement}return {}}};
 const storage={getItem:k=>{if(blockedStorage)throw Error();return values.get(k)||null},setItem:(k,v)=>{if(blockedStorage)throw Error();values.set(k,v)},removeItem:k=>values.delete(k)};
 const ctx={window:{localStorage:storage,sessionStorage:storage},document,navigator:{languages:browser},HTMLElement:class{setAttribute(){}appendChild(x){this.firstChild=x}querySelector(){return selectElement}},customElements:{define:(_,c)=>controlClass=c},NodeFilter:{SHOW_TEXT:4},MutationObserver:class{constructor(f){observer=f}observe(){}},requestAnimationFrame:f=>f(),AbortController,setTimeout,clearTimeout,fetch:()=>{fetches++;if(failure)return Promise.reject(Error());const response={ok:true,json:async()=>({country})};return pending?new Promise(r=>finish=()=>r(response)):Promise.resolve(response)}};
 vm.runInNewContext(dict,ctx);vm.runInNewContext(code,ctx);
 const control=new controlClass();control.connectedCallback();
 return {ctx,nodes,values,add(t){const n={nodeValue:t,parentElement:parent};nodes.push(n);return n},update(){observer([{target:{parentElement:parent}}])},choose(value){selectElement.change({target:{value}})},resolve(){finish()},get fetches(){return fetches}};
}
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 for(const [country,lang] of [['ES','es'],['MX','es'],['BR','pt'],['PT','pt'],['FR','fr'],['SN','fr'],['JP','en']]){const s=setup({country});await tick();assert.equal(s.ctx.document.documentElement.lang,lang);}
 for(const lang of ['en','es','pt','fr']){
  const s=setup({manual:lang,country:'BR'});const n=s.add('  Plan an event  ');s.update();await tick();assert.equal(s.fetches,0);assert.equal(s.ctx.document.documentElement.lang,lang);assert.equal(n.nodeValue,lang==='en'?'  Plan an event  ':'  '+s.ctx.window.KP_TRANSLATIONS['Plan an event'][lang]+'  ');
  s.choose('fr');assert.equal(n.nodeValue,'  Organiser un événement  ');s.choose('en');assert.equal(n.nodeValue,'  Plan an event  ');
  n.nodeValue='Music';s.update();s.choose('es');assert.equal(n.nodeValue,'Música');s.choose('en');assert.equal(n.nodeValue,'Music');
 }
 const delayed=setup({pending:true});delayed.choose('pt');delayed.resolve();await tick();assert.equal(delayed.ctx.document.documentElement.lang,'pt');
 const fallback=setup({browser:['fr-CA'],failure:true,blockedStorage:true});await tick();assert.equal(fallback.ctx.document.documentElement.lang,'fr');
 const unsupported=setup({manual:'ja',browser:['ru','es-MX'],failure:true});await tick();assert.equal(unsupported.ctx.document.documentElement.lang,'es');
 const s=setup({manual:'fr'});for(const original of Object.keys(s.ctx.window.KP_TRANSLATIONS))s.add(original);for(const lang of ['es','pt','fr','en']){s.choose(lang);for(const [i,original]of Object.keys(s.ctx.window.KP_TRANSLATIONS).entries())assert.equal(s.nodes[i].nodeValue,lang==='en'?original:s.ctx.window.KP_TRANSLATIONS[original][lang]);}
 const split=s.add(' peer-reviewed studies');s.choose('pt');assert.equal(split.nodeValue,' estudos com revisão por pares');const a=s.add('· 20 peer-reviewed studies');s.choose('fr');assert.equal(a.nodeValue,'· 20 études évaluées par les pairs');s.choose('en');assert.equal(a.nodeValue,'· 20 peer-reviewed studies');
 console.log('PASS: country mapping, regional browser fallback, storage denied, manual preference, async race, language round-trips, React text reuse, all dictionary entries in 3 languages, dynamic research count.');
})().catch(e=>{console.error(e);process.exitCode=1});
