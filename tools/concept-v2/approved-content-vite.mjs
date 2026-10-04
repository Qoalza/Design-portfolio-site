import {layoutPackageCsp as packageCsp} from '../portfolio-release/layout-package-policy.mjs';
import {readSnapshotDirectory} from '../portfolio-release/snapshot-directory.mjs';
import {createProjectSnapshot} from '../portfolio-release/project-snapshot.mjs';
import {exportApprovedRedesign} from './export-approved-content.mjs';
import {validateProjectDocument} from '../../src/lib/project-contract.ts';

const moduleId='virtual:project-documents',resolvedId='\0'+moduleId;
const contentTypes={png:'image/png',webp:'image/webp',avif:'image/avif',svg:'image/svg+xml',css:'text/css',html:'text/html',js:'text/javascript',mjs:'text/javascript',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf'};
// This policy applies only to manifest-listed layout packages, never Admin/API or the portfolio.
// The accepted Corvo source imports Manrope from these two existing font hosts.
export function createApprovedAssetMiddleware(prepared){
 const assets=new Map(prepared.assets.map(asset=>[asset.publicPath,asset]));
 const packages=prepared.projects.flatMap(project=>project.redesign?.hero.kind==='layout'?project.redesign.hero.scenes.filter(scene=>scene.source.kind==='package').map(scene=>scene.source):[]);
 const packageBases=[...new Set(packages.map(source=>source.assetBase))];
 const packageFiles=new Map(packages.flatMap(source=>source.files.map(file=>[source.assetBase+file.path,file])));
 return (req,res,next)=>{
  const pathname=req.url?.split('?')[0],asset=assets.get(pathname);
  const isPackage=packageBases.some(base=>pathname?.startsWith(base));
  if(!asset&&!isPackage)return next();
  if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end();}
  if(!asset||(isPackage&&!packageFiles.has(pathname))){res.statusCode=404;res.setHeader('Content-Type','text/plain');return res.end(req.method==='HEAD'?undefined:'Not found');}
  const type=packageFiles.get(pathname)?.mime??contentTypes[asset.publicPath.split('.').at(-1)]??'application/octet-stream';
  res.setHeader('Content-Type',type);
  res.setHeader('Content-Length',asset.bytes.length);
  res.setHeader('Cache-Control','no-cache');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(isPackage){
   res.setHeader('Access-Control-Allow-Origin','*');
   res.setHeader('Referrer-Policy','no-referrer');
   if(type==='text/html')res.setHeader('Content-Security-Policy',packageCsp);
  }
  res.end(req.method==='HEAD'?undefined:asset.bytes);
 };
}
// Development/build bridge for accepted code-origin content. The release host supplies validated canonical/preview documents separately.
export function approvedContentPlugin({repoRoot,loadDocuments}){
 let prepared;
 const prepare=async()=>{if(!prepared){prepared=process.env.PORTFOLIO_PROJECT_SNAPSHOT?await readSnapshotDirectory(process.env.PORTFOLIO_PROJECT_SNAPSHOT):await exportApprovedRedesign({repoRoot});createProjectSnapshot(prepared);}return prepared;};
 return {
  name:'approved-project-content',
  resolveId(id){if(id===moduleId)return resolvedId;},
  async load(id){if(id!==resolvedId)return;const result=await prepare();const documents=loadDocuments?await loadDocuments():result.projects;return `export default ${JSON.stringify(documents.map(validateProjectDocument))};`;},
  async configureServer(server){server.middlewares.use(createApprovedAssetMiddleware(await prepare()));},
  async generateBundle(){const result=await prepare();for(const asset of result.assets){this.emitFile({type:'asset',fileName:asset.publicPath.slice(1),source:asset.bytes});}},
 };
}
