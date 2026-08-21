import type { CSSProperties } from "react";
import type { ProjectPlatform } from "../lib/projects";
import styles from "./project-platforms.module.css";

const platformIcons = {
  Desktop: "/assets/projects/corvo/desktop.svg",
  Tablet: "/assets/projects/corvo/tablet.svg",
  Mobile: "/assets/projects/corvo/mobile.svg",
} satisfies Record<ProjectPlatform, string>;

type ProjectPlatformsProps = {
  platforms: ProjectPlatform[];
  desktopOnlyLabel?: boolean;
};

export function ProjectPlatforms({ platforms, desktopOnlyLabel = false }: ProjectPlatformsProps) {
  return (
    <ul className={styles.platforms} aria-label="Платформы">
      {platforms.map((platform) => {
        const iconStyle = {
          "--platform-icon": `url("${platformIcons[platform]}")`,
        } as CSSProperties & { "--platform-icon": string };

        return (
          <li key={platform}>
            <span className={styles.icon} style={iconStyle} aria-hidden="true" />
            {desktopOnlyLabel && platform === "Desktop" ? "Only Desktop" : platform}
          </li>
        );
      })}
    </ul>
  );
}
