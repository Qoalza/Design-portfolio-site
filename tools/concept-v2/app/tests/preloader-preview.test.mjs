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
  assert.match(preview,/import \{useEffect, useState\} from 'react';/);
  assert.match(preview,/import \{Preloader, INITIAL_MESSAGES, RETRY_MESSAGES\} from '.\/Preloader';/);
  assert.match(preview,/import \{LONG_LOADING_MS\} from '.\/preloader-gate\.mjs';/);
  assert.match(preview,/<Preloader state=\{step\.mode\} captionSet=\{captions\} onRetry=\{advanceCycle\}\/>/);
});

test('the preview exposes one automatic cycle instead of manual state selectors',()=>{
  assert.match(preview,/const CYCLE_STEPS=/);
  assert.match(preview,/advance:'timer'/);
  assert.match(preview,/advance:'timer-or-retry'/);
  assert.match(preview,/>Цикл<\/button>/);
  assert.doesNotMatch(preview,/Долгая загрузка'.*Нет соединения/s);
});

test('the automatic cycle covers every approved retry-copy sequence',()=>{
  assert.match(preview,/reason:'slow',retryNumber:1/);
  assert.match(preview,/reason:'slow',retryNumber:2/);
  assert.match(preview,/reason:'connection',retryNumber:1/);
  assert.match(preview,/reason:'connection',retryNumber:2/);
  assert.match(preview,/RETRY_MESSAGES\[step\.reason\]\[step\.retryNumber-1\]/);
  assert.match(preview,/setTimeout\(advanceCycle,LONG_LOADING_MS\)/);
});

test('a retry starts its replacement caption set from the first phrase',()=>{
  assert.match(preloader,/useEffect\(\(\)=>\{\s*setFrame\(\{current:0,outgoing:null,revision:0\}\);\s*\},\[captionSet\]\);/s);
});

test('the preloader matches the current Figma state frames and copy',()=>{
  assert.doesNotMatch(css,/\.preloader-content\s*\{[^}]*height:/s);
  assert.doesNotMatch(css,/\[data-state='(?:slow|connection)'\] \.preloader-content/);
  assert.match(css,/\.preloader-content\s*\{[^}]*transform:\s*translateY\(-100px\)/s);
  assert.match(css,/\.preloader-symbol\s*\{[^}]*color:\s*var\(--cv2-text-neutral-secondary\)/s);
  assert.match(css,/\.preloader-caption\s*\{[^}]*height:\s*24px[^}]*font:\s*350 16px\/24px Onest/s);
  assert.match(css,/var\(--cv2-container-neutral-faint\).*var\(--cv2-container-neutral-inverse\)/s);
  assert.match(preloader,/Проблема с соединением/);
});
