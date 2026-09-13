import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import path from 'node:path';

test('the single root Lenis loop halves wheel input without intercepting it',async()=>{
  const source=await readFile(path.resolve(import.meta.dirname,'../src/SmoothScroll.jsx'),'utf8');
  assert.match(source,/autoRaf:false,smoothWheel:true,syncTouch:false,/);
  assert.match(source,/lerp:\.1,wheelMultiplier:\.5,stopInertiaOnNavigate:true/);
  assert.doesNotMatch(source,/addEventListener\(['"]wheel/);
});
