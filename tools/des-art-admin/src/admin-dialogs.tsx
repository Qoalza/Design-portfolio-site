import { CheckCircledIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { AlertDialog, Button, Dialog, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useState } from "react";
import type { FieldIssue, PublishJob } from "./admin-model";
import { createSlugPreview } from "./admin-model";

export function NewProjectDialog({ open, existingSlugs, close, create }: { open: boolean; existingSlugs: string[]; close: () => void; create: (title: string, slug?: string) => void }) {
  const [title, setTitle] = useState("");
  const [custom, setCustom] = useState(false);
  const [slug, setSlug] = useState("");
  const preview = createSlugPreview(slug || title, existingSlugs);
  return <Dialog.Root open={open} onOpenChange={(value) => { if (!value) close(); }}><Dialog.Content maxWidth="520px">
    <Dialog.Title>Новый проект</Dialog.Title><Dialog.Description>Название можно написать свободно — адрес сформирует система.</Dialog.Description>
    <label className="dialog-field"><Text size="2" weight="medium">Название проекта</Text><TextField.Root size="3" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} /></label>
    <Text size="1" color="gray">Будущий адрес: /projects/{preview}</Text>
    <Button size="3" variant="ghost" color="gray" onClick={() => setCustom((value) => !value)}>{custom ? "Использовать автоматический адрес" : "Изменить адрес"}</Button>
    {custom ? <label className="dialog-field"><Text size="2" weight="medium">Адрес</Text><TextField.Root size="3" value={slug} onChange={(event) => setSlug(event.target.value)} /></label> : null}
    <Flex justify="end" gap="3" mt="5"><Button size="3" variant="soft" color="gray" onClick={close}>Отмена</Button><Button size="3" disabled={!title.trim()} onClick={() => create(title, custom ? slug : undefined)}>Создать</Button></Flex>
  </Dialog.Content></Dialog.Root>;
}

export function ConfirmDialog({ open, title, description, confirmLabel, danger, close, confirm }: { open: boolean; title: string; description: string; confirmLabel: string; danger?: boolean; close: () => void; confirm: () => void }) {
  return <AlertDialog.Root open={open} onOpenChange={(value) => { if (!value) close(); }}><AlertDialog.Content maxWidth="520px">
    <AlertDialog.Title>{title}</AlertDialog.Title><AlertDialog.Description>{description}</AlertDialog.Description>
    <Flex justify="end" gap="3" mt="5"><AlertDialog.Cancel><Button size="3" variant="soft" color="gray">Отмена</Button></AlertDialog.Cancel><AlertDialog.Action><Button size="3" color={danger ? "red" : "blue"} onClick={confirm}>{confirmLabel}</Button></AlertDialog.Action></Flex>
  </AlertDialog.Content></AlertDialog.Root>;
}

export function IssueDialog({ open, title, issues, close, navigate }: { open: boolean; title: string; issues: FieldIssue[]; close: () => void; navigate: (issue: FieldIssue) => void }) {
  return <Dialog.Root open={open} onOpenChange={(value) => { if (!value) close(); }}><Dialog.Content maxWidth="620px">
    <Dialog.Title>{title}</Dialog.Title><Dialog.Description>Исправьте отмеченные поля — после этого предпросмотр и публикация станут доступны.</Dialog.Description>
    <div className="issue-list">{issues.map((issue, index) => <button key={`${issue.projectSlug ?? "current"}-${issue.field}-${index}`} onClick={() => navigate(issue)}><strong>{issue.projectTitle ? `${issue.projectTitle} · ` : ""}{issue.title ?? issue.label ?? "Не удалось проверить поле"}</strong><span>{issue.message}</span></button>)}</div>
    <Flex justify="end" mt="4"><Button size="3" onClick={close}>Понятно</Button></Flex>
  </Dialog.Content></Dialog.Root>;
}

export function PublishOverlay({ job, mode, close, resume }: { job: PublishJob | null; mode: "live" | "sandbox"; close: () => void; resume: (jobId: string) => void }) {
  if (!job) return null;
  return (
    <div className="publish-overlay" role="dialog" aria-modal="true" aria-label="Публикация изменений">
      <div className="publish-card">
        <div className="publish-stages" aria-label="Этапы публикации">
          {job.stages.map((stage) => (
            <div
              className="publish-stage"
              key={stage.id}
              data-state={stage.status === "complete" ? "complete" : job.currentStage === stage.id ? "active" : "pending"}
            >
              <span className="publish-stage-marker" aria-hidden="true">
                {stage.status === "complete" ? <CheckCircledIcon /> : <i />}
              </span>
              <Text className="publish-stage-label" size="1">{stage.label}</Text>
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
          <Heading size="5">{job.status === "failed" ? job.errorTitle ?? "Публикация остановлена" : job.message}</Heading>
          {job.error ? (
            <>
              <Text color="red">{job.error}</Text>
              {job.diagnosticId ? <Text size="1" color="gray">Диагностика: {job.diagnosticId}</Text> : null}
            </>
          ) : (
            <Text color="gray">{mode === "live" ? "Изменения проходят проверки перед публикацией на art-des.ru." : "Это безопасная локальная репетиция. Production не изменяется."}</Text>
          )}
        </div>
        <Text className="publish-warning" size="2">
          {job.status === "failed"
            ? job.productionState === "main-updated-deploy-failed"
              ? "Изменения уже находятся в main, но deploy не завершён. Текущий работающий production сохранён."
              : "Изменения сохранены. Сайт не изменён."
            : job.status === "complete"
              ? mode === "live" ? "Изменения опубликованы на art-des.ru." : "Изменения опубликованы только в тестовом контуре."
              : "Можно закрыть эту страницу. Не выключайте Mac до завершения публикации."}
        </Text>
        {job.status === "complete" || job.status === "failed" ? <Flex gap="3">
          {job.status === "failed" && job.branch && job.contentCommit ? <Button size="3" onClick={() => resume(job.id)}>Продолжить</Button> : null}
          <Button size="3" variant="soft" color="gray" onClick={close}>Закрыть</Button>
        </Flex> : null}
      </div>
    </div>
  );
}
