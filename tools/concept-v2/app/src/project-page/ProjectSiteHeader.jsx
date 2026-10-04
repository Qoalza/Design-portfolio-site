import {ControlButton,Icon} from '../Controls';
import {ProjectHeaderShell} from './ProjectHeaderShell';
import styles from './ProjectSiteHeader.module.css';

export function ProjectSiteHeader({children}){
 return <ProjectHeaderShell><header className={styles.header} data-first-view><div className={styles.headerInner}>
  <a className={styles.brand} href={import.meta.env.BASE_URL} aria-label="На главную"><img src="/figma/project-corvo/header/header-symbol.svg" width="44" height="44" alt=""/><span><b>ARTUR</b><small>Product Designer</small></span></a>
  <nav className={styles.navigation} aria-label="Основная навигация"><a href={import.meta.env.BASE_URL} className="nav-tab"><Icon name="corvo-home" className={styles.headerIcon}/><span className="control-label">Главная</span></a><button type="button" className="nav-tab" disabled><Icon name="corvo-lock" className={styles.headerIcon}/><span className="control-label">Блог</span></button><button type="button" className="nav-tab" disabled><Icon name="corvo-lock" className={styles.headerIcon}/><span className="control-label">Лаборатория</span></button></nav>
  <div className={styles.headerRight}><span className={styles.availability}><img src="/figma/project-corvo/header/header-indicator.svg" width="6" height="8" alt=""/>Открыт к предложениям</span><ControlButton variant="accent" contactMotion className={styles.headerContact} iconRight="corvo-telegram" href="https://t.me/Coco_soul" external>Связаться</ControlButton></div>
 </div></header>{children}</ProjectHeaderShell>;
}
