import {canonicalJSON,exactObject} from '../portfolio-delivery/contract.mjs';
function slot(value,validateRelease){
 exactObject(value,['activationSeq','operationId','release'],'Code activation');
 if(!Number.isSafeInteger(value.activationSeq)||value.activationSeq<0||(value.activationSeq===0?value.operationId!==null:typeof value.operationId!=='string'||!/^[a-zA-Z0-9_-]{16,128}$/.test(value.operationId)))throw new Error('Invalid code activation identity');
 return {...value,release:validateRelease(value.release)};
}
export function validateCodeState(value,app,validateRelease){
 exactObject(value,['version','app','confirmed','selected'],'Code state');
 if(value.version!==1||!['portfolio','cms'].includes(app)||value.app!==app||typeof validateRelease!=='function')throw new Error('Invalid code state application');
 const result={version:1,app,confirmed:slot(value.confirmed,validateRelease),selected:slot(value.selected,validateRelease)};
 if(result.selected.activationSeq<result.confirmed.activationSeq||(result.selected.activationSeq===result.confirmed.activationSeq&&!isConfirmedCode(result)))throw new Error('Conflicting code activation identity');
 return result;
}
export function initialCodeState(app,release,validateRelease){const confirmed={activationSeq:0,operationId:null,release:validateRelease(release)};return validateCodeState({version:1,app,confirmed,selected:confirmed},app,validateRelease);}
export function isConfirmedCode(state){return canonicalJSON(state.selected)===canonicalJSON(state.confirmed);}
export function assertExpectedCode(state,expected){if(!isConfirmedCode(state)||canonicalJSON(state.confirmed)!==canonicalJSON(expected))throw new Error('code-conflict');}
