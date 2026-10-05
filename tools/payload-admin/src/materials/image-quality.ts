import { createHash } from 'node:crypto'
import sharp from 'sharp'

export type ImageContext = 'screen' | 'diagram' | 'photo' | 'illustration' | 'unknown'
type Format = 'png' | 'jpeg' | 'webp'
type Reason = 'verified-lossless' | 'original-context-unknown' | 'original-already-webp' | 'original-unsupported-depth' | 'original-orientation' | 'original-animated' | 'original-not-smaller' | 'original-quality-mismatch' | 'original-encoding-failed'
type ImageInfo = { format: Format; width: number; height: number; bytes: number; sha256: string }
export type QualityReport = { version: 1; context: ImageContext; mode: 'original' | 'lossless'; reason: Reason; original: ImageInfo; prepared: ImageInfo }
type Encoding = { encode?: (input: Buffer) => Promise<Buffer> }
const limits = { limitInputPixels: 40_000_000, animated: true, failOn: 'error' as const }
const formats = new Set(['png', 'jpeg', 'webp'])
const hash = (data: Buffer) => createHash('sha256').update(data).digest('hex')
function sameOptionalBuffer(a?: Buffer,b?: Buffer) { return a === undefined ? b === undefined : Boolean(b && a.equals(b)) }
async function pixels(input: Buffer) {
 return sharp(input, limits).toColourspace('srgb').ensureAlpha().raw().toBuffer({resolveWithObject:true})
}
// Trusted encoder injection is only used by focused fault tests; HTTP callers do not select it.
export async function prepareImage(input: Buffer, context: ImageContext, encoding: Encoding = {}) {
 if (!Buffer.isBuffer(input) || !input.length || input.length>20*1024*1024) throw new Error('Изображение должно иметь размер от 1 байта до 20 МБ.')
 if (!['screen','diagram','photo','illustration','unknown'].includes(context)) throw new Error('Назначение изображения не поддерживается.')
 const metadata=await sharp(input,limits).metadata()
 if(!metadata.format || !formats.has(metadata.format) || !metadata.width || !metadata.height) throw new Error('Допустимы PNG, JPEG и WebP.')
 // A valid header does not prove a complete original. Decode before any fallback.
 await sharp(input,limits).stats()
 const original:ImageInfo={format:metadata.format as Format,width:metadata.width,height:metadata.height,bytes:input.length,sha256:hash(input)}
 const keep=(reason:Reason)=>({bytes:input,mime:`image/${original.format}`,extension:original.format==='jpeg'?'jpg':original.format,report:{version:1 as const,context,mode:'original' as const,reason,original,prepared:original}})
 if(context==='unknown') return keep('original-context-unknown')
 if(original.format==='webp') return keep('original-already-webp')
 if((metadata.pages??1)>1) return keep('original-animated')
 if(metadata.depth!=='uchar') return keep('original-unsupported-depth')
 if(metadata.orientation && metadata.orientation!==1) return keep('original-orientation')
 let candidate:Buffer
 try { candidate=await (encoding.encode??(bytes=>sharp(bytes,limits).keepMetadata().webp({lossless:true,effort:6}).toBuffer()))(input) }
 catch { return keep('original-encoding-failed') }
 if(candidate.length>=input.length) return keep('original-not-smaller')
 try {
  const checked=await sharp(candidate,limits).metadata()
  if(checked.format!=='webp' || checked.width!==metadata.width || checked.height!==metadata.height || (checked.pages??1)!==1 || (checked.orientation??1)!==(metadata.orientation??1) || !sameOptionalBuffer(checked.icc,metadata.icc)) return keep('original-quality-mismatch')
  const before=await pixels(input),after=await pixels(candidate)
  if(before.info.width!==after.info.width || before.info.height!==after.info.height || before.info.channels!==after.info.channels || !before.data.equals(after.data)) return keep('original-quality-mismatch')
 } catch { return keep('original-quality-mismatch') }
 const prepared:ImageInfo={format:'webp',width:original.width,height:original.height,bytes:candidate.length,sha256:hash(candidate)}
 const report:QualityReport={version:1,context,mode:'lossless',reason:'verified-lossless',original,prepared}
 return {bytes:candidate,mime:'image/webp',extension:'webp',report}
}
