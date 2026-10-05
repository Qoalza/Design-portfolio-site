import {readFile,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {projectDetailForPath} from '../concept-v2/app/src/project-page/project-view-model.mjs';
import {layoutPackageCsp} from './layout-package-policy.mjs';
const origin='https://art-des.ru';
const mime={js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',html:'text/html; charset=utf-8',svg:'image/svg+xml',png:'image/png',webp:'image/webp',jpg:'image/jpeg',jpeg:'image/jpeg',avif:'image/avif',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',json:'application/json'};
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
async function safeRead(root,name){
 if(!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(name)||name.split('/').some(part=>!part||part==='.'||part==='..'))throw new Error('Unsafe site manifest path');
 let current=root;for(const part of name.split('/')){current=path.join(current,part);if((await lstat(current)).isSymbolicLink())throw new Error('Site manifest symlink');}
 return readFile(current);
}
async function loadSite(root){
 if((await lstat(root)).isSymbolicLink())throw new Error('Site root symlink');
 const manifest=JSON.parse(await safeRead(root,'site-manifest.json'));
 if(manifest.version!==1||!/^[a-f0-9]{40}$/.test(manifest.buildSha)||!manifest.pages?.['/']||!Array.isArray(manifest.files))throw new Error('Invalid site manifest');
 const files=new Map();for(const item of manifest.files){if(files.has('/'+item.path))throw new Error('Duplicate site manifest file');const bytes=await safeRead(root,item.path);if(bytes.length!==item.bytes||createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw new Error('Site manifest checksum mismatch');files.set('/'+item.path,{...item,content:bytes});}
 if(!files.has('/index.html'))throw new Error('Missing site manifest entry');
 return {manifest,files};
}
function htmlFor(site,pathname,status,content){
 const page=site.manifest.pages[pathname]??{title:'Страница не найдена — Product Designer',description:site.manifest.pages['/'].description};
 const title=escape(page.title),description=escape(page.description),url=origin+(status===404?'/404':pathname);
 const data=content?`<script id="portfolio-projects" type="application/json">${JSON.stringify(content).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')}</script>`:'';
 const tags=data+`<meta name="description" content="${description}"/><link rel="canonical" href="${url}"/><link rel="icon" href="/artur-designer-favicon.svg" type="image/svg+xml"/><meta property="og:type" content="website"/><meta property="og:locale" content="ru_RU"/><meta property="og:title" content="${title}"/><meta property="og:description" content="${description}"/><meta property="og:url" content="${url}"/><meta property="og:image" content="${origin}/artur-designer-social-preview.png"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${title}"/><meta name="twitter:description" content="${description}"/><meta name="twitter:image" content="${origin}/artur-designer-social-preview.png"/>${status===404?'<meta name="robots" content="noindex"/>':''}`;
 return site.files.get('/index.html').content.toString('utf8').replace('<html lang="ru">',`<html lang="ru" data-build-sha="${site.manifest.buildSha}"${/^[a-f0-9]{64}$/.test(site.manifest.snapshotSha256??'')?` data-content-sha256="${site.manifest.snapshotSha256}"`:""}>`).replace(/<title>[^<]*<\/title>/,`<title>${title}</title>`).replace('</head>',tags+'</head>');
}
/** @param {{root?: string, readContent?: () => Promise<{version: 1, revision: string, projects: import('../../src/lib/project-contract').ProjectDocument[]}>, readAsset?: (pathname: string) => Promise<{content: Buffer, sha256: string, mime?: string, packaged: boolean} | null>}} options */
export function createReleaseHandler({root=path.join(process.cwd(),'.portfolio-release/site'),readContent,readAsset}={}){
 let loading;
 return async request=>{
  if(request.method!=='GET'&&request.method!=='HEAD')return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
  const built=await (loading??=loadSite(root));
  const pathname=new URL(request.url).pathname;
  const head=request.method==='HEAD';
  const headers={'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache','Referrer-Policy':'strict-origin-when-cross-origin'};
  const respond=(body,status=200,extra={})=>new Response(head?null:body,{status,headers:{...headers,...extra}});
  const dynamicAsset=Boolean(readAsset&&(pathname.startsWith('/assets/projects/')||built.manifest.contentAssets?.includes(pathname)));
  const asset=dynamicAsset?await readAsset(pathname):built.files.get(pathname);
  if(dynamicAsset&&!asset)return respond(null,404);
  if(asset&&pathname!=='/index.html'){
   const packageType=dynamicAsset?(asset.packaged?asset.mime:undefined):built.manifest.packageFiles?.[pathname];
   const contentType=packageType??mime[pathname.split('.').at(-1)]??'application/octet-stream';
   const extra={'Content-Type':contentType,'Content-Length':String(asset.content.length),ETag:`"${asset.sha256}"`};
   if(packageType){extra['Access-Control-Allow-Origin']='*';extra['Referrer-Policy']='no-referrer';if(packageType==='text/html')extra['Content-Security-Policy']=layoutPackageCsp;}
   if(contentType==='image/svg+xml')extra['Content-Security-Policy']=layoutPackageCsp;
   if(request.headers.get('if-none-match')===extra.ETag){delete extra['Content-Length'];return respond(null,304,extra);}
   return respond(asset.content,200,extra);
  }
  const content=readContent?await readContent():undefined;
  if(content&&(content.version!==1||!Array.isArray(content.projects)||!/^[a-f0-9]{64}$/.test(content.revision)))throw new Error('Invalid published site content');
  const site=content?{...built,manifest:{...built.manifest,snapshotSha256:content.revision,pages:{'/':built.manifest.pages['/'],...Object.fromEntries(content.projects.filter(project=>projectDetailForPath([project],'/projects/'+project.slug)).map(project=>['/projects/'+project.slug,{title:project.title+' — Product Designer',description:project.description}]))}}}:built;
  if(pathname==='/projects')return respond(null,307,{Location:'/#projects'});
  if(pathname==='/robots.txt')return respond(`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,200,{'Content-Type':'text/plain; charset=utf-8'});
  if(pathname==='/sitemap.xml')return respond('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+Object.keys(site.manifest.pages).map(url=>`<url><loc>${origin}${url}</loc></url>`).join('')+'</urlset>',200,{'Content-Type':'application/xml; charset=utf-8'});
  const status=Object.hasOwn(site.manifest.pages,pathname)?200:404;
  const html=htmlFor(site,pathname,status,content);
  return respond(html,status,{'Content-Type':'text/html; charset=utf-8','Content-Length':String(Buffer.byteLength(html)),...(status===404?{'X-Robots-Tag':'noindex'}:{})});
 };
}
