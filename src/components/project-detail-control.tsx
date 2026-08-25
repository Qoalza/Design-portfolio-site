import { ControlButton } from "./ui-controls";
import type { ProjectAvailability } from "../lib/projects";
import { Tooltip } from "./tooltip";

type ProjectDetailControlProps = {
  className?: string;
} & (
  | {
      availability: Extract<ProjectAvailability["detail"], "available">;
      href: string;
      breadcrumbLabel: string;
    }
  | {
      availability: Extract<ProjectAvailability["detail"], "unavailable">;
      href?: never;
      breadcrumbLabel?: never;
    }
);

export function ProjectDetailControl(props: ProjectDetailControlProps) {
  if (props.availability === "unavailable") {
    return (
      <Tooltip content={{ text: "Вот-вот, горяченькое несу уже!", icon: "/assets/projects/rocket.svg", iconTone: "accent" }}>
        <ControlButton className={props.className} variant="neutral" disabled>Скоро</ControlButton>
      </Tooltip>
    );
  }

  return (
    <ControlButton
      className={props.className}
      variant="neutral"
      href={props.href}
      breadcrumbLabel={props.breadcrumbLabel}
    >
      Подробнее
    </ControlButton>
  );
}
