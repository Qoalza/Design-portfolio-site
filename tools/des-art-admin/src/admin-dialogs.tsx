import { CheckCircledIcon, ChevronDownIcon, ChevronUpIcon, DragHandleDots2Icon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { AlertDialog, Button, Dialog, Flex, Heading, IconButton, Switch, Text, TextField } from "@radix-ui/themes";
import { useMemo, useState } from "react";
import type { AdminProject, FieldIssue, PublishJob } from "./admin-model";
import { createSlugPreview } from "./admin-model";

export function NewProjectDialog({ open, existingSlugs, close, create }: { open: boolean; existingSlugs: string[]; close: () => void; create: (title: string, slug?: string) => void }) {
  const [title, setTitle] = useState("");
  const [custom, setCustom] = useState(false);
  const [slug, setSlug] = useState("");
  const preview = createSlugPreview(slug || title, existingSlugs);
  return <Dialog.Root open={open} onOpenChange={(value) => { if (!value) close(); }}><Dialog.Content maxWidth="520px">
    <Dialog.Title>Новый проект</Dialog.Title><Dialog.Description>Название можно написать свободно — адрес сформирует система.</Dialog.Description>
    <label className="dialog-field"><Text size="2" weight="medium">Название проекта</Text><TextField.Root autoFocus value={title} onChange={(event) => setTitle(event.target.value)} /></label>
    <Text size="1" color="gray">Будущий адрес: /projects/{preview}</Text>
    <Button size="1" variant="ghost" color="gray" onClick={() => setCustom((value) => !value)}>{custom ? "Использовать автоматический адрес" : "Изменить адрес"}</Button>
    {custom ? <label className="dialog-field"><Text size="2" weight="medium">Адрес</Text><TextField.Root value={slug} onChange={(event) => setSlug(event.target.value)} /></label> : null}
    <Flex justify="end" gap="3" mt="5"><Button variant="soft" color="gray" onClick={close}>Отмена</Button><Button disabled={!title.trim()} onClick={() => create(title, custom ? slug : undefined)}>Создать</Button></Flex>
  </Dialog.Content></Dialog.Root>;
}

export function ConfirmDialog({ open, title, description, confirmLabel, danger, close, confirm }: { open: boolean; title: string; description: string; confirmLabel: string; danger?: boolean; close: () => void; confirm: () => void }) {
  return <AlertDialog.Root open={open} onOpenChange={(value) => { if (!value) close(); }}><AlertDialog.Content maxWidth="520px">
    <AlertDialog.Title>{title}</AlertDialog.Title><AlertDialog.Description>{description}</AlertDialog.Description>
    <Flex justify="end" gap="3" mt="5"><AlertDialog.Cancel><Button variant="soft" color="gray">Отмена</Button></AlertDialog.Cancel><AlertDialog.Action><Button color={danger ? "red" : "blue"} onClick={confirm}>{confirmLabel}</Button></AlertDialog.Action></Flex>
  </AlertDialog.Content></AlertDialog.Root>;
}

export function IssueDialog({ open, title, issues, close, navigate }: { open: boolean; title: string; issues: FieldIssue[]; close: () => void; navigate: (issue: FieldIssue) => void }) {
  return <Dialog.Root open={open} onOpenChange={(value) => { if (!value) close(); }}><Dialog.Content maxWidth="620px">
    <Dialog.Title>{title}</Dialog.Title><Dialog.Description>Исправьте отмеченные поля — после этого предпросмотр и публикация станут доступны.</Dialog.Description>
    <div className="issue-list">{issues.map((issue, index) => <button key={`${issue.projectSlug ?? "current"}-${issue.field}-${index}`} onClick={() => navigate(issue)}><strong>{issue.projectTitle ? `${issue.projectTitle} · ` : ""}{issue.label ?? "Поле"}</strong><span>{issue.message}</span></button>)}</div>
    <Flex justify="end" mt="4"><Button onClick={close}>Понятно</Button></Flex>
  </Dialog.Content></Dialog.Root>;
}

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
  const [order, setOrder] = useState(initial);
  const [enabled, setEnabled] = useState(() => new Set(initial));
  const [dragged, setDragged] = useState<string>();
  const [dropTarget, setDropTarget] = useState<string>();
  return (
    <Dialog.Root open={open} onOpenChange={(value) => { if (!value) cancel(); }}>
      <Dialog.Content maxWidth="600px">
        <Dialog.Title>На главной можно показать три проекта</Dialog.Title>
        <Dialog.Description>Отключите один проект и расположите оставшиеся в нужном порядке.</Dialog.Description>
        <div className="home-list">
          {order.map((slug, index) => (
            <div
              key={slug}
              data-drop-target={dropTarget === slug || undefined}
              draggable
              onDragStart={() => setDragged(slug)}
              onDragOver={(event) => { event.preventDefault(); setDropTarget(slug); }}
              onDragLeave={() => setDropTarget((value) => value === slug ? undefined : value)}
              onDrop={() => {
                if (!dragged || dragged === slug) return;
                const next = [...order];
                const from = next.indexOf(dragged);
                const to = next.indexOf(slug);
                if (from === -1 || to === -1) return;
                next.splice(to, 0, next.splice(from, 1)[0]);
                setOrder(next);
                setDropTarget(undefined);
              }}
            >
              <DragHandleDots2Icon />
              <Switch
                radius="full"
                checked={enabled.has(slug)}
                onCheckedChange={(value) => setEnabled((previous) => { const next = new Set(previous); if (value) next.add(slug); else next.delete(slug); return next; })}
              />
              <div className="home-project-copy"><Text weight="medium">{projects.find((item) => item.slug === slug)?.title}</Text><Text size="1" color="gray">{projects.find((item) => item.slug === slug)?.description}</Text></div>
              <Flex gap="1"><IconButton size="1" variant="ghost" color="gray" disabled={index === 0} aria-label="Переместить выше" onClick={() => setOrder((value) => { const next = [...value]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })}><ChevronUpIcon /></IconButton><IconButton size="1" variant="ghost" color="gray" disabled={index === order.length - 1} aria-label="Переместить ниже" onClick={() => setOrder((value) => { const next = [...value]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next; })}><ChevronDownIcon /></IconButton></Flex>
            </div>
          ))}
        </div>
        <Flex justify="end" gap="3">
          <Button variant="soft" color="gray" onClick={cancel}>Отмена</Button>
          <Button disabled={enabled.size !== 3} onClick={() => apply(order.filter((slug) => enabled.has(slug)))}>Применить</Button>
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
        <Text className="publish-warning" size="2">{job.status === "failed" ? "Изменения сохранены. Сайт не изменён." : "Можно закрыть эту страницу. Не выключайте Mac до завершения публикации."}</Text>
        {job.status === "complete" || job.status === "failed" ? <Button onClick={close}>Закрыть</Button> : null}
      </div>
    </div>
  );
}
