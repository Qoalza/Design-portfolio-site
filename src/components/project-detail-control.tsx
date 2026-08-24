import { ControlButton } from "./ui-controls";

type ProjectDetailControlProps = {
  className?: string;
} & (
  | {
      available: true;
      href: string;
      breadcrumbLabel: string;
    }
  | {
      available: false;
      href?: never;
      breadcrumbLabel?: never;
    }
);

export function ProjectDetailControl(props: ProjectDetailControlProps) {
  if (!props.available) {
    return <ControlButton className={props.className} variant="neutral" disabled>Скоро</ControlButton>;
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
