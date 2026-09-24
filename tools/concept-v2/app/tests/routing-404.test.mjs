import test from 'node:test'; import assert from 'node:assert/strict'; import {chooseRoutes,drop,dropResult,routeProgress,status} from '../src/routing-404.mjs';
import {readFileSync} from 'node:fs';
import {pulseDuration,pulsePaths,pulseSpeed,pulseTracks} from '../src/routing-404-pulse.mjs';
const slots={research:{x:0,y:0},concept:{x:100,y:0},delivery:{x:200,y:0},gitBranch:{x:300,y:0},connector:{x:400,y:0}};
test('free drop retains no slot',()=>assert.deepEqual(drop({},'research',{x:900,y:900,slots}),{}));
test('nearest free slot snaps only inside radius',()=>assert.deepEqual(drop({},'research',{x:5,y:0,slots}),{research:'research'}));
test('wrong slot remains and reports mismatch',()=>assert.equal(status(drop({},'research',{x:100,y:0,slots})).wrong.length,1));
test('extracting a wrong packet removes its mismatch',()=>assert.deepEqual(drop({concept:'research'},'research',{x:900,y:900,slots}),{}));
test('dropping onto an occupied slot replaces its packet and identifies the displaced packet',()=>{
 assert.deepEqual(dropResult({research:'research'},'concept',{x:0,y:0,slots}),{state:{research:'concept'},slot:'research',displaced:'research'});
 assert.deepEqual(drop({research:'research'},'concept',{x:0,y:0,slots}),{research:'concept'});
});
test('a placed packet can replace another occupied slot without duplicating either packet',()=>{
 assert.deepEqual(dropResult({research:'research',concept:'concept'},'concept',{x:0,y:0,slots}),{state:{research:'concept'},slot:'research',displaced:'research'});
});
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
test('a wrong upper packet colors the path behind it red while the fade before 01 stays white',()=>{
 const placed={delivery:'concept'},routes=chooseRoutes(placed,false,routeProgress(placed));
 assert.deepEqual(routes.slice(0,7).map(({state})=>state),['white',...Array(6).fill('red')]);
 assert.equal(routes[7].state,'neutral');
});
test('a wrong lower packet colors its incoming branch red after the white fade',()=>{
 const placed={connector:'gitBranch'},routes=chooseRoutes(placed,false,routeProgress(placed));
 assert.deepEqual(routes.slice(8,12).map(({state})=>state),['white',...Array(3).fill('red')]);
 assert.equal(routes[12].state,'neutral');
});
test('each placed packet colors only its preceding interval across fixed nodes',()=>{
 const placed={research:'delivery',concept:'concept'},routes=chooseRoutes(placed,false,routeProgress(placed));
 assert.deepEqual(routes.slice(0,5).map(({state})=>state),['white','red','final','final','neutral']);
});
test('a missing earlier packet leaves the path to a later correct packet white',()=>{
 const placed={concept:'concept'},routes=chooseRoutes(placed,false,routeProgress(placed));
 assert.deepEqual(routes.slice(0,5).map(({state})=>state),['white','white','white','white','neutral']);
});
test('a later wrong packet changes only its own preceding interval',()=>{
 const placed={research:'research',concept:'delivery'},routes=chooseRoutes(placed,false,routeProgress(placed));
 assert.deepEqual(routes.slice(0,5).map(({state})=>state),['white','final','red','red','neutral']);
});
test('the final lower packet leaves a white path through fixed B8 to the edge',()=>{
 const placed={gitBranch:'gitBranch',connector:'connector'},routes=chooseRoutes(placed,false,routeProgress(placed));
 assert.deepEqual(routes.slice(8).map(({state})=>state),['white','final','final','final','white','white']);
 assert.deepEqual(chooseRoutes(placed,true,routeProgress(placed)).slice(12).map(({state})=>state),['white','white']);
});
test('route segment bounds stay on the fixed final grid before and after any placement',()=>{
 const initial=chooseRoutes({},false,routeProgress({}));
 const placed={concept:'concept'},next=chooseRoutes(placed,false,routeProgress(placed));
 assert.deepEqual(initial.map(({layer})=>layer),next.map(({layer})=>layer));
});
test('completion pulse follows each exact final Figma vector once and ends before success appears',()=>{
 const indices=pulseTracks.flatMap(track=>track.segments.map(([index])=>index)).sort((a,b)=>a-b);
 assert.deepEqual(indices,Array.from({length:14},(_,index)=>index));
 for(let index=0;index<14;index++){
  const source=readFileSync(new URL(`../public/figma/routing404/states/final/imgVector${index+36}.svg`,import.meta.url),'utf8');
  assert.equal(pulsePaths[index],source.match(/<path[^>]* d="([^"]+)"/)?.[1]);
 }
 for(const track of pulseTracks){
  const end=track.start+track.segments.reduce((sum,[,length])=>sum+length/pulseSpeed*1000,0);
  assert.ok(end<pulseDuration,`pulse arm ends at ${end}ms`);
 }
});
