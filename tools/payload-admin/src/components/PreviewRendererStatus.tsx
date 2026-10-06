'use client'
import {useEffect,useState} from 'react'
export function PreviewRendererStatus({rendererId}:{rendererId:string}) {
 const [current,setCurrent]=useState<string|null>(null),[unavailable,setUnavailable]=useState(false)
 useEffect(()=>{
  let live=true
  const check=async()=>{try{const response=await fetch('/api/preview-renderer');if(!response.ok)throw new Error();const value=await response.json();if(!/^[a-f0-9]{64}$/.test(value.rendererId))throw new Error();if(live){setCurrent(value.rendererId);setUnavailable(false)}}catch{if(live)setUnavailable(true)}}
  const initial=setTimeout(()=>void check(),0),timer=setInterval(()=>void check(),15000)
  return()=>{live=false;clearTimeout(initial);clearInterval(timer)}
 },[])
 return <span title={rendererId}>Сборка предпросмотра: {rendererId.slice(0,12)}. {unavailable?'Актуальность сборки не подтверждена.':current&&current!==rendererId?'Используется предыдущая сборка. Обновите предпросмотр.':null}</span>
}
