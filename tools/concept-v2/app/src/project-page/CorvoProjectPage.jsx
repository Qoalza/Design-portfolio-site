import {ProjectResponsiveHero} from '../project-hero/ProjectResponsiveHero';
import {corvoResponsiveHero} from '../project-hero/definition.mjs';
import {ControlButton,Icon} from '../Controls';
import {GridPattern} from '../GridPattern';
import {HoverMorphAction} from '../morph-icon/HoverMorphAction';
import {componentIcon,figmaIcon,metricIcon,stackIcon} from '../morph-icon/icons.mjs';
import {projectLinks} from '../project-links.mjs';
import {ProjectSiteHeader} from './ProjectSiteHeader';
import {ProjectTitleBlock} from './ProjectTitleBlock';
import styles from './CorvoProjectPage.module.css';

const projectDescription='B2B SaaS-платформа для управления партнёрской программой и рекламным трафиком. Она объединяет работу аффилиатов, компаний и команды продукта: подключение к программе, условия сотрудничества, кампании, рекламные материалы и статистику.';
function SiteHeader(){
 return <ProjectSiteHeader>
  <div className={styles.crumbRow}><nav className={styles.crumb} aria-label="Хлебные крошки"><ControlButton variant="ghost" iconLeft="imgColor" iconOnly href={import.meta.env.BASE_URL} className={styles.crumbHome} aria-label="На главную"/><span>/</span><ControlButton variant="ghost" iconLeftNode={<img src="/figma/imgProjectCorvo.svg" width="16" height="16" alt="" aria-hidden="true"/>} className={styles.crumbProject} aria-current="page">Corvo</ControlButton></nav></div>
 </ProjectSiteHeader>;
}

function ProjectIntro(){
 return <ProjectTitleBlock name="Corvo" logo={<img src="/figma/imgProjectCorvo.svg" width="44" height="44" alt=""/>} status="В процессе подготовки" tags={['B2B','SAAS','PARTNER PLATFORM']} description="Система для управления партнёрской программой" figmaHref={projectLinks.corvoFigma}/>;
}

function Notice({children,icon}){
 return <div className={styles.notice}><img className={styles.noticeIcon} src={icon} width="20" height="20" alt="" aria-hidden="true"/><div>{children}</div></div>;
}

const metrics=[
 {label:'Адаптивные версии',value:'3',copy:<>Desktop, Tablet и Mobile.<br/>Они есть во всех пяти рабочих страницах макетов: авторизация, кампании, статистика, My space и контакты.</>,wide:true,action:'Figma',href:projectLinks.corvoFigma,icon:figmaIcon},
 {label:'Групп компонентов',value:'26',copy:'10 групп в BASE и 16 в SYSTEM: кнопки, поля ввода, переключатели, таблицы, фильтры, модальные окна и другие',action:'Библиотека',href:projectLinks.corvoComponents,icon:componentIcon},
 {label:'Токенов',value:'1 056',copy:'151 переменная в Base, 315 в Global и 590 в Component. Это количество переменных, а не факт их использования.',action:'Variable',href:projectLinks.corvoVariables,icon:stackIcon},
 {label:'Уникальных иконок / всех иконок',value:<><strong>129</strong><em>/ 262</em></>,copy:'Множество различных иконок для навигации, статусов, пользователей, данных и других сценариев',action:'Иконки',href:projectLinks.corvoIcons,icon:metricIcon},
];

function Metrics(){
 return <section className={styles.metrics} aria-labelledby="metrics-title"><div className={styles.metricsHeading}><h2 id="metrics-title">В цифрах</h2><p>Общие данные по структуре проекта</p></div><div className={styles.metricsContent}><article className={`${styles.metric} ${styles.metricWide}`}><div className={styles.metricWideMain}><div className={styles.metricHeading}><p>{metrics[0].label}</p><h3>{metrics[0].value}</h3></div><p>{metrics[0].copy}</p></div><aside className={styles.metricWideAside}><p>Макеты собраны в одном файле: основные сценарии, состояния и их адаптация под три размера экрана</p><HoverMorphAction className={styles.action} variant="neutral" icon={metrics[0].icon} href={metrics[0].href} external>{metrics[0].action}</HoverMorphAction></aside></article><div className={styles.metricRow}>{metrics.slice(1).map(metric=><article className={styles.metric} key={metric.label}><div className={styles.metricHeading}><p>{metric.label}</p><h3 className={styles.metricValue}>{metric.value}</h3></div><p>{metric.copy}</p><HoverMorphAction className={styles.action} variant="light" icon={metric.icon} href={metric.href} external>{metric.action}</HoverMorphAction></article>)}</div></div></section>;
}

function Section({title,children,className=''}){return <section className={`${styles.contentSection} ${className}`}><div className={styles.copyColumn}><h2>{title}</h2>{children}</div></section>;}

function ScenarioShowcase(){
 return <section className={styles.scenarioShowcase} aria-labelledby="scenario-showcase-title">
  <div className={styles.scenarioShowcaseHeader}><div><p className={styles.scenarioEyebrow}>Один из сценариев</p><h2 id="scenario-showcase-title">Как создать медиа компанию?</h2><p>При создании медиакомпании пользователь выбирает её видимость, указывает название, ссылку и географию размещения, затем подключает план вознаграждения. Если готовые планы не подходят, новый можно настроить прямо в этом сценарии: задать долю выручки, CPA, условия достижения целей и параметры выплат.</p></div></div>
  <div className={styles.scenarioMedia}>
   <div className={styles.scenarioHatch} aria-hidden="true"/>
   <div className={styles.scenarioCanvas}><GridPattern/><img src="/figma/project-corvo/media-campaign-creation.png" width="1015" height="902" alt="Интерфейс создания медиа компании"/></div>
   <div className={styles.scenarioHatch} aria-hidden="true"/>
  </div>
 </section>;
}

function Content(){
 return <main className={styles.content}>
  <section className={styles.summary}><div className={styles.summaryInner}><div className={styles.summaryContent}><p>{projectDescription}</p><p>На момент моего подключения техническая часть уже развивалась, но дизайна и фронтенда не было. Я формировал интерфейс продукта с нуля: определил визуальное направление, структуру разделов, сценарии и состояния, выстроил дизайн-систему и процесс взаимодействия между дизайном и разработкой — от согласования решений до проверки их реализации.</p><Notice icon="/figma/project-corvo/notice-summary.svg"><p>Продемонстрирован частично</p><small>Проект опубликован частично, остальная часть находится в процессе подготовке к демонстрации</small></Notice></div></div></section>
  <Metrics/>
  <div className={styles.longForm}>
   <Section title="Контекст и задача" className={styles.contextSection}><p>Работа началась не с единого готового ТЗ. Требования формировались из постановок проджект-менеджера, работы с бизнес-аналитиком, требований аффилиатов, рыночных примеров и обсуждений с разработкой. Необходимо было собрать из этой информации рабочую модель продукта:</p><ul className={styles.arrowList}><li>определить роли;</li><li>связи между сущностями;</li><li>доступы и состояния.</li></ul><p>А затем разложить её на последовательные сценарии и интерфейсы. Эта модель стала основой дальнейшей проработки продукта — от внутренних операций команды до работы аффилиата в личном кабинете.</p></Section>
   <Section title="Проработка сценариев" className={styles.scenarioTextSection}><p>Я последовательно прорабатывал сценарии для разных ролей:</p><ol className={styles.numberList}><li>Подключение и ведение аффилиатов;</li><li>Работу с кампаниями, создание медиа айтемов;</li><li>Анализ статистики.</li></ol><p>Для каждого сценария определял состав данных, ключевые действия, статусы и связанные состояния интерфейса.</p><p>Решения сначала проходили согласование с проджект-менеджером, аналитиками и другими заинтересованными сторонами. После этого их необходимо было проверить вместе с разработкой: оценить реализацию, уточнить ограничения и найти вариант, который сохраняет смысл решения и укладывается в возможности продукта.</p></Section>
  </div>
  <ScenarioShowcase/>
  <div className={styles.designWrap}>
   <Section title="Дизайн-система" className={styles.designSection}><p>Параллельно с интерфейсами я выстраивал дизайн-систему: определял структуру компонентов, состояния и семантику токенов.</p><h3>Требования</h3><p>Система должна была стать не отдельной библиотекой, а рабочей основой продукта: новые разделы должны проектироваться по единым правилам и не расходиться с уже принятыми решениями. При этом библиотека должна была оставаться достаточно гибкой, чтобы в дальнейшем её можно было развивать в самостоятельный B2B-продукт.</p><h3>Процесс работы</h3><p>Я задавал структуру системы и проводил ревью компонентов, которые собирал младший дизайнер. Позже он подключался к макетам: сначала к отдельным частям разделов, затем — к самостоятельной работе с моим ревью.</p><p>Отдельно согласовывали дизайн-систему с разработкой. Для адаптивного поведения уже готовых компонентов мы совместно нашли локальное решение: добавили дополнительный слой Behavior поверх существующей библиотеки. Он позволил разработке сохранить единую механику компонентов в коде, а дизайну — не пересобирать всю систему с нуля. Это не универсальный паттерн, а решение, принятое для конкретной архитектуры проекта.</p><Notice icon="/figma/project-corvo/notice-design.svg"><p>Продемонстрирована частично</p><small>Детальная документация по дизайн-системе и правилам использования готовится к публикации. В публичном кейсе будут показаны её применение в продукте и ключевые принципы.</small></Notice></Section>
  </div>
  <div className={styles.caseHatch} aria-hidden="true"/>
  <div className={styles.resultWrap}><Section title="Результат работы" className={styles.result}><p>В рамках проекта спроектированы интерфейсы основных процессов партнёрской программы:</p><ul className={styles.checkList}><li><Icon name="hero-check" className={styles.checkIcon}/>подключение и ведение аффилиатов;</li><li><Icon name="hero-check" className={styles.checkIcon}/>управление кампаниями и условиями;</li><li><Icon name="hero-check" className={styles.checkIcon}/>создание рекламных материалов;</li><li><Icon name="hero-check" className={styles.checkIcon}/>работа со статистикой.</li></ul><p>При этом работа не ограничилась отдельными экранами. Параллельно была собрана дизайн-система, зафиксированы общие правила для компонентов и состояний и выстроен процесс взаимодействия дизайна с разработкой.</p><p>В результате получился не просто набор макетов, а единая интерфейсная база: с общей логикой, компонентами и правилами, на которую команда могла опираться при дальнейшем развитии продукта.</p></Section></div>
 </main>;
}

function Footer(){return <footer className={styles.footer}><div className={styles.footerText}><span className={styles.footerMain}><Icon name="corvo-footer" className={styles.footerIcon}/>Разработка и Дизайн Артур А.</span><span>2026</span></div></footer>;}

export function CorvoProjectPage(){return <div className={styles.page}><SiteHeader/><ProjectIntro/><div className={styles.hero} data-first-view><ProjectResponsiveHero definition={corvoResponsiveHero}/></div><Content/><Footer/></div>;}
