import path from 'node:path'
import {createPublicationCoordinator,PublicationError} from '../../../portfolio-delivery/coordinator.mjs'
import {createLoopbackProbe} from '../../../portfolio-delivery/probe.mjs'
import {readJSON,assertDirectory} from '../../../portfolio-delivery/durable-store.mjs'
import {readPortfolioRelease} from '../../../portfolio-runtime/active-release.mjs'
import {runtimeSettings} from '../../scripts/runtime-settings.mjs'
import {createNativePublicationAdapter} from './native'
import type {Payload} from 'payload'
import type {User} from '../payload-types'
export async function publicationRuntime(payload:Payload,user:User) {
 const settings=runtimeSettings(),publicRoot=process.env.PORTFOLIO_CONTENT_ROOT,releaseFile=process.env.PORTFOLIO_ACTIVE_RELEASE,origin=process.env.PORTFOLIO_INTERNAL_ORIGIN
 if(!publicRoot||!path.isAbsolute(publicRoot)||!releaseFile||!origin)throw new PublicationError('delivery-not-configured')
 if(settings.server&&(publicRoot===settings.root||publicRoot.startsWith(settings.root+path.sep)))throw new PublicationError('public-root-is-private')
 await assertDirectory(publicRoot)
 const owner=await readJSON(settings.root+'-lock/owner.json',4096) as {pid?:number;childPID?:number;token?:string}
 if(!process.env.PAYLOAD_WRITER_TOKEN||owner.token!==process.env.PAYLOAD_WRITER_TOKEN||!owner.pid||!owner.childPID)throw new PublicationError('writer-lock-not-confirmed')
 try{process.kill(owner.pid,0);process.kill(owner.childPID,0)}catch{throw new PublicationError('writer-lock-not-confirmed')}
 const release=await readPortfolioRelease(releaseFile,{requireClean:settings.server})
 const native=createNativePublicationAdapter({payload,user,dataRoot:settings.root})
 const coordinator=createPublicationCoordinator({publicRoot,privateRoot:path.join(settings.root,'delivery'),renderer:release.renderer,native,probe:createLoopbackProbe(origin)})
 return {coordinator,native,release}
}
