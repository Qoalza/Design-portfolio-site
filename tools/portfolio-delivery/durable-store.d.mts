export function assertDirectory(directory:string,options?:{create?:boolean;mode?:number}):Promise<string>;
export function flushDirectory(directory:string):Promise<void>;
export function readJSON(file:string,maxBytes?:number):Promise<unknown>;
export function writeFileDurable(file:string,bytes:Buffer,mode?:number):Promise<void>;
export function atomicJSON(file:string,value:unknown,options?:{mode?:number}):Promise<void>;
export function withActivationLock<T>(privateRoot:string,task:()=>Promise<T>):Promise<T>;
export function listJSON(directory:string):Promise<string[]>;
