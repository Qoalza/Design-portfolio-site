import {PublicationError} from '../../../portfolio-delivery/coordinator.mjs'
import type {Where} from 'payload'
// Reconstruct only the bounded native `where[...]` grammar. There is no eval,
// prototype lookup, new dependency or unconstrained select-all expansion.
export function nativeSelection(parameters:URLSearchParams):{ids:string[];where:Where} {
 if(parameters.toString().length>16384)throw new PublicationError('invalid-selection')
 const root:Record<string,unknown>=Object.create(null),ids=new Set<string>()
 let count=0
 for(const [name,value] of parameters) {
  if(!name.startsWith('where'))continue
  const tokens=name.match(/[^\[\]]+/g)??[]
  if(tokens[0]!=='where'||tokens.length<2||tokens.length>11||'where'+tokens.slice(1).map(part=>'['+part+']').join('')!==name||tokens.some(part=>!/^[-a-zA-Z0-9_.]+$/.test(part)||['__proto__','prototype','constructor'].includes(part))||++count>512)throw new PublicationError('invalid-selection')
  let node=root
  for(let i=1;i<tokens.length;i++) {
   const key=tokens[i],last=i===tokens.length-1
   if(/^\d+$/.test(key)&&Number(key)>100)throw new PublicationError('invalid-selection')
   if(last) {if(Object.hasOwn(node,key))throw new PublicationError('invalid-selection');node[key]=value}
   else {
    if(!Object.hasOwn(node,key))node[key]=/^\d+$/.test(tokens[i+1])?[]:Object.create(null)
    const child=node[key]
    if(!child||typeof child!=='object')throw new PublicationError('invalid-selection')
    node=child as Record<string,unknown>
   }
  }
  if(/^where(?:(?:\[and\])|(?:\[\d+\]))*\[id\]\[in\](?:\[\d+\])?$/.test(name))for(const id of value.split(',')) {
   if(!/^[1-9]\d{0,15}$/.test(id))throw new PublicationError('invalid-selection')
   ids.add(id)
  }
 }
 if(!ids.size||ids.size>100)throw new PublicationError('explicit-project-ids-required')
 return {ids:[...ids],where:root as Where}
}
