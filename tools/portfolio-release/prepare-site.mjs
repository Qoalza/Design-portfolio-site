import {readFile,writeFile,mkdir,readdir,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {build} from '../concept-v2/app/node_modules/vite/dist/node/index.js';
import {exportApprovedRedesign} from '../concept-v2/export-approved-content.mjs';
import {selectReleaseContent} from './content-source.mjs';
import {createPortfolioViteConfig} from '../concept-v2/app/vite.config.js';
const exec=promisify(execFile);
const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const siteRoot=path.join(repoRoot,'.portfolio-release/site');
// Select once; all Vite consumers receive these validated immutable bytes.
const {prepared,snapshotBytes,snapshotSha256}=await selectReleaseContent({repoRoot,kind:process.env.PORTFOLIO_RELEASE_CONTENT||'approved-git-code',directory:process.env.PORTFOLIO_PROJECT_SNAPSHOT,expectedInputHash:process.env.PORTFOLIO_RELEASE_SNAPSHOT_SHA256});
const approvedSourceSha=(await exportApprovedRedesign({repoRoot})).provenance.sourceSha;
const {stdout:head}=await exec('git',['rev-parse','HEAD'],{cwd:repoRoot});
const buildSha=head.trim();if(!/^[a-f0-9]{40}$/.test(buildSha))throw new Error('Full build SHA required');
const {stdout:status}=await exec('git',['status','--porcelain','--untracked-files=normal','--','.',':!USERSPACE'],{cwd:repoRoot});
const sourceDirty=Boolean(status.trim());
await build({...createPortfolioViteConfig({mode:'production-release',preparedInput:prepared}),root:path.join(repoRoot,'tools/concept-v2/app'),configFile:false,mode:'production-release',publicDir:false,build:{outDir:siteRoot,emptyOutDir:true}});
const sourcePrefix='tools/concept-v2/app/public/';
const {stdout:names}=await exec('git',['ls-tree','-r','--name-only',approvedSourceSha,'--',sourcePrefix+'figma',sourcePrefix+'fonts',sourcePrefix+'cursors',sourcePrefix+'assets'],{cwd:repoRoot});
const extras=[...names.trim().split('\n').filter(file=>file&&(!file.startsWith(sourcePrefix+'assets/')||/^assets\/[^/]+\.svg$/.test(file.slice(sourcePrefix.length))||file.startsWith(sourcePrefix+'assets/projects/corvo/responsive-hero/'))),'public/artur-designer-favicon.svg','public/artur-designer-social-preview.png'];
for(const file of extras){
 const {stdout:bytes}=await exec('git',['show',`${approvedSourceSha}:${file}`],{cwd:repoRoot,encoding:'buffer',maxBuffer:32*1024*1024});
 const output=file.startsWith(sourcePrefix)?file.slice(sourcePrefix.length):file.slice('public/'.length);
 await mkdir(path.dirname(path.join(siteRoot,output)),{recursive:true});await writeFile(path.join(siteRoot,output),bytes);
}
const files=[];
async function inventory(directory=siteRoot){for(const entry of await readdir(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if((await lstat(file)).isSymbolicLink())throw new Error('Site cannot contain symlinks');if(entry.isDirectory())await inventory(file);else if(entry.isFile()){const bytes=await readFile(file);files.push({path:path.relative(siteRoot,file).split(path.sep).join('/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}else throw new Error('Unsupported site entry');}}
await inventory();
// Bootstrap payload is bundled privately, outside public host manifest.
await writeFile(path.join(siteRoot,'snapshot.json'),snapshotBytes);
files.sort((a,b)=>a.path.localeCompare(b.path));
const pages={'/':{title:'Артур — Product Designer',description:'Портфолио продуктового дизайнера: B2B, B2E, SaaS и сложные внутренние системы.'}};
for(const project of prepared.projects)pages[`/projects/${project.slug}`]={title:`${project.title} — Product Designer`,description:project.description};
const packageFiles=Object.fromEntries(prepared.projects.flatMap(project=>project.redesign.hero.kind==='layout'?project.redesign.hero.scenes.flatMap(scene=>scene.source.kind==='package'?scene.source.files.map(file=>[scene.source.assetBase+file.path,file.mime]):[]):[]));
await writeFile(path.join(siteRoot,'site-manifest.json'),JSON.stringify({version:1,buildSha,sourceDirty,approvedSourceSha:approvedSourceSha,provenance:prepared.provenance,snapshotSha256,pages,packageFiles,contentAssets:prepared.assets.map(asset=>asset.publicPath),files},null,2)+'\n');
console.log(`Prepared selected release site: ${files.length} files; SHA ${buildSha}; ${sourceDirty?'scratch build (not publishable)':'clean source'}`);
