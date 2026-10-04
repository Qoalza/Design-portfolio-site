import {ControlButton,Icon} from '../Controls';
import {GridPattern} from '../GridPattern';
import {ProjectDocumentHero} from '../project-hero/ProjectDocumentHero';
import {ProjectParagraphs,RadioProjectSymbol} from './ProjectContent';
import {ProjectSiteHeader} from './ProjectSiteHeader';
import {ProjectTitleBlock} from './ProjectTitleBlock';
import styles from './SarafanProjectPage.module.css';

function Hatch(){return <div className={styles.hatch} aria-hidden="true"/>;}
function PageSection({title,children,className=''}){return <section className={`${styles.section} ${className}`}><div><h2>{title}</h2>{children}</div></section>;}
function ScenarioFlow({page}){return <><section className={styles.flow}><div className={styles.flowInner}><div className={styles.flowCopy}><h2>{page.flow.title}</h2><div><ProjectParagraphs paragraphs={page.flow.paragraphs}/></div></div><ControlButton variant="light" iconRight="hero-flow" href={page.flow.action.href} external>{page.flow.action.label}</ControlButton></div></section><section className={styles.scenarioMedia} aria-label="Сценарий оформления подарков"><div className={styles.scenarioSide} aria-hidden="true"/><div className={styles.scenarioCanvas}><GridPattern/><img src={page.flow.image.src} width="1047" height="860" alt={page.flow.image.alt}/></div><div className={styles.scenarioSide} aria-hidden="true"/></section></>;}

export function SarafanProjectPage({project}){
 const page=project.redesign.page;
 return <div className={styles.page}>
  <ProjectSiteHeader>
  <div className={styles.crumbRow}><nav className={styles.crumb} aria-label="Хлебные крошки"><ControlButton variant="ghost" iconLeft="imgColor" iconOnly href={import.meta.env.BASE_URL} className={styles.crumbHome} aria-label="На главную"/><span>/</span><ControlButton variant="ghost" iconLeftNode={<RadioProjectSymbol logo={project.logo} size={16}/>} className={styles.crumbProject} aria-current="page">{project.title}</ControlButton></nav></div>
  </ProjectSiteHeader><main>
   <ProjectTitleBlock name={project.title} logo={<RadioProjectSymbol logo={project.logo} size={44}/>} status={<Icon name="sarafan-flag" className={styles.flag}/>} tags={project.detailTags} description={project.subtitle} figmaHref={project.materials.fileState==='available'?project.materials.figmaUrl:undefined}/>
   <div className={styles.hero} data-first-view><ProjectDocumentHero project={project}/></div>
   <section className={styles.summary}><div><div className={styles.summaryCopy}><ProjectParagraphs paragraphs={page.summary}/></div><aside><Icon name="sarafan-info" size={20} className={styles.info}/><div><strong>{page.notice.title}</strong><span>{page.notice.body}</span></div></aside></div></section>
   <ScenarioFlow page={page}/>
   <section className={styles.receiving}><PageSection title={page.sections[0].heading}><ProjectParagraphs paragraphs={page.sections[0].paragraphs}/></PageSection><PageSection title={page.sections[1].heading}><ProjectParagraphs paragraphs={page.sections[1].paragraphs}/></PageSection></section>
   <Hatch/>
   <PageSection title={page.result.heading} className={styles.result}><ProjectParagraphs paragraphs={page.result.paragraphs}/></PageSection>
  </main>
  <footer className={styles.footer}><div><span className={styles.footerMain}><Icon name="corvo-footer"/>Разработка и Дизайн Артур А.</span><span>2026</span></div></footer>
 </div>;
}
