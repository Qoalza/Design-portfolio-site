import type {RendererManifest} from '../portfolio-delivery/contract.mjs';
import type {PortfolioBuildId} from './artifact.mjs';
export interface ActivePortfolioRelease {version:1;artifactRoot:string;portfolioBuildId:PortfolioBuildId;renderer:RendererManifest}
export function validatePortfolioRelease(value:unknown):ActivePortfolioRelease;
export function readPortfolioRelease(file:string,options?:{requireClean?:boolean}):Promise<ActivePortfolioRelease & {previewRoot:string;codeActivationSeq:number}>;
