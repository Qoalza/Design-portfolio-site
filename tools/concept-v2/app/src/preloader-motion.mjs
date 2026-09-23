// Motion copied from USERSPACE/Logo/logo-preloader-final.html. Geometry and relative phase timing stay intact.
export function mountPreloaderLogo(svg){
  if(!svg)return ()=>{};
  const CYCLE=1800;
  const ORBIT_END=1700;
  const SPEED=1.26;
  const cx=24,cy=26.2,radius=cy-9.62777;
  const marker=svg.querySelector('#preloader-marker');
  const tail=svg.querySelector('#preloader-tail');
  const gradient=svg.querySelector('#preloader-tail-gradient');
  const leftTipCut=svg.querySelector('#preloader-left-tip-cut');
  const rightTipCut=svg.querySelector('#preloader-right-tip-cut');
  const tipMotionBlur=svg.querySelector('#preloader-tip-motion-blur');
  const ballClearance=svg.querySelector('#preloader-ball-clearance');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let elapsed=0,last=performance.now(),frame=0;

  const clamp01=value=>Math.max(0,Math.min(1,value));
  const point=angle=>[cx+radius*Math.cos(angle),cy+radius*Math.sin(angle)];
  function cssEase(time){
    const t=clamp01(time),x1=.25,y1=.1,x2=.25,y2=1;
    const cubic=(p,a,b)=>3*(1-p)*(1-p)*p*a+3*(1-p)*p*p*b+p*p*p;
    const slope=(p,a,b)=>3*(1-p)*(1-p)*a+6*(1-p)*p*(b-a)+3*p*p*(1-b);
    let p=t;
    for(let i=0;i<5;i+=1)p-=(cubic(p,x1,x2)-t)/slope(p,x1,x2);
    return cubic(clamp01(p),y1,y2);
  }
  function between(value,from,to,start,end){
    if(value<=start)return from;
    if(value>=end)return to;
    return from+(to-from)*cssEase((value-start)/(end-start));
  }
  function tailDegrees(ms){
    const p=clamp01(ms/ORBIT_END);
    if(p<=.05)return 0;
    if(p<=.10)return between(p,0,21,.05,.10);
    if(p<=.20)return between(p,21,65,.10,.20);
    if(p<=.38)return between(p,65,84,.20,.38);
    if(p<=.59)return between(p,84,21,.38,.59);
    if(p<=.95)return between(p,21,0,.59,.95);
    return 0;
  }
  function arcPath(fromAngle,toAngle){
    const [x1,y1]=point(fromAngle),[x2,y2]=point(toAngle);
    const delta=Math.max(.001,toAngle-fromAngle);
    const large=delta>Math.PI?1:0;
    return {d:`M ${x1.toFixed(4)} ${y1.toFixed(4)} A ${radius.toFixed(4)} ${radius.toFixed(4)} 0 ${large} 1 ${x2.toFixed(4)} ${y2.toFixed(4)}`,x1,y1,x2,y2};
  }
  function legTravel(ms,start,end){
    const p=clamp01((ms-start)/(end-start));
    if(p<=0)return {position:0,speed:0};
    if(p>=1)return {position:1,speed:0};
    const ramp=.44;
    const cruise=1/(1-ramp);
    if(p<ramp){
      const u=p/ramp;
      return {position:cruise*ramp*(u/2-Math.sin(Math.PI*u)/(2*Math.PI)),speed:(1-Math.cos(Math.PI*u))/2};
    }
    if(p<=1-ramp)return {position:cruise*(p-ramp/2),speed:1};
    const u=(p-(1-ramp))/ramp;
    return {position:1-cruise*ramp/2+cruise*ramp*(u/2+Math.sin(Math.PI*u)/(2*Math.PI)),speed:(1+Math.cos(Math.PI*u))/2};
  }
  function roundedTipCut(tipY,morph){
    const slope=-3.9/12;
    const lineY=x=>tipY+11.75+slope*x;
    const innerSlope=(31.1504-24)/(36.1721-15.3709);
    const outerSlope=(35.5346-26.0129)/(39.9844-12.2839);
    const intersection=(x0,y0,legSlope)=>{
      const x=(x0+legSlope*(tipY+11.75-y0))/(1-legSlope*slope);
      return [x,lineY(x)];
    };
    const [ix,iy]=intersection(24,15.3709,innerSlope);
    const [ox,oy]=intersection(26.0129,12.2839,outerSlope);
    const innerRadius=.78;
    const outerSpan=.78+(1.8-.78)*morph;
    const outerRise=.78+(2-.78)*morph;
    const f=value=>value.toFixed(4);
    return `M 28 ${f(lineY(28))} `+
      `L ${f(ix-innerSlope*innerRadius)} ${f(iy-innerRadius)} `+
      `Q ${f(ix)} ${f(iy)} ${f(ix+innerRadius)} ${f(lineY(ix+innerRadius))} `+
      `L ${f(ox-outerSpan)} ${f(lineY(ox-outerSpan))} `+
      `Q ${f(ox)} ${f(oy)} ${f(ox-outerSlope*outerRise)} ${f(oy-outerRise)} `+
      `L 40 ${f(lineY(40))} L 40 48 L 28 48 Z`;
  }
  function updateLegTipCuts(ms,x,y){
    const rise=legTravel(ms,130,410);
    const fall=legTravel(ms,700,980);
    const lift=rise.position*(1-fall.position);
    const speed=Math.max(rise.speed,fall.speed);
    const softness=Math.sqrt(speed);
    const morphProgress=clamp01((lift-.08)/.82);
    const morph=morphProgress*morphProgress*(3-2*morphProgress);
    const cut=lift>.001?roundedTipCut(42-10.5*lift,morph):'';
    rightTipCut.setAttribute('d',cut);
    leftTipCut.setAttribute('d',cut);
    tipMotionBlur.setAttribute('stdDeviation',`${(.36*softness).toFixed(4)} ${(1.28*softness).toFixed(4)}`);
    ballClearance.setAttribute('cx',x.toFixed(4));
    ballClearance.setAttribute('cy',y.toFixed(4));
  }
  function render(rawMs){
    const ms=((rawMs%CYCLE)+CYCLE)%CYCLE;
    const angle=-Math.PI/2+cssEase(clamp01(ms/ORBIT_END))*Math.PI*2;
    const [x,y]=point(angle);
    marker.setAttribute('transform',ms>=ORBIT_END?'translate(0 0)':`translate(${(x-24).toFixed(4)} ${(y-9.62777).toFixed(4)})`);
    const tailLength=tailDegrees(ms)*Math.PI/180;
    if(tailLength<.002)tail.setAttribute('d','');
    else{
      const arc=arcPath(angle-tailLength,angle);
      tail.setAttribute('d',arc.d);
      gradient.setAttribute('x1',arc.x1);
      gradient.setAttribute('y1',arc.y1);
      gradient.setAttribute('x2',arc.x2);
      gradient.setAttribute('y2',arc.y2);
    }
    updateLegTipCuts(ms,x,y);
  }
  function tick(now){
    elapsed+=(now-last)*SPEED;
    last=now;
    render(elapsed);
    frame=requestAnimationFrame(tick);
  }
  function sync(){
    cancelAnimationFrame(frame);
    if(reduced.matches){render(CYCLE-1);return;}
    if(document.hidden)return;
    last=performance.now();
    frame=requestAnimationFrame(tick);
  }
  render(0);
  sync();
  reduced.addEventListener('change',sync);
  document.addEventListener('visibilitychange',sync);
  return ()=>{
    cancelAnimationFrame(frame);
    reduced.removeEventListener('change',sync);
    document.removeEventListener('visibilitychange',sync);
  };
}
