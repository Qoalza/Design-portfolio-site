import { createHash } from 'node:crypto';
// Synthetic documents and bytes; this fixture never reads CMS or Git content.
export function fixture() {
 const assets=[];
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADklEQVQImWP4DwYMEAoAU7oL9W/sIDEAAAAASUVORK5CYII=','base64');
 const avif=Buffer.from('AAAAHGZ0eXBhdmlmAAAAAG1pZjFhdmlmbWlhZgAAANZtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAACJpbG9jAAAAAERAAAEAAQAAAAAA+gABAAAAAAAAAB0AAAAjaWluZgAAAAAAAQAAABVpbmZlAgAAAAABAABhdjAxAAAAAA5waXRtAAAAAAABAAAAVmlwcnAAAAA4aXBjbwAAAAxhdjFDgSACAAAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAABZpcG1hAAAAAAAAAAEAAQOBAgMAAAAlbWRhdBIACgc4ADaQENBpMhAZQmMEwAA0AACQQMkcYIpq','base64');
 const projects=['fixture-one','fixture-two'].map((slug,index)=>{
  const image=name=>{
   const src=`/assets/projects/${slug}/redesign/${name}.png`;
   for(const [file,mime] of [[src,'image/png'],...(name==='imgDesktop3'?[[src.replace('.png','-640.avif'),'image/avif'],[src.replace('.png','-1080.avif'),'image/avif']]:[])]){
    const bytes=Buffer.from(mime==='image/avif'?avif:png);assets.push({publicPath:file,mime,bytes,sha256:createHash('sha256').update(bytes).digest('hex')});
   }
   return {src,alt:'Fixture',width:2960,height:2048};
  };
  const front=image('imgDesktop3'),back=image('back');
  const visual={templateId:'catalog.sarafan-collage',assets:{dashboard:[{...back,width:2880,height:2518}],player:[{...front,width:1688,height:612}],payment:[{...front,width:760,height:1100}]}};
  const copy=[[{type:'text',text:'Fixture'}]];
  return {schemaVersion:3,designProfile:'sarafan-v1',title:slug,slug,description:'Fixture',subtitle:'Fixture',role:'Designer',year:2026,tags:[],detailTags:[],visibility:'published',catalogOrder:index,detailAvailable:true,materials:{projectState:'completed',fileState:'absent'},platforms:[],visuals:{catalog:visual},workSummary:'Fixture',content:[],redesign:{version:1,card:{preview:{back,front}},hero:{kind:'raster',initialSlideId:'one',slides:['one','two','three'].map(id=>({id,title:'Fixture',image:{...front,width:4096,height:2958}}))},page:{templateId:'sarafan-redesign-v1',summary:copy,notice:{title:'Fixture',body:'Fixture'},flow:{title:'Fixture',paragraphs:copy,action:{label:'Fixture',href:'https://example.com/'},image:front},sections:[{id:'receiving',heading:'Fixture',paragraphs:copy},{id:'states',heading:'Fixture',paragraphs:copy}],result:{heading:'Fixture',paragraphs:copy}}}};
 });
 return {projects,assets,externalDependencies:[]};
}

export function layoutFixture() {
 const source=fixture(),project=source.projects[0];
 const assetBase=`/assets/projects/${project.slug}/hero-layout/${'b'.repeat(64)}/`;
 const entries=[['index.html','text/html',`<!doctype html><link rel="stylesheet" href="style.css"><img src="image.png"><script src="${assetBase}app.js"></script>`],['style.css','text/css','body{background:url(image.png)}'],['app.js','text/javascript','console.log("Fixture")'],['image.png','image/png',source.assets[0].bytes]];
 const files=entries.map(([name,mime,value])=>{const bytes=Buffer.isBuffer(value)?Buffer.from(value):Buffer.from(value);const sha256=createHash('sha256').update(bytes).digest('hex');source.assets.push({publicPath:assetBase+name,mime,bytes,sha256});return {path:name,mime,sha256,size:bytes.length};});
 project.redesign.hero={kind:'layout',chromeProfile:'layout-four-scenes-v1',initialSceneId:'media-campaigns',adaptives:{enabled:['desktop']},scenes:['media-campaigns','statistics','my-space','authorization'].map(id=>({id,title:'Fixture',source:{kind:'package',assetBase,entry:'index.html',files:structuredClone(files)},adaptives:[{id:'desktop',minWidth:360,maxWidth:1900,presetWidth:1200,height:1000}]}))};
 return source;
}
