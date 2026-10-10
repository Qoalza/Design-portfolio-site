const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=(from,to,value)=>{
  const t=clamp((value-from)/(to-from));
  return t*t*(3-2*t);
};

export function drawPreloaderMorph(svg,progress){
  const a=svg.querySelector('.preloader-morph-a');
  const left=svg.querySelector('.preloader-morph-left');
  const right=svg.querySelector('.preloader-morph-right');
  const fragments=svg.querySelector('.preloader-morph-fragments');
  const collapse=smooth(.12,.68,progress);
  const aOpacity=1-smooth(.48,.70,progress);
  const plugOpacity=1-aOpacity;
  const fragmentOpacity=smooth(.45,.88,progress);
  const color=[0,1,2].map((_,index)=>{
    const start=[242,244,245][index],end=[200,72,40][index];
    return Math.round(start+(end-start)*smooth(.16,.56,progress));
  });
  a.setAttribute('fill',`rgb(${color.join(',')})`);
  const scale=(1-.08*collapse).toFixed(3);
  a.setAttribute('transform',`translate(48 48) scale(${scale}) translate(-48 -48)`);
  const spread=1-smooth(.30,.84,progress);
  left.setAttribute('transform',`translate(${(8*spread).toFixed(2)} ${(-8*spread).toFixed(2)})`);
  right.setAttribute('transform',`translate(${(-8*spread).toFixed(2)} ${(8*spread).toFixed(2)})`);
  for(const [node,opacity] of [[a,aOpacity],[left,plugOpacity],[right,plugOpacity],[fragments,fragmentOpacity]]){
    node.style.display=opacity<=0?'none':'';
    node.setAttribute('opacity',opacity.toFixed(3));
  }
}
