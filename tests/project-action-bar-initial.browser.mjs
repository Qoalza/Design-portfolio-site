import assert from "node:assert/strict";

const BIDI_WS = process.env.BIDI_WS;
const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const EXPECTED_BUILD_SHA = process.env.EXPECTED_BUILD_SHA;

assert.ok(BIDI_WS, "BIDI_WS is required");
assert.ok(EXPECTED_BUILD_SHA, "EXPECTED_BUILD_SHA is required");

const ws = new WebSocket(BIDI_WS);
const pending = new Map();
let nextId = 1;

ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.type === "error") reject(new Error(JSON.stringify(message)));
  else resolve(message.result);
});

await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => {
      if (pending.delete(id)) reject(new Error(`timeout: ${method}`));
    }, 30_000);
  });
}

async function evaluate(context, expression) {
  const response = await send("script.evaluate", {
    expression: `Promise.resolve(${expression}).then(value=>JSON.stringify(value))`,
    target: { context },
    awaitPromise: true,
    resultOwnership: "none",
    userActivation: true,
  });
  return JSON.parse(response.result.value);
}

async function pause(context, milliseconds) {
  await evaluate(context, `new Promise(resolve=>setTimeout(()=>resolve(true),${milliseconds}))`);
}

async function pointerClick(context, x, y) {
  await send("input.performActions", {
    context,
    actions: [{
      type: "pointer",
      id: "mouse",
      parameters: { pointerType: "mouse" },
      actions: [
        { type: "pointerMove", x: Math.round(x), y: Math.round(y), duration: 0, origin: "viewport" },
        { type: "pointerDown", button: 0 },
        { type: "pointerUp", button: 0 },
      ],
    }],
  });
  await send("input.releaseActions", { context });
}

async function readState(context, scenario) {
  const result = await evaluate(context, `(()=>{const bar=document.querySelector('[data-project-action-bar]'),information=document.querySelector('[data-project-information-start]'),probe=window.__projectActionInitialProbe;if(!bar||!information)return {missing:true,frames:probe?.frames||[]};const barRect=bar.getBoundingClientRect(),informationRect=information.getBoundingClientRect();return {build:document.documentElement.dataset.buildSha,scrollY,variant:bar.dataset.projectActionVariant,measurement:bar.dataset.projectActionMeasurement,informationTop:informationRect.top,informationBottom:informationRect.bottom,visibleInformation:innerHeight-informationRect.top,barTop:innerHeight-88,rect:{left:barRect.left,width:barRect.width,top:barRect.top,height:barRect.height},frames:probe.frames,shifts:probe.shifts}})()`);
  const expected = result.visibleInformation >= 200 && result.informationBottom > result.barTop
    ? "adaptive"
    : "full";
  const paintedFrames = result.frames.filter((frame) => frame.source === "raf");
  const failures = [
    paintedFrames.length > 0 || "no rendered frame captured",
    result.build === EXPECTED_BUILD_SHA || "build SHA mismatch",
    result.scrollY === 0 || "initial scroll must be zero",
    paintedFrames[0]?.variant === expected || "first frame variant",
    paintedFrames[0]?.measurement === "valid" || "first frame measurement",
    paintedFrames[0]?.opacity === "1" || "blank first frame",
    paintedFrames[0]?.visibility === "visible" || "hidden first frame",
    result.variant === expected || "stable variant",
    paintedFrames.every((frame) => frame.variant === expected) || "variant flash",
    result.shifts.reduce((total, entry) => total + entry.value, 0) === 0 || "layout shift",
  ].filter((value) => value !== true);
  return { ...result, scenario, expected, paintedFrames, failures, pass: failures.length === 0 };
}

const session = await send("session.new", { capabilities: { alwaysMatch: {} } });
await send("script.addPreloadScript", {
  functionDeclaration: `()=>{
    window.__projectActionInitialProbe={frames:[],shifts:[]};
    try{new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)window.__projectActionInitialProbe.shifts.push({t:entry.startTime,value:entry.value})}).observe({type:'layout-shift',buffered:true})}catch{}
    let started=false;
    const capture=(index,source)=>{const bar=document.querySelector('[data-project-action-bar]');if(!bar)return false;const rect=bar.getBoundingClientRect(),style=getComputedStyle(bar);window.__projectActionInitialProbe.frames.push({index,source,t:performance.now(),variant:bar.dataset.projectActionVariant,measurement:bar.dataset.projectActionMeasurement,transitions:bar.dataset.projectActionTransitions,left:rect.left,width:rect.width,top:rect.top,height:rect.height,opacity:style.opacity,visibility:style.visibility,transition:style.transition});return true};
    const start=()=>{if(started||!capture(0,'mutation'))return;started=true;let index=1;const sample=()=>{capture(index++,'raf');if(index<12)requestAnimationFrame(sample)};requestAnimationFrame(sample)};
    new MutationObserver(start).observe(document,{subtree:true,childList:true});
    let attempts=0;const seek=()=>{start();if(!started&&++attempts<240)requestAnimationFrame(seek)};requestAnimationFrame(seek);
  }`,
});

const tree = await send("browsingContext.getTree", {});
const context = tree.contexts[0].context;
await send("browsingContext.setViewport", {
  context,
  viewport: { width: 1440, height: 999 },
  devicePixelRatio: 1,
});

await send("browsingContext.navigate", {
  context,
  url: `${BASE_URL}/projects/corvo?review=initial-browser-direct`,
  wait: "complete",
});
await pause(context, 700);
const direct = await readState(context, "direct-url");

await send("browsingContext.reload", { context, wait: "complete" });
await pause(context, 700);
const reload = await readState(context, "hard-reload");

await send("browsingContext.navigate", {
  context,
  url: `${BASE_URL}/?review=initial-browser-client`,
  wait: "complete",
});
await pause(context, 250);
await evaluate(context, `(()=>{window.__projectActionInitialProbe={frames:[],shifts:[]};let started=false;const capture=(index)=>{const bar=document.querySelector('[data-project-action-bar]');if(!bar)return false;const rect=bar.getBoundingClientRect(),style=getComputedStyle(bar);window.__projectActionInitialProbe.frames.push({index,source:'raf',t:performance.now(),variant:bar.dataset.projectActionVariant,measurement:bar.dataset.projectActionMeasurement,transitions:bar.dataset.projectActionTransitions,left:rect.left,width:rect.width,top:rect.top,height:rect.height,opacity:style.opacity,visibility:style.visibility,transition:style.transition});return true};const seek=()=>{if(!started&&capture(0)){started=true;let index=1;const sample=()=>{capture(index++);if(index<12)requestAnimationFrame(sample)};requestAnimationFrame(sample)}else if(!started)requestAnimationFrame(seek)};requestAnimationFrame(seek);return true})()`);
const link = await evaluate(context, `(()=>{const anchor=[...document.querySelectorAll('a')].find(element=>element.textContent.trim()==='Подробнее'&&element.href.includes('/projects/corvo'));anchor.scrollIntoView({block:'center',behavior:'instant'});const rect=anchor.getBoundingClientRect();return {x:rect.left+rect.width/2,y:rect.top+rect.height/2}})()`);
await pointerClick(context, link.x, link.y);
await pause(context, 700);
const clientNavigation = await readState(context, "client-navigation");

const output = {
  status: [direct, reload, clientNavigation].every((scenario) => scenario.pass) ? "PASS" : "FAIL",
  browser: `Zen ${session.capabilities.browserVersion}`,
  build: EXPECTED_BUILD_SHA,
  scenarios: [direct, reload, clientNavigation],
};
console.log(JSON.stringify(output, null, 2));
await send("session.end", {});
ws.close();
assert.equal(output.status, "PASS", "project action bar initial browser regression");
