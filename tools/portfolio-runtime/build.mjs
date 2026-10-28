import {readFile,writeFile,mkdir,rm,readdir,lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {build as viteBuild} from '../concept-v2/app/node_modules/vite/dist/node/index.js';
import react from '../concept-v2/app/node_modules/@vitejs/plugin-react/dist/index.js';
import {earlyPreloaderPlugin} from '../concept-v2/app/early-preloader-vite.mjs';
import {startupModulePlugin} from '../concept-v2/app/startup-module-vite.mjs';
import {boffProject} from '../concept-v2/app/src/project-page/boff-content.mjs';
import {build as bundle} from 'esbuild';
import {heroShellAssets} from '../portfolio-release/release-host.mjs';
import {socialPreviewPublicFiles} from '../portfolio-release/social-preview.mjs';
import {DELIVERY_CAPABILITIES,DELIVERY_VERSION,contentHash,canonicalJSON} from '../portfolio-delivery/contract.mjs';
import {artifactFiles,verifyPortfolioArtifact} from './artifact.mjs';
const exec=promisify(execFile),repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const appRoot=path.join(repoRoot,'tools/concept-v2/app');
export const previewPlaceholder='/api/preview-artifacts/'+'0'.repeat(64)+'/';
async function shellAssets(sha) {
 const prefix='tools/concept-v2/app/public/';
 const {stdout}=await exec('git',['ls-tree','-r','--name-only',sha,'--',prefix+'figma',prefix+'fonts',prefix+'cursors',prefix+'assets'],{cwd:repoRoot});
 const names=stdout.trim().split('\n').filter(file=>file&&(!file.startsWith(prefix+'assets/')||/^assets\/[^/]+\.svg$/.test(file.slice(prefix.length))||heroShellAssets.has('/'+file.slice(prefix.length))));
 names.push('public/artur-designer-favicon.svg','public/artur-designer-social-preview.png',...socialPreviewPublicFiles);
 const assets=[];
 for(const file of names){const {stdout:bytes}=await exec('git',['show',sha+':'+file],{cwd:repoRoot,encoding:'buffer',maxBuffer:32*1024*1024});assets.push({name:file.startsWith(prefix)?file.slice(prefix.length):file.slice(7),bytes});}
 return assets;
}
function shellPlugin(base) {
 const virtual='virtual:project-documents';
 return {name:'content-independent-portfolio',enforce:'pre',resolveId(id){if(id===virtual)return '\0'+virtual;},load(id){if(id==='\0'+virtual)return 'export default [];';},
 transformIndexHtml:{order:'pre',handler:html=>html.replace('/src/main.jsx','/src/main-release.jsx')},
 transform(code,id){
  if(!base||!id.startsWith(path.join(appRoot,'src/')))return;
  if(id===path.join(appRoot,'src/main-release.jsx')){
   const marker="const pathname=location.pathname.replace(/\\/$/,'')||'/';";
   if(!code.includes(marker))throw new Error('Preview entry source changed');
   code=code.replace(marker,`const pathname=('/'+location.pathname.slice(${JSON.stringify(base)}.length)).replace(/\\/$/,'')||'/';`);
  }
  const pattern=id===path.join(appRoot,'src/main-release.jsx')?/(["'`(])\/(assets|figma|fonts|cursors)\//g:/(["'`(])\/(assets|figma|fonts|cursors|projects)\//g;
  return {code:code.replace(pattern,`$1${base}$2/`),map:null};
 }};
}
async function inventory(root) {
 const files=await artifactFiles(path.dirname(root));
 const prefix=path.basename(root)+'/';
 return files.filter(file=>file.path.startsWith(prefix)).map(file=>({path:file.path.slice(prefix.length),size:file.size,sha256:file.sha256}));
}
export async function buildPortfolio({output=path.join(repoRoot,'.portfolio-release/portfolio')}={}) {
 output=path.resolve(output);
 const generated=path.join(repoRoot,'.portfolio-release')+path.sep;
 if (!output.startsWith(generated) && !output.startsWith('/private/tmp/')) throw new Error('Portfolio build requires a generated or disposable output directory');
 const existing=await lstat(output).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
 if(existing){
  if(!existing.isDirectory()||existing.isSymbolicLink())throw new Error('Build output must be a real directory');
  if((await readdir(output)).some(name=>!['site','preview','ops','server.mjs','release-manifest.json'].includes(name)))throw new Error('Build output contains unrelated files');
 }
 const {stdout:head}=await exec('git',['rev-parse','HEAD'],{cwd:repoRoot}),sha=head.trim();
 const {stdout:dirty}=await exec('git',['status','--porcelain','--untracked-files=normal','--','.',':!USERSPACE'],{cwd:repoRoot});
 const {stdout:names}=await exec('git',['ls-files','--','tools/concept-v2/app/src','tools/concept-v2/app/vendor','tools/concept-v2/app/index.html','tools/concept-v2/app/early-preloader-vite.mjs','tools/concept-v2/app/startup-module-vite.mjs','tools/concept-v2/process-icons','tools/concept-v2/app/package-lock.json','src/lib/project-image-source.mjs','tools/portfolio-runtime/build.mjs'],{cwd:repoRoot});
 const inputs=names.trim().split('\n').filter(Boolean);
 if(!inputs.includes('tools/portfolio-runtime/build.mjs'))inputs.push('tools/portfolio-runtime/build.mjs');
 const rendererInputs=[];for(const name of inputs.sort()){rendererInputs.push([name,contentHash(await readFile(path.join(repoRoot,name)))]);}
 const resources=await shellAssets(sha);
 const rendererId=contentHash(canonicalJSON({inputs:rendererInputs,resources:resources.map(a=>[a.name,contentHash(a.bytes)]),contractVersion:DELIVERY_VERSION,capabilities:DELIVERY_CAPABILITIES}));
 const renderer={rendererId,contractVersion:DELIVERY_VERSION,capabilities:DELIVERY_CAPABILITIES};
 // Build writes only generated code. It never imports a CMS config, exporter or content snapshot.
 await mkdir(output,{recursive:true});
 for(const name of ['site','preview']){
  const target=path.join(output,name),base=name==='preview'?previewPlaceholder:undefined;
  await viteBuild({root:appRoot,configFile:false,mode:'production-runtime',base:base||'/',publicDir:false,plugins:[shellPlugin(base),react(),startupModulePlugin({release:true}),earlyPreloaderPlugin()],build:{outDir:target,emptyOutDir:true},logLevel:'warn'});
  for(const resource of resources){const file=path.join(target,resource.name);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,resource.bytes);}
  const files=await inventory(target);
  if(name==='site')await writeFile(path.join(target,'site-manifest.json'),JSON.stringify({version:1,buildSha:sha,pages:{'/':{title:'Артур — Product Designer',description:'Портфолио продуктового дизайнера: B2B, B2E, SaaS и сложные внутренние системы.'},'/projects/boff':{title:boffProject.title+' — Product Designer',description:boffProject.description}},contentAssets:[],files:files.map(f=>({path:f.path,bytes:f.size,sha256:f.sha256}))}));
  else await writeFile(path.join(target,'preview-manifest.json'),JSON.stringify({version:1,rendererId,base:previewPlaceholder,contentAssets:[],files}));
 }
 await bundle({entryPoints:[path.join(repoRoot,'tools/portfolio-runtime/start.mjs')],bundle:true,platform:'node',target:'node22',format:'esm',outfile:path.join(output,'server.mjs'),sourcemap:false});
 await bundle({entryPoints:[path.join(repoRoot,'tools/portfolio-runtime/active-start.mjs')],bundle:true,platform:'node',target:'node22',format:'esm',outfile:path.join(output,'ops/active-start.mjs'),sourcemap:false});
 await bundle({entryPoints:[path.join(repoRoot,'tools/portfolio-runtime/code-cli.mjs')],bundle:true,platform:'node',target:'node22',format:'esm',outfile:path.join(output,'ops/code-cli.mjs'),sourcemap:false});
 await rm(path.join(output,'release-manifest.json'),{force:true});
 const files=await artifactFiles(output),portfolioBuildId={sourceSha:sha,artifactSha256:contentHash(canonicalJSON({files,renderer}))};
 const manifest={version:1,portfolioBuildId,renderer,sourceDirty:Boolean(dirty.trim()),files};
 await writeFile(path.join(output,'release-manifest.json'),JSON.stringify(manifest));
 await verifyPortfolioArtifact(output);
 console.log(`Built independent public + preview renderer ${rendererId}; ${files.length} code files; no content snapshot`);
 return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))buildPortfolio({output:process.argv[2]?path.resolve(process.argv[2]):undefined}).catch(error=>{console.error(error.message);process.exitCode=1;});
