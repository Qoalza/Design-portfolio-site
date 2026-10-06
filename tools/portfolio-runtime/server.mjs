import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createReleaseHandler} from '../portfolio-release/release-host.mjs';
import {createGenerationReader} from '../portfolio-delivery/reader.mjs';
import {renderedProjects,canonicalAssetPath} from '../portfolio-delivery/asset-resolution.mjs';

export function createPortfolioHandler({siteRoot,contentRoot,renderer,portfolioBuildId,codeActivationSeq=0}) {
 if(!Number.isSafeInteger(codeActivationSeq)||codeActivationSeq<0)throw new Error('Invalid serving code activation sequence');
 const reader = createGenerationReader({root:contentRoot,renderer});
 const release = createReleaseHandler({root:siteRoot,readState:async () => {
  const active = await reader.readActive(),generation = active.generation;
  return {content:{version:1,revision:generation.contentId,rendererId:renderer.rendererId,projects:renderedProjects(generation)},contentAssets:generation.assets.map(a=>a.publicPath),readAsset:async pathname => {
   let handle = active,canonical = pathname;
   if (pathname.startsWith('/__content/')) {
    const match = /^\/__content\/([a-f0-9]{64})(\/assets\/projects\/.+)$/.exec(pathname);
    if (!match) return null;
    if (match[1] !== generation.contentId) {
     try {handle = await reader.readActivated(match[1]);} catch {return null;}
    }
    try {canonical = canonicalAssetPath(handle.generation,pathname);} catch {return null;}
   }
   let asset = handle.generation.assets.find(asset => asset.publicPath === canonical);
   if (!asset && !pathname.startsWith('/__content/')) {
    const alias = await reader.immutableAlias(canonical);
    if (alias) {handle = alias.handle;asset = alias.asset;}
   }
   if (!asset) return null;
   const content = await handle.readAsset(canonical);
   const packaged = handle.generation.projects.some(p=>p.redesign.hero.kind==='layout'&&p.redesign.hero.scenes.some(scene=>scene.source.kind==='package'&&scene.source.files.some(f=>scene.source.assetBase+f.path===canonical)));
   return {content,sha256:asset.sha256,mime:asset.mime,packaged};
  }};
 }});
 return async request => {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/__internal/')) {
   if (!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
   try {
    let contentId,activationSeq,contentRendererId;
    if (url.pathname === '/__internal/health') {const active=await reader.readActive({allowLastGood:false});contentId=active.generation.contentId;activationSeq=active.descriptor.activationSeq;contentRendererId=active.descriptor.rendererId;}
    else if (url.pathname === '/__internal/candidate') {const candidate=await reader.readGeneration(url.searchParams.get('contentId'));contentId=candidate.generation.contentId;}
    else return new Response(null,{status:404});
    return new Response(request.method==='HEAD'?null:JSON.stringify({portfolioBuildId,codeActivationSeq,rendererId:renderer.rendererId,contractVersion:renderer.contractVersion,contentId,activationSeq,contentRendererId}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
   } catch {return Response.json({portfolioBuildId,codeActivationSeq,rendererId:renderer.rendererId,error:'generation-unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
  }
  try {return await release(request);} catch {return new Response(null,{status:503,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
 };
}
export function createPortfolioServer(options) {
 const handle = createPortfolioHandler(options);
 return createServer(async (incoming,outgoing) => {
  try {
   const remote = incoming.socket.remoteAddress;
   if (remote !== '127.0.0.1' && remote !== '::1' && remote !== '::ffff:127.0.0.1') {outgoing.writeHead(403);outgoing.end();return;}
   // Production origin is fixed; incoming Host/credentials never influence DTOs.
   const request = new Request('https://art-des.ru' + incoming.url,{method:incoming.method,headers:incoming.headers});
   const response = await handle(request);
   outgoing.writeHead(response.status,Object.fromEntries(response.headers));
   if (!response.body) outgoing.end();
   else await pipeline(Readable.fromWeb(response.body),outgoing);
  } catch {
   if (!outgoing.headersSent) outgoing.writeHead(500,{'Cache-Control':'no-store'});
   outgoing.end();
  }
 });
}
