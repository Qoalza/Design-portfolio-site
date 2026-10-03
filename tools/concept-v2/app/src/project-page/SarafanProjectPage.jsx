import {useEffect,useRef,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {ControlButton} from '../Controls';
import {V2Button} from '../v2/Controls';
import {ProjectRasterHero} from '../project-hero/ProjectRasterHero';
import {sarafanRasterHero} from '../project-hero/raster-definition.mjs';
import {HoverMorphAction} from '../morph-icon/HoverMorphAction';
import {StrokeMorphIcon} from '../morph-icon/StrokeMorphIcon';
import {checkMorphIcon,figmaIcon,link02Icon} from '../morph-icon/icons.mjs';
import {restartFeedbackTimer} from '../morph-icon/copy-feedback.mjs';
import {projectLinks} from '../project-links.mjs';
import styles from './SarafanProjectPage.module.css';

const actionLayout={layout:{type:'spring',stiffness:420,damping:38,mass:.8}};
const radioLayers=['a','b','c','d'];

function RadioSymbol(){return <span className="radio-symbol" aria-hidden="true">{radioLayers.map(layer=><span key={layer} className={`radio-logo-${layer}`}><img src={`/figma/radio-logo-vector-${layer}.svg`} alt=""/>{layer!=='d'?<img src={`/figma/radio-logo-mask-${layer}.svg`} alt=""/>:null}</span>)}</span>;}
function useCopy(){const [copied,setCopied]=useState(false),timer=useRef(null);useEffect(()=>()=>clearTimeout(timer.current),[]);return {copied,copy:async()=>{try{await navigator.clipboard.writeText(location.href);setCopied(true);timer.current=restartFeedbackTimer(timer.current,setTimeout,clearTimeout,()=>setCopied(false));}catch{setCopied(false);}}};}
function Hatch(){return <div className={styles.hatch} aria-hidden="true"/>;}
function PageSection({title,children,className=''}){return <section className={`${styles.section} ${className}`}><div><h2>{title}</h2>{children}</div></section>;}

export function SarafanProjectPage(){
 const reduceMotion=useReducedMotion();
 const {copied,copy}=useCopy();
 const transition=reduceMotion?{layout:{duration:0}}:actionLayout;
 return <div className={styles.page}>
  <header className={styles.header} data-first-view><div className={styles.headerInner}><a className={styles.brand} href={import.meta.env.BASE_URL} aria-label="На главную"><img src="/figma/imgSymbol.svg" width="44" height="44" alt=""/><span><b>ARTUR</b><small>Product Designer</small></span></a><nav className={styles.nav} aria-label="Основная навигация"><a href={import.meta.env.BASE_URL} className="nav-tab selected"><span className="control-label">Главная</span></a><button type="button" className="nav-tab" disabled>Блог</button><button type="button" className="nav-tab" disabled>Лаборатория</button></nav><div className={styles.headerRight}><span>Открыт к предложениям</span><ControlButton variant="accent" href="https://t.me/Coco_soul" external>Связаться</ControlButton></div></div></header>
  <div className={styles.crumbRow}><nav className={styles.crumb} aria-label="Хлебные крошки"><V2Button variant="ghost" iconLeft="imgColor" iconOnly href={import.meta.env.BASE_URL} aria-label="На главную"/><span>/</span><span>Сараффан.Радио</span></nav></div>
  <main>
   <section className={styles.intro} data-first-view><div className={styles.workArea}><div className={styles.tags}><span>B2B2C</span><i/><span>EVENT</span><b/><span>2026</span></div><div className={styles.heading}><div><div className={styles.name}><RadioSymbol/><h1>Сараффан.Радио</h1></div><p>Платформа для организации мероприятий</p></div><motion.div layout layoutDependency={copied} transition={transition} className={styles.actions}><ControlButton motionLayout layoutTransition={transition} onClick={copy} iconRightNode={<StrokeMorphIcon icon={copied?checkMorphIcon:link02Icon}/>}>{copied?'Скопировано':'Копировать ссылку'}</ControlButton><HoverMorphAction motionLayout="position" layoutTransition={transition} variant="neutral" icon={figmaIcon} href={projectLinks.sarafanFigma} external>Figma</HoverMorphAction></motion.div></div></div></section>
   <div className={styles.hero} data-first-view><ProjectRasterHero definition={sarafanRasterHero}/></div>
   <section className={styles.summary}><div><p>«Сараффан.Радио» — платформа для организации мероприятий, объединяющая товары, услуги и специалистов. В тестовом задании я работал с оформлением подарков: проверкой заказа, настройкой получения и переходом к оплате.</p><p>Исходной точкой был wireframe одной страницы. Задача состояла в том, чтобы предложить визуальное решение и проработать структуру и логику оформления. При необходимости можно было пересматривать не только интерфейс, но и сам сценарий.</p><p>Часть бизнес-вопросов я уточнил в общении с HR и дизайнером команды. Эти ответы помогли определить контекст и ограничения, а недостающие участки сценария я описал как рабочие гипотезы, требующие дальнейшей проверки.</p><aside><strong>По условиям тестового приоритетом были визуал и логика</strong><span>Детальную проработку компонентной системы, унификацию отступов и сетки ограничили, чтобы уложиться в отведённое время.</span></aside></div></section>
   <PageSection title="То, над чем" className={styles.flow}><h3>Сценарий оформления</h3><p>Чтобы не проектировать страницу оформления в отрыве от продукта, сначала определил роли клиента и менеджера и место заказа в подготовке мероприятия. Получился сценарий, в котором клиент может оформить подарки самостоятельно или передать задачу менеджеру. При делегировании менеджер готовит заказ, клиент проверяет его и либо переходит к оплате, либо возвращает на корректировку.</p><p>User Flow помог зафиксировать развилки, возвраты и условия готовности заказа ещё до детальной работы с интерфейсом.</p><HoverMorphAction variant="light" icon={figmaIcon} href={projectLinks.sarafanFlow} external>Полная схема в FigJam</HoverMorphAction></PageSection>
   <PageSection title="Настройка получения"><p>Основная сложность была в том, что один заказ может содержать несколько вариантов и единиц товара с разными условиями получения. Поэтому настройки построил в два уровня: общие — когда условия совпадают, и индивидуальные — когда адрес, способ или время отличаются. Для одинаковых единиц с разными условиями отдельно предусмотрел возможность разделения на группы.</p><p>Набор данных зависит от способа получения: курьер требует подробного адреса и времени, пункт выдачи — только выбора места. Повторяющиеся данные можно переиспользовать из мероприятия или сохранённых адресов.</p></PageSection>
   <PageSection title="Состояния заказа"><p>Заказ не всегда готов к оформлению: могут отсутствовать данные мероприятия, закончиться товар или оказаться недоступной доставка. Поэтому готовность заказа связал с конкретными условиями, которые пользователь может исправить. Вместо общего сообщения об ошибке система указывает причину и следующее действие: заполнить данные, изменить адрес или заменить товар.</p><p>Пустые состояния работают по тому же принципу — не просто сообщают об отсутствии данных, а дают понятный следующий шаг.</p></PageSection>
   <Hatch/>
   <PageSection title="Результат работы" className={styles.result}><p>В результате я подготовил концепт оформления подарков, в котором связаны данные мероприятия, состав заказа и условия получения. В макетах показал основной экран, общие и индивидуальные настройки доставки, а также пустые и проблемные состояния.</p><p>User Flow дополнил визуальное решение: зафиксировал путь клиента и менеджера, проверки готовности заказа и возвраты на корректировку. Решения за пределами исходного wireframe опирались на уточнения команды и рабочие гипотезы; части сценария, которые не вошли в детальную проработку, были обозначены отдельно.</p><p>Тестовое получило положительную оценку команды. После его проверки компания поставила набор на паузу, поэтому дальнейший процесс найма не продолжился.</p></PageSection>
  </main>
  <footer className={styles.footer}><span>Разработка и Дизайн Артур А.</span><span>2026</span></footer>
 </div>;
}
