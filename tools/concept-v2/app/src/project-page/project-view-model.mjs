export {projectImageSource} from '../../../../../src/lib/project-image-source.mjs';
import {projectImageSource} from '../../../../../src/lib/project-image-source.mjs';

// Approved labels are a Portfolio presentation concern; published DTOs stay intact.
const authoredTagCase=new Map([
 ['corvo',new Map([['SAAS','SaaS'],['PARTNER PLATFORM','Partner Platform']])],
 ['sarafan-radio',new Map([['EVENT','Event']])],
]);
function displayTags(project,tags){const labels=authoredTagCase.get(project.slug);return labels?tags.map(tag=>labels.get(tag)??tag):tags;}

// Consumers receive documents validated by the producer. No Node imports or secondary content owner.
export function projectCardView(project,base='/'){
 return {id:project.slug,title:project.title,categories:displayTags(project,project.tags),description:project.description,logo:project.designProfile==='corvo-v1'?'corvo':'radio',logoData:project.logo,tag:project.redesign.card.tag,preview:{back:projectImageSource(project.redesign.card.preview.back),front:projectImageSource(project.redesign.card.preview.front),ariaLabel:project.designProfile==='corvo-v1'?'Интерфейс Corvo':'Интерфейс Сараффан.Радио',frontAlt:project.redesign.card.preview.front.alt},actions:{details:{href:project.detailAvailable?`${base}projects/${project.slug}`:undefined},figma:{href:project.materials.fileState==='available'?project.materials.figmaUrl:undefined}}};
}

export function projectDetailDocument(projects,slug){
 const project=projects.find(project=>project.slug===slug&&project.visibility==='published'&&project.detailAvailable&&project.redesign);
 return project&&authoredTagCase.has(project.slug)?{...project,tags:displayTags(project,project.tags),detailTags:displayTags(project,project.detailTags)}:project;
}

export function projectDetailForPath(projects,pathname){
 const match=/^\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(pathname);
 if(!match)return undefined;
 const project=projectDetailDocument(projects,match[1]);
 return ['corvo-v1','sarafan-v1'].includes(project?.designProfile)?project:undefined;
}
