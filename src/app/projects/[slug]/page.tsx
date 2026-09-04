import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { ProjectActionBar } from "../../../components/project-action-bar";
import { ProjectCanvas } from "../../../components/project-canvas";
import { ProjectGallery } from "../../../components/project-gallery";
import { ProjectFrameCompositionView } from "../../../components/project-frame-composition";
import { PageHeader } from "../../../components/page-header";
import { ProjectSectionNavigation } from "../../../components/project-section-navigation";
import { SiteHeader } from "../../../components/site-header";
import { SiteFooter } from "../../../components/site-footer";
import type {
  ProjectContentBlock,
  ProjectInlineContent,
  ProjectSectionBlock,
} from "../../../lib/project-contract";
import { getAllProjects, getProjectBySlug, getProjectBySlugForPreview, type Project } from "../../../lib/projects";
import { HOME_TRAIL_ITEM } from "../../../lib/navigation-trail";
import { createProjectSectionIds } from "../../../lib/project-section-ids.mjs";
import { createSocialMetadata } from "../../../lib/site-metadata";
import styles from "./page.module.css";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

type ProjectSectionProps = {
  children: ReactNode;
};

type ProjectNoticeProps = ProjectSectionProps & {
  wide?: boolean;
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

function ProjectNotice({ children, wide = false }: ProjectNoticeProps) {
  return (
    <div className={`${styles.projectNotice} ${wide ? styles.projectNoticeWide : ""}`}>
      <span className={styles.projectNoticeIconFrame} aria-hidden="true">
        <span className={styles.projectNoticeIcon} />
      </span>
      <p>{children}</p>
    </div>
  );
}

function renderInlineContent(content: ProjectInlineContent[]): ReactNode[] {
  return content.map((item, index) => {
    const key = `${item.type}-${index}`;
    const marks = new Set(item.type === "text" || item.type === "link" ? item.marks : []);
    if (item.type === "strong") marks.add("strong");
    if (item.type === "emphasis") marks.add("emphasis");
    if (item.type === "underline") marks.add("underline");
    let rendered: ReactNode = item.text;
    if (marks.has("strong")) rendered = <strong>{rendered}</strong>;
    if (marks.has("emphasis")) rendered = <em>{rendered}</em>;
    if (marks.has("underline")) rendered = <u>{rendered}</u>;
    if (item.type === "link") rendered = <a href={item.href}>{rendered}</a>;
    return <span key={key}>{rendered}</span>;
  });
}

function ProjectContentBlockView({ block, noticeWide }: { block: ProjectSectionBlock; noticeWide: boolean }) {
  if (block.type === "paragraph") {
    return <p>{renderInlineContent(block.content)}</p>;
  }

  if (block.type === "heading") {
    return <h3>{renderInlineContent(block.content)}</h3>;
  }

  if (block.type === "list") {
    const items = block.items.map((item, index) => <li key={index}>{renderInlineContent(item)}</li>);
    return block.style === "ordered" ? <ol>{items}</ol> : <ul>{items}</ul>;
  }

  if (block.type === "notice") {
    return <ProjectNotice wide={noticeWide}>{renderInlineContent(block.content)}</ProjectNotice>;
  }

  if (block.type === "visual") {
    return <ProjectCanvas visual={block} />;
  }

  if (block.type === "hardBreak") {
    return <span className={styles.hardBreak} aria-hidden="true" />;
  }

  return <ProjectDivider />;
}

function ProjectSectionView({ section, id, showDivider, noticeWide }: { section: ProjectSectionContent; id: string; showDivider: boolean; noticeWide: boolean }) {
  const hasInteractiveBlock = section.blocks.some((block) => block.type === "visual");
  const contentBlocks = section.blocks.filter((block) => block.type !== "divider");
  return (
    <ProjectSection>
      <h2 id={id}>{section.heading}</h2>
      {contentBlocks.map((block, index) => <ProjectContentBlockView key={`${block.type}-${index}`} block={block} noticeWide={noticeWide} />)}
      {!hasInteractiveBlock && showDivider ? <ProjectDivider /> : null}
    </ProjectSection>
  );
}

function getProjectSections(content: ProjectContentBlock[]): Array<{ id: string; label: string }> {
  const sections = content
    .filter((block): block is ProjectSectionContent => block.type === "section")
  const ids = createProjectSectionIds(sections.map((section) => section.heading));
  return sections.map((section, index) => ({ id: ids[index], label: section.heading }));
}

function ProjectHeroVisual({ visual }: { visual: Project["visuals"]["hero"] }) {
  if (!visual) return null;
  if (visual.templateId === "hero.corvo-browser") {
    const backdrop = visual.assets.backdrop[0];
    const foreground = visual.assets.foreground[0];
    return (
      <div className={styles.heroPreview}>
        <Image className={styles.heroPreviewBack} src={backdrop.src} alt={backdrop.alt} width={backdrop.width} height={backdrop.height} priority aria-hidden={backdrop.alt.length === 0} />
        <div className={styles.heroPreviewFront}>
          <div className={styles.browserBar} aria-hidden="true"><i /><i /><i /></div>
          <div className={styles.heroPreviewImage}><Image src={foreground.src} alt={foreground.alt} width={foreground.width} height={foreground.height} priority sizes="720px" /></div>
        </div>
      </div>
    );
  }
  if (visual.templateId === "hero.sarafan-collage") {
    const slot = (name: string) => visual.assets[name][0];
    const illustration = slot("illustration");
    const decoration = slot("decoration");
    const dashboard = slot("dashboard");
    const player = slot("player");
    const payment = slot("payment");
    return (
      <div className={`${styles.heroPreview} ${styles.sarafanHero}`} aria-hidden="true">
        <Image className={styles.sarafanHeroIllustration} src={illustration.src} alt="" width={illustration.width} height={illustration.height} />
        <Image className={styles.sarafanHeroDecoration} src={decoration.src} alt="" width={decoration.width} height={decoration.height} />
        <Image className={styles.sarafanHeroDashboard} src={dashboard.src} alt="" width={dashboard.width} height={dashboard.height} />
        <Image className={styles.sarafanHeroPlayer} src={player.src} alt="" width={player.width} height={player.height} />
        <Image className={styles.sarafanHeroPayment} src={payment.src} alt="" width={payment.width} height={payment.height} />
      </div>
    );
  }
  return null;
}

export function generateStaticParams() {
  return getAllProjects()
    .filter(({ availability }) => isAdminPreview || availability.detail === "available")
    .map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  if (isAdminPreview) await connection();
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
  if (isAdminPreview) await connection();
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
  const sectionBlocks = project.content.filter((block): block is ProjectSectionContent => block.type === "section");
  const projectSections = getProjectSections(project.content);
  const galleryBlocks = project.content.filter((block): block is ProjectGalleryContent => block.type === "gallery" && block.groups.some((group) => group.images.length > 0));

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
            isProjectPage
            symbol={project.logo?.type === "image" ? project.logo.src : undefined}
            tags={projectLabels}
            platforms={project.platforms}
          />

          {project.heroFrame ? <div className={styles.heroPreview}><ProjectFrameCompositionView composition={project.heroFrame} fillSlot slotRadius={12} /></div> : <ProjectHeroVisual visual={project.visuals.hero} />}

          <div className={styles.projectInformation} data-project-information-start>
            <ProjectSectionNavigation
              sections={projectSections}
              className={styles.projectNavigation}
              activeItemClassName={styles.activeNavigationItem}
            />

            <article className={`${styles.projectArticle} ${galleryBlocks.length ? styles.projectArticleWithGallery : ""}`} data-project-content-column>
              {sectionBlocks.map((section, index) => (
                <ProjectSectionView
                  key={projectSections[index].id}
                  id={projectSections[index].id}
                  section={section}
                  noticeWide={project.designProfile === "corvo-v1"}
                  showDivider={index < sectionBlocks.length - 1 || galleryBlocks.length === 0}
                />
              ))}
            </article>
          </div>

          {galleryBlocks.map((gallery, index) => (
            <ProjectGallery
              key={`gallery-${index}`}
              groups={gallery.groups}
              title="Галерея"
              description="Часть экранов интерфейса"
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
