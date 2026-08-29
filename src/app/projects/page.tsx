import Image from "next/image";
import type { Metadata } from "next";
import { MainProjectCard } from "../../components/main-project-card";
import { PageHeader } from "../../components/page-header";
import { ProjectPlatforms } from "../../components/project-platforms";
import { ProjectDetailControl } from "../../components/project-detail-control";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { ControlButton } from "../../components/ui-controls";
import { ProjectFrameCompositionView } from "../../components/project-frame-composition";
import { HOME_TRAIL_ITEM } from "../../lib/navigation-trail";
import type { ProjectLogo } from "../../lib/project-contract";
import { getAllProjects, getAllProjectsForPreview, type Project } from "../../lib/projects";
import { createSocialMetadata } from "../../lib/site-metadata";
import styles from "./page.module.css";

const assetRoot = "/assets/homepage";

export const metadata: Metadata = {
  title: { absolute: "Мои работы — Artur Designer" },
  ...createSocialMetadata("/projects"),
};

function ProjectLogoMark({ logo }: { logo: ProjectLogo }) {
  if (logo.type === "image") {
    return <Image src={logo.src} alt="" width={28} height={28} />;
  }

  const classBySlot = { a: styles.radioA, b: styles.radioB, c: styles.radioC, d: styles.radioD };
  const sizeBySlot = { a: "15px", b: "5px", c: "15px", d: "5px" };
  return (
    <span className={styles.radioSymbol} aria-hidden="true">
      {logo.layers.map((layer) => (
        <span className={classBySlot[layer.slot]} key={`${layer.slot}-${layer.src}`}>
          <Image src={layer.src} alt="" fill sizes={sizeBySlot[layer.slot]} />
        </span>
      ))}
    </span>
  );
}

function ProjectVisual({ project }: { project: Project }) {
  if (project.catalogFrame) return <div className={styles.compactVisual} aria-hidden="true"><ProjectFrameCompositionView composition={project.catalogFrame} /></div>;
  const image = project.catalogImage;
  if (!image) return null;
  return (
    <div className={styles.compactVisual} aria-hidden="true">
      <div className={styles.browserFrame}>
        <span className={styles.browserDots}><i /><i /><i /></span>
        <Image src={image.src} alt="" fill sizes="468px" />
      </div>
    </div>
  );
}

function ProjectDetails({ project }: { project: Project }) {
  return (
    <>
      <div className={styles.details}>
        <div className={styles.detail}><Image src={`${assetRoot}/project-bullet.svg`} alt="" width={12} height={16} /><span><strong>Моя роль</strong><small>{project.role}</small></span></div>
        <div className={styles.detail}><Image src={`${assetRoot}/project-bullet.svg`} alt="" width={12} height={16} /><span><strong>Что делал</strong><small>{project.workSummary}</small></span></div>
      </div>
      {project.platforms?.length ? (
        <ProjectPlatforms platforms={project.platforms} desktopOnlyLabel={project.platforms.length === 1 && project.platforms[0] === "Desktop"} />
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
      ) : project.availability.figma === "unavailable" ? (
        <ControlButton variant="ghost" disabled iconLeft={`${assetRoot}/project-info.svg`}>Файл пока недоступен</ControlButton>
      ) : null}
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
          <div className={styles.titleLine}><h2>{project.title}</h2>{project.logo ? <ProjectLogoMark logo={project.logo} /> : null}</div>
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
  const projects = process.env.DES_ART_ADMIN_PREVIEW === "1" ? getAllProjectsForPreview() : getAllProjects();
  const [primaryProject, ...compactProjects] = projects;
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
            {primaryProject ? <MainProjectCard project={primaryProject} /> : null}
            <div className={styles.compactGrid}>{compactProjects.map((project) => <article className={styles.compactCard} key={project.slug}><ProjectVisual project={project} /><ProjectCopy project={project} compact /></article>)}</div>
          </section>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
