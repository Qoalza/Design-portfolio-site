import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

import {captionForPoint,clientPointToSvg,getHeroVariant} from '../src/hero-layout.mjs';
import {createCaptionController,DEFAULT_CAPTION,resolveCaptionCandidate} from '../src/hero-caption.mjs';
import {schedulePulses} from '../src/pulse.mjs';

test('Hero selects the matching Figma composition only at its authored Large width',()=>{
  assert.equal(getHeroVariant({width:1440,height:1600}),'small');
  assert.equal(getHeroVariant({width:2312,height:2400}),'small');
  assert.equal(getHeroVariant({width:2313,height:900}),'large');
});

test('Hero preserves the two authored component structures and the accepted map interaction',async()=>{
 const app=await readFile(path.resolve(import.meta.dirname,'../src/App.jsx'),'utf8');
 const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
 assert.match(app,/<SvgLens\/>/);
 assert.match(css,/\.hero\[data-layout="small"\] \.hero-copy\{[^}]*flex:0 0 408px;[^}]*height:412px/);
 assert.match(css,/\.hero\[data-layout="small"\] \.hero-layout\{[^}]*width:1200px;[^}]*height:492px;[^}]*padding-inline:24px/);
 assert.match(css,/\.hero\[data-layout="small"\] \.name\{display:none\}/);
 assert.match(css,/\.hero\[data-layout="large"\] \.hero-layout\{[^}]*width:1200px;[^}]*height:1014px;[^}]*padding-inline:24px/);
 assert.match(css,/\.hero\[data-layout="large"\] \.hero-copy\{[^}]*width:751px;[^}]*height:316px/);
 assert.match(css,/\.hero\[data-layout="large"\] \.hero-graph\{[^}]*width:947px;[^}]*height:634px/);
 assert.match(css,/\.hero-graph \.process-caption\{[^}]*height:16px;[^}]*font:400 14px\/16px/);
});

test('Hero lower field uses a native dot treatment over the exact Bg-main surface',async()=>{
 const app=await readFile(path.resolve(import.meta.dirname,'../src/App.jsx'),'utf8');
 const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
 assert.match(app,/29 лет · Екатеринбург · Senior/);
 assert.doesNotMatch(app,/\['ВОЗРАСТ','29 лет'\]/);
 assert.doesNotMatch(app,/className="disciplines"/);
 assert.match(css,/\.hero-bottom\{height:320px;flex:0 0 320px/);
 assert.match(css,/\.hero\[data-layout="large"\]\s+\.hero-bottom\{[^}]*height:560px;flex-basis:auto/);
 assert.match(css,/\.hero-bottom-dots\{[^}]*background-color:var\(--cv2-container-neutral-bg-main\)[^}]*background-image:radial-gradient\([^}]*background-size:16px 16px[^}]*mask-image:linear-gradient/);
 const desktopHero=css.slice(css.indexOf('/* The Hero is a single viewport'),css.indexOf('/* About'));
 assert.match(desktopHero,/\.hero-bottom-dots\{[^}]*-webkit-mask-image:none[^}]*mask-image:none/);
 assert.match(desktopHero,/\.hero-bottom-dots::after\{[^}]*top:80\.3125%[^}]*background:linear-gradient\(to bottom,rgba\(24,26,28,\.5\),var\(--cv2-container-neutral-bg-main\)\)[^}]*clip-path:polygon\([^}]*filter:blur\(75px\)/);
 assert.doesNotMatch(css,/hero-bottom-field(?:-large)?\.png/);
 assert.match(css,/\.hero-fact-chip\{[^}]*width:auto[^}]*height:42px[^}]*padding:0 20px/);
});

test('desktop Hero wave leaves the source map and mobile Hero untouched',async()=>{
 const app=await readFile(path.resolve(import.meta.dirname,'../src/App.jsx'),'utf8');
 const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
 assert.doesNotMatch(app,/texture-(?:top|bottom)/);
 assert.match(app,/className="hero-bottom-dots"/);
 assert.match(css,/\.hero-bottom\{z-index:0;isolation:auto;background:var\(--cv2-container-neutral-bg-main\)\}/);
 assert.match(css,/\.hero-main\{z-index:1\}/);
 assert.match(css,/\.hero-bottom-dots\{[^}]*background-size:16px 16px[^}]*mask-image:linear-gradient/);
 assert.doesNotMatch(css,/\.hero-graph \.process-map\{[^}]*mask-image/);
 assert.doesNotMatch(css,/\.hero-bottom\{[^}]*border-top/);
 const mobile=css.slice(css.indexOf('@media(max-width:760px)'),css.indexOf('@media(max-width:380px)'));
 assert.match(mobile,/\.hero-bottom\{height:auto;padding:0 20px 24px\}/);
 assert.doesNotMatch(mobile,/\.hero-bottom\{height:320px;flex:0 0 320px;padding:0\}/);
 assert.doesNotMatch(mobile,/hero-bottom-dots::after/);
});

test('desktop Hero occupies exactly one viewport and keeps the dotted field in its background',async()=>{
 const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
 const heroDesktop=css.slice(css.indexOf('/* The Hero is a single viewport'),css.indexOf('/* About'));
 assert.match(heroDesktop,/\.hero-shell\{height:100svh;min-height:0\}/);
 assert.match(heroDesktop,/\.hero\{height:calc\(100svh - 80px\);min-height:0\}/);
 assert.match(heroDesktop,/\.hero-main\{height:100%;flex:1 1 auto\}/);
 assert.match(heroDesktop,/\.hero\[data-layout="small"\] \.hero-main\{padding-bottom:120px;box-sizing:border-box\}/);
 assert.match(heroDesktop,/\.hero-bottom\{position:absolute;inset:auto 0 0;height:320px;flex-basis:auto\}/);
 assert.match(heroDesktop,/\.hero\[data-layout="large"\]\{height:calc\(100svh - 80px\)\}/);
 assert.match(heroDesktop,/\.hero\[data-layout="large"\] \.hero-main\{height:100%;flex:1 1 auto\}/);
 assert.match(heroDesktop,/\.hero\[data-layout="large"\] \.hero-bottom\{inset:auto 0 0;height:560px;flex-basis:auto\}/);
 assert.doesNotMatch(heroDesktop,/\.hero\[data-layout="large"\] \.hero-layout\{transform:translateY\(-12px\) scale\(/);
});

test('pointer coordinates account for SVG meet fields before magnification',()=>{
  assert.deepEqual(clientPointToSvg({clientX:100,clientY:50,rect:{left:0,top:0,width:200,height:100},viewWidth:1000,viewHeight:1000}),{x:500,y:500});
  assert.deepEqual(clientPointToSvg({clientX:0,clientY:50,rect:{left:0,top:0,width:200,height:100},viewWidth:1000,viewHeight:1000}),{x:0,y:500});
  assert.deepEqual(clientPointToSvg({clientX:200,clientY:50,rect:{left:0,top:0,width:200,height:100},viewWidth:1000,viewHeight:1000}),{x:1000,y:500});
});

test('selected Hero node supplies both the matching label and icon',()=>{
  assert.deepEqual(captionForPoint({x:495,y:314.667}),{label:'Проектирование',icon:'design',active:true});
  assert.deepEqual(captionForPoint({x:0,y:0}),{label:'Исследуйте процесс',icon:'search',active:false});
});

function fakeClock(){
 let now=0,id=0;
 const timers=new Map();
 return {
  schedule(fn,delay){const token=++id;timers.set(token,{at:now+delay,fn});return token},
  cancel(token){timers.delete(token)},
  tick(ms){
   const end=now+ms;
   while(true){
    const next=[...timers.entries()].filter(([,timer])=>timer.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];
    if(!next)break;
    timers.delete(next[0]);now=next[1].at;next[1].fn();
   }
   now=end;
  },
 };
}

test('caption resolver chooses the nearest node and retains it through the 80px exit radius',()=>{
 const design={x:495,y:314.667};
 const selected=resolveCaptionCandidate(design,'default');
 assert.equal(selected.label,'Проектирование');
 assert.equal(resolveCaptionCandidate({x:570,y:314.667},selected.key).label,'Проектирование');
 assert.equal(resolveCaptionCandidate({x:576,y:314.667},selected.key),null);
});

test('caption target reacts immediately while default waits for 160ms without an empty state',()=>{
 const clock=fakeClock();
 const changes=[];
 const controller=createCaptionController({onChange:value=>changes.push(value),schedule:clock.schedule,cancel:clock.cancel});
 controller.update({x:495,y:314.667});
 assert.equal(changes.at(-1).label,'Проектирование');
 controller.update(null);
 clock.tick(159);assert.equal(changes.at(-1).label,'Проектирование');
 clock.tick(1);assert.deepEqual(changes.at(-1),DEFAULT_CAPTION);
});

test('latest caption candidate wins immediately and cancels a pending default',()=>{
 const clock=fakeClock();
 const changes=[];
 const controller=createCaptionController({onChange:value=>changes.push(value),schedule:clock.schedule,cancel:clock.cancel});
 controller.update({x:495,y:314.667});
 controller.update({x:704,y:128.667});
 assert.equal(changes.at(-1).label,'Передача в разработку');
 controller.update(null);
 clock.tick(80);
 controller.update({x:495,y:314.667});
 assert.equal(changes.at(-1).label,'Проектирование');
 clock.tick(200);
 assert.equal(changes.at(-1).label,'Проектирование');
  controller.destroy();
});

test('caption crossfade keeps one stable shell and one live-region value',async()=>{
 const source=await readFile(path.resolve(import.meta.dirname,'../src/SvgLens.jsx'),'utf8');
 const css=await readFile(path.resolve(import.meta.dirname,'../src/style.css'),'utf8');
 assert.match(source,/className="process-caption-shell" aria-hidden="true"/);
 assert.match(source,/className="sr-only" aria-live="polite"/);
 assert.match(source,/createCaptionController/);
 assert.doesNotMatch(source,/key=\{`\$\{caption\.icon\}:\$\{caption\.label\}`\}/);
 assert.match(css,/\.process-caption-shell\{height:16px;display:grid;place-items:center\}/);
 assert.match(css,/\.process-caption-content\.is-incoming\{animation:caption-enter 300ms cubic-bezier\(\.22,\.61,\.36,1\) both\}/);
 assert.match(css,/@keyframes caption-enter\{from\{opacity:0;transform:translateY\(6px\) scale\(\.985\)\}/);
 assert.match(css,/@keyframes caption-exit\{from\{opacity:1;transform:translateY\(0\) scale\(1\)\}to\{opacity:0;transform:translateY\(-6px\) scale\(\.985\)\}\}/);
 assert.match(css,/\.process-caption-content\{animation:none\}\.process-caption-content\.is-outgoing\{display:none\}/);
});

test('route pulses wait 2–3 seconds and arrive only at their direction terminal',()=>{
  const scheduled=[];
  const cancelled=[];
  const pulses=[];
  const arrivals=[];
  const schedule=(callback,delay)=>{const item={callback,delay,id:scheduled.length+1};scheduled.push(item);return item.id;};
  const stop=schedulePulses({
    routes:[{from:'a',to:'b',duration:800}],
    emit:pulse=>pulses.push(pulse),
    arrive:event=>arrivals.push(event),
    random:()=>0,
    schedule,
    cancel:id=>cancelled.push(id),
  });

  assert.equal(scheduled[0].delay,2000);
  scheduled[0].callback();
  assert.equal(pulses[0].reverse,true);
  assert.equal(scheduled[1].delay,800);
  scheduled[1].callback();
  assert.equal(arrivals[0].node,'a');
  assert.equal(scheduled[2].delay,2000);
  stop();
  assert.ok(cancelled.length>=1);
});

test('forward route arrival targets the opposite terminal',()=>{
  const scheduled=[];
  const arrivals=[];
  const randomValues=[0,0,.75,0];
  const schedule=(callback,delay)=>{const item={callback,delay,id:scheduled.length+1};scheduled.push(item);return item.id;};
  schedulePulses({
    routes:[{from:'a',to:'b',duration:800}],
    emit:()=>{},
    arrive:event=>arrivals.push(event),
    random:()=>randomValues.shift(),
    schedule,
    cancel:()=>{},
  });

  scheduled[0].callback();
  scheduled[1].callback();
  assert.equal(arrivals[0].node,'b');
});

test('cancelled pulse cannot emit a late arrival or schedule another route',()=>{
  const scheduled=[];
  const cancelled=[];
  const arrivals=[];
  const schedule=(callback,delay)=>{const item={callback,delay,id:scheduled.length+1};scheduled.push(item);return item.id;};
  const stop=schedulePulses({
    routes:[{from:'a',to:'b',duration:800}],
    emit:()=>{},
    arrive:event=>arrivals.push(event),
    random:()=>0,
    schedule,
    cancel:id=>cancelled.push(id),
  });

  scheduled[0].callback();
  stop();
  assert.ok(cancelled.includes(scheduled[1].id));
  scheduled[1].callback();
  assert.deepEqual(arrivals,[]);
  assert.equal(scheduled.length,2);
});

test('terminal highlight uses 60ms reveal and 240ms fade',async()=>{
  const css=await readFile(path.resolve(import.meta.dirname,'../src/svg-lens.css'),'utf8');
  assert.match(css,/\.terminal-arrival\{[^}]*animation:terminal-arrival 300ms linear both/);
  assert.match(css,/@keyframes terminal-arrival\{0%\{opacity:0\}20%\{opacity:1\}100%\{opacity:0\}\}/);
});
