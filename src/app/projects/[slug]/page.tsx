import { evaluate } from "@mdx-js/mdx";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { ProjectActionBar } from "../../../components/project-action-bar";
import { ProjectCanvas } from "../../../components/project-canvas";
import { ProjectGallery, type ProjectGalleryGroup } from "../../../components/project-gallery";
import { PageHeader } from "../../../components/page-header";
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

type ProjectNoticeProps = ProjectSectionProps & {
  variant?: "default" | "wide";
};

const corvoGalleryGroups: ProjectGalleryGroup[] = [
  {
    id: "desktop",
    label: "Desktop",
    icon: "/assets/projects/corvo/desktop.svg",
    items: [
      { src: "/assets/projects/corvo/gallery/desktop-01.png", alt: "Desktop-интерфейс Corvo: экран 1", width: 2960, height: 2048 },
      { src: "/assets/projects/corvo/gallery/desktop-02.png", alt: "Desktop-интерфейс Corvo: экран 2", width: 2960, height: 2048 },
      { src: "/assets/projects/corvo/gallery/desktop-03.png", alt: "Desktop-интерфейс Corvo: экран 3", width: 2960, height: 2048 },
      { src: "/assets/projects/corvo/gallery/desktop-04.png", alt: "Desktop-интерфейс Corvo: экран 4", width: 2960, height: 2048 },
      { src: "/assets/projects/corvo/gallery/desktop-05.png", alt: "Desktop-интерфейс Corvo: экран 5", width: 2960, height: 2048 },
    ],
  },
  {
    id: "tablet",
    label: "Tablet",
    icon: "/assets/projects/corvo/tablet.svg",
    items: [
      { src: "/assets/projects/corvo/gallery/tablet-01.png", alt: "Планшетный интерфейс Corvo: экран 1", width: 1600, height: 2266 },
      { src: "/assets/projects/corvo/gallery/tablet-02.png", alt: "Планшетный интерфейс Corvo: экран 2", width: 1600, height: 2266 },
      { src: "/assets/projects/corvo/gallery/tablet-03.png", alt: "Планшетный интерфейс Corvo: экран 3", width: 1600, height: 2266 },
      { src: "/assets/projects/corvo/gallery/tablet-04.png", alt: "Планшетный интерфейс Corvo: экран 4", width: 1600, height: 2266 },
      { src: "/assets/projects/corvo/gallery/tablet-05.png", alt: "Планшетный интерфейс Corvo: экран 5", width: 1600, height: 2266 },
    ],
  },
  {
    id: "mobile",
    label: "Mobile",
    icon: "/assets/projects/corvo/mobile.svg",
    items: [
      { src: "/assets/projects/corvo/gallery/mobile-01.png", alt: "Мобильный интерфейс Corvo: экран 1", width: 1080, height: 1920 },
      { src: "/assets/projects/corvo/gallery/mobile-02.png", alt: "Мобильный интерфейс Corvo: экран 2", width: 1080, height: 1920 },
      { src: "/assets/projects/corvo/gallery/mobile-03.png", alt: "Мобильный интерфейс Corvo: экран 3", width: 1080, height: 1920 },
      { src: "/assets/projects/corvo/gallery/mobile-04.png", alt: "Мобильный интерфейс Corvo: экран 4", width: 1080, height: 1920 },
      { src: "/assets/projects/corvo/gallery/mobile-05.png", alt: "Мобильный интерфейс Corvo: экран 5", width: 1080, height: 1920 },
    ],
  },
];

function ProjectSection({ children }: ProjectSectionProps) {
  return <section className={styles.contentSection}>{children}</section>;
}

function ProjectDivider() {
  return <hr className={styles.contentDivider} />;
}

function ProjectNotice({ children, variant = "default" }: ProjectNoticeProps) {
  return (
    <div className={`${styles.projectNotice} ${variant === "wide" ? styles.projectNoticeWide : ""}`}>
      <span className={styles.projectNoticeIconFrame} aria-hidden="true">
        <span className={styles.projectNoticeIcon} />
      </span>
      <p>{children}</p>
    </div>
  );
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
  return getAllProjects().filter(({ availability }) => availability.detail === "available").map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project || project.availability.detail !== "available") {
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

  if (!project || project.availability.detail !== "available") {
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
          <PageHeader
            title={project.title}
            description={project.subtitle ?? project.description}
            symbol={project.logo}
            tags={projectLabels}
            platforms={project.platforms}
          />

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
                <Image
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

            <article className={styles.projectArticle} data-project-content-column>
              <ProjectContent
                components={{
                  ProjectDivider,
                  ProjectCanvas,
                  ProjectNotice,
                  ProjectSection,
                  h2: MdxHeading,
                }}
              />
            </article>
          </div>

          {project.slug === "corvo" ? (
            <ProjectGallery groups={corvoGalleryGroups} title="Галерея" description="Часть экранов интерфейса" />
          ) : null}

          <div className={styles.actionTerminal} data-project-action-terminal aria-hidden="true" />

          <ProjectActionBar
            title={project.title}
            figmaAvailable={project.availability.figma === "available"}
            figmaUrl={project.figmaUrl}
            updatedAt={project.updatedAt}
          />

        </main>

        <div data-project-footer><SiteFooter /></div>
      </div>
    </div>
  );
}
