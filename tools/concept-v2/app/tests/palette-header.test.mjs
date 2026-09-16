import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');

test('Concept V2 exposes distinct current semantic palette roles',async()=>{
 const css=await readFile(path.join(root,'src/style.css'),'utf8');
 const lens=await readFile(path.join(root,'src/lens.css'),'utf8');
 const svgLens=await readFile(path.join(root,'src/svg-lens.css'),'utf8');
 for(const [role,value] of Object.entries({
  '--cv2-container-neutral-bg-main':'#181a1c',
  '--cv2-container-neutral-faint':'#141517',
  '--cv2-container-neutral-thin':'#1c1f21',
  '--cv2-container-neutral-soft':'#222629',
  '--cv2-border-neutral-surface':'#2a2f33',
  '--cv2-border-neutral-muted':'#32383d',
  '--cv2-border-neutral-secondary':'#4d5459',
  '--cv2-text-neutral-primary':'#f2f4f5',
  '--cv2-text-neutral-secondary':'#d7dce0',
  '--cv2-text-neutral-tertiary':'#a9b1b8',
  '--cv2-text-neutral-muted':'#636c73',
  '--cv2-text-neutral-thin':'#42484d',
 })) assert.match(css,new RegExp(`${role}:${value}`),role);
 assert.match(css,/--page:var\(--cv2-container-neutral-bg-main\)/);
 assert.match(css,/--surface:var\(--cv2-container-neutral-thin\)/);
 assert.match(css,/--border:var\(--cv2-border-neutral-surface\)/);
 assert.match(lens,/html,body\{background:var\(--cv2-container-neutral-bg-main\)\}/);
 assert.match(lens,/\.lens-backing\{[^}]*background:var\(--cv2-container-neutral-bg-main\)/);
 assert.match(svgLens,/\.vector-network \.network-nodes\{fill:var\(--cv2-container-neutral-bg-main\)\}/);
 assert.match(svgLens,/\.vector-mode \.lens-backing\{background:var\(--cv2-container-neutral-bg-main\)\}/);
 assert.doesNotMatch(`${lens}\n${svgLens}`,/#18191a|#1a2029/i);
});

test('Header preserves its component brand tokens while using current 1280px frame and control states',async()=>{
 const css=await readFile(path.join(root,'src/style.css'),'utf8');
 const tokens=await readFile(path.join(root,'src/v2/tokens.css'),'utf8');
 assert.match(css,/\.header-row\{max-width:1280px/);
 assert.match(css,/\.brand strong\{[^}]*color:#f0f1f2/);
 assert.match(css,/\.brand small\{[^}]*color:#909498/);
 assert.match(css,/\.control\.accent\{--control-bg:var\(--cv2-container-accent-tertiary\);--control-fg:var\(--cv2-text-neutral-secondary\);--control-border:var\(--cv2-border-accent-muted\)/);
 assert.match(css,/\.nav-tab\.selected\{background:var\(--cv2-container-neutral-soft\);color:var\(--cv2-text-neutral-primary\)/);
 assert.match(css,/\.nav-tab:disabled\{color:var\(--cv2-text-neutral-thin\)/);
 assert.match(tokens,/--v2-light-neutral-bg-enable:var\(--cv2-container-neutral-soft\)/);
 assert.match(tokens,/--v2-control-disabled-fg:var\(--cv2-text-neutral-thin\)/);
});
