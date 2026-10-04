import {refreshFailedFontSources} from './first-view-fonts.mjs';

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

function loadImage(image,signal,retryNumber){
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
    const retryFailedImage=image.complete&&image.naturalWidth===0&&retryNumber>0;
    if(retryFailedImage){
      const url=new URL(image.src,location.href);
      url.searchParams.set('preloader-retry',String(retryNumber));
      image.src=url.href;
    }
    if(image.complete&&image.naturalWidth>0)loaded();
    else if(image.complete&&!retryFailedImage)failed();
  });
}

export async function prepareFirstView(root,signal,retryNumber=0){
  await nextPaint(signal);
  const visibleImages=[...root.querySelectorAll('.site-header img,.hero img,[data-first-view] img')]
    .filter(image=>image.loading!=='lazy'&&image.getBoundingClientRect().top<innerHeight);
  if(retryNumber>0)refreshFailedFontSources(document,location.href);
  const fonts=[
    document.fonts.load('400 16px Onest','Артур'),
    document.fonts.load('500 48px "Google Sans"','Продуктовый дизайнер'),
  ];
  await Promise.all([...fonts,...visibleImages.map(image=>loadImage(image,signal,retryNumber))]);
  if(signal.aborted)throw signal.reason;
  await nextPaint(signal);
}
