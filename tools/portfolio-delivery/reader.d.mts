import type { DeliveryGeneration, RendererManifest, ActiveDescriptor, DeliveryAsset } from './contract.mjs';
export interface GenerationHandle { generation: DeliveryGeneration; readAsset(publicPath: string): Promise<Buffer | null> }
export interface ActiveGenerationHandle extends GenerationHandle { descriptor: ActiveDescriptor; degraded: boolean }
export function createGenerationReader(options: {root: string; renderer: RendererManifest}): {
 readActive(options?: {allowLastGood?: boolean}): Promise<ActiveGenerationHandle>;
 readGeneration(contentId: string): Promise<GenerationHandle>;
 readActivated(contentId: string): Promise<GenerationHandle>;
 immutableAlias(publicPath: string): Promise<{handle: GenerationHandle; asset: DeliveryAsset} | null>;
};
