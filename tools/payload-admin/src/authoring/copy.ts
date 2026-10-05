import { replaceValue, valueAt, type Value, type ValuePath } from './model'
export type CopyKind = 'text' | 'link' | 'paragraph' | 'heading' | 'list' | 'hardBreak' | 'tag'
const object = (value: unknown): value is Record<string, Value> => Boolean(value && typeof value==='object' && !Array.isArray(value))
export function copyKinds(document:Value,path:ValuePath):CopyKind[] {
 const list=valueAt(document,path)
 if(!Array.isArray(list)) return []
 if(path.length===1 && ['tags','detailTags'].includes(String(path[0]))) return ['tag']
 if(path[0]!=='redesign'||path[1]!=='page') return []
 const name=path.at(-1)
 if(name==='blocks') return ['paragraph','heading','list','hardBreak']
 if(['summary','paragraphs','copy'].includes(String(name))) return ['paragraph']
 if(name==='items' && object(valueAt(document,path.slice(0,-1))) && (valueAt(document,path.slice(0,-1)) as Record<string,Value>).type==='list') return ['paragraph']
 if(list.length && list.every(item=>object(item)&&['text','link','strong','emphasis','underline'].includes(String(item.type)))) return ['text','link']
 if(name==='content' || (name==='description' && path.at(-2)==='showcase') || (typeof name==='number' && ['summary','paragraphs','copy','items'].includes(String(path.at(-2))))) return ['text','link']
 return []
}
export function appendCopy(document:Value,path:ValuePath,kind:CopyKind):Value {
 if(!copyKinds(document,path).includes(kind)) throw new Error('Содержимое этого списка нельзя менять.')
 const list=valueAt(document,path) as Value[]
 if(list.length>=100) throw new Error('Список поддерживает до100 элементов.')
 const text:Value={type:'text',text:''}
 const node:Value=kind==='tag'?'':kind==='text'?text:kind==='link'?{type:'link',text:'',href:''}:kind==='heading'?{type:'heading',level:3,content:[text]}:kind==='list'?{type:'list',style:'unordered',items:[[text]]}:kind==='hardBreak'?{type:'hardBreak'}:path.at(-1)==='blocks'?{type:'paragraph',content:[text]}:[text]
 return replaceValue(document,path,[...list,node])
}
export function removeCopy(document:Value,path:ValuePath,index:number):Value {
 if(!copyKinds(document,path).length) throw new Error('Содержимое этого списка нельзя менять.')
 const list=valueAt(document,path) as Value[]
 if(!Number.isInteger(index)||index<0||index>=list.length) throw new Error('Элемент не найден.')
 if(object(list[index])&&list[index].type==='notice') throw new Error('Согласованное системное примечание сохраняется.')
 return replaceValue(document,path,list.filter((_,at)=>at!==index))
}
export function setOptionalCopy(document:Value,path:ValuePath,key:string,value:Value|undefined):Value {
 const node=valueAt(document,path)
 if(!object(node)) throw new Error('Поле не найдено.')
 const allowed=(path.length===0&&key==='subtitle') || (path.length===1&&path[0]==='materials'&&key==='figmaUrl') || (path.join('.')==='redesign.card'&&key==='tag') || (path[0]==='redesign'&&path[1]==='page'&&['text','link'].includes(String(node.type))&&key==='marks') || (path[0]==='redesign'&&path[1]==='page'&&path.includes('metrics')&&node.id&&key==='secondaryValue')
 if(!allowed) throw new Error('Это поле не предназначено для редактирования.')
 const next={...node}
 if(value===undefined) delete next[key];else next[key]=value
 return replaceValue(document,path,next)
}
