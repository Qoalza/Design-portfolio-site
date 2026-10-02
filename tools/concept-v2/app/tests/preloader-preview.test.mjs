import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const main=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
const preview=readFileSync(new URL('../src/PreloaderPreview.jsx',import.meta.url),'utf8');
const preloader=readFileSync(new URL('../src/Preloader.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/preloader.css',import.meta.url),'utf8');

test('the preloader preview has a dedicated route and renders the production preloader',()=>{
  assert.match(main,/normalizedPath==='\/preloader-preview'/);
  assert.match(main,/<PreloaderPreview\/>/);
  assert.match(preview,/import \{Preloader, RETRY_MESSAGES\} from '.\/Preloader';/);
  assert.match(preview,/<Preloader state=\{mode\} captionSet=\{captionSet\} onRetry=\{handleRetry\}\/>/);
});

test('the preview offers normal, slow-loading, and connection states',()=>{
  for(const state of ['normal','slow','connection'])assert.match(preview,new RegExp(`id:'${state}'`));
});

test('the preview exposes both retry-copy sequences through the production retry action',()=>{
  assert.match(preview,/retryCounts/);
  assert.match(preview,/RETRY_MESSAGES\[reason\]\[Math\.min\(retryNumber,1\)\]/);
  assert.match(preview,/setCaptionSet\(RETRY_MESSAGES\[reason\]\[Math\.min\(retryNumber,1\)\]\)/);
  assert.match(preview,/setMode\('normal'\)/);
});

test('the preloader matches the current Figma state frames and copy',()=>{
  assert.doesNotMatch(css,/\.preloader-content\s*\{[^}]*height:/s);
  assert.doesNotMatch(css,/\[data-state='(?:slow|connection)'\] \.preloader-content/);
  assert.match(css,/\.preloader-content\s*\{[^}]*transform:\s*translateY\(-100px\)/s);
  assert.match(css,/\.preloader-caption\s*\{[^}]*height:\s*24px[^}]*font:\s*400 16px\/24px Onest/s);
  assert.match(css,/var\(--cv2-container-neutral-faint\).*var\(--cv2-container-neutral-inverse\)/s);
  assert.match(preloader,/Проблема с соединением/);
});
