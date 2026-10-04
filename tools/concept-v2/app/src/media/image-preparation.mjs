const priorityRank={low:0,high:1};

function resourceFor(image){
 return image.currentSrc||image.src||'';
}

function waitForImage(image){
 if(image.complete)return Promise.resolve(image.naturalWidth>0);
 return new Promise(resolve=>{
  const done=ready=>{image.removeEventListener('load',onLoad);image.removeEventListener('error',onError);resolve(ready);};
  const onLoad=()=>done(true);
  const onError=()=>done(false);
  image.addEventListener('load',onLoad,{once:true});
  image.addEventListener('error',onError,{once:true});
 });
}

export function createImagePreparer(){
 const records=new WeakMap();
 let disposed=false;
 function prepare(image,priority='low'){
  if(disposed||!image)return Promise.resolve(false);
  const resource=resourceFor(image);
  const previous=records.get(image);
  const rank=Math.max(priorityRank[priority]??0,previous?.rank??0);
  const effective=rank===priorityRank.high?'high':'low';
  image.fetchPriority=effective;
  image.loading='eager';
  if(previous?.resource===resource){previous.rank=rank;return previous.promise;}
  const record={resource,rank,promise:null};
  record.promise=waitForImage(image).then(async loaded=>{
   if(!loaded||disposed||records.get(image)!==record)return false;
   try{await image.decode?.();}catch{return false;}
   return !disposed&&records.get(image)===record;
  });
  records.set(image,record);
  return record.promise;
 }
 function prepareAll(images,priority){
  return Promise.all([...images].map(image=>prepare(image,priority)));
 }
 return {prepare,prepareAll,dispose(){disposed=true;}};
}
