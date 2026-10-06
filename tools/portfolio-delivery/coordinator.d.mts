import type { ProjectDocument } from '../../src/lib/project-contract.ts';
import type { ActiveDescriptor, DeliveryAsset, DeliveryGeneration, RendererManifest } from './contract.mjs';
export type PublicationKind = 'publish' | 'unpublish' | 'delete' | 'restore';
export interface PublicationIntent {
 operationId:string; target:string; actor:string; operation:PublicationKind;
 expectedRevision:string; sourceDigest:string; selectedVersionId?:string;
}
export interface NativeState {revision:string; digest:string}
export interface NativeCommit {current:NativeState|null; revision:string; source?:unknown}
export interface NativeSource {sourceDigest:string; selectedRevision:string}
export interface TargetDelta {
 effect?:'publish'|'remove';
 project?:ProjectDocument; assets?:Array<{publicPath:string;sha256:string;bytes:Buffer;mime?:string}>;
 externalDependencies?:string[];
}
export interface PreparedDelta extends TargetDelta, NativeSource {}
export interface PublicationJournal {
 version:1; intent:PublicationIntent; sequence:number; phase:string;
 source?:NativeSource; committed?:NativeCommit;nativePrepared?:NativeCommit; activation?:ActiveDescriptor; base?:ActiveDescriptor;
 receipt?:PublicationReceipt; error?:string;
}
export interface PublicationReceipt extends ActiveDescriptor {operationId:string;operationSeq:number}
export interface PublicationStatus {
 operationId:string;target:string;operation:PublicationKind;status:string;receipt?:PublicationReceipt;error?:string;
}
export interface PrivateProjectMapping {target:string;slug:string;externalDependencies:string[]}
export interface PrivateActiveMap {descriptor:ActiveDescriptor;projects:PrivateProjectMapping[];latest:Record<string,number>}
export type ProbeRequest = {kind:'candidate';contentId:string;rendererId:string} | {kind:'active';descriptor:ActiveDescriptor};
export interface NativePublicationAdapter {
 current(intent:PublicationIntent):Promise<NativeState|null>;
 prepare(intent:PublicationIntent):Promise<PreparedDelta>;
 commit(intent:PublicationIntent,source:NativeSource,checkpoint?:(prepared:NativeCommit)=>Promise<void>):Promise<NativeCommit>;
 delivery(journal:PublicationJournal):Promise<TargetDelta>;
 recover(journal:PublicationJournal):Promise<{state:'committed';result:NativeCommit}|{state:'uncommitted'|'ambiguous'}>;
}
export class PublicationError extends Error {code:string;constructor(code:string,message?:string)}
export class ReadinessRejected extends Error {constructor()}
export function validateIntent(value:unknown):PublicationIntent;
export function createPublicationCoordinator(options:{
 publicRoot:string;privateRoot:string;renderer:RendererManifest;native:NativePublicationAdapter;
 probe:(request:ProbeRequest)=>Promise<void>;fault?:(point:string,journal:PublicationJournal)=>Promise<void>;
}):{
 execute(input:PublicationIntent):Promise<PublicationStatus>;
 retry(operationId:string,actor:string):Promise<PublicationStatus>;
 nativeReplay(options:{actor:string;operation:PublicationKind;target?:string;selectedVersionId?:string}):Promise<PublicationIntent|null>;
 nativeResult(operationId:string,actor:string):Promise<unknown>;
 status(options?:{actor?:string;target?:string}):Promise<Array<PublicationStatus & {sequence:number}>>;
 active():Promise<{descriptor:ActiveDescriptor;generation:DeliveryGeneration;state:PrivateActiveMap;readAsset:(publicPath:string)=>Promise<Buffer|null>}>;
 initialize(options:{prepared:{projects:ProjectDocument[];assets:Array<DeliveryAsset & {bytes:Buffer}> | Array<{publicPath:string;sha256:string;bytes:Buffer;mime?:string}>;externalDependencies?:string[]};mapping:PrivateProjectMapping[]}):Promise<ActiveDescriptor>;
};
