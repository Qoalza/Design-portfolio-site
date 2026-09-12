export function randomEdgePoint(random=Math.random,size=64){
  const edge=Math.floor(random()*4);
  const offset=random()*size;
  if(edge===0)return {x:offset,y:0};
  if(edge===1)return {x:size,y:offset};
  if(edge===2)return {x:0,y:offset};
  return {x:offset,y:size};
}
