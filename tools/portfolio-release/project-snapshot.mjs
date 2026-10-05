import { createHash } from 'node:crypto';
import path from 'node:path';
import { projectImageSource } from '../../src/lib/project-image-source.mjs';
import { validateProjectDocument } from '../../src/lib/project-contract.ts';
const digestPattern=/^[a-f0-9]{64}$/;
const shaPattern=/^[a-f0-9]{40}$/;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function object(value, keys, at) {
 if(!value || typeof value!=='object' || Array.isArray(value))throw new Error(`${at} must be an object.`);
 for(const key of Object.keys(value))if(!keys.includes(key))throw new Error(`${at} contains unknown field ${key}.`);
 return value;
}
function publicPath(value, slugs) {
 if(typeof value!=='string' || /[\\%?#\u0000-\u0020\u007f]/.test(value) || path.posix.normalize(value)!==value || value.endsWith('/') || !slugs.some(slug=>value.startsWith(`/assets/projects/${slug}/`)))throw new Error('Unsafe public asset path.');
 return value;
}
export function requiredAssets(project) {
 const paths=new Set();
 function visit(value){
  if(!value || typeof value!=='object')return;
  if(typeof value.src==='string'){
   paths.add(value.src);
   for(const source of projectImageSource(value).sources)for(const rendition of source.srcSet.split(','))paths.add(rendition.trim().split(/\s+/)[0]);
  }
  for(const child of Object.values(value))if(child && typeof child==='object')visit(child);
 }
 visit(project.redesign);visit(project.logo);
 if(project.logo?.type==='layered')for(const layer of project.logo.layers)if(layer.slot!=='d')paths.add(layer.src.replace('radio-logo-vector-','radio-logo-mask-'));
 const manifests=[];
 if(project.redesign.hero.kind==='layout')for(const scene of project.redesign.hero.scenes)if(scene.source.kind==='package')for(const file of scene.source.files){
  const entry={publicPath:scene.source.assetBase+file.path,sha256:file.sha256,size:file.size};paths.add(entry.publicPath);manifests.push(entry);
 }
 return {paths,manifests};
}
// Pure boundary shared by approved-code export and the forthcoming Payload exporter.
// Portability covers redesign + logo + their prepared renditions. Legacy v3 surfaces
// remain in documents for schema compatibility, but are not release renderer inputs.
// It contains public documents and file checksums, never local storage paths or auth data.
export function validateProjectSnapshot(value) {
 const input=object(value,['version','projects','assets','provenance'],'Project snapshot');
 if(input.version!==1 || !Array.isArray(input.projects) || input.projects.length===0 || !Array.isArray(input.assets))throw new Error('Unsupported or empty project snapshot.');
 const projects=input.projects.map(validateProjectDocument),slugs=projects.map(p=>p.slug);
 if(new Set(slugs).size!==slugs.length)throw new Error('Duplicate project slug.');
 for(const project of projects)if(project.visibility!=='published' || !project.redesign || !project.detailAvailable)throw new Error('Snapshot requires published redesign project pages.');
 const assets=input.assets.map(value=>{
  const asset=object(value,['publicPath','sha256','size'],'Snapshot asset');
  if(!digestPattern.test(asset.sha256) || !Number.isSafeInteger(asset.size) || asset.size<0 || asset.size>20*1024*1024)throw new Error('Invalid asset checksum or size.');
  return {publicPath:publicPath(asset.publicPath,slugs),sha256:asset.sha256,size:asset.size};
 }).sort((a,b)=>a.publicPath.localeCompare(b.publicPath));
 const byPath=new Map(assets.map(a=>[a.publicPath,a]));
 if(byPath.size!==assets.length)throw new Error('Duplicate public asset path.');
 for(const project of projects){
  const {paths,manifests}=requiredAssets(project);
  for(const src of paths)if(!byPath.has(src))throw new Error(`Missing project asset: ${src}`);
  for(const file of manifests){const actual=byPath.get(file.publicPath);if(actual.sha256!==file.sha256 || actual.size!==file.size)throw new Error(`Layout manifest mismatch: ${file.publicPath}`);}
 }
 const source=object(input.provenance,['origin','sourceSha','files','externalDependencies','publicationId'],'Snapshot provenance');
 if(source.origin!=='approved-git-code' && source.origin!=='payload-published')throw new Error('Unknown snapshot origin.');
 if((source.origin==='approved-git-code' || source.sourceSha!==undefined) && !shaPattern.test(source.sourceSha))throw new Error('Invalid source SHA.');
 if(source.origin==='payload-published' && (typeof source.publicationId!=='string' || !source.publicationId.trim()))throw new Error('Missing Payload publication identifier.');
 if(source.files!==undefined){
  if(!Array.isArray(source.files))throw new Error('Invalid source provenance files.');
  for(const value of source.files){
   const file=object(value,['path','sha256'],'Provenance file');
   if(typeof file.path!=='string' || /[:\\\\%?#\u0000-\u001f\u007f]/.test(file.path) || file.path.startsWith('/') || file.path.split('/').some(part=>!part || part==='.' || part==='..') || !digestPattern.test(file.sha256))throw new Error('Invalid relative source provenance path or checksum.');
  }
 }
 if(source.externalDependencies!==undefined){
  if(!Array.isArray(source.externalDependencies))throw new Error('Invalid external dependencies.');
  for(const value of source.externalDependencies){
   let url;try{url=new URL(value);}catch{throw new Error('Invalid external dependency URL.');}
   const host=url.hostname.toLowerCase().replace(/\.+$/,'');
   if(url.protocol!=='https:' || url.username || url.password || !host.includes('.') || /^(?:\d+\.){3}\d+$/.test(host) || /(?:\.localhost|\.local|\.internal)$/.test(host))throw new Error('External dependency must be public HTTPS without credentials.');
  }
 }
 return {version:1,projects,assets,provenance:structuredClone(source)};
}
export function createProjectSnapshot({projects,assets,provenance}) {
 if(!Array.isArray(assets))throw new Error('Assets must be an array.');
 const manifest=assets.map(asset=>{
  if(!Buffer.isBuffer(asset.bytes) || hash(asset.bytes)!==asset.sha256)throw new Error(`Asset checksum mismatch: ${asset.publicPath}`);
  return {publicPath:asset.publicPath,sha256:asset.sha256,size:asset.bytes.length};
 });
 const snapshot=validateProjectSnapshot({version:1,projects,assets:manifest,provenance});
 const byPath=new Map(assets.map(a=>[a.publicPath,a]));
 for(const project of snapshot.projects)if(project.redesign.hero.kind==='layout'){
  const inspected=new Set();
  for(const scene of project.redesign.hero.scenes)if(scene.source.kind==='package'){
   const source=scene.source,base='https://package.example'+source.assetBase;
   for(const file of source.files){
    const publicName=source.assetBase+file.path;
    if(inspected.has(publicName) || !['text/html','text/css'].includes(file.mime))continue;
    inspected.add(publicName);
    const text=byPath.get(publicName).bytes.toString('utf8'),references=[];
    if(file.mime==='text/html'){
     for(const match of text.matchAll(/(?:src|href|poster)\s*=\s*(?:"([^"<>]*)"|'([^'<>]*)'|([^\s<>"']+))/gi))references.push(match[1]??match[2]??match[3]);
     for(const match of text.matchAll(/srcset\s*=\s*(?:"([^"<>]*)"|'([^'<>]*)')/gi))for(const part of (match[1]??match[2]).split(','))references.push(part.trim().split(/\s+/)[0]);
    }
    for(const match of text.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/gi))references.push(match[1]);
    for(const match of text.matchAll(/@import\s+['"]([^'"]+)['"]/gi))references.push(match[1]);
    for(const reference of references){
     if(!reference || reference.startsWith('#') || reference.startsWith('data:'))continue;
     const target=new URL(reference,base+file.path);
     if(target.origin!=='https://package.example'){
      if(!snapshot.provenance.externalDependencies?.includes(target.href))throw new Error(`Undeclared external package resource: ${target.href}`);
      continue;
     }
     if(!target.pathname.startsWith(source.assetBase) || !source.files.some(f=>source.assetBase+f.path===target.pathname) || !byPath.has(target.pathname))throw new Error(`Missing package dependency: ${reference} in ${file.path}`);
    }
   }
  }
 }
 return snapshot;
}
