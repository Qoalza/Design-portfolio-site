import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveRasterSelection} from '../src/project-hero/raster-selection.mjs';
const definition={initialContextId:'desktop',contexts:[
 {id:'desktop',initialSlideId:'two',slides:[{id:'one'},{id:'two'},{id:'three'}]},
 {id:'tablet',initialSlideId:'t',slides:[{id:'t'}]},
 {id:'mobile',slides:[]},
]};
test('selection is stable across layout changes and uses IDs instead of slide positions',()=>{
 const selected={contextId:'desktop',slideId:'three'};
 assert.deepEqual(resolveRasterSelection(definition,selected),selected);
 const reordered={...definition,contexts:[{...definition.contexts[0],slides:[{id:'three'},{id:'one'},{id:'two'}]}]};
 assert.deepEqual(resolveRasterSelection(reordered,selected),selected);
 assert.deepEqual(resolveRasterSelection(definition),{contextId:'desktop',slideId:'two'});
});
test('removed slides or unavailable contexts resolve to an existing initial slide',()=>{
 assert.deepEqual(resolveRasterSelection(definition,{contextId:'desktop',slideId:'gone'}),{contextId:'desktop',slideId:'two'});
 assert.deepEqual(resolveRasterSelection(definition,{contextId:'mobile',slideId:'gone'}),{contextId:'desktop',slideId:'two'});
 assert.deepEqual(resolveRasterSelection(definition,{contextId:'tablet',slideId:'t'}),{contextId:'tablet',slideId:'t'});
});
