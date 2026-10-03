export const WHEEL_GESTURE_IDLE_MS=160;

export function resolveWheelHandling({input,protectedRegionVisible=false}={}){
  return input==='trackpad'&&!protectedRegionVisible?'native':'smooth';
}

export function shouldResetSmoothScroll({previousHandling,nextHandling,isScrolling}={}){
  return previousHandling==='smooth'&&nextHandling==='native'&&isScrolling==='smooth';
}

export function isProtectedWheelRegion({scrollY=0,deltaY=0,sectionTop=Infinity,sectionHeight=0,viewportHeight=0}={}){
  const top=Number(sectionTop);
  const height=Number(sectionHeight);
  const viewport=Number(viewportHeight);
  if(!Number.isFinite(top)||height<=0||viewport<=0)return false;
  const current=Number(scrollY) || 0;
  const delta=Number(deltaY) || 0;
  const finalScrollTop=top+Math.max(0,height-viewport);
  if(current>=top&&current<=finalScrollTop)return true;
  return delta>0&&current<top&&current+delta>=top;
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
      const deltaY=Number(event.deltaY) || 0;
      if(newGesture){
        protectedAtStart=protectedRegionVisible;
        handling=resolveWheelHandling({input,protectedRegionVisible});
      }else if(handling==='native'&&protectedRegionVisible&&deltaY>0){
        protectedAtStart=true;
        handling='smooth';
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
  let pendingLegacyMouse=false;
  return{
    get current(){return input;},
    observe(event={}){
      const eventTime=Number(event.timeStamp);
      const inputTime=Number.isFinite(eventTime)?eventTime:performance.now();
      const gap=previousTime===undefined?Infinity:inputTime-previousTime;
      const sameGesture=gap>=0&&gap<=gestureIdleMs;
      const newGesture=!sameGesture;

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

      if(discreteUnits){
        input='mouse';
        pendingLegacyMouse=false;
      }else if(legacyWheelNotch&&input==='trackpad'&&newGesture){
        pendingLegacyMouse=true;
      }else if(legacyWheelNotch&&pendingLegacyMouse){
        input='mouse';
        pendingLegacyMouse=false;
      }else if(continuingTrackpad){
        input='trackpad';
        pendingLegacyMouse=false;
      }else if(legacyWheelNotch){
        input='mouse';
        pendingLegacyMouse=false;
      }else if(continuousPixels){
        input='trackpad';
        pendingLegacyMouse=false;
      }else if(newGesture){
        pendingLegacyMouse=false;
      }
      previousTime=inputTime;
      return input;
    },
    reset(){input='mouse';previousTime=undefined;pendingLegacyMouse=false;},
  };
}
