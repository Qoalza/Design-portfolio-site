// Metadata reader for immutable approved Git assets; this is not an upload validator.
// Payload owns full upload validation and image-quality processing.
import path from 'node:path';
export function inspectApprovedImage(bytes, fileName, mime) {
 if (!Buffer.isBuffer(bytes) || bytes.length < 24 || bytes.length > 20 * 1024 * 1024) throw new Error('Invalid approved image size.');
 let width, height;
 if (mime === 'image/png' && path.extname(fileName) === '.png' && bytes.subarray(0,8).toString('hex') === '89504e470d0a1a0a' && bytes.subarray(12,16).toString('ascii') === 'IHDR') {
  width=bytes.readUInt32BE(16);height=bytes.readUInt32BE(20);
 } else if (mime === 'image/webp' && path.extname(fileName) === '.webp' && bytes.length >= 30 && bytes.subarray(0,4).toString('ascii') === 'RIFF' && bytes.subarray(8,12).toString('ascii') === 'WEBP') {
  const type=bytes.subarray(12,16).toString('ascii');
  if(type==='VP8X'){width=1+bytes.readUIntLE(24,3);height=1+bytes.readUIntLE(27,3);}
  else if(type==='VP8L'){const bits=bytes.readUInt32LE(21);width=(bits&0x3fff)+1;height=((bits>>>14)&0x3fff)+1;}
  else if(type==='VP8 '){width=bytes.readUInt16LE(26)&0x3fff;height=bytes.readUInt16LE(28)&0x3fff;}
 }
 if(!width || !height || width*height>40_000_000) throw new Error('Unsupported or invalid approved image metadata.');
 return {width,height};
}
