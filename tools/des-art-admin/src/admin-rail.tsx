import { ChevronDownIcon, EyeOpenIcon, TrashIcon } from "@radix-ui/react-icons";
import { Button, Callout, DropdownMenu, Flex, Select, Switch, Text, TextField } from "@radix-ui/themes";
import type {
  ProjectDocument,
  ProjectVisibility,
} from "../../../src/lib/project-contract";
import type { AdminProject, FieldIssue } from "./admin-model";
import { issueFor } from "./admin-model";
import { Field, RailGroup } from "./admin-ui";
import { changeProjectFileState, changeProjectMaterialsState } from "../material-state.mjs";

export function ProjectOverview({
  project,
  changed,
  preview,
  publish,
  setVisibility,
  issues,
  reviewIssues,
}: {
  project: AdminProject;
  changed: boolean;
  preview: (route: "home" | "catalog" | "project") => void;
  publish: () => void;
  setVisibility: (visibility: ProjectVisibility) => void;
  issues: FieldIssue[];
  reviewIssues: () => void;
}) {
  return (
    <RailGroup title="Проект" description={issues.length ? `Нужно исправить · ${issues.length}` : "Готов к публикации"}>
      <Text size="2" color={project.visibility === "published" ? "green" : project.visibility === "deleted" ? "red" : "gray"}>{project.visibility === "published" ? "Опубликован" : project.visibility === "deleted" ? "Удалён" : "Черновик"}</Text>
      {issues.length ? <Button size="3" variant="soft" color="orange" onClick={reviewIssues}>Показать ошибки · {issues.length}</Button> : null}
      {project.visibility !== "deleted" ? <Flex className="preview-split" gap="0"><Button size="3" variant="soft" color="gray" onClick={() => preview("home")}><EyeOpenIcon />Предпросмотр</Button><DropdownMenu.Root><DropdownMenu.Trigger aria-label="Выбрать страницу предпросмотра"><button type="button" className="preview-split-trigger"><ChevronDownIcon /></button></DropdownMenu.Trigger><DropdownMenu.Content><DropdownMenu.Item onSelect={() => preview("catalog")}>Все работы</DropdownMenu.Item><DropdownMenu.Item onSelect={() => preview("project")}>Страница проекта</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Root></Flex> : null}
      {project.visibility === "draft" ? <Button size="3" onClick={publish}>Опубликовать</Button> : null}
      {project.visibility === "published" && changed ? <Button size="3" onClick={publish}>Опубликовать изменения</Button> : null}
      {project.visibility === "deleted" ? (
        <Button size="3" variant="soft" onClick={() => setVisibility("draft")}>Восстановить</Button>
      ) : null}
    </RailGroup>
  );
}

export function ProjectDangerActions({ project, setVisibility, unpublish, permanentDelete }: {
  project: AdminProject;
  setVisibility: (visibility: ProjectVisibility) => void;
  unpublish: () => void;
  permanentDelete: () => void;
}) {
  if (project.visibility === "deleted") return <div className="rail-danger-actions"><Button size="3" variant="ghost" color="red" onClick={permanentDelete}><TrashIcon />Удалить навсегда</Button></div>;
  return <div className="rail-danger-actions">{project.visibility === "published" ? <Button size="3" variant="ghost" color="gray" onClick={unpublish}>Снять с публикации</Button> : null}<Button size="3" variant="ghost" color="red" onClick={() => setVisibility("deleted")}><TrashIcon />Переместить в удалённые</Button></div>;
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
    </>
  );
}
