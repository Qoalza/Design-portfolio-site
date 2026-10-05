export class MaterialRequestError extends Error {
 constructor(message:string,readonly status:number){super(message)}
}
// Bounded read even if the sender omits or lies about Content-Length.
export async function readMaterialForm(request:Request, origin:string, limit=20*1024*1024+16*1024) {
 if(request.headers.get('origin')!==origin || request.headers.get('host')!==new URL(origin).host) throw new MaterialRequestError('Загрузка доступна только из локальной Payload.',403)
 const contentType=request.headers.get('content-type')||''
 if(!contentType.startsWith('multipart/form-data;')) throw new MaterialRequestError('Ожидается файл изображения.',400)
 const declared=request.headers.get('content-length')
 if(declared!==null && (!/^\d+$/.test(declared)||Number(declared)>limit)) throw new MaterialRequestError('Загрузка превышает допустимый размер.',413)
 const reader=request.body?.getReader()
 if(!reader) throw new MaterialRequestError('Выберите изображение.',400)
 const chunks:Uint8Array[]=[]
 let size=0
 try {
  for(;;) {
   const {done,value}=await reader.read()
   if(done) break
   size+=value.length
   if(size>limit){await reader.cancel();throw new MaterialRequestError('Загрузка превышает допустимый размер.',413)}
   chunks.push(value)
  }
 } finally {reader.releaseLock()}
 try{return await new Response(Buffer.concat(chunks),{headers:{'content-type':contentType}}).formData()}
 catch {throw new MaterialRequestError('Не удалось прочитать файл загрузки.',400)}
}
