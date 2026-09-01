import Image from "next/image";
import type { ProjectPlatform } from "../lib/projects";
import { ProjectPlatforms } from "./project-platforms";
import styles from "./page-header.module.css";

type PageHeaderProps = {
  description: string;
  isProjectPage?: boolean;
  platforms?: ProjectPlatform[];
  symbol?: string;
  tags?: string[];
  title: string;
};

export function PageHeader({
  description,
  isProjectPage = false,
  platforms = [],
  symbol,
  tags = [],
  title,
}: PageHeaderProps) {
  const showInfo = tags.length > 0 || platforms.length > 0;

  return (
    <header
      className={`${styles.pageHeader} ${showInfo ? styles.withInfo : styles.simple} ${isProjectPage ? styles.projectPage : ""}`}
      data-page-header
    >
      <div className={styles.head}>
        {symbol ? (
          <span className={styles.symbolFrame} aria-hidden="true">
            <Image src={symbol} alt="" width={44} height={44} priority />
          </span>
        ) : null}
        <div className={styles.text}>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      {showInfo ? (
        <div className={styles.info}>
          <hr className={styles.divider} />
          <div className={styles.infoBody}>
            <ul className={styles.tags} aria-label="Характеристики проекта">
              {tags.map((tag, index) => (
                <li key={`${tag}-${index}`}>
                  {index > 0 ? <span aria-hidden="true">/</span> : null}
                  <b aria-hidden="true">#</b>
                  {tag}
                </li>
              ))}
            </ul>
            {platforms.length > 0 ? (
              <ProjectPlatforms platforms={platforms} variant="projectHero" />
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
