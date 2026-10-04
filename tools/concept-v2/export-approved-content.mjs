import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';
import {inspectApprovedImage} from '../portfolio-release/approved-image-metadata.mjs';
import {validateProjectDocument} from '../../src/lib/project-contract.ts';

const SOURCE_SHA='258e95b2a7720499c7a74ec7602c8608b8c58200';
const app='tools/concept-v2/app';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const name=node=>node?.type==='JSXIdentifier'?node.name:undefined;
function descendants(node,predicate){
 const found=[];
 function visit(value){if(!value||typeof value!=='object')return;if(predicate(value))found.push(value);for(const [key,child] of Object.entries(value))if(key!=='loc'&&key!=='extra'){if(Array.isArray(child))child.forEach(visit);else visit(child);}}
 visit(node);return found;
}
const elements=(node,tag)=>descendants(node,n=>n.type==='JSXElement'&&name(n.openingElement.name)===tag);
const children=node=>node.children.filter(n=>n.type==='JSXElement');
const attribute=(node,key)=>node.openingElement.attributes.find(a=>a.type==='JSXAttribute'&&name(a.name)===key)?.value;
const classNode=(node,key)=>descendants(node,n=>n.type==='JSXElement'&&attribute(n,'className')?.expression?.property?.name===key)[0];
function exactlyOne(values,location){if(values.length!==1)throw new Error(`Approved source ${location}: expected one node, found ${values.length}.`);return values[0];}
function jsxWhitespace(value){
 const lines=value.replace(/\t/g,' ').split(/\r\n|\n|\r/);let last=0;for(let i=0;i<lines.length;i++)if(/[^ ]/.test(lines[i]))last=i;
 return lines.map((line,i)=>{if(i!==0)line=line.replace(/^ +/,'');if(i!==lines.length-1)line=line.replace(/ +$/,'');return line+(line&&i!==last?' ':'');}).join('');
}
function constant(node,context){
 if(node?.type==='StringLiteral'||node?.type==='NumericLiteral'||node?.type==='BooleanLiteral')return node.value;
 if(node?.type==='Identifier'&&Object.hasOwn(context,node.name))return context[node.name];
 if(node?.type==='ArrayExpression')return node.elements.map(n=>constant(n,context));
 if(node?.type==='ObjectExpression')return Object.fromEntries(node.properties.map(p=>{if(p.type!=='ObjectProperty'||p.computed)throw new Error('Unsupported approved object property.');return [p.key.name??p.key.value,constant(p.value,context)];}));
 if(node?.type==='MemberExpression'&&!node.computed)return constant(node.object,context)[node.property.name];
 if(node?.type==='TemplateLiteral')return node.quasis.map((q,i)=>q.value.cooked+(i<node.expressions.length?constant(node.expressions[i],context):'')).join('');
 if(node?.type==='CallExpression'&&node.callee?.object?.name==='Object'&&node.callee.property?.name==='freeze')return constant(node.arguments[0],context);
 throw new Error(`Unsupported approved constant: ${node?.type}.`);
}
function variable(ast,key){return exactlyOne(descendants(ast,n=>n.type==='VariableDeclarator'&&n.id?.name===key),key).init;}
function props(node,context,keys){return Object.fromEntries(node.openingElement.attributes.filter(a=>a.type==='JSXAttribute'&&(!keys||keys.includes(name(a.name)))).map(a=>[name(a.name),a.value?.type==='JSXExpressionContainer'?constant(a.value.expression,context):constant(a.value,context)]));}
function inline(node,context){
 const parts=[];
 for(const item of node.children??[]){
  if(item.type==='JSXText'){const text=jsxWhitespace(item.value);if(text)parts.push({type:'text',text});}
  else if(item.type==='JSXExpressionContainer')parts.push({type:'text',text:String(constant(item.expression,context))});
  else if(item.type==='JSXElement'){
   const tag=name(item.openingElement.name);if(tag==='Icon')continue;
   const type={strong:'strong',em:'emphasis',u:'underline'}[tag];if(!type)throw new Error(`Unsupported approved inline tag: ${tag}.`);
   parts.push({type,text:inline(item,context).map(p=>p.text).join('')});
  }else throw new Error(`Unsupported approved inline: ${item.type}.`);
 }
 return parts;
}
const paragraph=(node,context)=>inline(node,context);
const plain=(node,context)=>paragraph(node,context).map(p=>p.text).join('');
function splitCopy(node,context){
 if(node.type==='StringLiteral')return [[{type:'text',text:node.value}]];
 const result=[[]];for(const child of node.children){if(child.type==='JSXElement'&&name(child.openingElement.name)==='br')result.push([]);else result.at(-1).push(...inline({children:[child]},context));}return result;
}
function copyBlocks(section,context){return children(section).map(node=>{
 const tag=name(node.openingElement.name);
 if(tag==='p')return {type:'paragraph',content:paragraph(node,context)};
 if(tag==='h3')return {type:'heading',level:3,content:paragraph(node,context)};
 if(tag==='ul'||tag==='ol')return {type:'list',style:tag==='ul'?'unordered':'ordered',items:children(node).map(li=>paragraph(li,context))};
 if(tag==='Notice')return {type:'notice',variant:'system',title:plain(exactlyOne(elements(node,'p'),'notice title'),context),body:plain(exactlyOne(elements(node,'small'),'notice body'),context)};
 throw new Error(`Unsupported approved block: ${tag}.`);
});}

// Read the accepted Git objects, never local drafts, app support or generated snapshot files.
// Returns a preparation artifact in memory; it does not write canonical files or publish.
export async function exportApprovedRedesign({repoRoot}){
 const require=createRequire(path.join(repoRoot,app,'package.json'));
 const {parse}=require('@babel/parser');
 const sourceFiles=new Map(),assets=new Map();
 const read=relative=>{
  if(!relative.startsWith(`${app}/`)&&!/^content\/projects\/(corvo|sarafan-radio)\.json$/.test(relative))throw new Error('Export source is outside the approved allowlist.');
  if(!sourceFiles.has(relative)){const bytes=execFileSync('/usr/bin/git',['show',`${SOURCE_SHA}:${relative}`],{cwd:repoRoot,maxBuffer:64*1024*1024});sourceFiles.set(relative,{bytes,sha256:hash(bytes)});}
  return sourceFiles.get(relative).bytes;
 };
 const ast=relative=>parse(read(`${app}/src/${relative}`).toString('utf8'),{sourceType:'module',plugins:['jsx']});
 const links=constant(variable(ast('project-links.mjs'),'projectLinks'),{});
 const context={projectLinks:links};
 const corvo=ast('project-page/CorvoProjectPage.jsx'),sarafan=ast('project-page/SarafanProjectPage.jsx'),main=ast('App.jsx');
 context.projectDescription=constant(variable(corvo,'projectDescription'),context);
 const addAsset=(relative,publicPath)=>{const bytes=read(`${app}/public${relative}`);const entry={publicPath,sourcePath:`${app}/public${relative}`,sha256:hash(bytes),bytes};if(assets.has(publicPath)&&assets.get(publicPath).sha256!==entry.sha256)throw new Error('Conflicting approved asset path.');assets.set(publicPath,entry);return entry;};
 const image=(relative,slug,alt='')=>{
  const publicPath=relative.startsWith('/assets/')?relative:`/assets/projects/${slug}/redesign/${path.posix.basename(relative)}`;
  const asset=addAsset(relative,publicPath);const mime=relative.endsWith('.png')?'image/png':'image/webp';
  const {width,height}=inspectApprovedImage(asset.bytes,path.posix.basename(relative),mime);return {src:publicPath,alt,width,height};
 };
 const imageProps=(node,slug)=>{const p=props(node,context);return image(p.src,slug,p.alt);};
 const appDescriptions={corvo:constant(variable(main,'corvoDescription'),context),'sarafan-radio':constant(variable(main,'sarafanDescription'),context)};
 const cards=variable(main,'projectCards').elements;
 const property=(node,key)=>node.properties.find(p=>p.key?.name===key)?.value;
 const cardData=(slug,index,back,front)=>{
  const card=cards[index],preview=property(card,'preview');
  return {title:constant(property(card,'title'),context),tags:constant(property(card,'categories'),context),description:appDescriptions[slug],card:{preview:{back:image(back,slug),front:image(front,slug,constant(property(preview,'frontAlt'),context))},...(property(card,'tag')?{tag:constant(property(card,'tag'),context)}:{})}};
 };
 const corvoCard=cardData('corvo',0,'/figma/imgDesktop3.png','/figma/imgDesktop4.png');
 for(const base of ['imgDesktop3','imgDesktop4'])for(const width of [640,1080])addAsset(`/figma/${base}-${width}.avif`,`/assets/projects/corvo/redesign/${base}-${width}.avif`);
 const sarafanCard=cardData('sarafan-radio',1,'/figma/sarafan-desktop-3.png','/figma/sarafan-desktop-4.png');
 const corvoLogo={type:'image',src:'/assets/projects/corvo/redesign/imgProjectCorvo.svg'};
 addAsset('/figma/imgProjectCorvo.svg',corvoLogo.src);
 const sarafanLogo={type:'layered',layers:['a','b','c','d'].map(slot=>{const src=`/assets/projects/sarafan-radio/redesign/radio-logo-vector-${slot}.svg`;addAsset(`/figma/radio-logo-vector-${slot}.svg`,src);if(slot!=='d')addAsset(`/figma/radio-logo-mask-${slot}.svg`,`/assets/projects/sarafan-radio/redesign/radio-logo-mask-${slot}.svg`);return {src,slot};})};
 const intros=[props(exactlyOne(elements(corvo,'ProjectTitleBlock'),'Corvo intro'),context,['name','tags','description','figmaHref']),props(exactlyOne(elements(sarafan,'ProjectTitleBlock'),'Sarafan intro'),context,['name','tags','description','figmaHref'])];
 const corvoSummary=classNode(corvo,'summaryContent');const summaryNotice=exactlyOne(elements(corvoSummary,'Notice'),'summary notice');
 const metricIds=['adaptives','components','tokens','icons'];
 const metrics=variable(corvo,'metrics').elements.map((node,i)=>{
  const value=property(node,'value'),valueParts=value.type==='JSXFragment'?children(value):[];
  return {id:metricIds[i],label:constant(property(node,'label'),context),value:valueParts.length?plain(valueParts[0],context):constant(value,context),...(valueParts.length?{secondaryValue:plain(valueParts[1],context)}:{}),copy:splitCopy(property(node,'copy'),context),action:{label:constant(property(node,'action'),context),href:constant(property(node,'href'),context)}};
 });
 const metricHeading=classNode(corvo,'metricsHeading'),metricAside=classNode(corvo,'metricWideAside');
 const showcase=classNode(corvo,'scenarioShowcase');const showcaseHeader=classNode(corvo,'scenarioShowcaseHeader');
 const corvoPage={templateId:'corvo-redesign-v1',summary:children(corvoSummary).filter(n=>name(n.openingElement.name)==='p').slice(1).map(n=>paragraph(n,context)),notice:{title:plain(exactlyOne(elements(summaryNotice,'p'),'summary title'),context),body:plain(exactlyOne(elements(summaryNotice,'small'),'summary body'),context)},metrics:{heading:plain(exactlyOne(elements(metricHeading,'h2'),'metrics heading'),context),description:plain(exactlyOne(elements(metricHeading,'p'),'metrics description'),context),aside:plain(exactlyOne(elements(metricAside,'p'),'metrics aside'),context),items:metrics},sections:elements(corvo,'Section').map((section,i)=>({id:['context','scenarios','system','result'][i],heading:constant(attribute(section,'title'),context),blocks:copyBlocks(section,context)})),showcase:{eyebrow:plain(classNode(corvo,'scenarioEyebrow'),context),title:plain(exactlyOne(elements(showcaseHeader,'h2'),'showcase title'),context),description:paragraph(elements(showcaseHeader,'p')[1],context),image:imageProps(exactlyOne(elements(showcase,'img'),'showcase image'),'corvo')}};
 const sarafanSummary=classNode(sarafan,'summaryCopy'),sarafanSummarySection=classNode(sarafan,'summary'),flow=classNode(sarafan,'flowCopy'),flowAction=exactlyOne(elements(classNode(sarafan,'flow'),'ControlButton'),'flow action');
 const sarafanSections=elements(sarafan,'PageSection');
 const section=node=>({heading:constant(attribute(node,'title'),context),paragraphs:elements(node,'p').map(n=>paragraph(n,context))});
 const sarafanPage={templateId:'sarafan-redesign-v1',summary:elements(sarafanSummary,'p').map(n=>paragraph(n,context)),notice:{title:plain(exactlyOne(elements(sarafanSummarySection,'strong'),'Sarafan notice title'),context),body:plain(exactlyOne(elements(sarafanSummarySection,'span'),'Sarafan notice body'),context)},flow:{title:plain(exactlyOne(elements(flow,'h2'),'flow heading'),context),paragraphs:elements(flow,'p').map(n=>paragraph(n,context)),action:{label:plain(flowAction,context),href:constant(attribute(flowAction,'href').expression,context)},image:imageProps(exactlyOne(elements(classNode(sarafan,'scenarioCanvas'),'img'),'flow image'),'sarafan-radio')},sections:sarafanSections.slice(0,2).map((node,i)=>({id:['receiving','states'][i],...section(node)})),result:section(sarafanSections[2])};
 const tree=execFileSync('/usr/bin/git',['ls-tree','-r','--name-only',SOURCE_SHA,'--',`${app}/public/responsive-scenes/corvo-v1/`],{cwd:repoRoot,encoding:'utf8'}).trim().split('\n').sort();
 const packagePrefix=`${app}/public/responsive-scenes/corvo-v1/`;
 const mimes={'.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
 const files=tree.map(relative=>{const bytes=read(relative),mime=mimes[path.posix.extname(relative)];if(!mime)throw new Error(`Unsupported approved package file: ${relative}`);return {path:relative.slice(packagePrefix.length),sha256:hash(bytes),size:bytes.length,mime};});
 const digest=hash(Buffer.from(JSON.stringify(files))),assetBase=`/assets/projects/corvo/hero-layout/${digest}/`;
 for(const file of files)addAsset(`/responsive-scenes/corvo-v1/${file.path}`,assetBase+file.path);
 const definitionAst=ast('project-hero/definition.mjs');const layout=constant(variable(definitionAst,'corvoResponsiveHero'),{assetRoot:'/assets/projects/corvo/responsive-hero'});
 const adaptives=[{id:'mobile',minWidth:360,maxWidth:600,presetWidth:595.256245,height:640},{id:'tablet',minWidth:600,maxWidth:1280,presetWidth:1279,height:1100},{id:'desktop',minWidth:1280,maxWidth:1160/.6,presetWidth:1599,height:960}];
 const layoutHero={kind:'layout',chromeProfile:'layout-four-scenes-v1',initialSceneId:layout.initialSceneId,adaptives:{enabled:['mobile','tablet','desktop']},scenes:layout.scenes.map(scene=>({id:scene.id,title:scene.label,source:{kind:'package',entry:`${scene.id}/index.html`,assetBase,files},adaptives:structuredClone(adaptives)}))};
 const rasterAst=ast('project-hero/raster-definition.mjs');const raster=constant(variable(rasterAst,'sarafanRasterHero'),{assetRoot:'/assets/projects/sarafan-radio/raster-hero'}).contexts[0];
 const rasterHero={kind:'raster',initialSlideId:raster.initialSlideId,slides:raster.slides.map(slide=>({id:slide.id,title:slide.title,image:image(slide.src,'sarafan-radio',slide.title)}))};
 const projects=[['corvo',corvoCard,corvoPage,layoutHero],['sarafan-radio',sarafanCard,sarafanPage,rasterHero]].map(([slug,data,page,hero],i)=>{
  const baseline=JSON.parse(read(`content/projects/${slug}.json`).toString('utf8'));
  if (i===0 && context.projectDescription!==data.description) throw new Error('Approved Corvo card and first summary descriptions diverge.');
  return validateProjectDocument({...baseline,logo:i===0?corvoLogo:sarafanLogo,title:data.title,description:data.description,tags:data.tags,detailTags:intros[i].tags,subtitle:intros[i].description,materials:i===0?{...baseline.materials,projectState:'in_progress',fileState:'available',figmaUrl:links.corvoFigma}:{projectState:'completed',fileState:'available',figmaUrl:links.sarafanFigma},redesign:{version:1,card:data.card,page,hero}});
 });
 const externalDependencies=[...new Set(files.filter(f=>f.mime==='text/css').flatMap(f=>[...read(packagePrefix+f.path).toString('utf8').matchAll(/url\(['"]?(https:\/\/[^'")]+)['"]?\)/g)].map(m=>m[1])))];
 return {projects,assets:[...assets.values()].sort((a,b)=>a.publicPath.localeCompare(b.publicPath)),provenance:{origin:'approved-git-code',sourceSha:SOURCE_SHA,files:[...sourceFiles.entries()].map(([relative,file])=>({path:relative,sha256:file.sha256})).sort((a,b)=>a.path.localeCompare(b.path)),externalDependencies}};
}
