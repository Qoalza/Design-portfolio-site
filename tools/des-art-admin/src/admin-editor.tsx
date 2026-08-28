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
  Flex,
  Heading,
  IconButton,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import type {
  ProjectContentBlock,
  ProjectGalleryGroup,
  ProjectGalleryItem,
  ProjectImage,
  ProjectSectionBlock,
} from "../../../src/lib/project-contract";
import type { AdminContentBlock, AdminProject, AdminSection } from "./admin-model";
import type { FieldIssue } from "./admin-model";
import { issueFor, list, sectionText, textBlocks } from "./admin-model";
import { AssetField, Field, RichEditor } from "./admin-ui";

type Upload = (file: File, context: string) => Promise<ProjectImage>;

function replaceSectionText(section: AdminSection, value: string): AdminSection {
  const managed = section.blocks.filter((block) => block.type === "notice" || block.type === "image");
  return { ...section, blocks: [...textBlocks(value), ...managed] };
}

function SectionEditor({
  section,
  index,
  count,
  selected,
  select,
  change,
  move,
  remove,
  issues,
}: {
  section: AdminSection;
  index: number;
  count: number;
  selected: boolean;
  select: () => void;
  change: (value: AdminSection) => void;
  move: (delta: number) => void;
  remove: () => void;
  issues: FieldIssue[];
}) {
  const managed = section.blocks.find((block): block is Extract<ProjectSectionBlock, { type: "image" }> => block.type === "image");
  return (
    <section className="editor-section section-editor" data-selected={selected || undefined} onFocus={select} onClick={select}>
      <div className="section-editor-heading">
        <Flex align="center" gap="2">
          <Heading size="3">Секция {index + 1}</Heading>
          <IconButton
            type="button"
            size="1"
            variant="outline"
            color="red"
            aria-label={`Удалить секцию ${index + 1}`}
            onClick={(event) => { event.stopPropagation(); remove(); }}
          >
            <TrashIcon />
          </IconButton>
        </Flex>
        <Flex gap="1">
          <Button type="button" size="1" variant="ghost" color="gray" onClick={select}>Настройки</Button>
          <IconButton type="button" size="1" variant="outline" color="gray" aria-label="Переместить выше" disabled={index === 0} onClick={() => move(-1)}>
            <ChevronUpIcon />
          </IconButton>
          <IconButton type="button" size="1" variant="outline" color="gray" aria-label="Переместить ниже" disabled={index === count - 1} onClick={() => move(1)}>
            <ChevronDownIcon />
          </IconButton>
        </Flex>
      </div>
      <Field field={`content.${section.adminId}.heading`} label="Заголовок секции" error={issueFor(issues, `content.${section.adminId}.heading`)}>
        <TextField.Root value={section.heading} onChange={(event) => change({ ...section, heading: event.target.value })} />
      </Field>
      <Field label="Описание секции">
        <RichEditor value={sectionText(section)} onChange={(value) => change(replaceSectionText(section, value))} />
      </Field>
      {managed ? (
        <div className="managed-preview">
          <div>
            <Text weight="medium">Интерактивный экран</Text>
            <Text as="p" size="1" color="gray">Существующая кодовая композиция сохранена без изменений.</Text>
          </div>
          <div className="managed-thumbnails">
            {managed.images.map((image) => <img key={image.src} src={image.src} alt="" />)}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function CardEditor({
  project,
  update,
  upload,
  uploadLogo,
  issues,
}: {
  project: AdminProject;
  update: (patch: Partial<AdminProject>) => void;
  upload: Upload;
  uploadLogo: (file: File) => Promise<AdminProject["logo"]>;
  issues: FieldIssue[];
}) {
  return (
    <div className="editor-stack">
      <section className="editor-section editor-section-primary">
        <div className="section-heading-copy">
          <Heading size="4">Карточка проекта</Heading>
          <Text size="2" color="gray">Контент карточки на главной и в «Все работы».</Text>
        </div>
        <div className="form-grid">
          <Field field="title" label="Название" error={issueFor(issues, "title")} wide>
            <TextField.Root value={project.title} onChange={(event) => update({ title: event.target.value })} />
          </Field>
          <Field field="description" label="Описание" error={issueFor(issues, "description")} wide>
            <TextArea rows={4} value={project.description} onChange={(event) => update({ description: event.target.value })} />
          </Field>
          <Field field="role" label="Роль" error={issueFor(issues, "role")}>
            <TextField.Root value={project.role} onChange={(event) => update({ role: event.target.value })} />
          </Field>
          <Field label="Краткие теги" hint="Через запятую">
            <TextField.Root value={project.tags.join(", ")} onChange={(event) => update({ tags: list(event.target.value) })} />
          </Field>
          <Field label="Что делал" wide>
            <TextArea rows={3} value={project.workSummary ?? ""} onChange={(event) => update({ workSummary: event.target.value || undefined })} />
          </Field>
        </div>
      </section>
      <section className="editor-section">
        <div className="asset-field logo-field">
          <div className="asset-copy"><Text weight="medium">Логотип проекта</Text><Text as="p" size="1" color="gray">Необязательно. Загрузите безопасный квадратный SVG.</Text></div>
          {project.logo ? <div className="logo-preview">{project.logo.type === "image" ? <img src={project.logo.src} alt="" /> : <Text size="1" color="gray">Составной логотип сохранён</Text>}</div> : <div className="asset-placeholder"><Text size="1" color="gray">Логотип не добавлен</Text></div>}
          <Flex gap="2"><label><Button asChild size="1" variant="soft"><span>{project.logo ? "Заменить" : "Загрузить SVG"}</span></Button><input hidden type="file" accept="image/svg+xml,.svg" onChange={async (event) => { const file = event.target.files?.[0]; if (file) update({ logo: await uploadLogo(file) }); event.target.value = ""; }} /></label>{project.logo ? <Button size="1" variant="soft" color="red" onClick={() => update({ logo: undefined })}>Удалить</Button> : null}</Flex>
        </div>
      </section>
      <section className="editor-section">
        <AssetField
          title="Обложка карточки"
          description="Одна обложка используется на главной и в списке проектов."
          image={project.catalogImage ?? project.hero?.image}
          managed={!project.catalogImage && Boolean(project.hero)}
          upload={async (file) => update({ catalogImage: await upload(file, "Обложка проекта") })}
          remove={() => update({ catalogImage: undefined })}
        />
      </section>
    </div>
  );
}

const groupDefaults: Record<ProjectGalleryGroup["id"], Omit<ProjectGalleryGroup, "items">> = {
  desktop: { id: "desktop", label: "Desktop", icon: "/assets/device-desktop.svg", baseWidth: 740, baseHeight: 512 },
  tablet: { id: "tablet", label: "Tablet", icon: "/assets/device-tablet.svg", baseWidth: 400, baseHeight: 566 },
  mobile: { id: "mobile", label: "Mobile", icon: "/assets/device-mobile.svg", baseWidth: 180, baseHeight: 320 },
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
              <Button asChild size="1" variant="soft"><span><PlusIcon />Добавить изображение</span></Button>
              <input
                hidden
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const image = await upload(file, `Галерея ${group.label}`);
                  const item: ProjectGalleryItem = {
                    ...image,
                    frame: { clip: true, radius: 12, strokeColor: "#e8eaeb", strokeWidth: 1 },
                  };
                  updateGroup(group.id, { ...group, items: [...group.items, item] });
                  event.target.value = "";
                }}
              />
            </label>
          </div>
          <ol className="gallery-list">
            {group.items.map((item, index) => (
              <li key={`${item.src}-${index}`}>
                <img src={item.src} alt="" />
                <Text size="2">Изображение {index + 1}</Text>
                <IconButton
                  type="button"
                  size="1"
                  variant="ghost"
                  color="red"
                  aria-label={`Удалить изображение ${index + 1}`}
                  onClick={() => updateGroup(group.id, { ...group, items: group.items.filter((_, itemIndex) => itemIndex !== index) })}
                >
                  <TrashIcon />
                </IconButton>
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
}: {
  project: AdminProject;
  update: (patch: Partial<AdminProject>) => void;
  upload: Upload;
  selectedSection?: string;
  selectSection: (id: string) => void;
  issues: FieldIssue[];
}) {
  const sections = project.content.filter((block): block is AdminSection => block.type === "section");
  const gallery = project.content.find((block): block is Extract<ProjectContentBlock, { type: "gallery" }> => block.type === "gallery")
    ?? { type: "gallery", title: "Галерея", description: "Интерфейсы проекта", groups: [] };
  const replace = (target: AdminContentBlock, value: AdminContentBlock) => update({
    content: project.content.map((block) => block === target ? value : block),
  });
  const galleryChange = (value: Extract<ProjectContentBlock, { type: "gallery" }>) => update({
    content: project.content.some((block) => block.type === "gallery")
      ? project.content.map((block) => block.type === "gallery" ? value : block)
      : [...project.content, value],
  });
  return (
    <div className="editor-stack">
      <section className="editor-section editor-section-primary">
        <div className="section-heading-copy">
          <Heading size="4">Открытая страница проекта</Heading>
          <Text size="2" color="gray">Контент, который видит пользователь после открытия проекта.</Text>
        </div>
        <Field label="Подробные теги" hint="Отображаются наверху открытого проекта">
          <TextField.Root value={project.detailTags.join(", ")} onChange={(event) => update({ detailTags: list(event.target.value) })} />
        </Field>
      </section>
      <section className="editor-section">
        <AssetField
          title="Главное изображение страницы"
          description="Крупное изображение над основной информацией проекта."
          image={project.hero?.image}
          managed={project.hero?.presentation === "browser-composite"}
          upload={async (file) => update({ hero: { presentation: "single", image: await upload(file, "Главное изображение страницы") } })}
        />
      </section>
      <div className="content-heading">
        <div className="section-heading-copy">
          <Heading size="4">Содержание страницы</Heading>
          <Text size="2" color="gray">Одна секция соответствует одному пункту закреплённой навигации.</Text>
        </div>
        <Button
          size="2"
          variant="soft"
          onClick={() => {
            const adminId = `${project.slug}-section-${Date.now()}`;
            const section: AdminSection = { type: "section", adminId, heading: "Новая секция", blocks: [] };
            update({
              content: [
                ...project.content.filter((block) => block.type !== "gallery"),
                section,
                ...project.content.filter((block) => block.type === "gallery"),
              ],
            });
            selectSection(adminId);
          }}
        >
          <PlusIcon />Секция
        </Button>
      </div>
      {sections.map((section, index) => (
        <SectionEditor
          key={section.adminId}
          section={section}
          index={index}
          count={sections.length}
          selected={selectedSection === section.adminId}
          select={() => selectSection(section.adminId)}
          change={(value) => replace(section, value)}
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
        />
      ))}
      <GalleryEditor gallery={gallery} change={galleryChange} upload={upload} />
    </div>
  );
}
