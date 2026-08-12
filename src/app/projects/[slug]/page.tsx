import { evaluate } from "@mdx-js/mdx";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { ProjectMediaLightbox } from "../../../components/project-media-lightbox";
import { ProjectShareButton } from "../../../components/project-share-button";
import { getAllProjects, getProjectBySlug } from "../../../lib/projects";
import styles from "./page.module.css";

const homeAssetRoot = "/assets/homepage";

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

function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="На главную">
        <Image src={`${homeAssetRoot}/logo.svg`} alt="" width={48} height={48} priority />
        <span><strong>ART</strong><small>Design</small></span>
      </Link>

      <nav className={styles.nav} aria-label="Основная навигация">
        <Link className={styles.navHome} href="/">
          <MaskIcon className={styles.homeIcon} />
          Главная
        </Link>
        <span aria-disabled="true"><MaskIcon className={styles.lockIcon} />Блог</span>
        <span aria-disabled="true"><MaskIcon className={styles.lockIcon} />Лаборатория</span>
      </nav>

      <div className={styles.headerActions}>
        <span className={styles.availability}>
          <Image src={`${homeAssetRoot}/status.svg`} alt="" width={6} height={8} />
          Открыт к предложениям
        </span>
        <span className={styles.primaryButton} aria-disabled="true">Связаться</span>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <span><Image src={`${homeAssetRoot}/footer-mark.svg`} alt="" width={16} height={16} />Deveploment and design Artur Arustamyan</span>
      <span>2026</span>
    </footer>
  );
}

export function generateStaticParams() {
  return getAllProjects().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
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

  if (!project) {
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
        <SiteHeader />

        <main id="project-content">
          <div className={styles.projectToolbar}>
            <div className={styles.breadcrumbs}>
              <Link className={styles.backButton} href="/" aria-label="Вернуться на главную">
                <MaskIcon className={styles.backIcon} />
              </Link>
              <div className={styles.breadcrumbTrail}>
                <Link href="/">Главная</Link>
                <span aria-hidden="true">/</span>
                <span>{project.title}</span>
              </div>
            </div>

            <div className={styles.toolbarActions}>
              {project.updatedAt ? <span className={styles.updatedAt}>Обновлен {project.updatedAt}</span> : null}
              {project.figmaUrl ? (
                <a className={styles.figmaButton} href={project.figmaUrl} target="_blank" rel="noreferrer">
                  Figma
                  <MaskIcon className={styles.externalIcon} />
                </a>
              ) : (
                <span className={styles.figmaButton} aria-disabled="true">
                  Figma
                  <MaskIcon className={styles.externalIcon} />
                </span>
              )}
              <ProjectShareButton className={styles.shareButton} title={project.title} />
            </div>
          </div>

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
                    <MaskIcon className={platform === "Mobile" ? styles.mobileIcon : styles.desktopIcon} />
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
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
