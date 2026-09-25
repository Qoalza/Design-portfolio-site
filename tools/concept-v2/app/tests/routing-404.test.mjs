import test from 'node:test'; import assert from 'node:assert/strict'; import {chooseRoutes,drop,dropResult,fixedNodeVisual,routeProgress,status} from '../src/routing-404.mjs';
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
 assert.deepEqual(routeProgress({connector:'connector'}),{topReach:0,topBlue:0,lowerReach:12,lowerBlue:0});
 assert.deepEqual(routeProgress({gitBranch:'gitBranch',connector:'connector'}),{topReach:0,topBlue:0,lowerReach:12,lowerBlue:12});
});
test('a wrong packet still carries neutral signal to its slot without creating blue progress',()=>{
 assert.deepEqual(routeProgress({gitBranch:'connector'}),{topReach:0,topBlue:0,lowerReach:9,lowerBlue:0});
 assert.deepEqual(routeProgress({concept:'delivery'}),{topReach:3,topBlue:0,lowerReach:0,lowerBlue:0});
});
test('an untouched branch keeps its fade entrance gray',()=>{
 assert.deepEqual(chooseRoutes({},false,routeProgress({})).map(({state})=>state),Array(14).fill('neutral'));
 const lowerOnly={gitBranch:'gitBranch'};
 const routes=chooseRoutes(lowerOnly,false,routeProgress(lowerOnly));
 assert.equal(routes[0].state,'neutral');
 assert.equal(routes[8].state,'white');
});
test('a wrong upper packet colors its own incoming interval red while gaps stay white',()=>{
 const placed={delivery:'concept'},routes=chooseRoutes(placed,false,routeProgress(placed));
 assert.deepEqual(routes.slice(0,7).map(({state})=>state),['white','white','white','white','red','red','red']);
 assert.equal(routes[7].state,'white');
});
test('a wrong lower packet colors its incoming branch red after the white fade',()=>{
 const placed={connector:'gitBranch'},routes=chooseRoutes(placed,false,routeProgress(placed));
 assert.deepEqual(routes.slice(8).map(({state})=>state),['white','white','red','red','red','white']);
 assert.equal(fixedNodeVisual({id:'Б8',final:'other'},routeProgress(placed),routes),'other');
});
test('each placed packet colors only its preceding interval across fixed nodes',()=>{
 const placed={research:'delivery',concept:'concept'},routes=chooseRoutes(placed,false,routeProgress(placed));
 assert.deepEqual(routes.slice(0,5).map(({state})=>state),['white','red','final','final','neutral']);
 assert.equal(fixedNodeVisual({id:'03',final:'active'},routeProgress(placed),routes),'active');
 assert.equal(fixedNodeVisual({id:'01',final:'other'},routeProgress(placed),routes),'other');
});
test('a fixed node follows the colored interval crossing it instead of an earlier mismatch',()=>{
 const placed={research:'research',concept:'delivery',delivery:'delivery'};
 const signal=routeProgress(placed),routes=chooseRoutes(placed,false,signal);
 assert.equal(fixedNodeVisual({id:'03',final:'active'},signal,routes),'error');
 assert.equal(fixedNodeVisual({id:'05.1',final:'active'},signal,routes),'active');
 assert.equal(fixedNodeVisual({id:'05.2',final:'active'},signal,routes),'active');
});
test('the new Figma Error marker follows red segments through upper and lower fixed nodes',()=>{
 const top={concept:'concept',delivery:'research'};
 const topSignal=routeProgress(top),topRoutes=chooseRoutes(top,false,topSignal);
 assert.equal(fixedNodeVisual({id:'05.1',final:'active'},topSignal,topRoutes),'error');
 assert.equal(fixedNodeVisual({id:'05.2',final:'active'},topSignal,topRoutes),'error');
 const lower={gitBranch:'gitBranch',connector:'research'};
 const lowerSignal=routeProgress(lower),lowerRoutes=chooseRoutes(lower,false,lowerSignal);
 assert.equal(fixedNodeVisual({id:'C1',final:'active'},lowerSignal,lowerRoutes),'error');
});
test('fixed C1 takes the blue accent when a later correct packet follows an earlier error',()=>{
 const placed={gitBranch:'connector',connector:'connector'};
 const signal=routeProgress(placed),routes=chooseRoutes(placed,false,signal);
 assert.deepEqual(routes.slice(8,12).map(({state})=>state),['white','red','final','final']);
 assert.equal(fixedNodeVisual({id:'C1',final:'active'},signal,routes),'active');
});
test('a missing earlier packet leaves its own interval white and a later correct interval blue',()=>{
 const placed={concept:'concept'},routes=chooseRoutes(placed,false,routeProgress(placed));
 assert.deepEqual(routes.slice(0,5).map(({state})=>state),['white','white','final','final','neutral']);
});
test('upper intervals follow their own slots with a wrong 02, empty 04, and correct 06',()=>{
 const placed={research:'concept',delivery:'delivery'};
 const routes=chooseRoutes(placed,false,routeProgress(placed));
 assert.deepEqual(routes.slice(0,8).map(({state})=>state),['white','red','white','white','final','final','final','white']);
});
test('upper intervals stay independently red for two wrong packets before a correct 06',()=>{
 const placed={research:'concept',concept:'research',delivery:'delivery'};
 const routes=chooseRoutes(placed,false,routeProgress(placed));
 assert.deepEqual(routes.slice(0,8).map(({state})=>state),['white','red','red','red','final','final','final','white']);
});
test('lower intervals apply the same rule when the first icon slot is empty',()=>{
 const placed={connector:'connector'};
 const signal=routeProgress(placed),routes=chooseRoutes(placed,false,signal);
 assert.deepEqual(routes.slice(8).map(({state})=>state),['white','white','final','final','final','white']);
 assert.equal(fixedNodeVisual({id:'C1',final:'active'},signal,routes),'active');
});
test('a later wrong packet changes only its own preceding interval',()=>{
 const placed={research:'research',concept:'delivery'},routes=chooseRoutes(placed,false,routeProgress(placed));
 assert.deepEqual(routes.slice(0,5).map(({state})=>state),['white','final','red','red','neutral']);
});
test('the final lower packet keeps its color up to fixed B8 and a white tail beyond it',()=>{
 const placed={gitBranch:'gitBranch',connector:'connector'},routes=chooseRoutes(placed,false,routeProgress(placed));
 assert.deepEqual(routes.slice(8).map(({state})=>state),['white','final','final','final','final','white']);
 assert.equal(fixedNodeVisual({id:'Б8',final:'other'},routeProgress(placed),routes),'other');
 assert.deepEqual(chooseRoutes(placed,true,routeProgress(placed)).slice(12).map(({state})=>state),['final','white']);
});
test('the last fixed node stays white while the preceding interval follows its packet',()=>{
 const empty=routeProgress({});
 assert.equal(fixedNodeVisual({id:'Б8',final:'other'},empty,chooseRoutes({},false,empty)),'default');
 const cases=[
  [{connector:'connector'},'final'],
  [{gitBranch:'connector',connector:'connector'},'final'],
  [{gitBranch:'gitBranch',connector:'research'},'red'],
 ];
 for(const [placed,incoming] of cases){
  const signal=routeProgress(placed),routes=chooseRoutes(placed,false,signal);
  assert.equal(routes[12].state,incoming);
  assert.equal(routes[13].state,'white');
  assert.equal(fixedNodeVisual({id:'Б8',final:'other'},signal,routes),'other');
 }
});
test('the first fixed nodes and their fade entrances stay white after either branch activates',()=>{
 for(const [placed,first,entrance] of [
  [{research:'delivery'},'01',0],
  [{gitBranch:'connector'},'А2',8],
 ]){
  const signal=routeProgress(placed),routes=chooseRoutes(placed,false,signal);
  assert.equal(routes[entrance].state,'white');
  assert.equal(fixedNodeVisual({id:first,final:'other'},signal,routes),'other');
 }
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
