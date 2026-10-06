import path from 'node:path';import {readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
// next dev's CLI forks the writer. Start its installed server directly so the
// lifetime PID and disconnect handler belong to the process that opens SQLite.
process.env.TURBOPACK='1';
process.env.__NEXT_DEV_SERVER='1';
process.env.NEXT_PRIVATE_START_TIME=Date.now().toString();
if((await readdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'))).some(name=>name==='.env'||name.startsWith('.env.')))throw new Error('CMS development cannot load source environment files; use explicit runtime settings');
const {startServer}=await import('next/dist/server/lib/start-server.js');
const port=Number(process.argv[2]);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid CMS development port');
await startServer({dir:path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),isDev:true,hostname:'127.0.0.1',port,allowRetry:false});
