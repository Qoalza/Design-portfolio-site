/* eslint-disable @next/next/no-img-element -- local admin previews draft files outside Next Image */
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import {
  Badge,
  Button,
  Callout,
  Flex,
  Heading,
  IconButton,
  Select,
  Switch,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { useState } from "react";
import type {
  ProjectContentBlock,
  ProjectGalleryGroup,
  ProjectGalleryItem,
  ProjectImage,
  ProjectSectionBlock,
} from "../../../src/lib/project-contract";
import type { AdminProject, AdminSection } from "./admin-model";
import type { FieldIssue } from "./admin-model";
import { inline, issueFor, pendingGalleryDevices, sectionSetting, textOf, withPendingGalleryDevices, withSectionSetting } from "./admin-model";
import { Field, FrameField, ImagePreview, RichEditor, TagField } from "./admin-ui";

type Upload = (file: File, context: string) => Promise<ProjectImage>;

function replaceSectionText(section: AdminSection, value: ProjectSectionBlock[]): AdminSection {
  const managed = section.blocks.filter((block) => block.type === "notice" || block.type === "image" || block.type === "frame");
  return { ...section, blocks: [...value, ...managed] };
}

function updateSection(project: AdminProject, target: AdminSection, next: AdminSection): AdminProject {
  return { ...project, content: project.content.map((block) => block === target ? next : block) };
}

function SectionSettings({ project, section, change, importFrame }: { project: AdminProject; section: AdminSection; change: (project: AdminProject) => void; importFrame: (slot: "interactive", url: string, sectionId: string) => Promise<void> }) {
  const settings = sectionSetting(project, section.adminId);
  const notice = section.blocks.find((block): block is Extract<ProjectSectionBlock, { type: "notice" }> => block.type === "notice");
  const image = section.blocks.find((block): block is Extract<ProjectSectionBlock, { type: "image" }> => block.type === "image");
  const frame = section.blocks.find((block): block is Extract<ProjectSectionBlock, { type: "frame" }> => block.type === "frame");
  const noticeEnabled = settings.noticeEnabled ?? Boolean(notice);
  const interactive = settings.interactive ?? { enabled: Boolean(image || frame), status: image || frame ? "connected" as const : undefined };
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
    <div className="section-settings">
      <div className="section-settings-heading">
        <Text weight="medium">Настройки секции</Text>
        <Text size="1" color="gray">Действуют только для этой секции</Text>
      </div>
      <div className="section-settings-grid">
        <div className="section-setting">
          <label className="switch-line">
            <div><Text size="2" weight="medium">Примечание</Text><Text as="p" size="1" color="gray">Отдельный акцентный текст</Text></div>
            <Switch radius="full" checked={noticeEnabled} onCheckedChange={changeNotice} />
          </label>
          {noticeEnabled ? (
            <div className="section-setting-fields">
              <Field label="Текст примечания"><TextArea size="3" rows={3} value={notice ? textOf(notice.content) : ""} onChange={(event) => changeNoticeContent(event.target.value)} /></Field>
              <Field label="Ширина">
                <Select.Root value={settings.noticeVariant ?? notice?.variant ?? "default"} onValueChange={(variant) => changeSetting({ noticeVariant: variant as "default" | "wide" })}>
                  <Select.Trigger /><Select.Content><Select.Item value="default">Обычная</Select.Item><Select.Item value="wide">Широкая</Select.Item></Select.Content>
                </Select.Root>
              </Field>
            </div>
          ) : null}
        </div>
        <div className="section-setting">
          <label className="switch-line">
            <div><Text size="2" weight="medium">Интерактивный экран</Text><Text as="p" size="1" color="gray">Фрейм из Figma вместо разделителя</Text></div>
            <Switch radius="full" checked={interactive.enabled} onCheckedChange={(enabled) => changeSetting({ interactive: { ...interactive, enabled } })} />
          </label>
          {interactive.enabled ? (
            <div className="section-setting-fields">
              <FrameField key={`${project.slug}-${section.adminId}-${frame?.composition.source.url ?? interactive.figmaUrl ?? "empty"}`} title="Frame секции" description="Импортируется независимо для этой секции." composition={frame?.composition} source={interactive.figmaUrl} onImport={(url) => importFrame("interactive", url, section.adminId)} />
              {image && !frame ? <Callout.Root color="green" size="1"><Callout.Text>Подключён существующий managed-экран.</Callout.Text></Callout.Root> : null}
            </div>
          ) : <Text className="section-divider-status" size="1" color="gray">После секции будет разделитель.</Text>}
        </div>
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  project,
  index,
  count,
  selected,
  select,
  change,
  move,
  remove,
  issues,
  importFrame,
}: {
  section: AdminSection;
  project: AdminProject;
  index: number;
  count: number;
  selected: boolean;
  select: () => void;
  change: (value: AdminProject) => void;
  move: (delta: number) => void;
  remove: () => void;
  issues: FieldIssue[];
  importFrame: (slot: "interactive", url: string, sectionId: string) => Promise<void>;
}) {
  const managed = section.blocks.find((block): block is Extract<ProjectSectionBlock, { type: "image" }> => block.type === "image");
  return (
    <section className="editor-section section-editor" data-selected={selected || undefined} onFocus={select} onClick={select}>
      <div className="section-editor-heading">
        <Flex align="center" gap="2">
          <Heading size="3">Секция {index + 1}</Heading>
          {index > 0 ? <IconButton
            type="button"
            size="3"
            variant="ghost"
            color="red"
            aria-label={`Удалить секцию ${index + 1}`}
            onClick={(event) => { event.stopPropagation(); remove(); }}
          >
            <TrashIcon />
          </IconButton> : null}
        </Flex>
        <Flex gap="2">
          <IconButton type="button" size="3" variant="outline" color="gray" aria-label="Переместить выше" disabled={index === 0} onClick={() => move(-1)}>
            <ChevronUpIcon />
          </IconButton>
          <IconButton type="button" size="3" variant="outline" color="gray" aria-label="Переместить ниже" disabled={index === count - 1} onClick={() => move(1)}>
            <ChevronDownIcon />
          </IconButton>
        </Flex>
      </div>
      <Field field={`content.${section.adminId}.heading`} label="Заголовок секции" error={issueFor(issues, `content.${section.adminId}.heading`)}>
        <TextField.Root size="3" value={section.heading} onChange={(event) => change(updateSection(project, section, { ...section, heading: event.target.value }))} />
      </Field>
      <Field label="Описание секции">
        <RichEditor value={section.blocks} onChange={(value) => change(updateSection(project, section, replaceSectionText(section, value)))} />
      </Field>
      {managed ? (
        <div className="managed-preview">
          <div>
            <Text weight="medium">Интерактивный экран</Text>
            <Text as="p" size="1" color="gray">Существующая кодовая композиция сохранена без изменений.</Text>
          </div>
          <div className="managed-thumbnails">
            {managed.images.map((image, imageIndex) => <ImagePreview key={image.src} src={image.src} label={`Интерактивный экран · изображение ${imageIndex + 1}`}><img src={image.src} alt="" /></ImagePreview>)}
          </div>
        </div>
      ) : null}
      <SectionSettings project={project} section={section} change={change} importFrame={importFrame} />
    </section>
  );
}

export function CardEditor({
  project,
  update,
  uploadLogo,
  importFrame,
  issues,
}: {
  project: AdminProject;
  update: (patch: Partial<AdminProject>) => void;
  uploadLogo: (file: File) => Promise<AdminProject["logo"]>;
  importFrame: (slot: "catalog" | "hero" | "interactive", url: string, sectionId?: string) => Promise<void>;
  issues: FieldIssue[];
}) {
  return (
    <div className="editor-stack">
      <section className="editor-section frame-editor-section">
        <FrameField
          key={`${project.slug}-catalog-${project.catalogFrame?.source.url ?? "legacy"}`}
          title="Обложка карточки"
          description="Один адаптивный Frame используется на главной и в списке проектов."
          composition={project.catalogFrame}
          previewVariant="cover"
          onImport={(url) => importFrame("catalog", url)}
        />
        {!project.catalogFrame && (project.catalogImage || project.hero) ? <Text size="1" color="gray">Текущая managed-композиция сохранена и не изменится до успешного импорта Frame.</Text> : null}
      </section>
      <section className="editor-section editor-section-primary">
        <div className="section-heading-copy">
          <Heading size="4">Карточка проекта</Heading>
          <Text size="2" color="gray">Контент карточки на главной и в «Все работы».</Text>
        </div>
        <div className="form-grid">
          <Field field="title" label="Название" error={issueFor(issues, "title")} wide>
            <TextField.Root size="3" value={project.title} onChange={(event) => update({ title: event.target.value })} />
          </Field>
          <Field field="description" label="Описание" error={issueFor(issues, "description")} wide>
            <TextArea size="3" rows={4} value={project.description} onChange={(event) => update({ description: event.target.value })} />
          </Field>
          <Field field="role" label="Роль" error={issueFor(issues, "role")}>
            <TextField.Root size="3" value={project.role} onChange={(event) => update({ role: event.target.value })} />
          </Field>
          <TagField label="Краткие теги" value={project.tags} onChange={(tags) => update({ tags })} />
          <Field label="Что делал" wide>
            <TextArea size="3" rows={3} value={project.workSummary ?? ""} onChange={(event) => update({ workSummary: event.target.value || undefined })} />
          </Field>
        </div>
      </section>
      <section className="editor-section">
        <div className="asset-field logo-field">
          <div className="asset-copy"><Text weight="medium">Логотип проекта</Text><Text as="p" size="1" color="gray">Необязательно. Загрузите безопасный квадратный SVG.</Text></div>
          {project.logo ? <div className="logo-preview">{project.logo.type === "image" ? <ImagePreview src={project.logo.src} label="Логотип проекта"><img src={project.logo.src} alt="" /></ImagePreview> : <Text size="1" color="gray">Составной логотип сохранён</Text>}</div> : <div className="asset-placeholder"><Text size="1" color="gray">Логотип не добавлен</Text></div>}
          <Flex gap="2"><label><Button asChild size="3" variant="outline" color="gray"><span>{project.logo ? "Заменить" : "Загрузить SVG"}</span></Button><input hidden type="file" accept="image/svg+xml,.svg" onChange={async (event) => { const file = event.target.files?.[0]; if (file) update({ logo: await uploadLogo(file) }); event.target.value = ""; }} /></label>{project.logo ? <IconButton size="3" variant="ghost" color="red" aria-label="Удалить логотип" onClick={() => update({ logo: undefined })}><TrashIcon /></IconButton> : null}</Flex>
        </div>
      </section>
    </div>
  );
}

const groupDefaults: Record<ProjectGalleryGroup["id"], Omit<ProjectGalleryGroup, "items">> = {
  desktop: { id: "desktop", label: "Desktop", icon: "/assets/projects/corvo/desktop.svg", baseWidth: 740, baseHeight: 512 },
  tablet: { id: "tablet", label: "Tablet", icon: "/assets/projects/corvo/tablet.svg", baseWidth: 400, baseHeight: 566 },
  mobile: { id: "mobile", label: "Mobile", icon: "/assets/projects/corvo/mobile.svg", baseWidth: 180, baseHeight: 320 },
};

export { groupDefaults };

function GalleryEditor({
  gallery,
  change,
  upload,
}: {
  gallery: Extract<ProjectContentBlock, { type: "gallery" }>;
  change: (value: Extract<ProjectContentBlock, { type: "gallery" }>) => void;
  upload: Upload;
}) {
  const [importing, setImporting] = useState<ProjectGalleryGroup["id"]>();
  const [uploadErrors, setUploadErrors] = useState<Partial<Record<ProjectGalleryGroup["id"], string>>>({});
  const updateGroup = (id: string, value: ProjectGalleryGroup) => change({
    ...gallery,
    groups: gallery.groups.map((group) => group.id === id ? value : group),
  });
  return (
    <section className="editor-section gallery-editor">
      <div className="section-title">
        <div className="section-heading-copy">
          <Heading size="4">Галерея</Heading>
          <Text size="2" color="gray">Название и подпись заданы публичным шаблоном.</Text>
        </div>
        <Badge>{gallery.groups.reduce((sum, group) => sum + group.items.length, 0)} изображений</Badge>
      </div>
      {gallery.groups.length === 0 ? (
        <div className="empty-inline"><Text size="2" color="gray">Выберите устройства в настройках справа.</Text></div>
      ) : null}
      {gallery.groups.map((group) => (
        <div className="gallery-group" key={group.id}>
          <div className="section-title">
            <Heading size="3">{group.label}</Heading>
            <label>
              <Button asChild size="3" variant="soft" disabled={importing === group.id}><span>{importing === group.id ? "Загрузка…" : <><PlusIcon />Добавить изображение</>}</span></Button>
              <input
                hidden
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                disabled={importing === group.id}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  event.target.value = "";
                  setImporting(group.id);
                  try {
                    const image = await upload(file, `Галерея ${group.label}`);
                    const item: ProjectGalleryItem = {
                      ...image,
                      frame: { clip: true, radius: 12, strokeColor: "#e8eaeb", strokeWidth: 1 },
                    };
                    updateGroup(group.id, { ...group, items: [...group.items, item] });
                    setUploadErrors((value) => ({ ...value, [group.id]: undefined }));
                  } catch (error) {
                    setUploadErrors((value) => ({ ...value, [group.id]: error instanceof Error ? error.message : "Изображение не удалось загрузить. Выберите файл ещё раз." }));
                  } finally {
                    setImporting(undefined);
                  }
                }}
              />
            </label>
          </div>
          {uploadErrors[group.id] ? <Callout.Root color="red" size="1"><Callout.Text>{uploadErrors[group.id]}</Callout.Text></Callout.Root> : null}
          <ol className="gallery-list">
            {group.items.map((item, index) => (
              <li key={`${item.src}-${index}`}>
                <ImagePreview src={item.src} label={`Изображение ${index + 1}`}><img src={item.src} alt="" /></ImagePreview>
                <Flex className="gallery-item-name" align="center" gap="2"><Text size="2">Изображение {index + 1}</Text><IconButton type="button" size="3" variant="ghost" color="red" aria-label={`Удалить изображение ${index + 1}`} onClick={() => updateGroup(group.id, { ...group, items: group.items.filter((_, itemIndex) => itemIndex !== index) })}><TrashIcon /></IconButton></Flex>
                <Flex className="gallery-item-order" gap="2">
                  <IconButton size="3" variant="ghost" color="gray" aria-label="Переместить изображение выше" disabled={index === 0} onClick={() => { const items = [...group.items]; [items[index - 1], items[index]] = [items[index], items[index - 1]]; updateGroup(group.id, { ...group, items }); }}><ChevronUpIcon /></IconButton>
                  <IconButton size="3" variant="ghost" color="gray" aria-label="Переместить изображение ниже" disabled={index === group.items.length - 1} onClick={() => { const items = [...group.items]; [items[index + 1], items[index]] = [items[index], items[index + 1]]; updateGroup(group.id, { ...group, items }); }}><ChevronDownIcon /></IconButton>
                </Flex>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}

export function PageEditor({
  project,
  update,
  upload,
  selectedSection,
  selectSection,
  issues,
  importFrame,
}: {
  project: AdminProject;
  update: (patch: Partial<AdminProject>) => void;
  upload: Upload;
  selectedSection?: string;
  selectSection: (id: string) => void;
  issues: FieldIssue[];
  importFrame: (slot: "catalog" | "hero" | "interactive", url: string, sectionId?: string) => Promise<void>;
}) {
  const sections = project.content.filter((block): block is AdminSection => block.type === "section");
  const gallery = project.content.find((block): block is Extract<ProjectContentBlock, { type: "gallery" }> => block.type === "gallery")
    ?? { type: "gallery", title: "Галерея", description: "Интерфейсы проекта", groups: [] };
  const pending = pendingGalleryDevices(project);
  const galleryForEditing = {
    ...gallery,
    groups: [...gallery.groups, ...pending
      .filter((id) => !gallery.groups.some((group) => group.id === id))
      .map((id) => ({ ...groupDefaults[id], items: [] }))],
  };
  const galleryChange = (value: Extract<ProjectContentBlock, { type: "gallery" }>) => {
    const resolvedPending = pending.filter((id) => !value.groups.some((group) => group.id === id && group.items.length > 0));
    const publicGroups = value.groups.filter((group) => !resolvedPending.includes(group.id));
    const nextProject = withPendingGalleryDevices({
      ...project,
      content: publicGroups.length === 0
        ? project.content.filter((block) => block.type !== "gallery")
        : project.content.some((block) => block.type === "gallery")
          ? project.content.map((block) => block.type === "gallery" ? { ...value, groups: publicGroups } : block)
          : [...project.content, { ...value, groups: publicGroups }],
    }, resolvedPending);
    update(nextProject);
  };
  return (
    <div className="editor-stack">
      <section className="editor-section frame-editor-section">
        <FrameField
          key={`${project.slug}-hero-${project.heroFrame?.source.url ?? "legacy"}`}
          title="Главное изображение страницы"
          description="Frame занимает публичный визуальный слот и сохраняет constraints вложенных элементов."
          composition={project.heroFrame}
          required={project.detailAvailable}
          onImport={(url) => importFrame("hero", url)}
        />
        {!project.heroFrame && project.hero ? <Text size="1" color="gray">Существующее главное изображение сохранено как managed-композиция.</Text> : null}
      </section>
      <section className="editor-section editor-section-primary">
        <div className="section-heading-copy">
          <Heading size="4">Открытая страница проекта</Heading>
          <Text size="2" color="gray">Контент, который видит пользователь после открытия проекта.</Text>
        </div>
        <TagField label="Подробные теги" hint="Отображаются наверху открытого проекта · разделитель /" value={project.detailTags} onChange={(detailTags) => update({ detailTags })} />
      </section>
      <div className="content-heading">
        <div className="section-heading-copy">
          <Heading size="4">Содержание страницы</Heading>
          <Text size="2" color="gray">Одна секция соответствует одному пункту закреплённой навигации.</Text>
        </div>
      </div>
      {sections.map((section, index) => (
        <SectionEditor
          key={section.adminId}
          section={section}
          project={project}
          index={index}
          count={sections.length}
          selected={selectedSection === section.adminId}
          select={() => selectSection(section.adminId)}
          change={(value) => update(value)}
          move={(delta) => {
            const from = project.content.indexOf(section);
            let to = from + delta;
            while (to >= 0 && to < project.content.length && project.content[to].type !== "section") to += delta;
            if (to < 0 || to >= project.content.length) return;
            const content = [...project.content];
            [content[from], content[to]] = [content[to], content[from]];
            update({ content });
          }}
          remove={() => {
            const sections = { ...project.admin?.sections };
            delete sections[section.adminId];
            update({ content: project.content.filter((block) => block !== section), admin: { ...project.admin, sections } });
          }}
          issues={issues}
          importFrame={importFrame}
        />
      ))}
      <Button
        className="add-section-button"
        size="3"
        variant="soft"
        color="gray"
        onClick={() => {
          const adminId = `${project.slug}-section-${Date.now()}`;
          const section: AdminSection = { type: "section", adminId, heading: "Новая секция", blocks: [] };
          update({ content: [...project.content.filter((block) => block.type !== "gallery"), section, ...project.content.filter((block) => block.type === "gallery")] });
          selectSection(adminId);
          requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-field="content.${adminId}.heading"] input`)?.focus());
        }}
      ><PlusIcon />Добавить секцию</Button>
      <GalleryEditor gallery={galleryForEditing} change={galleryChange} upload={upload} />
    </div>
  );
}
