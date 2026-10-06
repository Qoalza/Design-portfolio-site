import {open,constants,lstat} from 'node:fs/promises';
import {hostname} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
// The parent installs the child's PID before permitting any Payload imports.
// Losing the supervisor IPC channel terminates this writer and preserves its lock.
const entry=process.argv[2];
if(!entry||!process.connected||!process.env.PAYLOAD_LOCK_FILE||!process.env.PAYLOAD_WRITER_TOKEN)throw new Error('Writer requires a lifecycle supervisor');
process.on('disconnect',()=>process.kill(process.pid,'SIGTERM'));
const timeout=setTimeout(()=>process.exit(1),30000);
try {
 const message=await new Promise(resolve=>process.once('message',resolve));
 if(message!=='start')throw new Error('Invalid writer barrier');
 const file=process.env.PAYLOAD_LOCK_FILE;
 const directory=await lstat(path.dirname(file));
 if(directory.isSymbolicLink()||!directory.isDirectory())throw new Error('Invalid writer lock');
 const fd=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW);
 let owner;try{const stat=await fd.stat();if(!stat.isFile()||stat.size>4096)throw new Error('Invalid writer owner');owner=JSON.parse(await fd.readFile('utf8'));}finally{await fd.close();}
 if(owner.host!==hostname()||owner.pid!==process.ppid||owner.childPID!==process.pid||owner.token!==process.env.PAYLOAD_WRITER_TOKEN)throw new Error('Writer ownership not confirmed');
 clearTimeout(timeout);
 // IPC must monitor a running server without keeping completed maintenance alive.
 process.channel.unref();
 process.argv=[process.execPath,path.resolve(entry),...process.argv.slice(3)];
 await import(pathToFileURL(path.resolve(entry)).href);
}finally{clearTimeout(timeout);}
