import { createHash } from 'node:crypto';
import path from 'node:path';
import { TextDecoder } from 'node:util';
import { validateProjectDocument } from '../../src/lib/project-contract.ts';
import { requiredAssets, validatePackageResources } from '../portfolio-release/project-snapshot.mjs';

export const DELIVERY_VERSION = 'public-delivery-v1';
export const DELIVERY_CAPABILITIES = Object.freeze(['project-v3', 'redesign-v1', 'hero-layout', 'hero-raster', 'empty-collection', 'scoped-assets-v1']);
export const digestPattern = /^[a-f0-9]{64}$/;
export const contentHash = bytes => createHash('sha256').update(bytes).digest('hex');
export const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
export function exactObject(value, keys, at) {
 if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${at} must be an object.`);
 for (const key of Object.keys(value)) if (!keys.includes(key)) throw new Error(`${at} contains unknown field ${key}.`);
 return value;
}
// Object insertion order and producer enumeration never determine content identity.
export function canonicalJSON(value) {
 if (Array.isArray(value)) return '[' + value.map(canonicalJSON).join(',') + ']';
 if (value && typeof value === 'object') return '{' + Object.keys(value).sort(compare).map(key => JSON.stringify(key) + ':' + canonicalJSON(value[key])).join(',') + '}';
 const result = JSON.stringify(value);
 if (result === undefined) throw new Error('Delivery data must be JSON.');
 return result;
}
const mimes = new Map(Object.entries({'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.svg':'image/svg+xml','.gif':'image/gif','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.otf':'font/otf','.wasm':'application/wasm'}));
export function assetMime(publicPath) {
 const mime = mimes.get(path.posix.extname(publicPath).toLowerCase());
 if (!mime) throw new Error('Unsupported delivery asset MIME.');
 return mime;
}
// Signature checks verify the transport MIME against bytes. Full image decoding,
// dimensions and HTML/SVG sanitization remain in the existing CMS ingest pipeline.
const rasterMimes = new Set(['image/png','image/jpeg','image/webp','image/avif','image/gif']);
const compatibleMime = (declared,actual) => declared === actual || (rasterMimes.has(declared) && rasterMimes.has(actual)) || (['text/javascript','application/javascript'].includes(declared) && ['text/javascript','application/javascript'].includes(actual));
function transportMime(publicPath,bytes,declared) {
 const expected = assetMime(publicPath);
 if (declared !== undefined && !compatibleMime(expected,declared)) throw new Error('Delivery declared MIME differs from asset kind.');
 if (!rasterMimes.has(expected)) return declared ?? expected;
 // Existing immutable packages may contain JPEG bytes under a .png filename.
 // Preserve their authoring manifest and bytes; serve the verified actual type.
 if (bytes.length >= 8 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
 if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
 if (['GIF87a','GIF89a'].includes(bytes.toString('ascii',0,6))) return 'image/gif';
 if (bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP') return 'image/webp';
 if (bytes.toString('ascii',4,8) === 'ftyp') return 'image/avif';
 throw new Error('Delivery raster MIME does not match bytes.');
}
export function validateAssetBytes(asset, bytes) {
 if (!Buffer.isBuffer(bytes) || bytes.length !== asset.size || contentHash(bytes) !== asset.sha256) throw new Error('Delivery asset checksum or size mismatch.');
 const mime = asset.mime;
 const signatures = {
  'image/png': () => bytes.length >= 24 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString('ascii',12,16) === 'IHDR',
  'image/jpeg': () => bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
  'image/gif': () => bytes.length >= 10 && ['GIF87a','GIF89a'].includes(bytes.toString('ascii',0,6)),
  'image/webp': () => bytes.length >= 16 && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP',
  'image/avif': () => { if(bytes.length < 16 || bytes.toString('ascii',4,8) !== 'ftyp') return false; const length = bytes.readUInt32BE(0); if(length < 16 || length > bytes.length) return false; const brands = [bytes.toString('ascii',8,12)]; for(let i=16;i+4<=length;i+=4) brands.push(bytes.toString('ascii',i,i+4)); return brands.some(brand => brand === 'avif' || brand === 'avis'); },
  'font/woff': () => bytes.length >= 44 && bytes.toString('ascii',0,4) === 'wOFF',
  'font/woff2': () => bytes.length >= 48 && bytes.toString('ascii',0,4) === 'wOF2',
  'font/ttf': () => bytes.length >= 12 && bytes.readUInt32BE(0) === 0x00010000,
  'font/otf': () => bytes.length >= 12 && bytes.toString('ascii',0,4) === 'OTTO',
  'application/wasm': () => bytes.length >= 8 && bytes.subarray(0,8).equals(Buffer.from([0,97,115,109,1,0,0,0])),
 };
 if (signatures[mime]) { if (!signatures[mime]()) throw new Error('Delivery MIME does not match actual bytes.'); }
 else {
  const text = new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  if (text.includes(String.fromCharCode(0))) throw new Error('Delivery text asset contains binary data.');
  if (mime === 'image/svg+xml' && !/<svg(?:\s|>)/i.test(text)) throw new Error('Delivery SVG MIME does not match bytes.');
  if (mime === 'application/json') JSON.parse(text);
 }
}
export function validateAssetPath(value, slugs) {
 if (typeof value !== 'string' || /[\\%?#\u0000-\u0020\u007f]/.test(value) || !value.startsWith('/assets/projects/') || value.endsWith('/') || value.split('/').slice(1).some(part => !part || part === '.' || part === '..') || !slugs.some(slug => value.startsWith(`/assets/projects/${slug}/`))) throw new Error('Unsafe delivery asset path.');
 return value;
}
function externalDependencies(values) {
 if (!Array.isArray(values)) throw new Error('External dependencies must be an array.');
 return [...new Set(values.map(value => {
  if (typeof value !== 'string') throw new Error('Invalid external dependency.');
  const url = new URL(value), host = url.hostname.toLowerCase().replace(/\.+$/, '');
  if (url.protocol !== 'https:' || url.username || url.password || !host.includes('.') || host.includes(':') || /^(?:\d+\.){3}\d+$/.test(host) || /(?:\.localhost|\.local|\.internal)$/.test(host)) throw new Error('External dependency must be public HTTPS without credentials.');
  return url.href;
 }))].sort(compare);
}
export function validateRenderer(renderer) {
 exactObject(renderer, ['rendererId', 'contractVersion', 'capabilities'], 'Renderer');
 if (!digestPattern.test(renderer.rendererId) || renderer.contractVersion !== DELIVERY_VERSION) throw new Error('Incompatible renderer contract or identity.');
 if (!Array.isArray(renderer.capabilities) || new Set(renderer.capabilities).size !== renderer.capabilities.length || renderer.capabilities.some(cap => !DELIVERY_CAPABILITIES.includes(cap))) throw new Error('Unsupported renderer capabilities.');
 return renderer;
}
function normalize(value) {
 exactObject(value, ['contractVersion', 'contentId', 'capabilities', 'projects', 'assets', 'externalDependencies'], 'Delivery generation');
 if (value.contractVersion !== DELIVERY_VERSION || !Array.isArray(value.projects) || !Array.isArray(value.assets)) throw new Error('Unsupported delivery contract.');
 const projects = value.projects.map(validateProjectDocument).sort((a,b) => a.catalogOrder - b.catalogOrder || compare(a.slug,b.slug));
 const slugs = projects.map(project => project.slug);
 if (new Set(slugs).size !== slugs.length) throw new Error('Duplicate project slug.');
 const placements = projects.flatMap(project => project.homePlacement ? [project.homePlacement] : []);
 if (new Set(placements).size !== placements.length) throw new Error('Duplicate named home placement.');
 for (const project of projects) if (project.visibility !== 'published' || !project.redesign) throw new Error('Delivery requires published redesign documents.');
 const capabilities = ['project-v3','redesign-v1','scoped-assets-v1', ...(projects.length ? [...new Set(projects.map(p => 'hero-' + p.redesign.hero.kind))] : ['empty-collection'])].sort(compare);
 if (!Array.isArray(value.capabilities) || canonicalJSON([...value.capabilities].sort(compare)) !== canonicalJSON(capabilities)) throw new Error('Delivery capability declaration differs from documents.');
 const assets = value.assets.map(value => {
  const asset = exactObject(value, ['publicPath','sha256','size','mime'], 'Delivery asset');
  validateAssetPath(asset.publicPath, slugs);
  if (!digestPattern.test(asset.sha256) || !Number.isSafeInteger(asset.size) || asset.size < 1 || asset.size > 20*1024*1024) throw new Error('Invalid delivery asset checksum or size.');
  const expected = assetMime(asset.publicPath);
  if (!compatibleMime(expected,asset.mime)) throw new Error('Delivery asset MIME differs from path.');
  return {...asset};
 }).sort((a,b) => compare(a.publicPath,b.publicPath));
 const byPath = new Map(assets.map(asset => [asset.publicPath,asset]));
 if (byPath.size !== assets.length) throw new Error('Duplicate delivery asset path.');
 const required = new Set();
 for (const project of projects) {
  const closure = requiredAssets(project);
  for (const name of closure.paths) {
   required.add(name);
   if (!byPath.has(name)) throw new Error(`Missing delivery asset: ${name}`);
   validateAssetPath(name,[project.slug]);
  }
  for (const file of closure.manifests) {
   const asset = byPath.get(file.publicPath);
   if (asset.sha256 !== file.sha256 || asset.size !== file.size) throw new Error('Layout manifest differs from delivery manifest.');
  }
  if (project.redesign.hero.kind === 'layout') for (const scene of project.redesign.hero.scenes) if (scene.source.kind === 'package') for (const file of scene.source.files) if (!compatibleMime(file.mime,byPath.get(scene.source.assetBase + file.path).mime)) throw new Error('Package MIME differs from delivery manifest.');
 }
 if (assets.some(asset => !required.has(asset.publicPath))) throw new Error('Unreferenced asset cannot enter public delivery.');
 return {contractVersion:DELIVERY_VERSION,capabilities,projects,assets,externalDependencies:externalDependencies(value.externalDependencies)};
}
export function validateDeliveryGeneration(value, renderer) {
 const core = normalize(value);
 if (!digestPattern.test(value.contentId) || contentHash(canonicalJSON(core)) !== value.contentId) throw new Error('Delivery content digest mismatch.');
 validateRenderer(renderer);
 if (core.capabilities.some(cap => !renderer.capabilities.includes(cap))) throw new Error('Renderer does not support delivery capabilities.');
 return {...core,contentId:value.contentId};
}
export function createDeliveryGeneration({projects,assets,externalDependencies=[]},renderer) {
 if (!Array.isArray(assets) || !Array.isArray(projects)) throw new Error('Delivery inputs must be arrays.');
 const capabilities = ['project-v3','redesign-v1','scoped-assets-v1', ...(projects.length ? [...new Set(projects.map(p => 'hero-' + p.redesign?.hero.kind))] : ['empty-collection'])].sort(compare);
 const manifest = assets.map(asset => {
  if (!Buffer.isBuffer(asset.bytes) || contentHash(asset.bytes) !== asset.sha256) throw new Error('Delivery asset checksum mismatch.');
  return {publicPath:asset.publicPath,sha256:asset.sha256,size:asset.bytes.length,mime:transportMime(asset.publicPath,asset.bytes,asset.mime)};
 });
 const core = normalize({contractVersion:DELIVERY_VERSION,capabilities,projects,assets:manifest,externalDependencies});
 const byPath = new Map(assets.map(asset => [asset.publicPath,asset.bytes]));
 for (const asset of core.assets) validateAssetBytes(asset,byPath.get(asset.publicPath));
 validatePackageResources(core.projects,assets,core.externalDependencies);
 return validateDeliveryGeneration({...core,contentId:contentHash(canonicalJSON(core))},renderer);
}
export function validateActiveDescriptor(value) {
 exactObject(value,['contractVersion','contentId','rendererId','activationSeq'],'Active descriptor');
 if (value.contractVersion !== DELIVERY_VERSION || !digestPattern.test(value.contentId) || !digestPattern.test(value.rendererId) || !Number.isSafeInteger(value.activationSeq) || value.activationSeq < 0) throw new Error('Invalid active delivery descriptor.');
 return {...value};
}
