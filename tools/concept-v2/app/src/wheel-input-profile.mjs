export const WHEEL_GESTURE_IDLE_MS=160;

export function resolveWheelHandling({input,protectedRegionVisible=false}={}){
  return input==='trackpad'&&!protectedRegionVisible?'native':'smooth';
}

export function createWheelHandlingProfile({gestureIdleMs=WHEEL_GESTURE_IDLE_MS}={}){
  let handling='smooth';
  let previousTime;
  let protectedAtStart=false;
  return{
    get current(){return handling;},
    observe({event={},input='mouse',protectedRegionVisible=false}={}){
      const eventTime=Number(event.timeStamp);
      const inputTime=Number.isFinite(eventTime)?eventTime:performance.now();
      const gap=previousTime===undefined?Infinity:inputTime-previousTime;
      const newGesture=gap<0||gap>gestureIdleMs;
      if(newGesture){
        protectedAtStart=protectedRegionVisible;
        handling=resolveWheelHandling({input,protectedRegionVisible});
      }else if(!protectedAtStart&&handling==='smooth'&&input==='trackpad'){
        handling='native';
      }
      previousTime=inputTime;
      return handling;
    },
    reset(){handling='smooth';previousTime=undefined;protectedAtStart=false;},
  };
}

export function createWheelInputProfile({gestureIdleMs=WHEEL_GESTURE_IDLE_MS}={}){
  let input='mouse';
  let previousTime;
  return{
    get current(){return input;},
    observe(event={}){
      const eventTime=Number(event.timeStamp);
      const inputTime=Number.isFinite(eventTime)?eventTime:performance.now();
      const gap=previousTime===undefined?Infinity:inputTime-previousTime;
      const sameGesture=gap>=0&&gap<=gestureIdleMs;

      const deltaMode=Number(event.deltaMode) || 0;
      const deltaX=Number(event.deltaX) || 0;
      const deltaY=Number(event.deltaY) || 0;
      const wheelDeltaY=Math.abs(Number(event.wheelDeltaY));
      const discreteUnits=deltaMode!==0;
      const legacyWheelNotch=wheelDeltaY>0&&wheelDeltaY%120===0;
      const continuingTrackpad=sameGesture&&input==='trackpad'&&deltaMode===0;
      const continuousPixels=deltaMode===0&&(
        Math.abs(deltaX)>0||
        !Number.isInteger(deltaX)||
        !Number.isInteger(deltaY)||
        (Math.abs(deltaY)>0&&Math.abs(deltaY)<40)||
        continuingTrackpad
      );

      if(continuingTrackpad)input='trackpad';
      else if(discreteUnits||legacyWheelNotch)input='mouse';
      else if(continuousPixels)input='trackpad';
      previousTime=inputTime;
      return input;
    },
    reset(){input='mouse';previousTime=undefined;},
  };
}
