import {readFile,writeFile,mkdir,readdir,lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {build} from '../../../concept-v2/app/node_modules/vite/dist/node/index.js';
import react from '../../../concept-v2/app/node_modules/@vitejs/plugin-react/dist/index.js';
import {requiredAssets} from '../../../portfolio-release/project-snapshot.mjs';
import {validateProjectDocument} from '../../../../src/lib/project-contract.ts';
import {exportApprovedRedesign} from '../../../concept-v2/export-approved-content.mjs';
const exec=promisify(execFile);
const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..');
const appRoot=path.join(repoRoot,'tools/concept-v2/app');
const virtual='virtual:project-documents',resolved='\0'+virtual;
export function scopeValue(value,base){
 if(typeof value==='string')return /^\/(assets|figma|fonts|cursors|projects)(\/|$)/.test(value)?base+value.slice(1):value;
 if(Array.isArray(value))return value.map(item=>scopeValue(item,base));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,scopeValue(item,base)]));
 return value;
}
export async function compilePreview({inputFile,output,base}){
 if(!/^\/api\/preview-artifacts\/[a-f0-9]{64}\/$/.test(base))throw new Error('Invalid preview namespace');
 const input=JSON.parse(await readFile(inputFile,'utf8'));
 if(input.version!==1||!Array.isArray(input.projects)||!Array.isArray(input.assets))throw new Error('Invalid private preview input');
 const documents=input.projects.map(validateProjectDocument);
 const assets=input.assets.map(asset=>{
  if(!/^\/(assets|figma)\/[a-zA-Z0-9_./-]+$/.test(asset.publicPath)||asset.publicPath.split('/').includes('..'))throw new Error('Invalid preview asset path');
  const bytes=Buffer.from(asset.base64,'base64');
  if(createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw new Error('Preview asset digest mismatch');
  return {...asset,bytes};
 });
 if(new Set(assets.map(asset=>asset.publicPath)).size!==assets.length)throw new Error('Duplicate preview asset');
 const byPath=new Map(assets.map(asset=>[asset.publicPath,asset]));
 for(const document of documents){const closure=requiredAssets(document);for(const name of closure.paths)if(!byPath.has(name))throw new Error('Missing preview asset');for(const entry of closure.manifests){const asset=byPath.get(entry.publicPath);if(!asset||asset.sha256!==entry.sha256||asset.bytes.length!==entry.size)throw new Error('Preview package mismatch');}}

 const plugin={name:'private-payload-preview',enforce:'pre',resolveId(id){if(id===virtual)return resolved;},load(id){if(id===resolved)return `export default ${JSON.stringify(scopeValue(documents,base))};`;},
  transformIndexHtml:{order:'pre',handler:html=>html.replace('/src/main.jsx','/src/main-release.jsx')},
  transform(code,id){
   if(id===path.join(appRoot,'src/main-release.jsx')){
    const marker="const pathname=location.pathname.replace(/\\/$/,'')||'/';";
    if(!code.includes(marker))throw new Error('Preview entry source changed');
    code=code.replace(marker,`const pathname=('/'+location.pathname.slice(${JSON.stringify(base)}.length)).replace(/\\/$/,'')||'/';`);
   }
   if(id===path.join(repoRoot,'src/lib/project-image-source.mjs'))code=code.replace('.test(image.src)',`.test(image.src.startsWith(${JSON.stringify(base)})?'/'+image.src.slice(${base.length}):image.src)`);
   if(id.startsWith(path.join(appRoot,'src/'))){
    const pattern=id===path.join(appRoot,'src/main-release.jsx')?/(["'`(])\/(assets|figma|fonts|cursors)\//g:/(["'`(])\/(assets|figma|fonts|cursors|projects)\//g;
    code=code.replace(pattern,`$1${base}$2/`);
   }
   return {code,map:null};
  },
  generateBundle(){for(const asset of assets)this.emitFile({type:'asset',fileName:asset.publicPath.slice(1),source:asset.bytes});}
 };
 await build({root:appRoot,configFile:false,base,publicDir:false,plugins:[react(),plugin],build:{outDir:output,emptyOutDir:true},logLevel:'error'});
 // Only approved immutable shell resources, never the entire local public directory.
 const approved=await exportApprovedRedesign({repoRoot});
 const sha=approved.provenance.sourceSha,prefix='tools/concept-v2/app/public/';
 const {stdout:names}=await exec('git',['ls-tree','-r','--name-only',sha,'--',prefix+'figma',prefix+'fonts',prefix+'cursors',prefix+'assets'],{cwd:repoRoot});
 for(const file of names.trim().split('\n').filter(file=>file&&(!file.startsWith(prefix+'assets/')||/^assets\/[^/]+\.svg$/.test(file.slice(prefix.length))||file.startsWith(prefix+'assets/projects/corvo/responsive-hero/')))){
  const {stdout:bytes}=await exec('git',['show',`${sha}:${file}`],{cwd:repoRoot,encoding:'buffer',maxBuffer:32*1024*1024});
  const target=path.join(output,file.slice(prefix.length));await mkdir(path.dirname(target),{recursive:true});await writeFile(target,bytes);
 }
 const files=[];
 async function scan(directory){for(const entry of await readdir(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if((await lstat(file)).isSymbolicLink())throw new Error('Preview symlink');if(entry.isDirectory())await scan(file);else if(entry.isFile()){const bytes=await readFile(file);files.push({path:path.relative(output,file).split(path.sep).join('/'),size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}else throw new Error('Unsupported preview entry');}}
 await scan(output);
 const packageFiles=Object.fromEntries(documents.flatMap(project=>project.redesign?.hero.kind==='layout'?project.redesign.hero.scenes.flatMap(scene=>scene.source.kind==='package'?scene.source.files.map(file=>[scene.source.assetBase.slice(1)+file.path,file.mime]):[]):[]));
 const manifest={version:1,revision:input.revision,source:input.source,base,contentAssets:assets.map(asset=>asset.publicPath),files:files.sort((a,b)=>a.path.localeCompare(b.path)),packageFiles};
 await writeFile(path.join(output,'preview-manifest.json'),JSON.stringify(manifest));
 return manifest;
}
