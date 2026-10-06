// Public and private preview hosts inject validated DTOs before the built app runs.
// Explicit legacy callers may still pass a fixture; main-release always requires injection.
export function runtimeProjectDocuments(fallback,element,{required=false}={}){
 if(!element){if(required)throw new Error('Published content injection is required');return fallback;}
 const value=JSON.parse(element.textContent);
 if(value?.version!==1||!Array.isArray(value.projects)||!/^[a-f0-9]{64}$/.test(value.revision))throw new Error('Invalid runtime project content');
 return value.projects;
}
