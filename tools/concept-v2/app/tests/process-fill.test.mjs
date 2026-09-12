import assert from 'node:assert/strict';
import test from 'node:test';

import {randomEdgePoint} from '../src/process-fill.mjs';

test('process fill origin is always on one frame edge',()=>{
  const samples=[0,.24,.25,.49,.5,.74,.75,.99];
  const points=samples.map(value=>randomEdgePoint(()=>value));
  for(const {x,y} of points)assert.ok(x===0||x===64||y===0||y===64);
});

test('edge origin stays inside the full 64px icon frame',()=>{
  const values=[.999,.5];
  const point=randomEdgePoint(()=>values.shift());
  assert.deepEqual(point,{x:32,y:64});
});
