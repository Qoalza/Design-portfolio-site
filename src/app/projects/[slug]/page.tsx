import { evaluate } from "@mdx-js/mdx";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { ProjectActionBar } from "../../../components/project-action-bar";
import { ProjectMediaLightbox } from "../../../components/project-media-lightbox";
import { SiteHeader } from "../../../components/site-header";
import { SiteFooter } from "../../../components/site-footer";
import { getAllProjects, getProjectBySlug, type ProjectPlatform } from "../../../lib/projects";
import styles from "./page.module.css";

const platformIconClass: Record<ProjectPlatform, string> = {
  Desktop: styles.desktopIcon,
  Tablet: styles.tabletIcon,
  Mobile: styles.mobileIcon,
};

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

type ProjectSectionProps = {
  children: ReactNode;
};

type ProjectMediaProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  variant?: "standard" | "flow" | "result";
};

function MaskIcon({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`${styles.maskIcon} ${className}`} />;
}

function ProjectSection({ children }: ProjectSectionProps) {
  return <section className={styles.contentSection}>{children}</section>;
}

function ProjectDivider() {
  return <hr className={styles.contentDivider} />;
}

function ProjectMedia({
  src,
  alt,
  width,
  height,
  caption,
  variant = "standard",
}: ProjectMediaProps) {
  return (
    <figure className={`${styles.projectMedia} ${styles[variant]}`}>
      <ProjectMediaLightbox src={src} alt={alt} width={width} height={height} />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

function MdxHeading({ children, ...props }: ComponentPropsWithoutRef<"h2">) {
  return <h2 {...props}>{children}</h2>;
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

  const projectLabels = [
    ...project.tags,
    project.role,
    project.visibility,
    project.ndaNote,
    String(project.year),
  ].filter((value): value is string => Boolean(value));

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <a className={styles.skipLink} href="#project-content">Перейти к содержимому</a>
        <SiteHeader breadcrumbLabel={project.title} />

        <main id="project-content">
          <header className={styles.projectHero}>
            <div className={styles.projectTitleRow}>
              {project.logo ? <Image src={project.logo} alt="" width={52} height={52} priority /> : null}
              <h1>{project.title}</h1>
            </div>
            {project.subtitle ? <p className={styles.projectSubtitle}>{project.subtitle}</p> : null}
            {project.platforms?.length ? (
              <ul className={styles.platforms} aria-label="Платформы">
                {project.platforms.map((platform) => (
                  <li key={platform}>
                    <MaskIcon className={platformIconClass[platform]} />
                    {platform}
                  </li>
                ))}
              </ul>
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

          <article className={styles.projectArticle}>
            <ProjectContent
              components={{
                ProjectDivider,
                ProjectMedia,
                ProjectSection,
                h2: MdxHeading,
              }}
            />
          </article>

          <ProjectActionBar
            title={project.title}
            figmaAvailable={project.figmaAvailable}
            figmaUrl={project.figmaUrl}
            updatedAt={project.updatedAt}
          />
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
