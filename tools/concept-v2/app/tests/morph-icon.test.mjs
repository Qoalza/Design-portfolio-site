import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {COPY_FEEDBACK_MS,restartFeedbackTimer} from '../src/morph-icon/copy-feedback.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('copy feedback restarts one two-second reset window',()=>{
 const cleared=[];
 const scheduled=[];
 const schedule=(callback,delay)=>{scheduled.push({callback,delay});return scheduled.length;};
 const cancel=id=>cleared.push(id);

 const first=restartFeedbackTimer(null,schedule,cancel,()=>{});
 const second=restartFeedbackTimer(first,schedule,cancel,()=>{});

 assert.equal(COPY_FEEDBACK_MS,2000);
 assert.equal(second,2);
 assert.deepEqual(cleared,[1]);
 assert.deepEqual(scheduled.map(item=>item.delay),[2000,2000]);
});

test('stroke morphing is reusable, 20% faster than snappy, and preserves the icon-system contract',async()=>{
 const [component,icons,checkAsset,css,packageJson,designSystem,agentRules]=await Promise.all([
  readFile(path.join(root,'src/morph-icon/StrokeMorphIcon.jsx'),'utf8'),
  readFile(path.join(root,'src/morph-icon/icons.mjs'),'utf8'),
  readFile(path.join(root,'public/figma/project-corvo/action-check.svg'),'utf8'),
  readFile(path.join(root,'src/morph-icon/stroke-morph-icon.css'),'utf8'),
  readFile(path.join(root,'package.json'),'utf8'),
  readFile(path.resolve(root,'../../../DESIGN_SYSTEM.md'),'utf8'),
  readFile(path.resolve(root,'../../../AGENTS.md'),'utf8'),
 ]);

 assert.equal(JSON.parse(packageJson).dependencies.morphicons,'1.7.1');
 assert.match(component,/from 'morphicons\/react'/);
 assert.match(component,/reducedMotion="user"/);
 assert.match(component,/STROKE_MORPH_SPRING=Object\.freeze\(\{stiffness:605,damping:36\}\)/);
 assert.match(component,/spring=STROKE_MORPH_SPRING/);
 assert.match(component,/spring=\{spring\}/);
 assert.match(component,/strokeWidth=\{1\.3\}/);
 assert.match(css,/\.strokeMorphIcon path\s*\{[^}]*fill:\s*none[^}]*stroke:\s*currentColor[^}]*stroke-width:\s*1\.3[^}]*vector-effect:\s*non-scaling-stroke/s);
 assert.match(css,/stroke-linejoin:\s*round/);
 assert.match(css,/stroke-linecap:\s*butt/);
 assert.match(icons,/export const link02Icon=/);
 assert.match(icons,/export const checkIcon=/);
 assert.match(icons,/export const checkMorphIcon=/);
 assert.match(icons,/M4 12L9 17M9 17L14\.5 11\.5M14\.5 11\.5L20 6/);
 assert.match(checkAsset,/M20 6L9 17L4 12/);
 assert.match(designSystem,/### Морф иконки/);
 assert.match(designSystem,/«морф»|«морф иконки»/);
 assert.match(agentRules,/«морф»|«морф иконки»/);
 assert.match(agentRules,/StrokeMorphIcon/);
});

test('shared project copy action morphs only after a successful copy and returns automatically',async()=>{
 const page=await readFile(path.join(root,'src/project-page/ProjectTitleBlock.jsx'),'utf8');

 assert.match(page,/async function copyLink\(/);
 assert.match(page,/await navigator\.clipboard\.writeText\(window\.location\.href\)/);
 assert.match(page,/setCopied\(true\)/);
 assert.match(page,/restartFeedbackTimer/);
 assert.match(page,/<StrokeMorphIcon icon=\{copied\?checkMorphIcon:link02Icon\}/);
 assert.match(page,/\{copied\?'Скопировано':'Копировать ссылку'\}/);
 assert.match(page,/useEffect\(\(\)=>\(\)=>clearTimeout/);
});
