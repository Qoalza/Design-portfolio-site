import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getTooltipPlacement,isSameTooltipPlacement,reduceTooltipPhase} from '../src/tooltip.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('redesign Tooltip keeps the production lifecycle and collision placement',()=>{
 assert.equal(reduceTooltipPhase('closed','open'),'entering');
 assert.equal(reduceTooltipPhase('open','close'),'exiting');
 assert.equal(reduceTooltipPhase('exiting','exited'),'closed');
 const trigger={top:100,right:220,bottom:140,left:100};
 assert.deepEqual(getTooltipPlacement(trigger,{width:300,height:88},{width:800,height:600}),{left:100,top:152,side:'bottom'});
 assert.equal(getTooltipPlacement({...trigger,left:700,right:760},{width:300,height:88},{width:800,height:600}).left,488);
 assert.deepEqual(getTooltipPlacement({top:520,right:220,bottom:560,left:100},{width:300,height:88},{width:800,height:600}),{left:100,top:420,side:'top'});
 assert.equal(isSameTooltipPlacement({left:100,top:152,side:'bottom'},{left:100,top:152,side:'bottom'}),true);
});

test('redesign Tooltip combines production behavior with Figma 222:1906 visuals',async()=>{
 const [component,css]=await Promise.all([
  readFile(path.join(root,'src/Tooltip.jsx'),'utf8'),
  readFile(path.join(root,'src/tooltip.css'),'utf8'),
 ]);
 assert.match(component,/createPortal/);
 assert.match(component,/ResizeObserver/);
 assert.match(component,/aria-describedby/);
 assert.match(component,/role="tooltip"/);
 assert.match(component,/onMouseEnter:requestOpen/);
 assert.match(component,/onFocus:requestOpen/);
 assert.match(component,/pointerType==='touch'/);
 assert.match(component,/content\.title/);
 assert.match(component,/content\.description/);
 assert.match(css,/\.cv2-tooltip\s*\{[^}]*max-width:\s*300px[^}]*padding:\s*12px[^}]*border-radius:\s*8px[^}]*background:\s*#f8fafc/s);
 assert.match(css,/backdrop-filter:\s*blur\(40px\)/);
 assert.match(css,/\.cv2-tooltip-icon\s*\{[^}]*width:\s*16px[^}]*height:\s*16px/s);
 assert.match(css,/\.cv2-tooltip-copy\s*\{[^}]*gap:\s*8px[^}]*padding:\s*0 8px/s);
 assert.match(css,/\.cv2-tooltip-title\s*\{[^}]*color:\s*#1f2224[^}]*font:\s*400 14px\/16px Onest/s);
 assert.match(css,/\.cv2-tooltip-description\s*\{[^}]*color:\s*#565c61[^}]*font:\s*400 12px\/16px Onest[^}]*font-feature-settings:\s*"calt" 0[^}]*word-break:\s*break-word[^}]*-webkit-line-clamp:\s*2/s);
});
