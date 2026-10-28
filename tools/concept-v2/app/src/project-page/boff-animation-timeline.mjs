// One on-demand clock: the panel pair shares elapsed time; other scenes keep their own.
export function createBoffAnimationTimeline({scenes,render,requestFrame,cancelFrame,now}){
 const groups=new Map(scenes.map(scene=>[scene.group,0]));
 const visible=new Set();
 let pageVisible=true,reduced=false,disposed=false,frame=null,last=now();
 const active=group=>pageVisible&&!reduced&&scenes.some(scene=>scene.group===group&&visible.has(scene.id));
 function advance(time){
  const delta=Math.max(0,time-last);last=time;
  for(const [group,elapsed] of groups)if(active(group))groups.set(group,elapsed+delta);
 }
 function draw(all=false){
  for(const scene of scenes)if(all||visible.has(scene.id)){
   const value=reduced?0:(groups.get(scene.group)*scene.fps/1000)%scene.frames;
   render(scene.id,value);
  }
 }
 function schedule(){
  const running=!disposed&&[...groups.keys()].some(active);
  if(!running&&frame!==null){cancelFrame(frame);frame=null;}
  if(running&&frame===null)frame=requestFrame(tick);
 }
 function tick(time){
  frame=null;if(disposed)return;
  advance(time);draw();schedule();
 }
 function update(change){if(disposed)return;advance(now());change();draw();schedule();}
 draw(true);
 return {
  setVisible(id,value){update(()=>{if(value)visible.add(id);else visible.delete(id);});},
  setPageVisible(value){update(()=>{pageVisible=value;});},
  setReducedMotion(value){update(()=>{reduced=value;if(value)draw(true);});},
  destroy(){if(disposed)return;disposed=true;if(frame!==null)cancelFrame(frame);frame=null;visible.clear();},
 };
}
