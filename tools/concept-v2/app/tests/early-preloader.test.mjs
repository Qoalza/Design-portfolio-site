import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {earlyPreloaderPlugin} from '../early-preloader-vite.mjs';
import {LOGO_REVOLUTION_MS} from '../src/preloader-gate.mjs';
const input='<!doctype html><html lang="ru"><head><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>';
const html=await earlyPreloaderPlugin().transformIndexHtml.handler(input);
const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
function harness({stylesheetPending=false,reducedMotion=false}={}){
 let time=0,nextId=0,reloads=0;
 const tasks=new Map(),replacements=[];
 const node=()=>{const element={style:{},hidden:false,_text:'',dataset:{},listeners:new Map(),children:[],attributes:{},
  get firstChild(){return this.children[0];},get textContent(){return this._text+this.children.map(child=>child.textContent).join('');},set textContent(value){this._text=value;this.children=[];},
  classList:{values:new Set(),add(value){this.values.add(value);},remove(value){this.values.delete(value);},toggle(value,on){if(on)this.add(value);else this.remove(value);}},
  setAttribute(key,value){this.attributes[key]=value;this[key]=value;},getAttributeNames(){return Object.keys(this.attributes);},getAttribute(key){return this.attributes[key];},removeAttribute(key){delete this.attributes[key];},
  appendChild(child){if(child.parent)child.parent.children=child.parent.children.filter(value=>value!==child);child.parent=this;this.children.push(child);return child;},
  remove(){this.removed=true;if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);},
  cloneNode(){return Object.assign(node(),{href:this.href,src:this.src,type:this.type,tagName:this.tagName,alreadyStarted:this.alreadyStarted});},replaceWith(next){replacements.push({previous:this,next});},
  addEventListener(key,fn){this.listeners.set(key,fn);},removeEventListener(key){this.listeners.delete(key);},
 };
 element.classList={add(value){this.toggle(value,true);},remove(value){this.toggle(value,false);},toggle(value,on){const list=new Set((element.className??'').split(' ').filter(Boolean));if(on)list.add(value);else list.delete(value);element.className=[...list].join(' ');}};return element;};
 const svg=node(),svgNodes=new Map();svg.querySelector=selector=>{if(!svgNodes.has(selector))svgNodes.set(selector,node());return svgNodes.get(selector);};
 const morph=node(),morphNodes=new Map();morph.querySelector=selector=>{if(!morphNodes.has(selector))morphNodes.set(selector,node());return morphNodes.get(selector);};
 const caption=node(),heading=node(),copy=node(),button=node(),status=node();
 caption.querySelector=selector=>caption.children.find(child=>child.className?.includes(selector.slice(1)));
 caption.querySelectorAll=()=>[...caption.children];
 const first=node();first.className='preloader-caption-content is-incoming';first.textContent='Посмотрю, готова ли страница';caption.appendChild(first);
 status.querySelector=selector=>({'h1':heading,'p':copy,'button':button}[selector]);
 status.appendChild(heading);status.appendChild(copy);status.appendChild(button);
 const shell=node();shell.querySelector=selector=>({'.preloader-symbol':svg,'.preloader-morph':morph,'.preloader-caption':caption,'.preloader-status':status,'.preloader-status button':button}[selector]);
 const link=Object.assign(node(),{href:'http://localhost/app.css',tagName:'LINK'});if(!stylesheetPending)link.sheet={};
 const entry=Object.assign(node(),{src:'http://localhost/app.js',tagName:'SCRIPT',type:'module',alreadyStarted:true,attributes:{type:'module',src:'http://localhost/app.js',nonce:'test-nonce',crossorigin:'anonymous'}});
 const document=node();document.hidden=false;document.documentElement=node();
 document.getElementById=()=>shell;document.querySelector=()=>null;document.querySelectorAll=()=>[link];document.createElement=tag=>Object.assign(node(),{tagName:tag.toUpperCase(),alreadyStarted:false});
 const window=node(),reduced=Object.assign(node(),{matches:reducedMotion});
 const timer=(fn,delay=0,interval=0)=>{const id=++nextId;tasks.set(id,{fn,at:time+delay,interval});return id;};
 runInNewContext(script,{window,document,AbortController,DOMException,URL,performance:{now:()=>time},matchMedia:()=>reduced,location:{href:'http://localhost/',reload(){reloads++;}},setTimeout:(fn,delay)=>timer(fn,delay),clearTimeout:id=>tasks.delete(id),setInterval:(fn,delay)=>timer(fn,delay,delay),clearInterval:id=>tasks.delete(id),requestAnimationFrame:fn=>timer(()=>fn(time),16),cancelAnimationFrame:id=>tasks.delete(id)});
 const flush=async()=>{for(let i=0;i<16;i++)await Promise.resolve();};
 return {shell,status,caption,heading,button,link,entry,document,window,svgNodes,morphNodes,replacements,get reloads(){return reloads;},get api(){return window.__CONCEPT_EARLY_PRELOADER__;},get captionText(){return caption.querySelector('.is-incoming')?.textContent;},async advance(ms){
  const end=time+ms;await flush();
  while(true){const next=[...tasks].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;
   const [id,task]=next;time=task.at;tasks.delete(id);task.fn();if(task.interval)tasks.set(id,{...task,at:time+task.interval});await flush();
  }
  time=end;await flush();
 },retry(){button.listeners.get('click')();},failModule(){window.listeners.get('error')({target:entry});}};
}

test('first HTML is self-contained before app, with non-blocking CSS and approved retry control',()=>{
 assert.ok(html.indexOf('id="early-preloader"')<html.indexOf('id="root"'));
 assert.match(html,/name="portfolio-app-entry" content="\/app.js"/);
 assert.doesNotMatch(html,/<script type="module" src="\/app.js"/);
 assert.match(html,/data-app-style media="print"/);assert.match(html,/id="preloader-marker"/);
 assert.match(html,/class="control accent"/);assert.match(html,/data-icon="preloader-refresh"/);
 assert.match(html,/@keyframes caption-enter/);assert.match(html,/@keyframes caption-exit/);
 assert.doesNotMatch(script,/react-dom|location\.reload/);
});
test('both slow retries show approved contextual copy before any app runs',async()=>{
 const h=harness({stylesheetPending:true});assert.equal(h.api.shownAt,0);await h.advance(5000);
 assert.ok(h.api.snapshot().phase.elapsed>0);assert.equal(h.shell.removed,undefined);
 await h.advance(5000);assert.equal(h.api.snapshot().mode,'slow');assert.equal(h.heading.textContent,'Долгая загрузка');
 assert.equal(h.caption.hidden,false);assert.equal(h.caption.attributes['aria-hidden'],'true');
 h.retry();assert.equal(h.reloads,0);assert.equal(h.captionText,'Второй заход пошёл');
 await h.advance(10000);h.retry();assert.equal(h.captionText,'Третий заход без капитуляции');
 await h.advance(10000);h.retry();assert.equal(h.captionText,'Третий заход без капитуляции');
 h.api.dispose();assert.equal(h.shell.removed,true);
});
test('slow retry preserves animated nodes and accumulated phase',async()=>{
 const h=harness();await h.advance(10000);const before=h.api.snapshot().phase.elapsed,node=h.svgNodes.get('#preloader-marker'),transform=node.attributes.transform;
 h.retry();await h.advance(32);assert.equal(h.reloads,0);assert.equal(h.api.snapshot().reason,'slow');assert.equal(h.api.snapshot().retryNumber,1);
 assert.ok(h.api.snapshot().phase.elapsed>before);assert.equal(h.svgNodes.get('#preloader-marker'),node);assert.notEqual(node.attributes.transform,transform);h.api.dispose();
});
test('module failure respects minimum; connection retries reverse the animated morph',async()=>{
 const h=harness();await h.advance(0);h.failModule();await h.advance(1000);assert.equal(h.api.snapshot().mode,'normal');
 await h.advance(450);assert.equal(h.api.snapshot().mode,'connection');await h.advance(100);
 const left=h.morphNodes.get('.preloader-morph-left'),during=left.attributes.transform;
 await h.advance(100);assert.notEqual(left.attributes.transform,during);await h.advance(250);h.retry();assert.equal(h.captionText,'Пробую достучаться снова');
 assert.equal(h.reloads,0);await h.advance(0);assert.match(h.replacements.at(-1).next.src,/preloader-retry=1/);
 assert.equal(h.replacements.at(-1).next.alreadyStarted,false,'a cloned script inherits already-started and cannot execute');
 assert.equal(h.replacements.at(-1).next.type,'module');assert.equal(h.replacements.at(-1).next.nonce,'test-nonce');
 await h.advance(180);const returning=left.attributes.transform;await h.advance(200);assert.notEqual(left.attributes.transform,returning);
 const phase=h.api.snapshot().phase.elapsed;await h.advance(32);assert.ok(h.api.snapshot().phase.elapsed>phase);
 h.failModule();await h.advance(LOGO_REVOLUTION_MS);h.retry();assert.equal(h.captionText,'Снова пробую выйти на связь');h.api.dispose();
});
test('failed CSS is retried and recovers without document navigation',async()=>{
 const h=harness({stylesheetPending:true}),work=deferred();h.api.connect(()=>work.promise,()=>{});
 await h.advance(0);h.link.listeners.get('error')();await h.advance(1500);assert.equal(h.api.snapshot().mode,'connection');h.retry();await h.advance(0);
 const replacement=h.replacements.at(-1).next;assert.match(replacement.href,/preloader-retry=1/);assert.equal(h.reloads,0);
 replacement.listeners.get('load')();work.resolve();await h.advance(2000);assert.equal(replacement.media,'all');assert.equal(h.api.snapshot().visible,false);assert.equal(h.shell.removed,true);
});
test('app attachment keeps history and stale readiness never reveals page',async()=>{
 const h=harness(),attempts=[];await h.advance(10000);h.retry();await h.advance(10000);h.retry();
 const detach=h.api.connect((signal,retryNumber)=>{const work=deferred();attempts.push({signal,retryNumber,...work});return work.promise;},()=>{});
 await h.advance(0);assert.equal(attempts[0].retryNumber,2);assert.equal(h.captionText,'Третий заход без капитуляции');
 await h.advance(10000);h.retry();await h.advance(0);assert.equal(attempts[0].signal.aborted,true);attempts[0].resolve();await h.advance(2000);assert.equal(h.api.snapshot().visible,true);
 attempts[1].resolve();await h.advance(630);assert.equal(h.api.snapshot().visible,false);detach();
});
test('slow and connection retry counters stay independent across app attachment',async()=>{
 const h=harness(),attempts=[];h.api.connect((signal,retryNumber)=>{const work=deferred();attempts.push({signal,retryNumber,...work});return work.promise;},()=>{});
 await h.advance(10000);h.retry();assert.equal(h.captionText,'Второй заход пошёл');await h.advance(1500);
 attempts.at(-1).reject(new TypeError('image failed'));await h.advance(0);h.retry();assert.equal(h.captionText,'Пробую достучаться снова');
 await h.advance(10000);h.retry();assert.equal(h.captionText,'Третий заход без капитуляции');await h.advance(1500);
 attempts.at(-1).reject(new TypeError('image failed'));await h.advance(0);h.retry();assert.equal(h.captionText,'Снова пробую выйти на связь');h.api.dispose();
});
test('late slow readiness reveals directly; hidden/reduced motion captions stay still',async()=>{
 const h=harness(),work=deferred();h.api.connect(()=>work.promise,()=>{});await h.advance(10000);work.resolve();await h.advance(0);
 assert.equal(h.api.snapshot().mode,'slow');assert.equal(h.api.snapshot().showReadyMessage,false);await h.advance(180);assert.equal(h.shell.removed,true);
 const reduced=harness({reducedMotion:true});await reduced.advance(5000);assert.equal(reduced.captionText,'Посмотрю, готова ли страница');reduced.api.dispose();
 const hidden=harness();hidden.document.hidden=true;hidden.document.listeners.get('visibilitychange')();await hidden.advance(5000);assert.equal(hidden.captionText,'Посмотрю, готова ли страница');hidden.api.dispose();
});
test('native critical CSS does not override app inherited text color',()=>{
 const critical=html.match(/<style>([\s\S]*?)<\/style>/)[1],globalRule=critical.match(/html,body\{([^}]*)\}/)[1];assert.doesNotMatch(globalRule,/(?:^|;)\s*color\s*:/);
});

test('caption crossfade retains incoming and outgoing spans for the approved 300 ms',async()=>{
 const h=harness();await h.advance(2000);
 assert.equal(h.caption.children.filter(node=>node.className.includes('is-outgoing')).length,1);
 assert.equal(h.captionText,'Да-да, еще чуть-чуть осталось');
 await h.advance(299);assert.equal(h.caption.children.filter(node=>node.className.includes('is-outgoing')).length,1);
 await h.advance(1);assert.equal(h.caption.children.filter(node=>node.className.includes('is-outgoing')).length,0);
 h.api.dispose();
});

test('module recovery retains completed minimum; initial ready cannot bypass a revolution',async()=>{
 const h=harness();await h.advance(0);h.failModule();await h.advance(1800);h.retry();await h.advance(400);
 h.api.connect(()=>Promise.resolve(),()=>{});await h.advance(0);assert.equal(h.api.snapshot().visible,true);
 await h.advance(449);assert.equal(h.api.snapshot().visible,true);
 await h.advance(181);assert.equal(h.api.snapshot().visible,false);assert.equal(h.reloads,0);
 const first=harness();first.api.connect(()=>Promise.resolve(),()=>{});await first.advance(LOGO_REVOLUTION_MS-1);assert.equal(first.api.snapshot().visible,true);
 await first.advance(181);assert.equal(first.api.snapshot().visible,false);
});

test('StrictMode provider replay keeps a single native session and disposes timers',async()=>{
 const h=harness();let staleCalls=0,newCalls=0;const detach=h.api.connect(()=>{staleCalls++;return Promise.resolve();},()=>{});
 detach();h.api.connect(()=>{newCalls++;return Promise.resolve();},()=>{});await h.advance(2000);
 assert.equal(staleCalls,0);assert.equal(newCalls,1);assert.equal(h.api.snapshot().visible,false);
 const text=h.captionText,phase=h.api.snapshot().phase.elapsed;await h.advance(20000);assert.equal(h.captionText,text);assert.equal(h.api.snapshot().phase.elapsed,phase);
});

test('slow-to-connection replaces status frame like React key while retaining its retry button',async()=>{
 const h=harness(),work=deferred();h.api.connect(()=>work.promise,()=>{});
 await h.advance(10000);assert.equal(h.api.snapshot().mode,'slow');
 work.reject(new TypeError('critical image failed'));await h.advance(0);
 assert.equal(h.api.snapshot().mode,'connection');
 const replacement=h.replacements.find(value=>value.previous===h.status);
 assert.ok(replacement,'a retained completed CSS animation would not restart on a state class change');
 assert.ok(replacement.next.children.includes(h.button),'moving the existing button preserves its event listener');
 assert.match(replacement.next.className,/connection/);
 h.retry();assert.equal(h.captionText,'Пробую достучаться снова');h.api.dispose();
});

test('a stalled stylesheet is replaced on slow Retry and no stale listeners survive',async()=>{
 const h=harness({stylesheetPending:true});h.api.connect(()=>Promise.resolve(),()=>{});await h.advance(10000);
 assert.equal(h.api.snapshot().mode,'slow');h.retry();await h.advance(0);
 const replacement=h.replacements.find(value=>value.previous===h.link)?.next;assert.ok(replacement);assert.match(replacement.href,/preloader-retry=1/);assert.equal(h.link.listeners.size,0);
 replacement.listeners.get('load')();await h.advance(630);assert.equal(h.api.snapshot().visible,false);assert.equal(h.reloads,0);
});
