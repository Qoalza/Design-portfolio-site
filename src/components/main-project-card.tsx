import Image from "next/image";
import type { Project } from "../lib/projects";
import { ProjectPlatforms } from "./project-platforms";
import { ControlButton } from "./ui-controls";
import styles from "./main-project-card.module.css";

const assetRoot = "/assets/homepage";

type MainProjectCardProps = {
  project: Project;
  headingLevel?: "h2" | "h3";
};

export function MainProjectCard({ project, headingLevel = "h2" }: MainProjectCardProps) {
  const Heading = headingLevel;
  const description = project.subtitle ?? project.description;
  const role = project.catalogRole ?? project.role;

  return (
    <article className={styles.card}>
      <div className={styles.visual} aria-hidden="true">
        <Image className={styles.visualBack} src={`${assetRoot}/corvo-dashboard.png`} alt="" width={2960} height={2400} />
        <Image className={styles.visualFront} src={`${assetRoot}/corvo-product.png`} alt="" width={2960} height={2400} />
      </div>

      <div className={styles.copy}>
        <div className={styles.titleGroup}>
          <div className={styles.titleLine}>
            <Heading>{project.title}</Heading>
            {project.logo ? <Image src={project.logo} alt="" width={28} height={28} /> : null}
          </div>
          <p>{description}</p>
        </div>

        <div className={styles.tags} aria-label="Теги проекта">
          {project.tags.map((tag, index) => (
            <span key={tag}>
              {index > 0 ? <i aria-hidden="true">/</i> : null}
              <b aria-hidden="true">#</b>
              {tag}
            </span>
          ))}
        </div>

        <dl className={styles.details}>
          <div className={styles.detail}>
            <Image src={`${assetRoot}/project-bullet.svg`} alt="" width={12} height={16} />
            <div><dt>Моя роль</dt><dd>{role}</dd></div>
          </div>
          <div className={styles.detail}>
            <Image src={`${assetRoot}/project-bullet.svg`} alt="" width={12} height={16} />
            <div><dt>Что делал</dt><dd>{project.workSummary}</dd></div>
          </div>
        </dl>

        {project.platforms?.length ? <ProjectPlatforms platforms={project.platforms} /> : null}

        <div className={styles.actions}>
          <div className={styles.actionButtons}>
            {project.detailAvailable ? (
              <ControlButton className={styles.detailsButton} variant="neutral" href={`/projects/${project.slug}`} breadcrumbLabel={project.title}>Подробнее</ControlButton>
            ) : (
              <ControlButton className={styles.detailsButton} variant="neutral" disabled>Подробнее</ControlButton>
            )}
            {project.figmaAvailable && project.figmaUrl ? (
              <ControlButton variant="ghost" href={project.figmaUrl} external iconRight={`${assetRoot}/project-share.svg`}>Figma</ControlButton>
            ) : (
              <ControlButton variant="ghost" disabled iconLeft={`${assetRoot}/project-info.svg`}>Файл пока недоступен</ControlButton>
            )}
          </div>
          {project.figmaAvailable && project.updatedAt ? (
            <>
              <span className={styles.actionDivider} aria-hidden="true" />
              <span className={styles.updated}>
                <Image src={`${assetRoot}/project-refresh.svg`} alt="" width={16} height={16} />
                Обновлено {project.updatedAt}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
