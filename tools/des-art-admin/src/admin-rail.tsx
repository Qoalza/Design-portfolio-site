import { EyeOpenIcon } from "@radix-ui/react-icons";
import {
  Badge,
  Button,
  Callout,
  Select,
  Switch,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import type {
  ProjectContentBlock,
  ProjectGalleryGroup,
  ProjectPlatform,
  ProjectSectionBlock,
  ProjectVisibility,
} from "../../../src/lib/project-contract";
import { groupDefaults } from "./admin-editor";
import type { AdminProject, AdminSection, FieldIssue } from "./admin-model";
import { inline, issueFor, sectionSetting, textOf, withSectionSetting } from "./admin-model";
import { Field, RailGroup } from "./admin-ui";

export function ProjectActions({
  project,
  changed,
  preview,
  publish,
  setVisibility,
  permanentDelete,
  issues,
  reviewIssues,
}: {
  project: AdminProject;
  changed: boolean;
  preview: () => void;
  publish: () => void;
  setVisibility: (visibility: ProjectVisibility) => void;
  permanentDelete: () => void;
  issues: FieldIssue[];
  reviewIssues: () => void;
}) {
  return (
    <RailGroup title="Проект" description={issues.length ? `Нужно исправить · ${issues.length}` : "Готов к публикации"}>
      <Select.Root value={project.visibility} onValueChange={(value) => setVisibility(value as ProjectVisibility)}>
        <Select.Trigger />
        <Select.Content>
          <Select.Item value="draft">Черновик</Select.Item>
          <Select.Item value="published">Опубликован</Select.Item>
          <Select.Item value="deleted">Удалён</Select.Item>
        </Select.Content>
      </Select.Root>
      {issues.length ? <Button variant="soft" color="orange" onClick={reviewIssues}>Показать ошибки · {issues.length}</Button> : null}
      <Button variant="soft" color="gray" onClick={preview}><EyeOpenIcon />Предпросмотр</Button>
      {changed ? <Button onClick={publish}>Опубликовать этот проект</Button> : null}
      {project.visibility === "deleted" ? (
        <>
          <Button variant="soft" onClick={() => setVisibility("draft")}>Восстановить</Button>
          <Button variant="ghost" color="red" onClick={permanentDelete}>Удалить навсегда</Button>
        </>
      ) : (
        <Button variant="ghost" color="red" onClick={() => setVisibility("deleted")}>Переместить в удалённые</Button>
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
          <TextField.Root readOnly value={project.slug} />
        </Field>
        <Field label="Год">
          <TextField.Root type="number" value={String(project.year)} onChange={(event) => update({ year: Number(event.target.value) })} />
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
      <RailGroup title="Главная" description="На главной может быть не более трёх проектов.">
        <label className="switch-line">
          <div>
            <Text size="2" weight="medium">Показывать на главной</Text>
            {project.featuredOnHome && project.homeOrder ? (
              <Text as="p" size="1" color="gray">Позиция {project.homeOrder}</Text>
            ) : null}
          </div>
          <Switch radius="full" checked={project.featuredOnHome} disabled={project.visibility !== "published"} onCheckedChange={home} />
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
    materials: state === "completed"
      ? { projectState: "completed", fileState: "available", figmaUrl: "" }
      : { projectState: "in_progress", fileState: "available", figmaUrl: "" },
  });
  const fileState = (state: string) => update({
    materials: value.projectState === "completed"
      ? state === "available"
        ? { projectState: "completed", fileState: "available", figmaUrl: "" }
        : { projectState: "completed", fileState: "absent" }
      : state === "available"
        ? { projectState: "in_progress", fileState: "available", figmaUrl: "" }
        : { projectState: "in_progress", fileState: "unavailable" },
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
          <TextField.Root
            type="url"
            value={value.figmaUrl}
            onChange={(event) => update({ materials: { ...value, figmaUrl: event.target.value } })}
          />
        </Field>
      ) : null}
      {value.projectState === "in_progress" && value.fileState === "available" ? (
        <Field label="Дата последнего обновления" hint="Необязательно" error={issueFor(issues, "materials.updatedAt")}>
          <TextField.Root
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

function updateSection(project: AdminProject, target: AdminSection, next: AdminSection): AdminProject {
  return { ...project, content: project.content.map((block) => block === target ? next : block) };
}

function SectionSettings({
  project,
  section,
  change,
}: {
  project: AdminProject;
  section: AdminSection;
  change: (project: AdminProject) => void;
}) {
  const settings = sectionSetting(project, section.adminId);
  const notice = section.blocks.find((block): block is Extract<ProjectSectionBlock, { type: "notice" }> => block.type === "notice");
  const image = section.blocks.find((block): block is Extract<ProjectSectionBlock, { type: "image" }> => block.type === "image");
  const noticeEnabled = settings.noticeEnabled ?? Boolean(notice);
  const interactive = settings.interactive ?? { enabled: Boolean(image), status: image ? "connected" as const : undefined };
  const changeSetting = (patch: Parameters<typeof withSectionSetting>[2]) => change(withSectionSetting(project, section.adminId, patch));
  const changeNotice = (enabled: boolean) => {
    let next = project;
    if (enabled && !notice) {
      next = updateSection(project, section, { ...section, blocks: [...section.blocks, { type: "notice", variant: "default", content: inline("") }] });
    }
    change(withSectionSetting(next, section.adminId, { noticeEnabled: enabled }));
  };
  const changeNoticeContent = (text: string) => {
    const nextNotice: Extract<ProjectSectionBlock, { type: "notice" }> = {
      type: "notice",
      variant: settings.noticeVariant ?? notice?.variant ?? "default",
      content: inline(text),
    };
    change(updateSection(project, section, {
      ...section,
      blocks: [...section.blocks.filter((block) => block.type !== "notice"), nextNotice],
    }));
  };
  return (
    <RailGroup title={`Секция · ${section.heading}`} description="Настройки выбранной секции" selected>
      <label className="switch-line">
        <div>
          <Text size="2" weight="medium">Примечание</Text>
          <Text as="p" size="1" color="gray">Отдельный акцентный текст</Text>
        </div>
        <Switch radius="full" checked={noticeEnabled} onCheckedChange={changeNotice} />
      </label>
      {noticeEnabled ? (
        <>
          <Field label="Текст примечания">
            <TextArea rows={4} value={notice ? textOf(notice.content) : ""} onChange={(event) => changeNoticeContent(event.target.value)} />
          </Field>
          <Field label="Ширина">
            <Select.Root
              value={settings.noticeVariant ?? notice?.variant ?? "default"}
              onValueChange={(variant) => changeSetting({ noticeVariant: variant as "default" | "wide" })}
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="default">Обычная</Select.Item>
                <Select.Item value="wide">Широкая</Select.Item>
              </Select.Content>
            </Select.Root>
          </Field>
        </>
      ) : null}
      <div className="rail-divider" />
      <label className="switch-line">
        <div>
          <Text size="2" weight="medium">Интерактивный экран</Text>
          <Text as="p" size="1" color="gray">Фрейм из Figma поверх публичного фона</Text>
        </div>
        <Switch
          radius="full"
          checked={interactive.enabled}
          onCheckedChange={(enabled) => changeSetting({ interactive: { ...interactive, enabled } })}
        />
      </label>
      {interactive.enabled ? (
        <>
          <Field label="Ссылка на фрейм Figma" hint="Codex подготовит экран по размерам фрейма">
            <TextField.Root
              type="url"
              value={interactive.figmaUrl ?? ""}
              onChange={(event) => changeSetting({
                interactive: {
                  enabled: true,
                  figmaUrl: event.target.value,
                  status: event.target.value ? "pending" : undefined,
                },
              })}
            />
          </Field>
          {image ? (
            <Badge color="green">Подключён существующий экран</Badge>
          ) : interactive.figmaUrl ? (
            <Callout.Root color="blue" size="1">
              <Callout.Text>Фрейм сохранён в запросе. Публикация будет доступна после подготовки ассета Codex.</Callout.Text>
            </Callout.Root>
          ) : (
            <Callout.Root color="gray" size="1"><Callout.Text>Вставьте ссылку на конкретный фрейм Figma.</Callout.Text></Callout.Root>
          )}
        </>
      ) : null}
      <Text size="1" color="gray">
        {interactive.enabled ? "Разделитель после секции скрыт." : "После секции будет разделитель."}
      </Text>
    </RailGroup>
  );
}

function GallerySettings({ project, update }: { project: AdminProject; update: (patch: Partial<AdminProject>) => void }) {
  const gallery = project.content.find((block): block is Extract<ProjectContentBlock, { type: "gallery" }> => block.type === "gallery")
    ?? { type: "gallery", title: "Галерея", description: "Интерфейсы проекта", groups: [] };
  const setEnabled = (id: ProjectGalleryGroup["id"], enabled: boolean) => {
    const next = {
      ...gallery,
      groups: enabled
        ? [...gallery.groups, { ...groupDefaults[id], items: [] }]
        : gallery.groups.filter((group) => group.id !== id),
    };
    update({
      content: project.content.some((block) => block.type === "gallery")
        ? project.content.map((block) => block.type === "gallery" ? next : block)
        : [...project.content, next],
    });
  };
  return (
    <RailGroup title="Галерея" description="Одна галерея, от одного до трёх типов устройств.">
      <div className="rail-switch-list">
        {(["desktop", "tablet", "mobile"] as const).map((id) => (
          <label className="switch-line" key={id}>
            <Text size="2">{groupDefaults[id].label}</Text>
            <Switch radius="full" checked={gallery.groups.some((group) => group.id === id)} onCheckedChange={(enabled) => setEnabled(id, enabled)} />
          </label>
        ))}
      </div>
    </RailGroup>
  );
}

export function PageSettings({
  project,
  update,
  selectedSection,
  issues,
}: {
  project: AdminProject;
  update: (patch: Partial<AdminProject>) => void;
  selectedSection?: string;
  issues: FieldIssue[];
}) {
  const section = project.content.find((block): block is AdminSection => block.type === "section" && block.adminId === selectedSection);
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
      {section ? <div className="selected-section-settings"><Text size="1" color="gray">Настройки · Секция {project.content.filter((block) => block.type === "section").findIndex((block) => block.adminId === section.adminId) + 1} · {section.heading || "Без названия"}</Text><SectionSettings project={project} section={section} change={(next) => update(next)} /></div> : (
        <RailGroup title="Настройки секции" description="Выберите секцию в центральной области." />
      )}
      <GallerySettings project={project} update={update} />
    </>
  );
}
