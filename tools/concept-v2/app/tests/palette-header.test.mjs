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
  '--cv2-container-neutral-bg-main':'#17191a',
  '--cv2-container-neutral-faint':'#141617',
  '--cv2-container-neutral-thin':'#1a1d1f',
  '--cv2-container-neutral-soft':'#1f2224',
  '--cv2-container-neutral-inverse':'#101112',
  '--cv2-border-neutral-surface':'#272b2e',
  '--cv2-border-neutral-muted':'#323639',
  '--cv2-border-neutral-secondary':'#565c61',
  '--cv2-text-neutral-primary':'#eceff2',
  '--cv2-text-neutral-secondary':'#d6dce0',
  '--cv2-text-neutral-tertiary':'#bbc2c7',
  '--cv2-text-neutral-muted':'#99a1a6',
  '--cv2-text-neutral-thin':'#565c61',
  '--cv2-text-neutral-strong':'#f8fafc',
  '--cv2-element-neutral-secondary':'#d6dce0',
  '--cv2-element-neutral-tertiary':'#bbc2c7',
  '--cv2-element-neutral-muted':'#788087',
  '--cv2-element-neutral-thin':'#3d4347',
  '--cv2-element-neutral-faint':'#1f2224',
  '--cv2-element-neutral-strong':'#f8fafc',
  '--cv2-element-neutral-disabled':'#3d4347',
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
 assert.match(css,/\.brand strong\{font:550 16px\/20px "Google Sans",sans-serif;font-variation-settings:"GRAD" -25,"opsz" 18/);
 assert.match(css,/\.brand small\{font:450 12px\/12px "Google Sans",sans-serif;font-variation-settings:"GRAD" -30,"opsz" 18/);
 assert.match(css,/@media all\{\.brand\{width:191px\}\.header-actions\{width:378px\}\}/);
 assert.match(css,/\.control\.accent\{--control-bg:var\(--cv2-container-accent-tertiary\);--control-fg:var\(--cv2-text-neutral-secondary\);--control-border:var\(--cv2-border-accent-muted\)/);
 assert.match(css,/\.control\.light:hover\{[^}]*--control-border:var\(--cv2-border-neutral-surface\)/);
 assert.match(css,/\.control\.light:active\{[^}]*--control-border:var\(--cv2-border-neutral-muted\)/);
 assert.match(css,/\.control\.ghost:hover\{[^}]*--control-border:var\(--cv2-border-neutral-surface\)/);
 assert.match(css,/\.control\.ghost:active\{[^}]*--control-border:var\(--cv2-border-neutral-muted\)/);
 assert.match(css,/\.control \.icon\{color:var\(--control-icon-fg,var\(--control-fg\)\)\}/);
 assert.match(css,/\.nav-tab\.selected\{background:var\(--cv2-container-neutral-soft\);color:var\(--cv2-text-neutral-primary\)/);
 assert.match(css,/\.nav-tab:disabled\{color:var\(--cv2-text-neutral-thin\)/);
 assert.match(css,/\.nav-tab:disabled \.icon\{color:var\(--cv2-element-neutral-disabled\)/);
 assert.match(tokens,/--v2-light-neutral-bg-enable:var\(--cv2-container-neutral-soft\)/);
 assert.match(tokens,/--v2-light-neutral-border-hover:var\(--cv2-border-neutral-surface\)/);
 assert.match(tokens,/--v2-light-neutral-border-press:var\(--cv2-border-neutral-muted\)/);
 assert.match(tokens,/--v2-ghost-neutral-border-hover:var\(--cv2-border-neutral-surface\)/);
 assert.match(tokens,/--v2-ghost-neutral-border-press:var\(--cv2-border-neutral-muted\)/);
 assert.match(tokens,/--v2-control-disabled-fg:var\(--cv2-text-neutral-thin\)/);
});
