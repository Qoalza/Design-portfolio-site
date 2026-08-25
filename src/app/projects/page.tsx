import Image from "next/image";
import { MainProjectCard } from "../../components/main-project-card";
import { PageHeader } from "../../components/page-header";
import { ProjectPlatforms } from "../../components/project-platforms";
import { ProjectDetailControl } from "../../components/project-detail-control";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { ControlButton } from "../../components/ui-controls";
import { HOME_TRAIL_ITEM } from "../../lib/navigation-trail";
import { getCatalogProjects, type Project } from "../../lib/projects";
import styles from "./page.module.css";

const assetRoot = "/assets/homepage";

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
    <>
      <div className={styles.details}>
        <div className={styles.detail}><Image src={`${assetRoot}/project-bullet.svg`} alt="" width={12} height={16} /><span><strong>Моя роль</strong><small>{project.catalogRole ?? project.role}</small></span></div>
        <div className={styles.detail}><Image src={`${assetRoot}/project-bullet.svg`} alt="" width={12} height={16} /><span><strong>Что делал</strong><small>{project.workSummary}</small></span></div>
      </div>
      {project.platforms?.length ? (
        <ProjectPlatforms platforms={project.platforms} desktopOnlyLabel={project.slug === "sarafan-radio"} />
      ) : null}
    </>
  );
}

function ProjectActions({ project }: { project: Project }) {
  return (
    <div className={styles.actions}>
      {project.availability.detail === "available" ? (
        <ProjectDetailControl
          availability="available"
          href={`/projects/${project.slug}`}
          breadcrumbLabel={project.title}
          className={styles.detailsButton}
        />
      ) : (
        <ProjectDetailControl availability="unavailable" className={styles.detailsButton} />
      )}
      {project.availability.figma === "available" && project.figmaUrl ? (
        <ControlButton variant="ghost" href={project.figmaUrl} external iconRight={`${assetRoot}/project-share.svg`}>Figma</ControlButton>
      ) : (
        <ControlButton variant="ghost" disabled iconLeft={`${assetRoot}/project-info.svg`}>Файл пока недоступен</ControlButton>
      )}
      {project.availability.figma === "available" && project.updatedAt ? <><span className={styles.actionDivider} /><span className={styles.updated}><Image src={`${assetRoot}/project-refresh.svg`} alt="" width={16} height={16} />Обновлено {project.updatedAt}</span></> : null}
    </div>
  );
}

function ProjectTags({ tags }: { tags: string[] }) {
  return (
    <div className={styles.projectTags} aria-label="Теги проекта">
      {tags.map((tag, index) => (
        <span key={tag}>
          {index > 0 ? <i aria-hidden="true">/</i> : null}
          <b aria-hidden="true">#</b>
          {tag}
        </span>
      ))}
    </div>
  );
}

function ProjectCopy({ project, compact = false }: { project: Project; compact?: boolean }) {
  return (
    <div className={`${styles.copy} ${compact ? styles.compactCopy : ""}`}>
      <div className={styles.headerGroup}>
        <div className={styles.titleGroup}>
          <div className={styles.titleLine}><h2>{project.title}</h2>{project.logo ? <Image src={project.logo} alt="" width={28} height={28} /> : project.slug === "sarafan-radio" ? <RadioSymbol /> : null}</div>
          <p>{project.subtitle ?? project.description}</p>
        </div>
        <ProjectTags tags={project.tags} />
      </div>
      <ProjectDetails project={project} />
      <ProjectActions project={project} />
    </div>
  );
}

export default function ProjectsPage() {
  const projects = getCatalogProjects();
  const corvo = projects.find((project) => project.slug === "corvo");
  const compactProjects = projects.filter((project) => project.slug !== "corvo");
  const projectsTrailItem = { href: "/projects", label: "Работы" };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <a className={styles.skipLink} href="#projects-content">Перейти к содержимому</a>
        <SiteHeader
          navigationPage={{
            item: projectsTrailItem,
            canonicalTrail: [HOME_TRAIL_ITEM, projectsTrailItem],
          }}
        />
        <main id="projects-content" className={styles.main}>
          <PageHeader
            title="Мои работы"
            description={"Здесь собрал рабочие проекты, тестовые задания,\nгде можно увидеть мой подход к задаче и результат."}
          />
          <section className={styles.catalog} aria-label="Проекты">
            {corvo ? <MainProjectCard project={corvo} /> : null}
            <div className={styles.compactGrid}>{compactProjects.map((project) => <article className={styles.compactCard} key={project.slug}><ProjectVisual slug={project.slug} /><ProjectCopy project={project} compact /></article>)}</div>
          </section>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
