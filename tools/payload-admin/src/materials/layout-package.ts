import { createHash } from 'node:crypto'
import path from 'node:path'
import sharp from 'sharp'
import type { RedesignLayoutSource } from '../../../../src/lib/project-redesign-contract'
export type PackageInput = {path:string;bytes:Buffer}
export type PreparedPackage = {source:Extract<RedesignLayoutSource,{kind:'package'}>;files:{path:string;bytes:Buffer;mime:string;sha256:string}[];externalDependencies:string[]}
const mimes:Record<string,string>={html:'text/html',htm:'text/html',css:'text/css',js:'text/javascript',mjs:'text/javascript',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',avif:'image/avif',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',wasm:'application/wasm'}
const digest=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex')
export function packagePath(value:string) {
 if(!value || value.length>512 || /[:\\%?#\u0000-\u0020\u007f]/.test(value) || value.split('/').some(part=>!part||part==='.'||part==='..') || path.posix.normalize(value)!==value) throw new Error('Пути верстки должны быть относительными, без пробелов, .. и специальных символов.')
 return value
}
function references(text:string,mime:string):string[] {
 const found:string[]=[]
 if(mime==='text/html') {
  for(const match of text.matchAll(/(?:src|href|poster)\s*=\s*(?:"([^"<>]*)"|'([^'<>]*)'|([^\s<>"']+))/gi)) found.push(match[1]??match[2]??match[3])
  for(const match of text.matchAll(/srcset\s*=\s*(?:"([^"<>]*)"|'([^'<>]*)')/gi)) for(const part of (match[1]??match[2]).split(',')) found.push(part.trim().split(/\s+/)[0])
 }
 if(mime==='text/html'||mime==='text/css') {
  for(const match of text.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/gi)) found.push(match[1])
  for(const match of text.matchAll(/@import\s+['"]([^'"]+)['"]/gi)) found.push(match[1])
 }
 if(mime==='text/html'||mime==='text/javascript') {
  for(const match of text.matchAll(/(?:\b(?:import|export)\s+(?:[^;'"\n]*?\s+from\s*)?|\bimport\s*\(\s*|\bnew\s+URL\s*\(\s*)['"]([^'"]+)['"]/g)) found.push(match[1])
 }
 return found
}
// Never fetch remote URLs. The package runs only in the existing sandbox/CSP boundary.
export async function prepareLayoutPackage(slug:string,entry:string,inputs:PackageInput[]):Promise<PreparedPackage> {
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Сначала сохраните адрес проекта.')
 packagePath(entry)
 if(!inputs.length||inputs.length>512) throw new Error('Верстка должна содержать от1 до512 файлов.')
 if(inputs.reduce((sum,file)=>sum+file.bytes.length,0)>64*1024*1024) throw new Error('Пакет верстки превышает64МБ.')
 const seen=new Set<string>()
 const texts=new Map<string,string>()
 const files=[]
 for(const input of inputs) {
  const name=packagePath(input.path),folded=name.normalize('NFC').toLowerCase()
  if(seen.has(folded)) throw new Error('В пакете есть совпадающие имена файлов.')
  seen.add(folded)
  if(!Buffer.isBuffer(input.bytes)||!input.bytes.length||input.bytes.length>20*1024*1024) throw new Error('Каждый файл должен быть размером от1 байта до20МБ.')
  let mime=mimes[path.posix.extname(name).slice(1).toLowerCase()]
  if(!mime) throw new Error(`Формат файла не поддерживается: ${name}`)
  if(mime.startsWith('image/')&&mime!=='image/svg+xml') {
   const image=sharp(input.bytes,{limitInputPixels:40_000_000,animated:true})
   const metadata=await image.metadata()
   const actual=`image/${metadata.format==='heif'&&metadata.compression==='av1'?'avif':metadata.format}`
   if(!['image/png','image/jpeg','image/webp','image/avif'].includes(actual)) throw new Error(`Формат изображения не поддерживается: ${name}`)
   // Ready HTML may use a historical .png name for a JPEG; preserve its path and bytes.
   mime=actual
   await image.stats()
  } else if(['text/html','text/css','text/javascript','application/json','image/svg+xml'].includes(mime)) {
   const text=new TextDecoder('utf-8',{fatal:true}).decode(input.bytes)
   if(text.includes('\0')) throw new Error(`Повреждён текстовый файл: ${name}`)
   if(mime==='application/json') JSON.parse(text)
   if(mime==='image/svg+xml'&&!/<svg(?:\s|>)/i.test(text)) throw new Error(`Неверный SVG: ${name}`)
   texts.set(name,text)
  } else {
   const signatures:Record<string,Buffer>={'font/woff':Buffer.from('wOFF'),'font/woff2':Buffer.from('wOF2'),'font/otf':Buffer.from('OTTO'),'font/ttf':Buffer.from([0,1,0,0]),'application/wasm':Buffer.from([0,97,115,109])}
   if(!input.bytes.subarray(0,4).equals(signatures[mime])) throw new Error(`Неверный бинарный файл: ${name}`)
  }
  files.push({path:name,bytes:input.bytes,mime,sha256:digest(input.bytes)})
 }
 files.sort((a,b)=>a.path.localeCompare(b.path))
 if(!files.some(file=>file.path===entry&&file.mime==='text/html')) throw new Error('Выберите существующий HTML файл для начала сцены.')
 const manifest=files.map(file=>({path:file.path,sha256:file.sha256,size:file.bytes.length,mime:file.mime}))
 const assetBase=`/assets/projects/${slug}/hero-layout/${digest(JSON.stringify({entry,files:manifest}))}/`
 const byPath=new Map(files.map(file=>[file.path,file]))
 const external=new Set<string>()
 for(const file of files) {
  const text=texts.get(file.path)
  if(text===undefined) continue
  for(const ref of references(text,file.mime)) {
   if(!ref||ref.startsWith('#')||ref.startsWith('data:')) continue
   const target=new URL(ref,`https://package.example${assetBase}${file.path}`)
   if(target.origin!=='https://package.example') {
    // These are the only external resources permitted by the approved package CSP.
    if(target.protocol!=='https:'||target.username||target.password||!['fonts.googleapis.com','fonts.gstatic.com'].includes(target.hostname)||!['text/html','text/css'].includes(file.mime)) throw new Error(`Ресурс вне пакета недоступен в изолированной сцене: ${ref}`)
    external.add(target.href);continue
   }
   if(!target.pathname.startsWith(assetBase)||!byPath.has(target.pathname.slice(assetBase.length))) throw new Error(`Не хватает ресурса верстки: ${ref} (${file.path})`)
  }
 }
 return {source:{kind:'package',entry,assetBase,files:manifest},files,externalDependencies:[...external].sort()}
}
