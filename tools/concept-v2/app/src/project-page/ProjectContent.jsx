import {Fragment} from 'react';
import {Icon} from '../Controls';

export function ProjectText({content}){
 return content.map((item,index)=>{
  let text=item.text;
  const marks=item.marks??(item.type==='strong'?['strong']:item.type==='emphasis'?['emphasis']:item.type==='underline'?['underline']:[]);
  for(const mark of marks){if(mark==='strong')text=<strong>{text}</strong>;else if(mark==='emphasis')text=<em>{text}</em>;else if(mark==='underline')text=<u>{text}</u>;}
  if(item.type==='link')text=<a href={item.href} {...(item.href.startsWith('https:')?{target:'_blank',rel:'noopener noreferrer'}:{})}>{text}</a>;
  return <Fragment key={index}>{text}</Fragment>;
 });
}
export function ProjectParagraphs({paragraphs}){return paragraphs.map((content,index)=><p key={index}><ProjectText content={content}/></p>);}
export function MetricCopy({paragraphs}){return paragraphs.map((content,index)=><Fragment key={index}>{index>0&&<br/>}<ProjectText content={content}/></Fragment>);}
export function CopyBlocks({blocks,sectionId,styles,Notice}){
 return blocks.map((block,index)=>{
  if(block.type==='paragraph')return <p key={index}><ProjectText content={block.content}/></p>;
  if(block.type==='heading')return <h3 key={index}><ProjectText content={block.content}/></h3>;
  if(block.type==='hardBreak')return <br key={index}/>;
  if(block.type==='notice')return <Notice key={index} icon="/figma/project-corvo/notice-design.svg"><p>{block.title}</p><small>{block.body}</small></Notice>;
  if(block.type==='list'){
   const ordered=block.style==='ordered',check=sectionId==='result'&&!ordered,Tag=ordered?'ol':'ul';
   return <Tag key={index} className={ordered?styles.numberList:check?styles.checkList:styles.arrowList}>{block.items.map((content,itemIndex)=><li key={itemIndex}>{check&&<Icon name="hero-check" className={styles.checkIcon}/>}<ProjectText content={content}/></li>)}</Tag>;
  }
  throw new Error('Unsupported validated project block.');
 });
}
export function RadioProjectSymbol({logo,size}){
 if(logo.type==='image')return <img src={logo.src} width={size??28} height={size??28} alt=""/>;
 return <span className="radio-symbol" {...(size?{style:{width:size,height:size,flexBasis:size}}:{})} aria-hidden="true">{logo.layers.map(({src,slot})=><span key={slot} className={`radio-logo-${slot}`}><img src={src} alt=""/>{slot!=='d'?<img src={`${src.slice(0,src.lastIndexOf('/'))}/radio-logo-mask-${slot}.svg`} alt=""/>:null}</span>)}</span>;
}
