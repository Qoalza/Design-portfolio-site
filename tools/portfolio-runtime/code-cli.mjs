import path from 'node:path';import {fileURLToPath} from 'node:url';
import {readJSON} from '../portfolio-delivery/durable-store.mjs';import {exactObject} from '../portfolio-delivery/contract.mjs';
import {createCodeController} from './code-controller.mjs';import {createServiceAdapter} from './service-adapter.mjs';
export async function runCodeCLI(args){
 const [configFile,action,target]=args;if(args.length!==3||!configFile||!path.isAbsolute(configFile)||!['state','apply'].includes(action))throw new Error('Use <absolute-config.json> state <portfolio|cms> or apply <absolute-intent.json>');
 const config=await readJSON(configFile,32768);exactObject(config,['version','dataRoot','publicRoot','files','services'],'Code controller configuration');exactObject(config.files,['portfolio','cms'],'Code descriptor paths');exactObject(config.services,['portfolio','cms'],'Managed services');if(config.version!==1)throw new Error('Unknown controller configuration');
 const adapters=Object.fromEntries(['portfolio','cms'].map(app=>[app,createServiceAdapter({app,config:config.services[app]})]));
 const controller=createCodeController({privateRoot:path.join(config.dataRoot,'delivery'),dataRoot:config.dataRoot,publicRoot:config.publicRoot,files:config.files,adapters});
 if(action==='state'){if(!['portfolio','cms'].includes(target))throw new Error('Unknown code application');return controller.state(target);}
 if(!target||!path.isAbsolute(target))throw new Error('Explicit absolute code intent required');return controller.apply(await readJSON(target,65536));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))runCodeCLI(process.argv.slice(2)).then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error.message);process.exitCode=1;});
