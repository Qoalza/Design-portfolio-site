import test from 'node:test'; import assert from 'node:assert/strict'; import {drop,routeProgress,status} from '../src/routing-404.mjs';
const slots={research:{x:0,y:0},concept:{x:100,y:0},delivery:{x:200,y:0},gitBranch:{x:300,y:0},connector:{x:400,y:0}};
test('free drop retains no slot',()=>assert.deepEqual(drop({},'research',{x:900,y:900,slots}),{}));
test('nearest free slot snaps only inside radius',()=>assert.deepEqual(drop({},'research',{x:5,y:0,slots}),{research:'research'}));
test('wrong slot remains and reports mismatch',()=>assert.equal(status(drop({},'research',{x:100,y:0,slots})).wrong.length,1));
test('extracting a wrong packet removes its mismatch',()=>assert.deepEqual(drop({concept:'research'},'research',{x:900,y:900,slots}),{}));
test('occupied slot is not replaced',()=>assert.deepEqual(drop({research:'research'},'concept',{x:0,y:0,slots}),{research:'research'}));
test('the two icon packets match the Figma slots, not the nearest starting slot',()=>{
 assert.equal(status({gitBranch:'connector'}).wrong.length,1);
 assert.equal(status({connector:'gitBranch'}).wrong.length,1);
 assert.equal(status({gitBranch:'gitBranch',connector:'connector'}).correct,2);
});
test('launch requires all correct packets',()=>assert.equal(status({research:'research',concept:'concept',delivery:'delivery',connector:'connector',gitBranch:'gitBranch'}).launched,true));
test('a later upper packet leaves a neutral path through missing predecessors',()=>{
 assert.deepEqual(routeProgress({concept:'concept'}),{topReach:3,topBlue:0,lowerReach:0,lowerBlue:0});
 assert.deepEqual(routeProgress({research:'research',delivery:'delivery'}),{topReach:6,topBlue:1,lowerReach:0,lowerBlue:0});
});
test('the lower blue route stops at the last connected packet',()=>{
 assert.deepEqual(routeProgress({gitBranch:'gitBranch'}),{topReach:0,topBlue:0,lowerReach:9,lowerBlue:9});
 assert.deepEqual(routeProgress({connector:'connector'}),{topReach:0,topBlue:0,lowerReach:11,lowerBlue:0});
 assert.deepEqual(routeProgress({gitBranch:'gitBranch',connector:'connector'}),{topReach:0,topBlue:0,lowerReach:12,lowerBlue:12});
});
test('a wrong packet still carries neutral signal to its slot without creating blue progress',()=>{
 assert.deepEqual(routeProgress({gitBranch:'connector'}),{topReach:0,topBlue:0,lowerReach:9,lowerBlue:0});
 assert.deepEqual(routeProgress({concept:'delivery'}),{topReach:3,topBlue:0,lowerReach:0,lowerBlue:0});
});
