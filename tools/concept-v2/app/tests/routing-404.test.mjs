import test from 'node:test'; import assert from 'node:assert/strict'; import {drop,status} from '../src/routing-404.mjs';
const slots={research:{x:0,y:0},concept:{x:100,y:0},delivery:{x:200,y:0},connector:{x:300,y:0},branch:{x:400,y:0}};
test('free drop retains no slot',()=>assert.deepEqual(drop({},'research',{x:900,y:900,slots}),{}));
test('nearest free slot snaps only inside radius',()=>assert.deepEqual(drop({},'research',{x:5,y:0,slots}),{research:'research'}));
test('wrong slot remains and reports mismatch',()=>assert.equal(status(drop({},'research',{x:100,y:0,slots})).wrong.length,1));
test('extracting a wrong packet removes its mismatch',()=>assert.deepEqual(drop({concept:'research'},'research',{x:900,y:900,slots}),{}));
test('occupied slot is not replaced',()=>assert.deepEqual(drop({research:'research'},'concept',{x:0,y:0,slots}),{research:'research'}));
test('launch requires all correct packets',()=>assert.equal(status({research:'research',concept:'concept',delivery:'delivery',connector:'connector',branch:'branch'}).launched,true));
