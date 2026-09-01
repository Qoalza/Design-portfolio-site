import { ChevronDownIcon, EyeOpenIcon, TrashIcon } from "@radix-ui/react-icons";
import {
  Button,
  Callout,
  DropdownMenu,
  Flex,
  Select,
  Switch,
  Text,
  TextField,
} from "@radix-ui/themes";
import type {
  ProjectContentBlock,
  ProjectDocument,
  ProjectGalleryGroup,
  ProjectPlatform,
  ProjectVisibility,
} from "../../../src/lib/project-contract";
import { groupDefaults } from "./admin-editor";
import type { AdminProject, FieldIssue } from "./admin-model";
import { issueFor, pendingGalleryDevices, withPendingGalleryDevices } from "./admin-model";
import { Field, RailGroup } from "./admin-ui";
import { changeProjectFileState, changeProjectMaterialsState } from "../material-state.mjs";

export function ProjectActions({
  project,
  changed,
  preview,
  publish,
  setVisibility,
  unpublish,
  permanentDelete,
  issues,
  reviewIssues,
}: {
  project: AdminProject;
  changed: boolean;
  preview: (route: "home" | "catalog" | "project") => void;
  publish: () => void;
  setVisibility: (visibility: ProjectVisibility) => void;
  unpublish: () => void;
  permanentDelete: () => void;
  issues: FieldIssue[];
  reviewIssues: () => void;
}) {
  return (
    <RailGroup title="Проект" description={issues.length ? `Нужно исправить · ${issues.length}` : "Готов к публикации"}>
      <Text size="2" color={project.visibility === "published" ? "green" : project.visibility === "deleted" ? "red" : "gray"}>{project.visibility === "published" ? "Опубликован" : project.visibility === "deleted" ? "Удалён" : "Черновик"}</Text>
      {issues.length ? <Button size="3" variant="soft" color="orange" onClick={reviewIssues}>Показать ошибки · {issues.length}</Button> : null}
      {project.visibility !== "deleted" ? <Flex className="preview-split" gap="0"><Button size="3" variant="soft" color="gray" onClick={() => preview("home")}><EyeOpenIcon />Предпросмотр</Button><DropdownMenu.Root><DropdownMenu.Trigger asChild><Button size="3" variant="soft" color="gray" aria-label="Выбрать страницу предпросмотра"><ChevronDownIcon /></Button></DropdownMenu.Trigger><DropdownMenu.Content><DropdownMenu.Item onSelect={() => preview("catalog")}>Все работы</DropdownMenu.Item><DropdownMenu.Item onSelect={() => preview("project")}>Страница проекта</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Root></Flex> : null}
      {project.visibility === "draft" ? <Button size="3" onClick={publish}>Опубликовать</Button> : null}
      {project.visibility === "published" && changed ? <Button size="3" onClick={publish}>Опубликовать изменения</Button> : null}
      {project.visibility === "deleted" ? (
        <>
          <Button size="3" variant="soft" onClick={() => setVisibility("draft")}>Восстановить</Button>
          <Button size="3" variant="ghost" color="red" onClick={permanentDelete}>Удалить навсегда</Button>
        </>
      ) : (
        <div className="rail-danger-actions">{project.visibility === "published" ? <Button size="3" variant="ghost" color="gray" onClick={unpublish}>Снять с публикации</Button> : null}<Button size="3" variant="ghost" color="red" onClick={() => setVisibility("deleted")}><TrashIcon />Переместить в удалённые</Button></div>
      )}
    </RailGroup>
  );
}

export function CardSettings({
  project,
  update,
  home,
}: {
  project: AdminProject;
  update: (patch: Partial<AdminProject>) => void;
  home: (enabled: boolean) => void;
}) {
  const platform = (item: ProjectPlatform, enabled: boolean) => update({
    platforms: enabled
      ? [...new Set([...project.platforms, item])]
      : project.platforms.filter((value) => value !== item),
  });
  return (
    <>
      <RailGroup title="Настройки карточки">
        <Field label="Адрес проекта" hint="Задаётся при создании">
          <TextField.Root size="3" readOnly value={project.slug} />
        </Field>
        <Field label="Год">
          <TextField.Root size="3" type="number" value={String(project.year)} onChange={(event) => update({ year: Number(event.target.value) })} />
        </Field>
      </RailGroup>
      <RailGroup title="Платформы">
        <div className="rail-switch-list">
          {(["Desktop", "Tablet", "Mobile"] as ProjectPlatform[]).map((item) => (
            <label className="switch-line" key={item}>
              <Text size="2">{item}</Text>
              <Switch radius="full" checked={project.platforms.includes(item)} onCheckedChange={(value) => platform(item, value)} />
            </label>
          ))}
        </div>
      </RailGroup>
      <RailGroup title="Главная" description="Позиция определяется code-owned профилем.">
        <label className="switch-line">
          <div>
            <Text size="2" weight="medium">Показывать на главной</Text>
            {project.homePlacement ? (
              <Text as="p" size="1" color="gray">Позиция: {project.homePlacement === "primary" ? "основная" : "вторая"}</Text>
            ) : null}
          </div>
          <Switch radius="full" checked={Boolean(project.homePlacement)} disabled={project.visibility !== "published" || project.designProfile === "catalog-only-v1"} onCheckedChange={home} />
        </label>
        {project.visibility !== "published" ? <Text size="1" color="gray">Сначала переведите проект в состояние «Опубликован».</Text> : null}
      </RailGroup>
    </>
  );
}

function MaterialsSettings({
  project,
  update,
  issues,
}: {
  project: AdminProject;
  update: (patch: Partial<AdminProject>) => void;
  issues: FieldIssue[];
}) {
  const value = project.materials;
  const projectState = (state: "completed" | "in_progress") => update({
    materials: changeProjectMaterialsState(value, state),
  });
  const fileState = (state: string) => update({
    materials: changeProjectFileState(value, state as ProjectDocument["materials"]["fileState"]),
  });
  return (
    <RailGroup title="Материалы проекта" description="Определяет состояние файла внизу публичной страницы.">
      <Field label="Состояние проекта">
        <Select.Root value={value.projectState} onValueChange={(item) => projectState(item as "completed" | "in_progress")}>
          <Select.Trigger />
          <Select.Content>
            <Select.Item value="completed">Завершён</Select.Item>
            <Select.Item value="in_progress">Дополняется</Select.Item>
          </Select.Content>
        </Select.Root>
      </Field>
      <Field label="Отдельный файл">
        <Select.Root value={value.fileState} onValueChange={fileState}>
          <Select.Trigger />
          <Select.Content>
            <Select.Item value="available">Доступен</Select.Item>
            {value.projectState === "completed" ? (
              <Select.Item value="absent">У проекта нет файла</Select.Item>
            ) : (
              <Select.Item value="unavailable">Временно недоступен</Select.Item>
            )}
          </Select.Content>
        </Select.Root>
      </Field>
      {value.fileState === "available" ? (
        <Field label="Ссылка на Figma" hint="Обязательное поле" error={issueFor(issues, "materials.figmaUrl")}>
          <TextField.Root size="3"
            type="url"
            value={value.figmaUrl}
            onChange={(event) => update({ materials: { ...value, figmaUrl: event.target.value } })}
          />
        </Field>
      ) : null}
      {value.projectState === "in_progress" && value.fileState === "available" ? (
        <Field label="Дата последнего обновления" hint="Необязательно" error={issueFor(issues, "materials.updatedAt")}>
          <TextField.Root size="3"
            value={value.updatedAt ?? ""}
            onChange={(event) => update({ materials: { ...value, updatedAt: event.target.value || undefined } })}
          />
        </Field>
      ) : null}
      {value.projectState === "completed" && value.fileState === "absent" ? (
        <Callout.Root color="gray" size="1">
          <Callout.Text>Будет отображён текст: «У проекта нет отдельного файла»</Callout.Text>
        </Callout.Root>
      ) : null}
    </RailGroup>
  );
}

function GallerySettings({ project, update }: { project: AdminProject; update: (patch: Partial<AdminProject>) => void }) {
  const gallery = project.content.find((block): block is Extract<ProjectContentBlock, { type: "gallery" }> => block.type === "gallery")
    ?? { type: "gallery", templateId: "gallery.devices-v1", groups: [] };
  const pending = pendingGalleryDevices(project);
  const setEnabled = (id: ProjectGalleryGroup["deviceId"], enabled: boolean) => {
    const hasGroup = gallery.groups.some((group) => group.deviceId === id);
    const next = {
      ...gallery,
      groups: enabled
        ? gallery.groups
        : gallery.groups.filter((group) => group.deviceId !== id),
    };
    const nextProject = withPendingGalleryDevices({
      ...project,
      content: next.groups.length === 0
        ? project.content.filter((block) => block.type !== "gallery")
        : project.content.some((block) => block.type === "gallery")
          ? project.content.map((block) => block.type === "gallery" ? next : block)
          : [...project.content, next],
    }, enabled && !hasGroup
      ? [...new Set([...pending, id])]
      : pending.filter((item) => item !== id));
    update(nextProject);
  };
  return (
    <RailGroup title="Галерея" description="Одна галерея, от одного до трёх типов устройств.">
      <div className="rail-switch-list">
        {(["desktop", "tablet", "mobile"] as const).map((id) => (
          <label className="switch-line" key={id}>
            <Text size="2">{groupDefaults[id].label}</Text>
            <Switch radius="full" checked={gallery.groups.some((group) => group.deviceId === id) || pending.includes(id)} onCheckedChange={(enabled) => setEnabled(id, enabled)} />
          </label>
        ))}
      </div>
      {pending.length ? <Text size="1" color="orange">Добавьте изображение для включённых устройств или отключите их перед предпросмотром и публикацией.</Text> : null}
    </RailGroup>
  );
}

export function PageSettings({
  project,
  update,
  issues,
}: {
  project: AdminProject;
  update: (patch: Partial<AdminProject>) => void;
  issues: FieldIssue[];
}) {
  return (
    <>
      <RailGroup title="Доступность страницы">
        <label className="switch-line">
          <div>
            <Text size="2" weight="medium">Страница проекта</Text>
            <Text as="p" size="1" color="gray">{project.detailAvailable ? "Доступна" : "Недоступна · в карточке «Скоро»"}</Text>
          </div>
          <Switch radius="full" checked={project.detailAvailable} onCheckedChange={(detailAvailable) => update({ detailAvailable })} />
        </label>
      </RailGroup>
      <MaterialsSettings project={project} update={update} issues={issues} />
      <GallerySettings project={project} update={update} />
    </>
  );
}
