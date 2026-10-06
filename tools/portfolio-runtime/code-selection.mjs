import {readJSON} from '../portfolio-delivery/durable-store.mjs';
import {canonicalJSON} from '../portfolio-delivery/contract.mjs';
import {initialCodeState,validateCodeState,isConfirmedCode} from './code-state.mjs';
// Launchers use selected code; readers/publication use confirmed code. The active
// descriptor can be either known side during crash recovery, never unrelated code.
export async function readCodeSelection(file,app,validateRelease,verifyRelease){
 const active=validateRelease(await readJSON(file,16384));let state;
 try{state=validateCodeState(await readJSON(file+'.state.json',65536),app,validateRelease);}
 catch(error){if(error.code!=='ENOENT')throw error;state=initialCodeState(app,active,validateRelease);}
 const identity=canonicalJSON(active);
 if(identity!==canonicalJSON(state.confirmed.release)&&(isConfirmedCode(state)||identity!==canonicalJSON(state.selected.release)))throw new Error('Active descriptor is outside the selected code transition');
 await verifyRelease(state.selected.release);
 return state.selected;
}
