export const WHEEL_GESTURE_IDLE_MS=160;

export function resolveWheelHandling({input,protectedRegionVisible=false}={}){
  return input==='trackpad'&&!protectedRegionVisible?'native':'smooth';
}

export function resolveWheelEligibility({handling='smooth',input='mouse',desktop=true,reduced=false,protectedRegionVisible=false,stopped=false}={}){
  if(stopped)return 'smooth';
  if((reduced||(!desktop&&input!=='mouse'))&&!protectedRegionVisible)return 'native';
  return handling;
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
      }else if(input==='mouse'){
        // The input classifier has confirmed a device switch. Native handling
        // belongs to trackpad gestures and must not latch onto mouse notches.
        handling='smooth';
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
  let quantizedMouse=false;
  let pixelSteps=[];
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
      // Some pixel-mode wheels expose no legacy120-unit notch. Recognize a
      // repeated quantum and its multiples, allowing integer browser rounding.
      // A single large impulse or a smooth acceleration/deceleration is not proof.
      if(newGesture)pixelSteps=[];
      const precisionEvidence=deltaMode===0&&(deltaX!==0||!Number.isInteger(deltaY)||(Math.abs(deltaY)>0&&Math.abs(deltaY)<10));
      if(precisionEvidence){quantizedMouse=false;pixelSteps=[];}
      else if(deltaMode===0&&deltaX===0&&Number.isInteger(deltaY)&&Math.abs(deltaY)>=40){
        pixelSteps.push(Math.abs(deltaY));
        pixelSteps=pixelSteps.slice(-6);
        // A non-accelerating wheel can repeat one rounded notch instead of
        // multiples. Require six consistent samples, not a brief velocity peak.
        if(pixelSteps.length===6&&Math.max(...pixelSteps)-Math.min(...pixelSteps)<=1)quantizedMouse=true;
        if(pixelSteps.length>=3&&Math.max(...pixelSteps)>=2*Math.min(...pixelSteps)){
          quantizedMouse=quantizedMouse||pixelSteps.some(base=>{
            const multiples=pixelSteps.map(value=>Math.round(value/base));
            if(multiples.some(value=>value<1||value>64))return false;
            const quantum=pixelSteps.reduce((sum,value,index)=>sum+value/multiples[index],0)/pixelSteps.length;
            return pixelSteps.every((value,index)=>Math.abs(value-quantum*multiples[index])<=2);
          });
        }
      }
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
      }else if(quantizedMouse){
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
    reset(){input='mouse';previousTime=undefined;pendingLegacyMouse=false;quantizedMouse=false;pixelSteps=[];},
  };
}
