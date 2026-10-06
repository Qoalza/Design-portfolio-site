import type { ProjectDocument, ProjectImage } from '../../src/lib/project-contract.ts';
import type { DeliveryGeneration } from './contract.mjs';
declare const presentationOnly: unique symbol;
// Presentation DTOs carry scoped URLs; canonical authoring validation precedes mapping.
export type RenderedProjectDTO = ProjectDocument & { readonly [presentationOnly]: true };
export function scopedAssetPath(generation: DeliveryGeneration,canonical: string): string;
export function canonicalAssetPath(generation: DeliveryGeneration,scoped: string): string;
export function renderedProjects(generation: DeliveryGeneration,base?:string): RenderedProjectDTO[];
export function scopedProjectImageSource(generation: DeliveryGeneration,image: ProjectImage): { fallback: string; sources: Array<{type: string; srcSet: string}> };
