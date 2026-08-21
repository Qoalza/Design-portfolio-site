import { evaluate } from "@mdx-js/mdx";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { ProjectActionBar } from "../../../components/project-action-bar";
import { ProjectGallery } from "../../../components/project-gallery";
import { ProjectMediaLightbox } from "../../../components/project-media-lightbox";
import { ProjectPlatforms } from "../../../components/project-platforms";
import { ProjectSectionNavigation } from "../../../components/project-section-navigation";
import { SiteHeader } from "../../../components/site-header";
import { SiteFooter } from "../../../components/site-footer";
import { getAllProjects, getProjectBySlug } from "../../../lib/projects";
import { HOME_TRAIL_ITEM } from "../../../lib/navigation-trail";
import styles from "./page.module.css";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

type ProjectSectionProps = {
  children: ReactNode;
};

function ProjectSection({ children }: ProjectSectionProps) {
  return <section className={styles.contentSection}>{children}</section>;
}

function ProjectDivider() {
  return <hr className={styles.contentDivider} />;
}

function getHeadingId(label: string): string {
  return label
    .toLocaleLowerCase("ru")
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-|-$/g, "");
}

function MdxHeading({ children, ...props }: ComponentPropsWithoutRef<"h2">) {
  const label = typeof children === "string" ? children : "section";
  return <h2 id={getHeadingId(label)} {...props}>{children}</h2>;
}

function getProjectSections(content: string): Array<{ id: string; label: string }> {
  return [...content.matchAll(/^##\s+(.+)$/gm)].map((match) => ({
    id: getHeadingId(match[1].trim()),
    label: match[1].trim(),
  }));
}

export function generateStaticParams() {
  return getAllProjects().filter(({ detailAvailable }) => detailAvailable).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project || !project.detailAvailable) {
    return {};
  }

  return {
    title: `${project.title} — Артур Арустамян`,
    description: project.description,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project || !project.detailAvailable) {
    notFound();
  }

  const { default: ProjectContent } = await evaluate(project.content, {
    Fragment,
    jsx,
    jsxs,
  });

  const projectLabels = project.detailLabels ?? [
    ...project.tags,
    project.role,
    project.status,
    String(project.year),
  ];
  const projectsTrailItem = { href: "/projects", label: "Работы" };
  const projectTrailItem = { href: `/projects/${project.slug}`, label: project.title };
  const projectSections = getProjectSections(project.content);
  const hasHeroImage = Boolean(
    project.heroImage
    && project.heroImageAlt
    && project.heroImageWidth
    && project.heroImageHeight,
  );

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <a className={styles.skipLink} href="#project-content">Перейти к содержимому</a>
        <SiteHeader
          navigationPage={{
            item: projectTrailItem,
            canonicalTrail: [HOME_TRAIL_ITEM, projectsTrailItem, projectTrailItem],
          }}
        />

        <main id="project-content">
          <header className={styles.projectHero}>
            <div className={styles.projectTitleRow}>
              {project.logo ? <Image src={project.logo} alt="" width={52} height={52} priority /> : null}
              <h1>{project.title}</h1>
            </div>
            {project.subtitle ? <p className={styles.projectSubtitle}>{project.subtitle}</p> : null}
            {project.platforms?.length ? (
              <div className={styles.heroPlatforms}><ProjectPlatforms platforms={project.platforms} variant="projectHero" /></div>
            ) : null}
            <ul className={styles.projectLabels} aria-label="Характеристики проекта">
              {projectLabels.map((label, index) => (
                <li key={`${label}-${index}`}>
                  {index > 0 ? <span aria-hidden="true">/</span> : null}
                  <b aria-hidden="true">#</b>
                  {label}
                </li>
              ))}
            </ul>
          </header>

          {hasHeroImage ? (
            <div className={styles.heroPreview}>
              <Image
                className={styles.heroPreviewBack}
                src="/assets/homepage/corvo-dashboard.png"
                alt=""
                width={2960}
                height={2400}
                priority
                aria-hidden="true"
              />
              <div className={styles.heroPreviewFront}>
                <div className={styles.browserBar} aria-hidden="true"><i /><i /><i /></div>
                <div className={styles.heroPreviewImage}>
                <ProjectMediaLightbox
                  src="/assets/homepage/corvo-product.png"
                  alt={project.heroImageAlt!}
                  width={2960}
                  height={2400}
                  priority
                  sizes="720px"
                />
                </div>
              </div>
            </div>
          ) : null}

          <div className={styles.projectInformation} data-project-information-start>
            <ProjectSectionNavigation
              sections={projectSections}
              className={styles.projectNavigation}
              activeItemClassName={styles.activeNavigationItem}
            />

            <article className={styles.projectArticle}>
              <ProjectContent
                components={{
                  ProjectDivider,
                  ProjectGallery,
                  ProjectSection,
                  h2: MdxHeading,
                }}
              />
            </article>
          </div>

          <ProjectActionBar
            title={project.title}
            figmaAvailable={project.figmaAvailable}
            figmaUrl={project.figmaUrl}
            updatedAt={project.updatedAt}
          />
        </main>

        <div data-project-footer><SiteFooter /></div>
      </div>
    </div>
  );
}
