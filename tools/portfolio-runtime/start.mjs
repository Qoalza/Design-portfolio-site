import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createPortfolioServer} from './server.mjs';
import {verifyPortfolioArtifact} from './artifact.mjs';
export async function startPortfolio({root=path.dirname(fileURLToPath(import.meta.url)),contentRoot=process.env.PORTFOLIO_CONTENT_ROOT,codeActivationSeq=0,port=Number(process.env.PORTFOLIO_PORT||3101)}={}) {
 if(!contentRoot||!path.isAbsolute(contentRoot)||!Number.isInteger(port)||port<1||port>65535)throw new Error('Explicit content root and valid loopback port are required');
 const manifest=await verifyPortfolioArtifact(root);
 const server=createPortfolioServer({siteRoot:path.join(root,'site'),contentRoot,renderer:manifest.renderer,portfolioBuildId:manifest.portfolioBuildId,codeActivationSeq});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 const stop=()=>{const timeout=setTimeout(()=>server.closeAllConnections(),10000);timeout.unref();server.close(()=>{clearTimeout(timeout);});};
 process.once('SIGTERM',stop);process.once('SIGINT',stop);
 console.log('Portfolio started on loopback; build '+manifest.portfolioBuildId.sourceSha+'; renderer '+manifest.renderer.rendererId);
 return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))startPortfolio().catch(error=>{console.error(error.message);process.exitCode=1;});
