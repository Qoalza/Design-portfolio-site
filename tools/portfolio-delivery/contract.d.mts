import type { ProjectDocument } from '../../src/lib/project-contract.ts';
export type DeliveryCapability = 'project-v3' | 'redesign-v1' | 'hero-layout' | 'hero-raster' | 'empty-collection' | 'scoped-assets-v1';
export interface RendererManifest { rendererId: string; contractVersion: 'public-delivery-v1'; capabilities: readonly DeliveryCapability[] }
export interface DeliveryAsset { publicPath: string; sha256: string; size: number; mime: string }
export interface PreparedDeliveryAsset { publicPath: string; sha256: string; bytes: Buffer; mime?: string }
export interface PreparedDelivery { projects: unknown[]; assets: PreparedDeliveryAsset[]; externalDependencies?: string[] }
export interface DeliveryGeneration { contractVersion: 'public-delivery-v1'; contentId: string; capabilities: DeliveryCapability[]; projects: ProjectDocument[]; assets: DeliveryAsset[]; externalDependencies: string[] }
export interface ActiveDescriptor { contractVersion: 'public-delivery-v1'; contentId: string; rendererId: string; activationSeq: number }
export const DELIVERY_VERSION: 'public-delivery-v1';
export const DELIVERY_CAPABILITIES: readonly DeliveryCapability[];
export const digestPattern: RegExp;
export function contentHash(bytes: string | Buffer): string;
export function compare(a: string,b: string): number;
export function exactObject(value: unknown,keys: string[],at: string): Record<string,unknown>;
export function canonicalJSON(value: unknown): string;
export function assetMime(publicPath: string): string;
export function validateAssetPath(value: unknown,slugs: string[]): string;
export function validateAssetBytes(asset: DeliveryAsset,bytes: Buffer): void;
export function validateRenderer(value: unknown): RendererManifest;
export function validateDeliveryGeneration(value: unknown,renderer: RendererManifest): DeliveryGeneration;
export function createDeliveryGeneration(value: PreparedDelivery,renderer: RendererManifest): DeliveryGeneration;
export function validateActiveDescriptor(value: unknown): ActiveDescriptor;
