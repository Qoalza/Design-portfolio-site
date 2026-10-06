import { lstat, open, constants, readdir } from 'node:fs/promises';
import path from 'node:path';
import { validateAssetBytes, digestPattern, validateRenderer, validateDeliveryGeneration, createDeliveryGeneration, validateActiveDescriptor } from './contract.mjs';

async function safeFile(root,relative,maxBytes) {
 const absolute = path.resolve(root), target = path.resolve(absolute,relative);
 if (!target.startsWith(absolute + path.sep)) throw new Error('Delivery path escapes root.');
 // Check ancestors too: a non-symlink final directory can still be inside a symlink.
 let current = path.parse(target).root;
 for (const part of target.slice(current.length).split(path.sep)) {
  current = path.join(current,part);
  const stat = await lstat(current);
  if (stat.isSymbolicLink()) throw new Error('Delivery path contains a symlink.');
  if (current !== target && !stat.isDirectory()) throw new Error('Delivery ancestor is not a directory.');
 }
 const file = await open(target,constants.O_RDONLY | constants.O_NOFOLLOW);
 try {
  const stat = await file.stat();
  if (!stat.isFile() || stat.size > maxBytes) throw new Error('Invalid delivery file size or type.');
  const bytes = await file.readFile();
  if (bytes.length !== stat.size || bytes.length > maxBytes) throw new Error('Delivery file changed while reading.');
  return bytes;
 } finally { await file.close(); }
}
function freeze(value) {
 if (value && typeof value === 'object') { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
 return value;
}
export function createGenerationReader({root,renderer}) {
 validateRenderer(renderer);
 const supported = freeze(structuredClone(renderer));
 let lastGood;
 const activatedCache = new Map();
 async function readGeneration(contentId) {
  if (!digestPattern.test(contentId)) throw new Error('Invalid content identity.');
  const base = `generations/${contentId}/`;
  const generation = validateDeliveryGeneration(JSON.parse(await safeFile(root,base + 'generation.json',16*1024*1024)),supported);
  if (generation.contentId !== contentId) throw new Error('Generation directory identity mismatch.');
  const assets = [];
  for (const entry of generation.assets) {
   const bytes = await safeFile(root,base + entry.publicPath.slice(1),entry.size);
   validateAssetBytes(entry,bytes);
   assets.push({...entry,bytes});
  }
  // Metadata-only validation cannot prove the static package dependency graph.
  createDeliveryGeneration({projects:generation.projects,assets,externalDependencies:generation.externalDependencies},supported);
  const entriesByPath = new Map(generation.assets.map(asset => [asset.publicPath,asset]));
  return {generation:freeze(generation),readAsset:async publicPath => {
   const entry = entriesByPath.get(publicPath);
   if (!entry) return null;
   const bytes = await safeFile(root,base + entry.publicPath.slice(1),entry.size);
   validateAssetBytes(entry,bytes);
   return bytes;
  }};
 }
 async function readActive({allowLastGood=true}={}) {
  try {
   const descriptor = validateActiveDescriptor(JSON.parse(await safeFile(root,'active.json',4096)));
   // Descriptor rendererId records content-activation provenance. A code-only
   // release uses its own renderer identity and validates compatible generation
   // capabilities without modifying the content pointer or private map.
   if (lastGood && descriptor.activationSeq < lastGood.descriptor.activationSeq) throw new Error('Stale activation sequence.');
   if (lastGood && descriptor.activationSeq === lastGood.descriptor.activationSeq && descriptor.contentId !== lastGood.descriptor.contentId) throw new Error('Conflicting activation sequence.');
   if (allowLastGood && lastGood && descriptor.activationSeq === lastGood.descriptor.activationSeq && descriptor.contentId === lastGood.descriptor.contentId) return lastGood;
   const snapshot = await readGeneration(descriptor.contentId);
   const result = Object.freeze({...snapshot,descriptor:freeze(descriptor),degraded:false});
   // A slower request for A can finish after B. Keep its captured view, but never
   // let that completion replace the newer last-good generation.
   if (!lastGood || descriptor.activationSeq > lastGood.descriptor.activationSeq || (descriptor.activationSeq === lastGood.descriptor.activationSeq && descriptor.contentId === lastGood.descriptor.contentId)) lastGood = result;
   return result;
  } catch (error) {
   if (!allowLastGood || !lastGood) throw error;
   return Object.freeze({...lastGood,degraded:true});
  }
 }
 async function readActivated(contentId) {
  if (!digestPattern.test(contentId)) throw new Error('Invalid retained content identity.');
  const receipt = validateActiveDescriptor(JSON.parse(await safeFile(root,`activated/${contentId}.json`,4096)));
  if (receipt.contentId !== contentId) throw new Error('Retained activation receipt mismatch.');
  if (!activatedCache.has(contentId)) {
   if (activatedCache.size >= 64) activatedCache.delete(activatedCache.keys().next().value);
   const promise = readGeneration(contentId);
   activatedCache.set(contentId,promise);
   promise.catch(() => {if (activatedCache.get(contentId) === promise) activatedCache.delete(contentId);});
  }
  return activatedCache.get(contentId);
 }
 async function immutableAlias(publicPath) {
  if (!/^\/assets\/projects\/[a-z0-9]+(?:-[a-z0-9]+)*\/hero-layout\/[a-f0-9]{64}\//.test(publicPath)) return null;
  const directory = path.join(root,'activated');
  if ((await lstat(directory)).isSymbolicLink()) throw new Error('Activation receipts contain symlink.');
  let match;
  for (const entry of await readdir(directory)) {
   if (!/^[a-f0-9]{64}\.json$/.test(entry)) throw new Error('Invalid activation receipt name.');
   const handle = await readActivated(entry.slice(0,-5)),asset = handle.generation.assets.find(asset => asset.publicPath === publicPath);
   if (!asset) continue;
   if (match && (match.asset.sha256 !== asset.sha256 || match.asset.mime !== asset.mime)) throw new Error('Conflicting immutable package alias.');
   match = {handle,asset};
  }
  return match;
 }
 // readGeneration is for internal readiness probes. HTTP allowlisting of activated
 // generations is a separate host responsibility; staging must never be exposed.
 return {readActive,readGeneration,readActivated,immutableAlias};
}
