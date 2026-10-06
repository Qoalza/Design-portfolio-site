import type { ProbeRequest } from './coordinator.mjs';
export function createLoopbackProbe(origin:string,options?:{timeoutMs?:number}):(request:ProbeRequest)=>Promise<void>;
