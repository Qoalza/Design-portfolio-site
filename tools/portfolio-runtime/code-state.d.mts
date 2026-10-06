export interface CodeActivation<T> {activationSeq:number;operationId:string|null;release:T}
export interface CodeState<T> {version:1;app:'portfolio'|'cms';confirmed:CodeActivation<T>;selected:CodeActivation<T>}
export function validateCodeState<T>(value:unknown,app:'portfolio'|'cms',validateRelease:(value:unknown)=>T):CodeState<T>;
export function initialCodeState<T>(app:'portfolio'|'cms',release:unknown,validateRelease:(value:unknown)=>T):CodeState<T>;
export function isConfirmedCode<T>(state:CodeState<T>):boolean;
export function assertExpectedCode<T>(state:CodeState<T>,expected:CodeActivation<T>):void;
