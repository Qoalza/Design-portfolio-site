import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ProjectActionBar } from "../../../components/project-action-bar";
import { ProjectCanvas } from "../../../components/project-canvas";
import { ProjectGallery } from "../../../components/project-gallery";
import { PageHeader } from "../../../components/page-header";
import { ProjectSectionNavigation } from "../../../components/project-section-navigation";
import { SiteHeader } from "../../../components/site-header";
import { SiteFooter } from "../../../components/site-footer";
import type {
  ProjectContentBlock,
  ProjectInlineContent,
  ProjectSectionBlock,
} from "../../../lib/project-contract";
import { getAllProjects, getProjectBySlug, getProjectBySlugForPreview } from "../../../lib/projects";
import { HOME_TRAIL_ITEM } from "../../../lib/navigation-trail";
import { createSocialMetadata } from "../../../lib/site-metadata";
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

type ProjectSectionContent = Extract<ProjectContentBlock, { type: "section" }>;
type ProjectGalleryContent = Extract<ProjectContentBlock, { type: "gallery" }>;
const isAdminPreview = process.env.DES_ART_ADMIN_PREVIEW === "1";

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

function renderInlineContent(content: ProjectInlineContent[]): ReactNode[] {
  return content.map((item, index) => {
    const key = `${item.type}-${index}`;
    if (item.type === "strong") return <strong key={key}>{item.text}</strong>;
    if (item.type === "emphasis") return <em key={key}>{item.text}</em>;
    if (item.type === "link") return <a key={key} href={item.href}>{item.text}</a>;
    return item.text;
  });
}

function ProjectContentBlockView({ block }: { block: ProjectSectionBlock }) {
  if (block.type === "paragraph") {
    return <p>{renderInlineContent(block.content)}</p>;
  }

  if (block.type === "heading") {
    const content = renderInlineContent(block.content);
    if (block.level === 3) return <h3>{content}</h3>;
    if (block.level === 4) return <h4>{content}</h4>;
    if (block.level === 5) return <h5>{content}</h5>;
    return <h6>{content}</h6>;
  }

  if (block.type === "list") {
    const items = block.items.map((item, index) => <li key={index}>{renderInlineContent(item)}</li>);
    return block.style === "ordered" ? <ol>{items}</ol> : <ul>{items}</ul>;
  }

  if (block.type === "notice") {
    return <ProjectNotice variant={block.variant}>{renderInlineContent(block.content)}</ProjectNotice>;
  }

  if (block.type === "image") {
    return <ProjectCanvas presentation={block.presentation} images={block.images} />;
  }

  return <ProjectDivider />;
}

function ProjectSectionView({ section }: { section: ProjectSectionContent }) {
  return (
    <ProjectSection>
      <h2 id={getHeadingId(section.heading)}>{section.heading}</h2>
      {section.blocks.map((block, index) => <ProjectContentBlockView key={`${block.type}-${index}`} block={block} />)}
    </ProjectSection>
  );
}

function getProjectSections(content: ProjectContentBlock[]): Array<{ id: string; label: string }> {
  return content
    .filter((block): block is ProjectSectionContent => block.type === "section")
    .map((section) => ({ id: getHeadingId(section.heading), label: section.heading }));
}

export function generateStaticParams() {
  return getAllProjects()
    .filter(({ availability }) => isAdminPreview || availability.detail === "available")
    .map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = isAdminPreview
    ? getProjectBySlugForPreview(slug)
    : getProjectBySlug(slug);

  if (!project || (!isAdminPreview && project.availability.detail !== "available")) {
    return {};
  }

  return {
    title: { absolute: `${project.title} — Artur Designer` },
    description: project.description,
    ...createSocialMetadata(`/projects/${project.slug}`),
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = isAdminPreview
    ? getProjectBySlugForPreview(slug)
    : getProjectBySlug(slug);

  if (!project || (!isAdminPreview && project.availability.detail !== "available")) {
    notFound();
  }

  const projectLabels = project.detailTags;
  const projectsTrailItem = { href: "/projects", label: "Работы" };
  const projectTrailItem = { href: `/projects/${project.slug}`, label: project.title };
  const projectSections = getProjectSections(project.content);
  const sectionBlocks = project.content.filter((block): block is ProjectSectionContent => block.type === "section");
  const galleryBlocks = project.content.filter((block): block is ProjectGalleryContent => block.type === "gallery");
  const hero = project.hero;
  const heroForeground = hero?.foreground ?? hero?.image;

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
            symbol={project.logo?.type === "image" ? project.logo.src : undefined}
            tags={projectLabels}
            platforms={project.platforms}
          />

          {hero && heroForeground ? (
            <div className={styles.heroPreview}>
              {hero.presentation === "browser-composite" && hero.backdrop ? (
                <Image
                  className={styles.heroPreviewBack}
                  src={hero.backdrop.src}
                  alt={hero.backdrop.alt}
                  width={hero.backdrop.width}
                  height={hero.backdrop.height}
                  priority
                  aria-hidden={hero.backdrop.alt.length === 0}
                />
              ) : null}
              <div className={styles.heroPreviewFront}>
                <div className={styles.browserBar} aria-hidden="true"><i /><i /><i /></div>
                <div className={styles.heroPreviewImage}>
                  <Image
                    src={heroForeground.src}
                    alt={heroForeground.alt}
                    width={heroForeground.width}
                    height={heroForeground.height}
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
              {sectionBlocks.map((section, index) => (
                <ProjectSectionView key={`${getHeadingId(section.heading)}-${index}`} section={section} />
              ))}
            </article>
          </div>

          {galleryBlocks.map((gallery, index) => (
            <ProjectGallery
              key={`${gallery.title}-${index}`}
              groups={gallery.groups}
              title={gallery.title}
              description={gallery.description}
            />
          ))}

          <div className={styles.actionTerminal} data-project-action-terminal aria-hidden="true" />

          <ProjectActionBar
            fileState={project.availability.figma}
            figmaUrl={project.figmaUrl}
            updatedAt={project.updatedAt}
          />

        </main>

        <div data-project-footer><SiteFooter /></div>
      </div>
    </div>
  );
}
