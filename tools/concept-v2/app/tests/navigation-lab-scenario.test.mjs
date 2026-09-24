import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveLabAttempt} from '../src/navigation-lab-scenario.mjs';

test('the default preview alternates long loading and connection failure on Retry',()=>{
  assert.deepEqual([0,1,2,3].map(index=>resolveLabAttempt('cycle',index)),[
    {kind:'pending'},
    {kind:'connection',delay:9500},
    {kind:'pending'},
    {kind:'connection',delay:9500},
  ]);
});

test('individual preview conditions keep their independent outcomes',()=>{
  assert.deepEqual(resolveLabAttempt('slow',0),{kind:'ready',delay:20000});
  assert.deepEqual(resolveLabAttempt('connection',0),{kind:'connection',delay:400});
});
