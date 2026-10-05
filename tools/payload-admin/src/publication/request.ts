export class PublicationRequestError extends Error{constructor(message:string,readonly status:number){super(message)}}
export async function readPublicationRequest(request:Request,origin:string){
 if(request.headers.get('origin')!==origin||request.headers.get('host')!==new URL(origin).host)throw new PublicationRequestError('Публикация доступна только из Payload.',403)
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')throw new PublicationRequestError('Ожидается запрос Payload.',400)
 const length=request.headers.get('content-length');if(length!==null&&(!/^\d+$/.test(length)||Number(length)>4096))throw new PublicationRequestError('Запрос слишком большой.',413)
 const reader=request.body?.getReader();if(!reader)throw new PublicationRequestError('Запрос пуст.',400)
 const chunks:Uint8Array[]=[];let size=0
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4096){await reader.cancel();throw new PublicationRequestError('Запрос слишком большой.',413)}chunks.push(value)}}finally{reader.releaseLock()}
 let value:unknown;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw new PublicationRequestError('Не удалось прочитать запрос.',400)}
 if(!value||typeof value!=='object'||Array.isArray(value))throw new PublicationRequestError('Неверный запрос.',400)
 return value as Record<string,unknown>
}
