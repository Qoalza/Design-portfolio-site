import {forwardRef,useState} from 'react';

const formatFor=src=>src?.match(/\.(avif|webp|png)(?:$|[?#])/i)?.[1]?.toLowerCase();

export const ResponsivePicture=forwardRef(function ResponsivePicture({source,className,alt,sizes,loading='lazy',decoding='async',fetchPriority,onLoad,onError,...props},ref){
 const [failed,setFailed]=useState([]);
 const sources=(source.sources??[]).filter(candidate=>!failed.includes(candidate.type));
 const imageProps={...props,ref,className,src:source.fallback,alt,sizes,loading,decoding,fetchPriority,onLoad,onError:event=>{
  const format=formatFor(event.currentTarget.currentSrc)||formatFor(event.currentTarget.src);
  if(format&&format!=='png'&&!failed.includes(`image/${format}`))setFailed(previous=>[...previous,`image/${format}`]);
  else if(format==='png'&&!failed.includes('image/png'))setFailed(previous=>[...previous,'image/png']);
  onError?.(event);
 }};
 if(!sources.length)return <img {...imageProps}/>;
 return <picture>{sources.map(candidate=><source key={candidate.type} type={candidate.type} srcSet={candidate.srcSet} sizes={sizes}/>)}<img {...imageProps}/></picture>;
});
