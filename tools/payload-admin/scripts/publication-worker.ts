import path from 'node:path'
import {readFile} from 'node:fs/promises'
import {setTimeout as delay} from 'node:timers/promises'
import {locations} from './state.mjs'
import {prepareRuntime} from '../src/publication/prepare'
const state=locations(),[action,id,ownerValue]=process.argv.slice(2)
if(action!=='prepare'||!/^[a-f0-9-]{36}$/.test(id||'')||!/^[1-9]\d*$/.test(ownerValue||''))throw new Error('Invalid publication worker input')
// The parent publishes this descriptor only after its dispatch setup succeeds.
// Until then this child cannot start a build, so failed setup has no descendants.
async function dispatched(){
 for(let attempt=0;attempt<100;attempt++){
  try{const worker=JSON.parse(await readFile(path.join(state.root,'site-publication/inputs',id,'worker.json'),'utf8'));if(worker.pid===process.pid&&worker.operationId===id&&worker.action===action)return}
  catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error}
  await delay(100)
 }
 throw new Error('Publication dispatch not committed')
}
try{await dispatched();await prepareRuntime({dataRoot:state.root,repoRoot:path.resolve(import.meta.dirname,'../../..'),id,owner:Number(ownerValue)})}
catch{console.error('Подготовка выпуска не завершена. Проверьте статус в Payload.');process.exitCode=1}
