// Producer validates the document before rendering. Shell geometry/motion remain code-owned.
export function rasterHeroDefinition(project){
 const hero=project.redesign.hero;
 if(hero.kind!=='raster')throw new Error('Expected a validated raster Hero document.');
 return {
  projectName:project.title,
  initialContextId:'desktop',
  contexts:[
   {id:'desktop',label:'Desktop',icon:'size-desktop',initialSlideId:hero.initialSlideId,slides:hero.slides.map(({id,title,image})=>({id,title,src:image.src}))},
   {id:'tablet',label:'Tablet',icon:'size-tablet',slides:[]},
   {id:'mobile',label:'Mobile',icon:'size-mobile',slides:[]},
  ],
 };
}
// The library holds internal step/queue state. A changed accepted source starts a fresh instance.
export function rasterHeroRevision(project){return JSON.stringify(rasterHeroDefinition(project));}
