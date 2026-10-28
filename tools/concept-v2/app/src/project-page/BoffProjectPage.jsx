import {useState} from 'react';
import {TextButton,Icon} from '../Controls';
import {GridPattern} from '../GridPattern';
import {ProjectRasterHero} from '../project-hero/ProjectRasterHero';
import {resolveRasterSelection} from '../project-hero/raster-selection.mjs';
import {ProjectParagraphs} from './ProjectContent';
import {ProjectSiteHeader} from './ProjectSiteHeader';
import {ProjectTitleBlock} from './ProjectTitleBlock';
import {BoffAnimations} from './BoffAnimations';
import {boffHero,boffProject} from './boff-content.mjs';
import shared from './SarafanProjectPage.module.css';
import styles from './BoffProjectPage.module.css';

function BoffHero(){
 const [selection,setSelection]=useState(()=>resolveRasterSelection(boffHero));
 const View=ProjectRasterHero;
 return <View definition={boffHero} selection={selection} onSelectionChange={setSelection}/>;
}
function CopySection({section}){return <section className={shared.section}><div><h2>{section.heading}</h2><ProjectParagraphs paragraphs={section.paragraphs}/>{section.items&&<ul className={styles.list}>{section.items.map(item=><li key={item}>{item}</li>)}</ul>}</div></section>;}
function DecisionCard({item,className=''}){return <article className={`${styles.decision} ${className}`} data-decision={item.id}><div className={styles.media}><GridPattern/><div className={styles.animation} data-boff-animation={item.id} role="img" aria-label={item.title}/></div><div className={styles.decisionCopy}><h3>{item.title}</h3><ProjectParagraphs paragraphs={item.paragraphs}/></div></article>;}

export function BoffProjectPage(){
 const project=boffProject,items=project.decisions.items;
 return <div className={shared.page}>
  <ProjectSiteHeader><div className={shared.crumbRow}><nav className={shared.crumb} aria-label="Хлебные крошки"><TextButton iconLeft="imgColor" iconOnly href={import.meta.env.BASE_URL} aria-label="На главную"/><span>/</span><TextButton aria-current="page">B.Off</TextButton></nav></div></ProjectSiteHeader>
  <main>
   <ProjectTitleBlock name={project.title} year={project.year} tags={project.tags} description={project.description} figmaHref={project.figmaHref}/>
   <div className={shared.hero} data-first-view><BoffHero/></div>
   <section className={`${shared.summary} ${styles.summary}`}><div><div className={shared.summaryCopy}><ProjectParagraphs paragraphs={project.summary}/></div><aside><Icon name="sarafan-info" size={20} className={shared.info}/><div><strong>{project.notice.title}</strong><span>{project.notice.body}</span></div></aside></div></section>
   <div className={`${shared.receiving} ${styles.longForm}`}><CopySection section={project.context}/><CopySection section={project.work}/></div>
   <section className={styles.decisions} aria-labelledby="boff-decisions-title"><div className={styles.decisionsHeading}><h2 id="boff-decisions-title">{project.decisions.heading}</h2><p>{project.decisions.description}</p></div><BoffAnimations className={styles.decisionsInner}><div className={styles.panelPair}><DecisionCard item={items[0]}/><DecisionCard item={items[1]}/></div><div className={styles.bottomRow}><DecisionCard item={items[2]}/><DecisionCard item={items[3]}/></div></BoffAnimations></section>
   <div className={shared.hatch} aria-hidden="true"/>
   <section className={`${shared.section} ${shared.result} ${styles.result}`}><div><h2>{project.result.heading}</h2><ProjectParagraphs paragraphs={project.result.paragraphs}/></div></section>
  </main>
  <footer className={shared.footer}><div><span className={shared.footerMain}><Icon name="corvo-footer"/>Разработка и Дизайн Артур А.</span><span>2026</span></div></footer>
 </div>;
}
