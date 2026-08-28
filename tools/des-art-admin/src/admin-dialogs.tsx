import { CheckCircledIcon, DragHandleDots2Icon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Button, Dialog, Flex, Heading, Switch, Text } from "@radix-ui/themes";
import { useMemo, useState } from "react";
import type { AdminProject, PublishJob } from "./admin-model";

export function HomeLimitDialog({
  open,
  projects,
  requested,
  cancel,
  apply,
}: {
  open: boolean;
  projects: AdminProject[];
  requested?: string;
  cancel: () => void;
  apply: (slugs: string[]) => void;
}) {
  const initial = useMemo(() => {
    const selected = projects
      .filter((item) => item.featuredOnHome)
      .sort((first, second) => (first.homeOrder ?? 99) - (second.homeOrder ?? 99))
      .map((item) => item.slug);
    return requested && !selected.includes(requested) ? [...selected, requested] : selected;
  }, [projects, requested]);
  const [slugs, setSlugs] = useState(initial);
  const [dragged, setDragged] = useState<string>();
  return (
    <Dialog.Root open={open} onOpenChange={(value) => { if (!value) cancel(); }}>
      <Dialog.Content maxWidth="600px">
        <Dialog.Title>На главной можно показать три проекта</Dialog.Title>
        <Dialog.Description>Отключите один проект и расположите оставшиеся в нужном порядке.</Dialog.Description>
        <div className="home-list">
          {initial.map((slug) => (
            <div
              key={slug}
              draggable
              onDragStart={() => setDragged(slug)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!dragged || dragged === slug) return;
                const next = [...slugs];
                const from = next.indexOf(dragged);
                const to = next.indexOf(slug);
                if (from === -1 || to === -1) return;
                next.splice(to, 0, next.splice(from, 1)[0]);
                setSlugs(next);
              }}
            >
              <DragHandleDots2Icon />
              <Switch
                radius="full"
                checked={slugs.includes(slug)}
                onCheckedChange={(value) => setSlugs(value ? [...slugs, slug] : slugs.filter((item) => item !== slug))}
              />
              <Text>{projects.find((item) => item.slug === slug)?.title}</Text>
            </div>
          ))}
        </div>
        <Flex justify="end" gap="3">
          <Button variant="soft" color="gray" onClick={cancel}>Отмена</Button>
          <Button disabled={slugs.length > 3} onClick={() => apply(slugs)}>Применить</Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

export function PublishOverlay({ job, close }: { job: PublishJob | null; close: () => void }) {
  if (!job) return null;
  return (
    <div className="publish-overlay" role="dialog" aria-modal="true" aria-label="Публикация изменений">
      <div className="publish-card">
        <div className="publish-stages">
          {job.stages.map((stage) => (
            <div
              key={stage.id}
              data-state={stage.status === "complete" ? "complete" : job.currentStage === stage.id ? "active" : "pending"}
            >
              <span>{stage.status === "complete" ? <CheckCircledIcon /> : <i />}</span>
              <Text size="1">{stage.label}</Text>
            </div>
          ))}
        </div>
        <div className="publish-current">
          {job.status === "running" || job.status === "queued" ? (
            <div className="spinner" />
          ) : job.status === "complete" ? (
            <CheckCircledIcon />
          ) : (
            <ExclamationTriangleIcon />
          )}
          <Heading size="5">{job.status === "failed" ? "Публикация остановлена" : job.message}</Heading>
          {job.error ? (
            <Text color="red">{job.error}</Text>
          ) : (
            <Text color="gray">Это безопасная локальная репетиция. Production не изменяется.</Text>
          )}
        </div>
        <Text className="publish-warning" size="2">Можно закрыть эту страницу. Не выключайте Mac до завершения публикации.</Text>
        {job.status === "complete" || job.status === "failed" ? <Button onClick={close}>Закрыть</Button> : null}
      </div>
    </div>
  );
}
