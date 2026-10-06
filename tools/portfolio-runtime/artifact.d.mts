import type {RendererManifest} from '../portfolio-delivery/contract.mjs';
export interface PortfolioFile {path:string;size:number;sha256:string}
export interface PortfolioBuildId {sourceSha:string;artifactSha256:string}
export interface PortfolioArtifact {version:1;portfolioBuildId:PortfolioBuildId;renderer:RendererManifest;sourceDirty:boolean;files:PortfolioFile[]}
export function artifactFiles(root:string,directory?:string):Promise<PortfolioFile[]>;
export function verifyPortfolioArtifact(root:string):Promise<PortfolioArtifact>;
