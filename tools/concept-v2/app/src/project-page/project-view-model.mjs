export {projectImageSource} from '../../../../../src/lib/project-image-source.mjs';
import {projectImageSource} from '../../../../../src/lib/project-image-source.mjs';
// Consumers receive documents validated by the producer. No Node imports or secondary content owner.
export function projectCardView(project,base='/'){
 return {id:project.slug,title:project.title,categories:project.tags,description:project.description,logo:project.designProfile==='corvo-v1'?'corvo':'radio',logoData:project.logo,tag:project.redesign.card.tag,preview:{back:projectImageSource(project.redesign.card.preview.back),front:projectImageSource(project.redesign.card.preview.front),ariaLabel:project.designProfile==='corvo-v1'?'Интерфейс Corvo':'Интерфейс Сараффан.Радио',frontAlt:project.redesign.card.preview.front.alt},actions:{details:{href:project.detailAvailable?`${base}projects/${project.slug}`:undefined},figma:{href:project.materials.fileState==='available'?project.materials.figmaUrl:undefined}}};
}

export function projectDetailDocument(projects,slug){
 return projects.find(project=>project.slug===slug&&project.visibility==='published'&&project.detailAvailable&&project.redesign);
}

export function projectDetailForPath(projects,pathname){
 const match=/^\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(pathname);
 if(!match)return undefined;
 const project=projectDetailDocument(projects,match[1]);
 return ['corvo-v1','sarafan-v1'].includes(project?.designProfile)?project:undefined;
}
