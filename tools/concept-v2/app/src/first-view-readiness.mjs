function nextPaint(signal){
  return new Promise((resolve,reject)=>{
    if(signal.aborted){reject(signal.reason);return;}
    let frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>{
      signal.removeEventListener('abort',abort);
      resolve();
    });});
    const abort=()=>{cancelAnimationFrame(frame);reject(signal.reason);};
    signal.addEventListener('abort',abort,{once:true});
  });
}

function loadImage(image,signal){
  return new Promise((resolve,reject)=>{
    if(signal.aborted){reject(signal.reason);return;}
    const cleanup=()=>{
      image.removeEventListener('load',loaded);
      image.removeEventListener('error',failed);
      signal.removeEventListener('abort',aborted);
    };
    const loaded=()=>{
      cleanup();
      try{
        const decoding=image.decode?.();
        if(decoding)decoding.then(resolve,reject);
        else resolve();
      }catch(error){reject(error);}
    };
    const failed=()=>{cleanup();reject(new TypeError(`Critical first-view image failed: ${image.currentSrc||image.src}`));};
    const aborted=()=>{cleanup();reject(signal.reason);};
    image.addEventListener('load',loaded,{once:true});
    image.addEventListener('error',failed,{once:true});
    signal.addEventListener('abort',aborted,{once:true});
    if(image.complete)(image.naturalWidth>0?loaded:failed)();
  });
}

export async function prepareFirstView(root,signal){
  await nextPaint(signal);
  const visibleImages=[...root.querySelectorAll('.site-header img,.hero img')]
    .filter(image=>image.loading!=='lazy'&&image.getBoundingClientRect().top<innerHeight);
  const fonts=[
    document.fonts.load('400 16px Onest','Артур'),
    document.fonts.load('500 48px "Google Sans"','Продуктовый дизайнер'),
  ];
  await Promise.all([...fonts,...visibleImages.map(image=>loadImage(image,signal))]);
  if(signal.aborted)throw signal.reason;
  await nextPaint(signal);
}
