import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { getCatalogProjects, type Project, type ProjectPlatform } from "../../lib/projects";
import styles from "./page.module.css";

const assetRoot = "/assets/homepage";

const platformIcons: Record<ProjectPlatform, string> = {
  Desktop: "/assets/projects/corvo/desktop.svg",
  Tablet: "/assets/projects/corvo/tablet.svg",
  Mobile: "/assets/projects/corvo/mobile.svg",
};

function RadioSymbol() {
  return (
    <span className={styles.radioSymbol} aria-hidden="true">
      <span className={styles.radioA}><Image src={`${assetRoot}/radio-logo-vector-a.svg`} alt="" fill sizes="15px" /></span>
      <span className={styles.radioA}><Image src={`${assetRoot}/radio-logo-mask-a.svg`} alt="" fill sizes="15px" /></span>
      <span className={styles.radioB}><Image src={`${assetRoot}/radio-logo-vector-b.svg`} alt="" fill sizes="5px" /></span>
      <span className={styles.radioB}><Image src={`${assetRoot}/radio-logo-mask-b.svg`} alt="" fill sizes="5px" /></span>
      <span className={styles.radioC}><Image src={`${assetRoot}/radio-logo-vector-c.svg`} alt="" fill sizes="15px" /></span>
      <span className={styles.radioC}><Image src={`${assetRoot}/radio-logo-mask-c.svg`} alt="" fill sizes="15px" /></span>
      <span className={styles.radioD}><Image src={`${assetRoot}/radio-logo-vector-d.svg`} alt="" fill sizes="5px" /></span>
    </span>
  );
}

function ProjectVisual({ slug }: { slug: string }) {
  if (slug === "corvo") {
    return (
      <div className={`${styles.visual} ${styles.corvoVisual}`} aria-hidden="true">
        <Image className={styles.corvoBack} src={`${assetRoot}/corvo-dashboard.png`} alt="" width={2960} height={2400} />
        <Image className={styles.corvoFront} src={`${assetRoot}/corvo-product.png`} alt="" width={2960} height={2400} />
      </div>
    );
  }

  const source = slug === "sarafan-radio"
    ? "/assets/projects/catalog/sarafan-radio.png"
    : "/assets/projects/catalog/boff-transactions.png";

  return (
    <div className={styles.compactVisual} aria-hidden="true">
      <div className={styles.browserFrame}>
        <span className={styles.browserDots}><i /><i /><i /></span>
        <Image src={source} alt="" fill sizes="468px" />
      </div>
    </div>
  );
}

function ProjectDetails({ project }: { project: Project }) {
  return (
    <div className={styles.details}>
      <div className={styles.detail}><Image src={`${assetRoot}/project-bullet.svg`} alt="" width={12} height={16} /><span><strong>Моя роль</strong><small>{project.catalogRole ?? project.role}</small></span></div>
      <div className={styles.detail}><Image src={`${assetRoot}/project-bullet.svg`} alt="" width={12} height={16} /><span><strong>Что делал</strong><small>{project.workSummary}</small></span></div>
      {project.platforms?.length ? (
        <ul className={styles.platforms} aria-label="Платформы">
          {project.platforms.map((platform) => <li key={platform}><Image src={platformIcons[platform]} alt="" width={20} height={20} />{project.slug === "sarafan-radio" ? "Only Desktop" : platform}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

function ProjectActions({ project }: { project: Project }) {
  return (
    <div className={styles.actions}>
      {project.detailAvailable ? <Link className={styles.detailsButton} href={`/projects/${project.slug}`}>Подробнее</Link> : <span className={styles.detailsButton} aria-disabled="true">Подробнее</span>}
      {project.figmaAvailable && project.figmaUrl ? (
        <a className={styles.figmaButton} href={project.figmaUrl} target="_blank" rel="noreferrer">Figma <Image src={`${assetRoot}/project-share.svg`} alt="" width={16} height={16} /></a>
      ) : (
        <span className={styles.unavailable}><Image src={`${assetRoot}/project-info.svg`} alt="" width={16} height={16} />Файл пока недоступен</span>
      )}
      {project.figmaAvailable && project.updatedAt ? <><span className={styles.actionDivider} /><span className={styles.updated}><Image src={`${assetRoot}/project-refresh.svg`} alt="" width={16} height={16} />Обновлено {project.updatedAt}</span></> : null}
    </div>
  );
}

function ProjectCopy({ project, compact = false }: { project: Project; compact?: boolean }) {
  const title = (
    <div className={styles.titleGroup}>
      <div className={styles.titleLine}><h2>{project.title}</h2>{project.logo ? <Image src={project.logo} alt="" width={28} height={28} /> : project.slug === "sarafan-radio" ? <RadioSymbol /> : null}</div>
      <p>{project.subtitle ?? project.description}</p>
    </div>
  );
  const badges = <div className={styles.badges}>{project.tags.map((tag) => <span className={tag === "В работе" ? styles.grayBadge : tag === "Тестовое" ? styles.orangeBadge : styles.blueBadge} key={tag}>{tag}</span>)}</div>;

  return (
    <div className={`${styles.copy} ${compact ? styles.compactCopy : ""}`}>
      {compact ? <div className={styles.headingRow}>{title}{badges}</div> : <>{badges}{title}</>}
      <ProjectDetails project={project} />
      <ProjectActions project={project} />
    </div>
  );
}

export default function ProjectsPage() {
  const projects = getCatalogProjects();
  const [corvo, ...compactProjects] = projects;

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <a className={styles.skipLink} href="#projects-content">Перейти к содержимому</a>
        <SiteHeader breadcrumbLabel="Все работы" />
        <main id="projects-content" className={styles.main}>
          <header className={styles.intro}><h1>Мои работы</h1><p>Здесь собрал рабочие проекты, тестовые задания,<br />где можно увидеть мой подход к задаче и результат.</p></header>
          <section className={styles.catalog} aria-label="Проекты">
            {corvo ? <article className={styles.featured}><ProjectVisual slug={corvo.slug} /><ProjectCopy project={corvo} /></article> : null}
            <div className={styles.compactGrid}>{compactProjects.map((project) => <article className={styles.compactCard} key={project.slug}><ProjectVisual slug={project.slug} /><ProjectCopy project={project} compact /></article>)}</div>
          </section>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
