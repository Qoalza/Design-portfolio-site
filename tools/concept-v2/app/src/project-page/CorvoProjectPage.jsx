import {ProjectDocumentHero} from '../project-hero/ProjectDocumentHero';
import {ControlButton,Icon} from '../Controls';
import {GridPattern} from '../GridPattern';
import {HoverMorphAction} from '../morph-icon/HoverMorphAction';
import {componentIcon,figmaIcon,metricIcon,stackIcon} from '../morph-icon/icons.mjs';
import {ProjectText,ProjectParagraphs,MetricCopy,CopyBlocks} from './ProjectContent';
import {ProjectSiteHeader} from './ProjectSiteHeader';
import {ProjectTitleBlock} from './ProjectTitleBlock';
import styles from './CorvoProjectPage.module.css';

function SiteHeader({project}){
 return <ProjectSiteHeader>
  <div className={styles.crumbRow}><nav className={styles.crumb} aria-label="Хлебные крошки"><ControlButton variant="ghost" iconLeft="imgColor" iconOnly href={import.meta.env.BASE_URL} className={styles.crumbHome} aria-label="На главную"/><span>/</span><ControlButton variant="ghost" iconLeftNode={<img src={project.logo.src} width="16" height="16" alt="" aria-hidden="true"/>} className={styles.crumbProject} aria-current="page">{project.title}</ControlButton></nav></div>
 </ProjectSiteHeader>;
}

function ProjectIntro({project}){
 return <ProjectTitleBlock name={project.title} logo={<img src={project.logo.src} width="44" height="44" alt=""/>} status={project.materials.projectState==='in_progress'?'В процессе подготовки':'Завершён'} tags={project.detailTags} description={project.subtitle} figmaHref={project.materials.fileState==='available'?project.materials.figmaUrl:undefined}/>;
}

function Notice({children,icon}){
 return <div className={styles.notice}><img className={styles.noticeIcon} src={icon} width="20" height="20" alt="" aria-hidden="true"/><div>{children}</div></div>;
}

const metricIcons={adaptives:figmaIcon,components:componentIcon,tokens:stackIcon,icons:metricIcon};

function Metrics({page}){
 const metrics=page.metrics.items.map(item=>({...item,copy:<MetricCopy paragraphs={item.copy}/>,value:item.secondaryValue?<><strong>{item.value}</strong><em>{item.secondaryValue}</em></>:item.value,action:item.action.label,href:item.action.href,icon:metricIcons[item.id]}));
 return <section className={styles.metrics} aria-labelledby="metrics-title"><div className={styles.metricsHeading}><h2 id="metrics-title">{page.metrics.heading}</h2><p>{page.metrics.description}</p></div><div className={styles.metricsContent}><article className={`${styles.metric} ${styles.metricWide}`}><div className={styles.metricWideMain}><div className={styles.metricHeading}><p>{metrics[0].label}</p><h3>{metrics[0].value}</h3></div><p>{metrics[0].copy}</p></div><aside className={styles.metricWideAside}><p>{page.metrics.aside}</p><HoverMorphAction className={styles.action} variant="neutral" icon={metrics[0].icon} href={metrics[0].href} external>{metrics[0].action}</HoverMorphAction></aside></article><div className={styles.metricRow}>{metrics.slice(1).map(metric=><article className={styles.metric} key={metric.label}><div className={styles.metricHeading}><p>{metric.label}</p><h3 className={styles.metricValue}>{metric.value}</h3></div><p>{metric.copy}</p><HoverMorphAction className={styles.action} variant="light" icon={metric.icon} href={metric.href} external>{metric.action}</HoverMorphAction></article>)}</div></div></section>;
}

function Section({title,children,className=''}){return <section className={`${styles.contentSection} ${className}`}><div className={styles.copyColumn}><h2>{title}</h2>{children}</div></section>;}

function ScenarioShowcase({showcase}){
 return <section className={styles.scenarioShowcase} aria-labelledby="scenario-showcase-title">
  <div className={styles.scenarioShowcaseHeader}><div><p className={styles.scenarioEyebrow}>{showcase.eyebrow}</p><h2 id="scenario-showcase-title">{showcase.title}</h2><p><ProjectText content={showcase.description}/></p></div></div>
  <div className={styles.scenarioMedia}>
   <div className={styles.scenarioHatch} aria-hidden="true"/>
   <div className={styles.scenarioCanvas}><GridPattern/><img src={showcase.image.src} width="1015" height="902" alt={showcase.image.alt}/></div>
   <div className={styles.scenarioHatch} aria-hidden="true"/>
  </div>
 </section>;
}

function Content({project}){
 const page=project.redesign.page;
 return <main className={styles.content}>
  <section className={styles.summary}><div className={styles.summaryInner}><div className={styles.summaryContent}><p>{project.description}</p><ProjectParagraphs paragraphs={page.summary}/><Notice icon="/figma/project-corvo/notice-summary.svg"><p>{page.notice.title}</p><small>{page.notice.body}</small></Notice></div></div></section>
  <Metrics page={page}/>
  <div className={styles.longForm}>
   <Section title={page.sections[0].heading} className={styles.contextSection}><CopyBlocks blocks={page.sections[0].blocks} sectionId={page.sections[0].id} styles={styles} Notice={Notice}/></Section>
   <Section title={page.sections[1].heading} className={styles.scenarioTextSection}><CopyBlocks blocks={page.sections[1].blocks} sectionId={page.sections[1].id} styles={styles} Notice={Notice}/></Section>
  </div>
  <ScenarioShowcase showcase={page.showcase}/>
  <div className={styles.designWrap}>
   <Section title={page.sections[2].heading} className={styles.designSection}><CopyBlocks blocks={page.sections[2].blocks} sectionId={page.sections[2].id} styles={styles} Notice={Notice}/></Section>
  </div>
  <div className={styles.caseHatch} aria-hidden="true"/>
  <div className={styles.resultWrap}><Section title={page.sections[3].heading} className={styles.result}><CopyBlocks blocks={page.sections[3].blocks} sectionId={page.sections[3].id} styles={styles} Notice={Notice}/></Section></div>
 </main>;
}

function Footer(){return <footer className={styles.footer}><div className={styles.footerText}><span className={styles.footerMain}><Icon name="corvo-footer" className={styles.footerIcon}/>Разработка и Дизайн Артур А.</span><span>2026</span></div></footer>;}

export function CorvoProjectPage({project}){return <div className={styles.page}><SiteHeader project={project}/><ProjectIntro project={project}/><div className={styles.hero} data-first-view><ProjectDocumentHero project={project}/></div><Content project={project}/><Footer/></div>;}
