import "@radix-ui/themes/styles.css";
import "./admin.css";

import {
  Badge,
  Box,
  Button,
  Card,
  Dialog,
  DropdownMenu,
  Flex,
  Heading,
  Select,
  Separator,
  Switch,
  Tabs,
  Text,
  TextArea,
  TextField,
  Theme,
} from "@radix-ui/themes";
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import type {
  ProjectContentBlock,
  ProjectDocument,
  ProjectGalleryGroup,
  ProjectImage,
  ProjectPlatform,
  ProjectSectionBlock,
  ProjectVisibility,
} from "../../../src/lib/project-contract";

type EditorTab = "card" | "page" | "media";
type SaveState = "saved" | "dirty" | "draft" | "restored";
type UploadResult = ProjectImage & { duplicateOf?: string };

const csrf = document.body.dataset.csrf ?? "";
const previewPort = document.body.dataset.previewPort ?? "41732";

async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      "x-des-art-csrf": csrf,
      ...options.headers,
    },
  });
  const value = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(value.error || "Ошибка запроса");
  return value;
}

const listFromText = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
const inline = (value: string) => [{ type: "text" as const, text: value }];
const textOf = (content: Array<{ text: string }> = []) => content.map((item) => item.text).join("");
const visibilityLabel: Record<ProjectVisibility, string> = {
  draft: "Черновик",
  published: "Опубликован",
  hidden: "Скрыт",
  archived: "В архиве",
};
const saveLabel: Record<SaveState, string> = {
  saved: "Все изменения сохранены",
  dirty: "Есть несохранённые изменения",
  draft: "Черновик сохранён локально",
  restored: "Восстановлен локальный черновик",
};

function FormField({ label, hint, wide, children }: {
  label: string;
  hint?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return <label className={`form-field${wide ? " form-field-wide" : ""}`}>
    <Text size="2" weight="medium">{label}</Text>
    {children}
    {hint ? <span className="field-help">{hint}</span> : null}
  </label>;
}

function ProjectNavigation({ projects, current, search, onSearch, onOpen, onMove, onCreate }: {
  projects: ProjectDocument[];
  current: ProjectDocument | null;
  search: string;
  onSearch: (value: string) => void;
  onOpen: (slug: string) => void;
  onMove: (index: number, delta: number) => void;
  onCreate: () => void;
}) {
  const ordered = [...projects].sort((a, b) => a.catalogOrder - b.catalogOrder);
  const filtered = ordered.filter((project) => project.title.toLowerCase().includes(search.toLowerCase()));
  return <aside className="project-nav" aria-label="Проекты">
    <div className="nav-heading">
      <Heading size="4">Проекты</Heading>
      <Button size="2" variant="soft" onClick={onCreate}>Новый</Button>
    </div>
    <Box mt="4">
      <TextField.Root
        aria-label="Поиск проектов"
        placeholder="Найти проект"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />
    </Box>
    <ol className="project-list">
      {filtered.map((project) => {
        const index = ordered.findIndex((item) => item.slug === project.slug);
        const active = current?.slug === project.slug;
        return <li key={project.slug}>
          <div className="project-row" data-active={active}>
            <button className="project-row-main" type="button" onClick={() => onOpen(project.slug)}>
              <span className="project-row-title">{project.title}</span>
              <span className="project-row-meta">
                <Badge color={project.visibility === "published" ? "green" : "gray"} variant="soft">
                  {visibilityLabel[project.visibility]}
                </Badge>
                <Text size="1" color="gray">{project.year}</Text>
              </span>
            </button>
            <span className="order-controls" aria-label="Порядок проекта">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger><Button type="button" size="1" variant="ghost" color="gray">Ещё</Button></DropdownMenu.Trigger>
                <DropdownMenu.Content align="end"><DropdownMenu.Item disabled={index === 0} onSelect={() => onMove(index, -1)}>Переместить выше</DropdownMenu.Item><DropdownMenu.Item disabled={index === ordered.length - 1} onSelect={() => onMove(index, 1)}>Переместить ниже</DropdownMenu.Item></DropdownMenu.Content>
              </DropdownMenu.Root>
            </span>
          </div>
        </li>;
      })}
    </ol>
    {!filtered.length ? <Text as="p" size="2" color="gray" mt="4">Ничего не найдено.</Text> : null}
  </aside>;
}

function CardTab({ project, update }: { project: ProjectDocument; update: (patch: Partial<ProjectDocument>) => void }) {
  return <div className="tab-stack">
    <Card className="editor-card">
      <div className="card-heading">
        <div>
          <Heading size="4">Карточка проекта</Heading>
          <Text as="p" size="2" color="gray" mt="1">Данные, которые помогают выбрать проект в каталоге.</Text>
        </div>
        <Badge variant="soft">Главная и /projects</Badge>
      </div>
      <Separator size="4" my="4" />
      <div className="form-grid">
        <FormField label="Название"><TextField.Root value={project.title} onChange={(event) => update({ title: event.target.value })} /></FormField>
        <FormField label="Slug" hint="Технический адрес задаётся при создании проекта"><TextField.Root readOnly value={project.slug} /></FormField>
        <FormField label="Краткое описание" wide><TextArea resize="vertical" value={project.description} onChange={(event) => update({ description: event.target.value })} /></FormField>
        <FormField label="Роль"><TextField.Root value={project.role} onChange={(event) => update({ role: event.target.value })} /></FormField>
        <FormField label="Короткая роль для карточки" hint="Необязательно; иначе используется основная роль"><TextField.Root value={project.catalogRole ?? ""} onChange={(event) => update({ catalogRole: event.target.value || undefined })} /></FormField>
        <FormField label="Год"><TextField.Root type="number" min="1900" value={String(project.year)} onChange={(event) => update({ year: Number(event.target.value) })} /></FormField>
        <FormField label="Этап проекта" hint="Публичная подпись: «В работе», «Завершён» и т. п."><TextField.Root value={project.status} onChange={(event) => update({ status: event.target.value })} /></FormField>
        <FormField label="Теги" hint="Публичные категории через запятую" wide><TextField.Root value={project.tags.join(", ")} onChange={(event) => update({ tags: listFromText(event.target.value) })} /></FormField>
        <FormField label="Что делал" wide><TextArea resize="vertical" value={project.workSummary ?? ""} onChange={(event) => update({ workSummary: event.target.value || undefined })} /></FormField>
      </div>
    </Card>
  </div>;
}

function ChildEditor({ block, onChange, onRemove }: { block: ProjectSectionBlock; onChange: (block: ProjectSectionBlock) => void; onRemove: () => void }) {
  const plain = block.type === "divider" || block.type === "image" ? "" : block.type === "list" ? block.items.map(textOf).join("\n") : textOf(block.content);
  return <div className="child-row">
    <Badge color="gray" variant="soft">{block.type}</Badge>
    {block.type === "divider" ? <Text size="2" color="gray">Разделитель между блоками</Text> : null}
    {block.type === "image" ? <div className="image-editor">
      <Select.Root value={block.presentation} onValueChange={(value) => onChange({ ...block, presentation: value as typeof block.presentation })}>
        <Select.Trigger aria-label="Представление изображения" />
        <Select.Content>{["single", "quotes", "process", "controls"].map((value) => <Select.Item key={value} value={value}>{value}</Select.Item>)}</Select.Content>
      </Select.Root>
      {block.images.map((image, imageIndex) => <div className="form-grid" key={`${image.src}-${imageIndex}`}>
        <FormField label="Путь" wide><TextField.Root value={image.src} onChange={(event) => onChange({ ...block, images: block.images.map((item, index) => index === imageIndex ? { ...item, src: event.target.value } : item) })} /></FormField>
        <FormField label="Alt" wide><TextField.Root value={image.alt} onChange={(event) => onChange({ ...block, images: block.images.map((item, index) => index === imageIndex ? { ...item, alt: event.target.value } : item) })} /></FormField>
        <FormField label="Ширина"><TextField.Root type="number" value={String(image.width)} onChange={(event) => onChange({ ...block, images: block.images.map((item, index) => index === imageIndex ? { ...item, width: Number(event.target.value) } : item) })} /></FormField>
        <FormField label="Высота"><TextField.Root type="number" value={String(image.height)} onChange={(event) => onChange({ ...block, images: block.images.map((item, index) => index === imageIndex ? { ...item, height: Number(event.target.value) } : item) })} /></FormField>
      </div>)}
    </div> : null}
    {block.type !== "divider" && block.type !== "image" ? <TextArea
      aria-label={`Содержимое блока ${block.type}`}
      resize="vertical"
      value={plain}
      onChange={(event) => {
        if (block.type === "list") onChange({ ...block, items: event.target.value.split("\n").filter(Boolean).map(inline) });
        else onChange({ ...block, content: inline(event.target.value) });
      }}
    /> : null}
    <Button type="button" size="1" variant="ghost" color="red" onClick={onRemove}>Удалить</Button>
  </div>;
}

function SectionEditor({ section, index, count, projectSlug, onChange, onMove, onRemove }: {
  section: Extract<ProjectContentBlock, { type: "section" }>;
  index: number;
  count: number;
  onChange: (section: Extract<ProjectContentBlock, { type: "section" }>) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
  projectSlug: string;
}) {
  const addChild = (type: ProjectSectionBlock["type"]) => {
    const variants: Record<ProjectSectionBlock["type"], ProjectSectionBlock> = {
      paragraph: { type: "paragraph", content: inline("Новый абзац") },
      heading: { type: "heading", level: 3, content: inline("Новый заголовок") },
      list: { type: "list", style: "unordered", items: [inline("Новый пункт")] },
      notice: { type: "notice", variant: "default", content: inline("Примечание") },
      image: { type: "image", presentation: "single", images: [{ src: `/assets/projects/${projectSlug}/image.png`, alt: "Описание изображения", width: 1, height: 1 }] },
      divider: { type: "divider" },
    };
    onChange({ ...section, blocks: [...section.blocks, variants[type]] });
  };
  return <Card className="content-block">
    <div className="block-heading">
      <Heading size="3">Секция {index + 1}</Heading>
      <div className="block-head-actions">
        <Button type="button" size="1" variant="ghost" disabled={index === 0} onClick={() => onMove(-1)}>Выше</Button>
        <Button type="button" size="1" variant="ghost" disabled={index === count - 1} onClick={() => onMove(1)}>Ниже</Button>
        <Button type="button" size="1" variant="ghost" color="red" onClick={onRemove}>Удалить секцию</Button>
      </div>
    </div>
    <Box mt="3"><FormField label="Заголовок"><TextField.Root value={section.heading} onChange={(event) => onChange({ ...section, heading: event.target.value })} /></FormField></Box>
    <div className="child-list">
      {section.blocks.map((block, childIndex) => <ChildEditor key={`${block.type}-${childIndex}`} block={block} onChange={(next) => onChange({ ...section, blocks: section.blocks.map((item, index) => index === childIndex ? next : item) })} onRemove={() => onChange({ ...section, blocks: section.blocks.filter((_, index) => index !== childIndex) })} />)}
    </div>
    <Flex mt="4" gap="2" wrap="wrap"><Text size="2" color="gray">Добавить:</Text>{(["paragraph", "heading", "list", "notice", "image", "divider"] as const).map((type) => <Button type="button" size="1" variant="soft" key={type} onClick={() => addChild(type)}>{type}</Button>)}</Flex>
  </Card>;
}

function PageTab({ project, update }: { project: ProjectDocument; update: (patch: Partial<ProjectDocument>) => void }) {
  const content = project.content;
  const setContent = (next: ProjectContentBlock[]) => update({ content: next });
  const sections = content.filter((block): block is Extract<ProjectContentBlock, { type: "section" }> => block.type === "section");
  const updateAt = (index: number, block: ProjectContentBlock) => setContent(content.map((item, itemIndex) => itemIndex === index ? block : item));
  const moveAt = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= content.length) return;
    const next = [...content];
    [next[index], next[target]] = [next[target], next[index]];
    setContent(next);
  };
  return <div className="content-stack">
    <Card className="editor-card">
      <div className="section-heading"><div><Heading size="4">Страница проекта</Heading><Text as="p" size="2" color="gray" mt="1">Секции идут сверху вниз в том же порядке, что и на сайте.</Text></div><Badge variant="soft">{sections.length} секций</Badge></div>
      <Separator size="4" my="4" />
      <div className="form-grid">
        <FormField label="Подзаголовок" wide><TextField.Root value={project.subtitle ?? ""} onChange={(event) => update({ subtitle: event.target.value || undefined })} /></FormField>
      </div>
    </Card>
    {content.map((block, index) => block.type === "section" ? <SectionEditor key={`section-${index}`} section={block} index={index} count={content.length} projectSlug={project.slug} onChange={(next) => updateAt(index, next)} onMove={(delta) => moveAt(index, delta)} onRemove={() => setContent(content.filter((_, itemIndex) => itemIndex !== index))} /> : null)}
    <Button type="button" variant="soft" onClick={() => setContent([...content, { type: "section", heading: "Новая секция", blocks: [] }])}>Добавить секцию</Button>
  </div>;
}

function GalleryEditor({ gallery, projectSlug, blockIndex, blockCount, onChange, onMove }: {
  gallery: Extract<ProjectContentBlock, { type: "gallery" }>;
  projectSlug: string;
  blockIndex: number;
  blockCount: number;
  onChange: (gallery: Extract<ProjectContentBlock, { type: "gallery" }>) => void;
  onMove: (delta: number) => void;
}) {
  const updateGroup = (groupIndex: number, group: ProjectGalleryGroup) => onChange({ ...gallery, groups: gallery.groups.map((item, index) => index === groupIndex ? group : item) });
  const addGroup = () => {
    const ids = ["desktop", "tablet", "mobile"] as const;
    const id = ids.find((value) => !gallery.groups.some((group) => group.id === value));
    if (!id) return;
    const dimensions = id === "desktop" ? [740, 512] : id === "tablet" ? [400, 566] : [180, 320];
    onChange({ ...gallery, groups: [...gallery.groups, { id, label: id[0].toUpperCase() + id.slice(1), icon: `/assets/projects/${projectSlug}/${id}.svg`, baseWidth: dimensions[0], baseHeight: dimensions[1], items: [] }] });
  };
  return <Card className="editor-card gallery-editor">
    <div className="card-heading"><div><Heading size="4">Галерея</Heading><Flex mt="2" gap="2"><Button type="button" size="1" variant="ghost" disabled={blockIndex === 0} onClick={() => onMove(-1)}>Выше по странице</Button><Button type="button" size="1" variant="ghost" disabled={blockIndex === blockCount - 1} onClick={() => onMove(1)}>Ниже по странице</Button></Flex></div><Badge variant="soft">{gallery.groups.reduce((sum, group) => sum + group.items.length, 0)} изображений</Badge></div>
    <div className="form-grid">
      <FormField label="Заголовок"><TextField.Root value={gallery.title} onChange={(event) => onChange({ ...gallery, title: event.target.value })} /></FormField>
      <FormField label="Описание"><TextField.Root value={gallery.description} onChange={(event) => onChange({ ...gallery, description: event.target.value })} /></FormField>
    </div>
    {gallery.groups.map((group, groupIndex) => <div className="gallery-group" key={group.id}>
      <div className="section-heading"><Heading size="3">{group.label}</Heading><Text size="2" color="gray">{group.items.length} шт.</Text></div>
      {group.items.map((item, itemIndex) => <div className="gallery-item" key={`${item.src}-${itemIndex}`}>
        <Badge color="gray">{itemIndex + 1}</Badge>
        <TextField.Root aria-label={`Alt ${group.label} ${itemIndex + 1}`} value={item.alt} onChange={(event) => updateGroup(groupIndex, { ...group, items: group.items.map((current, index) => index === itemIndex ? { ...current, alt: event.target.value } : current) })} />
        <div className="inline-actions"><Button type="button" size="1" variant="ghost" disabled={itemIndex === 0} onClick={() => { const items = [...group.items]; [items[itemIndex - 1], items[itemIndex]] = [items[itemIndex], items[itemIndex - 1]]; updateGroup(groupIndex, { ...group, items }); }}>Выше</Button><Button type="button" size="1" variant="ghost" disabled={itemIndex === group.items.length - 1} onClick={() => { const items = [...group.items]; [items[itemIndex + 1], items[itemIndex]] = [items[itemIndex], items[itemIndex + 1]]; updateGroup(groupIndex, { ...group, items }); }}>Ниже</Button><Button type="button" size="1" variant="ghost" color="red" onClick={() => updateGroup(groupIndex, { ...group, items: group.items.filter((_, index) => index !== itemIndex) })}>Удалить</Button></div>
      </div>)}
    </div>)}
    <Button type="button" variant="soft" disabled={gallery.groups.length === 3} onClick={addGroup}>Добавить группу устройств</Button>
  </Card>;
}

function MediaTab({ project, update, onUpload, uploads }: {
  project: ProjectDocument;
  update: (patch: Partial<ProjectDocument>) => void;
  onUpload: (file: File, alt: string) => Promise<void>;
  uploads: UploadResult[];
}) {
  const [alt, setAlt] = useState("");
  const [drag, setDrag] = useState(false);
  const [target, setTarget] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const galleries = project.content.map((block, index) => ({ block, index })).filter((entry): entry is { block: Extract<ProjectContentBlock, { type: "gallery" }>; index: number } => entry.block.type === "gallery");
  const targets = [
    ...project.content.map((block, index) => block.type === "section" ? { value: `section:${index}`, label: `Секция: ${block.heading}` } : null).filter((value): value is { value: string; label: string } => Boolean(value)),
    ...galleries.flatMap(({ block, index }) => block.groups.map((group) => ({ value: `gallery:${index}:${group.id}`, label: `Галерея: ${group.label}` }))),
  ];
  const selectedTarget = target || targets[0]?.value || "";
  const upload = async (file?: File) => {
    if (!file || !alt.trim()) return;
    await onUpload(file, alt.trim());
    setAlt("");
    if (fileRef.current) fileRef.current.value = "";
  };
  return <div className="media-stack">
    <Card className="editor-card">
      <div className="card-heading"><div><Heading size="4">Медиа</Heading><Text as="p" size="2" color="gray" mt="1">Загрузите файл один раз, затем добавьте его в нужный контентный блок.</Text></div><Badge variant="soft">PNG · JPG · GIF · WebP</Badge></div>
      <Separator size="4" my="4" />
      <FormField label="Описание изображения (alt)" hint="Обязательно перед загрузкой"><TextField.Root value={alt} onChange={(event) => setAlt(event.target.value)} /></FormField>
      <Box mt="4" className="dropzone" data-drag={drag} onDragEnter={(event) => { event.preventDefault(); setDrag(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDrag(false)} onDrop={(event) => { event.preventDefault(); setDrag(false); void upload(event.dataTransfer.files[0]); }}>
        <div><Text as="p" weight="medium">Перетащите изображение сюда</Text><Text as="p" size="2" color="gray" mt="1">или выберите файл на компьютере</Text><Button mt="4" type="button" variant="soft" onClick={() => fileRef.current?.click()}>Выбрать файл</Button><input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => void upload(event.target.files?.[0])} /></div>
      </Box>
      {uploads.length ? <Box mt="4"><div className="media-stack">{uploads.map((item) => <div className="upload-result" key={item.src}><Text size="2" weight="medium">{item.src}</Text><Text size="1" color="gray">{item.width}×{item.height}{item.duplicateOf ? " · использован существующий файл" : ""}</Text><Flex gap="2" align="end"><Box flexGrow="1"><FormField label="Добавить в"><Select.Root value={selectedTarget} onValueChange={setTarget}><Select.Trigger /><Select.Content>{targets.map((entry) => <Select.Item key={entry.value} value={entry.value}>{entry.label}</Select.Item>)}</Select.Content></Select.Root></FormField></Box><Button disabled={!selectedTarget} onClick={() => { const [type, indexValue, groupId] = selectedTarget.split(":"); const contentIndex = Number(indexValue); const block = project.content[contentIndex]; const image: ProjectImage = { src: item.src, alt: item.alt, width: item.width, height: item.height }; if (type === "section" && block?.type === "section") update({ content: project.content.map((entry, index) => index === contentIndex ? { ...block, blocks: [...block.blocks, { type: "image", presentation: "single", images: [image] }] } : entry) }); if (type === "gallery" && block?.type === "gallery") update({ content: project.content.map((entry, index) => index === contentIndex ? { ...block, groups: block.groups.map((group) => group.id === groupId ? { ...group, items: [...group.items, { ...image, frame: { clip: true, radius: 12, strokeColor: "#e8eaeb", strokeWidth: 1 } }] } : group) } : entry) }); }}>Добавить</Button></Flex></div>)}</div></Box> : null}
    </Card>
    {galleries.map(({ block, index }) => <GalleryEditor key={`gallery-${index}`} gallery={block} projectSlug={project.slug} blockIndex={index} blockCount={project.content.length} onMove={(delta) => { const targetIndex = index + delta; if (targetIndex < 0 || targetIndex >= project.content.length) return; const content = [...project.content]; [content[index], content[targetIndex]] = [content[targetIndex], content[index]]; update({ content }); }} onChange={(next) => update({ content: project.content.map((item, itemIndex) => itemIndex === index ? next : item) })} />)}
    <Button type="button" variant="soft" onClick={() => update({ content: [...project.content, { type: "gallery", title: "Галерея", description: "Описание галереи", groups: [] }] })}>Добавить галерею</Button>
  </div>;
}

function PublicationRail({ project, update, onLifecycle, onDuplicate }: {
  project: ProjectDocument;
  update: (patch: Partial<ProjectDocument>) => void;
  onLifecycle: (visibility: ProjectVisibility) => void;
  onDuplicate: () => void;
}) {
  const togglePlatform = (platform: ProjectPlatform, checked: boolean) => update({ platforms: checked ? [...new Set([...project.platforms, platform])] : project.platforms.filter((item) => item !== platform) });
  return <aside className="publish-rail" aria-label="Публикация">
    <div className="rail-stack">
      <div className="rail-heading"><Heading size="4">Публикация</Heading><Badge color={project.visibility === "published" ? "green" : "gray"}>{visibilityLabel[project.visibility]}</Badge></div>
      <FormField label="Состояние">
        <Select.Root value={project.visibility} onValueChange={(value) => update({ visibility: value as ProjectVisibility })}><Select.Trigger /><Select.Content>{Object.entries(visibilityLabel).map(([value, label]) => <Select.Item key={value} value={value}>{label}</Select.Item>)}</Select.Content></Select.Root>
      </FormField>
      <Separator size="4" />
      <div className="switch-row"><Text size="2">Показывать в каталоге</Text><Switch checked={project.catalogVisible} onCheckedChange={(checked) => update({ catalogVisible: checked })} /></div>
      <div className="switch-row"><Text size="2">Открывать страницу проекта</Text><Switch checked={project.detailAvailable} onCheckedChange={(checked) => update({ detailAvailable: checked })} /></div>
      <FormField label="Порядок в каталоге"><TextField.Root type="number" min="0" value={String(project.catalogOrder)} onChange={(event) => update({ catalogOrder: Number(event.target.value) })} /></FormField>
      {project.detailAvailable ? <div className="publish-summary"><Text size="2" weight="medium">Страница доступна</Text><Text as="p" size="1" mt="1">art-des.ru/projects/{project.slug}</Text></div> : null}
      <Separator size="4" />
      <Heading size="3">Ссылки и детали</Heading>
      <div className="switch-row"><Text size="2">Ссылка на Figma</Text><Switch checked={project.figmaAvailable} onCheckedChange={(checked) => update({ figmaAvailable: checked })} /></div>
      {project.figmaAvailable ? <FormField label="Figma URL"><TextField.Root type="url" value={project.figmaUrl ?? ""} onChange={(event) => update({ figmaUrl: event.target.value || undefined })} /></FormField> : null}
      <FormField label="Дата обновления"><TextField.Root value={project.updatedAt ?? ""} onChange={(event) => update({ updatedAt: event.target.value || undefined })} /></FormField>
      <div className="form-field"><Text size="2" weight="medium">Платформы</Text><div className="platforms">{(["Desktop", "Tablet", "Mobile"] as const).map((platform) => <label key={platform} className="switch-row"><Switch size="1" checked={project.platforms.includes(platform)} onCheckedChange={(checked) => togglePlatform(platform, checked)} /><Text size="2">{platform}</Text></label>)}</div></div>
      <FormField label="NDA-примечание"><TextArea resize="vertical" value={project.ndaNote ?? ""} onChange={(event) => update({ ndaNote: event.target.value || undefined })} /></FormField>
      <Separator size="4" />
      <Heading size="3">Действия</Heading>
      <div className="lifecycle-actions">
        <Button size="2" variant="soft" onClick={() => onLifecycle("published")}>Опубликовать локально</Button>
        <Button size="2" variant="soft" color="gray" onClick={() => onLifecycle("hidden")}>Скрыть</Button>
        <Button size="2" variant="soft" color="gray" onClick={onDuplicate}>Дублировать</Button>
        <Button size="2" variant="ghost" color="red" onClick={() => onLifecycle("archived")}>Архивировать</Button>
      </div>
    </div>
  </aside>;
}

function SlugDialog({ open, title, action, onOpenChange, onSubmit }: { open: boolean; title: string; action: string; onOpenChange: (open: boolean) => void; onSubmit: (slug: string) => void }) {
  const [slug, setSlug] = useState("");
  return <Dialog.Root open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) setSlug(""); }}>
    <Dialog.Content maxWidth="420px">
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Description size="2" color="gray">Используйте латиницу, цифры и дефисы.</Dialog.Description>
      <Box mt="4"><FormField label="Slug"><TextField.Root autoFocus value={slug} onChange={(event) => setSlug(event.target.value)} /></FormField></Box>
      <Flex mt="5" gap="3" justify="end"><Dialog.Close><Button variant="soft" color="gray">Отмена</Button></Dialog.Close><Button disabled={!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)} onClick={() => onSubmit(slug)}>{action}</Button></Flex>
    </Dialog.Content>
  </Dialog.Root>;
}

function App() {
  const [projects, setProjects] = useState<ProjectDocument[]>([]);
  const [current, setCurrent] = useState<ProjectDocument | null>(null);
  const [tab, setTab] = useState<EditorTab>("card");
  const [search, setSearch] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [message, setMessage] = useState<{ text: string; error: boolean }>({ text: "", error: false });
  const [uploads, setUploads] = useState<UploadResult[]>([]);
  const [dialog, setDialog] = useState<"create" | "duplicate" | null>(null);
  const dirtyRef = useRef(false);

  const loadProjects = async () => setProjects(await api<ProjectDocument[]>("/api/projects"));
  useEffect(() => {
    let active = true;
    void api<ProjectDocument[]>("/api/projects").then((value) => { if (active) setProjects(value); }).catch((error: Error) => { if (active) setMessage({ text: error.message, error: true }); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!current || !dirtyRef.current) return;
    const timer = window.setTimeout(() => {
      void api(`/api/drafts/${encodeURIComponent(current.slug)}`, { method: "PUT", body: JSON.stringify(current) })
        .then(() => setSaveState("draft"))
        .catch((error: Error) => setMessage({ text: error.message, error: true }));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [current]);

  const update = (patch: Partial<ProjectDocument>) => {
    dirtyRef.current = true;
    setSaveState("dirty");
    setCurrent((value) => value ? { ...value, ...patch } : value);
  };

  const openProject = async (slug: string) => {
    try {
      const saved = await api<ProjectDocument>(`/api/projects/${encodeURIComponent(slug)}`);
      try {
        setCurrent(await api<ProjectDocument>(`/api/drafts/${encodeURIComponent(slug)}`));
        setSaveState("restored");
      } catch {
        setCurrent(saved);
        setSaveState("saved");
      }
      dirtyRef.current = false;
      setUploads([]);
      setTab("card");
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Не удалось открыть проект", error: true });
    }
  };

  const save = async (): Promise<boolean> => {
    if (!current) return false;
    try {
      await api(`/api/projects/${encodeURIComponent(current.slug)}`, { method: "PUT", body: JSON.stringify(current) });
      dirtyRef.current = false;
      setSaveState("saved");
      setMessage({ text: "Проект сохранён", error: false });
      await loadProjects();
      return true;
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Не удалось сохранить проект", error: true });
      return false;
    }
  };

  const moveProject = async (index: number, delta: number) => {
    try {
      const ordered = [...projects].sort((a, b) => a.catalogOrder - b.catalogOrder);
      const target = index + delta;
      if (target < 0 || target >= ordered.length) return;
      [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
      await api("/api/projects/reorder", { method: "POST", body: JSON.stringify({ slugs: ordered.map((project) => project.slug) }) });
      await loadProjects();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Не удалось изменить порядок", error: true });
    }
  };

  const createProject = async (slug: string) => {
    try {
      const max = Math.max(0, ...projects.map((project) => project.catalogOrder));
      const created: ProjectDocument = { schemaVersion: 1, title: "Новый проект", slug, description: "Описание проекта", role: "Product Designer", year: new Date().getFullYear(), status: "В работе", tags: [], visibility: "draft", catalogVisible: false, catalogOrder: max + 1, detailAvailable: false, figmaAvailable: false, platforms: [], content: [] };
      await api(`/api/projects/${encodeURIComponent(slug)}`, { method: "PUT", body: JSON.stringify(created) });
      setDialog(null);
      await loadProjects();
      dirtyRef.current = false;
      setSaveState("saved");
      setCurrent(created);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Не удалось создать проект", error: true });
    }
  };

  const duplicateProject = async (slug: string) => {
    if (!current) return;
    try {
      const copy = await api<ProjectDocument>(`/api/projects/${encodeURIComponent(current.slug)}/duplicate`, { method: "POST", body: JSON.stringify({ slug }) });
      setDialog(null);
      await loadProjects();
      dirtyRef.current = false;
      setSaveState("saved");
      setCurrent(copy);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Не удалось создать копию", error: true });
    }
  };

  const lifecycle = async (visibility: ProjectVisibility) => {
    if (!current) return;
    try {
      const next = await api<ProjectDocument>(`/api/projects/${encodeURIComponent(current.slug)}/visibility`, { method: "POST", body: JSON.stringify({ visibility }) });
      setCurrent(next);
      dirtyRef.current = false;
      setSaveState("saved");
      await loadProjects();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Не удалось изменить состояние", error: true });
    }
  };

  const upload = async (file: File, alt: string) => {
    if (!current) return;
    try {
      const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] ?? ""); reader.onerror = reject; reader.readAsDataURL(file); });
      const result = await api<UploadResult>(`/api/projects/${encodeURIComponent(current.slug)}/upload`, { method: "POST", body: JSON.stringify({ name: file.name, mime: file.type, alt, data }) });
      setUploads((value) => [result, ...value]);
      setMessage({ text: result.duplicateOf ? "Найден дубликат — используется существующий файл" : "Изображение загружено", error: false });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Не удалось загрузить изображение", error: true });
    }
  };

  const preview = async () => {
    const saved = await save();
    if (saved && current) window.open(`http://127.0.0.1:${previewPort}/projects/${encodeURIComponent(current.slug)}?admin-preview=1`, "des-art-preview");
  };

  const shutdown = async () => {
    await api("/api/shutdown", { method: "POST", body: "{}" });
    document.body.innerHTML = "<main class=empty-state><div><h1>Админка остановлена</h1><p>Это окно можно закрыть.</p></div></main>";
  };

  const title = current?.title ?? "Выберите проект";
  return <Theme accentColor="blue" grayColor="sand" radius="small" panelBackground="solid" scaling="95%">
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-brand"><Heading size="4">Des-art Admin</Heading></div>
        <div className="admin-context"><Text size="2">Проекты</Text><Text size="2">/</Text><strong>{title}</strong></div>
        <div className="admin-actions">
          <Text className="save-indicator" size="1" color={saveState === "dirty" ? "blue" : "gray"}>{saveLabel[saveState]}</Text>
          {current ? <><Button variant="soft" color="gray" onClick={() => void preview()}>Предпросмотр</Button><Button onClick={() => void save()}>Сохранить</Button></> : null}
          <Button variant="ghost" color="red" onClick={() => void shutdown()}>Завершить</Button>
        </div>
      </header>
      <main className="admin-workspace">
        <ProjectNavigation projects={projects} current={current} search={search} onSearch={setSearch} onOpen={(slug) => void openProject(slug)} onMove={(index, delta) => void moveProject(index, delta)} onCreate={() => setDialog("create")} />
        <section className="editor-area">
          {!current ? <div className="empty-state"><div><Heading size="5">Выберите проект</Heading><Text as="p" size="2" mt="2">Или создайте новый черновик.</Text></div></div> : <div className="editor-inner">
            <div className="editor-title-row"><div><Heading size="7">{current.title}</Heading><Text as="p" size="2" color="gray" mt="1">Редактирование контента проекта</Text></div><Badge variant="soft" color={current.visibility === "published" ? "green" : "gray"}>{visibilityLabel[current.visibility]}</Badge></div>
            <div className="message-area" role="status"><Text size="2" color={message.error ? "red" : "green"}>{message.text}</Text></div>
            <Tabs.Root value={tab} onValueChange={(value) => setTab(value as EditorTab)}>
              <Tabs.List className="editor-tabs-list"><Tabs.Trigger value="card">Карточка</Tabs.Trigger><Tabs.Trigger value="page">Страница проекта</Tabs.Trigger><Tabs.Trigger value="media">Медиа</Tabs.Trigger></Tabs.List>
              <Tabs.Content value="card"><CardTab project={current} update={update} /></Tabs.Content>
              <Tabs.Content value="page"><PageTab project={current} update={update} /></Tabs.Content>
              <Tabs.Content value="media"><MediaTab project={current} update={update} onUpload={upload} uploads={uploads} /></Tabs.Content>
            </Tabs.Root>
          </div>}
        </section>
        {current ? <PublicationRail project={current} update={update} onLifecycle={(value) => void lifecycle(value)} onDuplicate={() => setDialog("duplicate")} /> : <aside className="publish-rail"><Text size="2" color="gray">Настройки публикации появятся после выбора проекта.</Text></aside>}
      </main>
      <SlugDialog open={dialog === "create"} title="Новый проект" action="Создать" onOpenChange={(open) => setDialog(open ? "create" : null)} onSubmit={(slug) => void createProject(slug)} />
      <SlugDialog open={dialog === "duplicate"} title="Дублировать проект" action="Создать копию" onOpenChange={(open) => setDialog(open ? "duplicate" : null)} onSubmit={(slug) => void duplicateProject(slug)} />
    </div>
  </Theme>;
}

const root = document.querySelector("#admin-root");
if (!root) throw new Error("Admin root was not found");
createRoot(root).render(<StrictMode><App /></StrictMode>);
