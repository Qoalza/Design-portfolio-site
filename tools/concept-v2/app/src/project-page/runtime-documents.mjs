// Online Payload injects its committed public DTO before the already-built app runs.
// Historical static releases keep their approved build-time input.
export function runtimeProjectDocuments(fallback,element){
 if(!element)return fallback;
 const value=JSON.parse(element.textContent);
 if(value?.version!==1||!Array.isArray(value.projects)||!/^[a-f0-9]{64}$/.test(value.revision))throw new Error('Invalid runtime project content');
 return value.projects;
}
