export function dotFieldMaskRect({width,height}){
 const maskWidth=width*1.1;
 const maskHeight=height*1.12+100;
 return {
  width:maskWidth,
  height:maskHeight,
  x:(width-maskWidth)/2+8,
  y:-108,
 };
}

export function paintDotField(context,{width,height,dpr,mask,background='#181a1c',dot='#232526'}){
 context.save();
 context.setTransform(dpr,0,0,dpr,0,0);
 context.clearRect(0,0,width,height);
 context.fillStyle=background;
 context.fillRect(0,0,width,height);
 context.fillStyle=dot;
 for(let y=1.5;y<height;y+=16){
  for(let x=1.5;x<width;x+=16){
   context.beginPath();
   context.arc(x,y,1.5,0,Math.PI*2);
   context.fill();
  }
 }
 const maskRect=dotFieldMaskRect({width,height});
 context.globalCompositeOperation='destination-in';
 context.drawImage(mask,maskRect.x,maskRect.y,maskRect.width,maskRect.height);
 context.restore();
 return maskRect;
}
