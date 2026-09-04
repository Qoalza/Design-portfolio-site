/* eslint-disable @next/next/no-img-element -- local admin previews draft files outside Next Image */
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { Badge, Button, Callout, Flex, Heading, IconButton, Switch, Text, TextArea, TextField } from "@radix-ui/themes";
import { useEffect, useRef, useState } from "react";
import type { ProjectContentBlock, ProjectGalleryDeviceId, ProjectGalleryGroup, ProjectImage, ProjectSectionBlock } from "../../../src/lib/project-contract";
import { PROJECT_VISUAL_TEMPLATES, type ProjectVisualTemplateId } from "../../../src/lib/project-visual-registry";
import { sectionTemplateOptions } from "../figma-template-map.mjs";
import type { AdminProject, AdminSection, FieldIssue } from "./admin-model";
import { inline, issueFor, textOf, visualSource, withoutVisualSource } from "./admin-model";
import { Field, FigmaTemplateField, ImagePreview, RichEditor, TagField } from "./admin-ui";
import { uploadGalleryBatch, type GalleryUploadBatchResult } from "./gallery-upload-batch";

type UploadPolicy = { templateId: string; slot: string; operation: "replace" | "add"; referenceSrc?: string };
type Upload = (file: File, context: string, policy: UploadPolicy) => Promise<ProjectImage>;
type ImportFigma = (surface: "catalog" | "hero" | "section", templateId: ProjectVisualTemplateId | undefined, url: string, sectionId?: string) => Promise<void>;
type ProjectUpdate = (patch: Partial<AdminProject>, textOnly?: boolean) => void;

function replaceSectionText(section: AdminSection, value: ProjectSectionBlock[]): AdminSection {
  const managed = section.blocks.filter((block) => block.type === "notice" || block.type === "visual" || block.type === "hardBreak");
  return { ...section, blocks: [...value, ...managed] };
}

function updateSection(project: AdminProject, target: AdminSection, next: AdminSection): AdminProject {
  return { ...project, content: project.content.map((block) => block === target ? next : block) };
}

function SectionSettings({ project, section, change, interactiveEnabled, setInteractiveEnabled, interactiveAvailable }: {
  project: AdminProject; section: AdminSection; change: (project: AdminProject, textOnly?: boolean) => void;
  interactiveEnabled: boolean; setInteractiveEnabled: (enabled: boolean) => void; interactiveAvailable: boolean;
}) {
  const notice = section.blocks.find((block): block is Extract<ProjectSectionBlock, { type: "notice" }> => block.type === "notice");
  const setNotice = (enabled: boolean) => change(updateSection(project, section, {
    ...section,
    blocks: enabled
      ? notice ? section.blocks : [...section.blocks, { type: "notice", templateId: "notice.info-v1", content: inline("") }]
      : section.blocks.filter((block) => block.type !== "notice"),
  }));
  const changeNoticeContent = (value: string) => change(updateSection(project, section, {
    ...section,
    blocks: section.blocks.map((block) => block.type === "notice" ? { ...block, content: inline(value) } : block),
  }), true);
  return (
    <div className="section-settings">
      <div className="section-settings-heading"><Text weight="medium">Настройки секции</Text><Text size="1" color="gray">Визуальное поведение задаёт Portfolio</Text></div>
      <label className="switch-line section-toggle"><div><Text weight="medium">Примечание</Text><Text as="p" size="2" color="gray">Ширина и оформление фиксированы шаблоном</Text></div><Switch radius="full" checked={Boolean(notice)} onCheckedChange={setNotice} /></label>
      {notice ? <Field label="Текст примечания"><TextArea size="3" rows={3} value={textOf(notice.content)} onChange={(event) => changeNoticeContent(event.target.value)} /></Field> : null}
      <label className="switch-line section-toggle section-toggle-interactive"><div><Text weight="medium">Интерактивный блок</Text><Text as="p" size="2" color="gray">Добавляется из утверждённого Figma Frame и оформляется Portfolio</Text></div><Switch radius="full" checked={interactiveEnabled} disabled={!interactiveAvailable} onCheckedChange={setInteractiveEnabled} /></label>
    </div>
  );
}

function SectionEditor({ section, project, index, count, selected, select, change, move, remove, issues, importFigma }: {
  section: AdminSection; project: AdminProject; index: number; count: number; selected: boolean; select: () => void;
  change: (value: AdminProject, textOnly?: boolean) => void; move: (delta: number) => void; remove: () => void; issues: FieldIssue[]; importFigma: ImportFigma;
}) {
  const visual = section.blocks.find((block): block is Extract<ProjectSectionBlock, { type: "visual" }> => block.type === "visual");
  const options = sectionTemplateOptions(project.designProfile, PROJECT_VISUAL_TEMPLATES) as Array<{ templateId: ProjectVisualTemplateId; label: string }>;
  const [addingVisual, setAddingVisual] = useState(false);
  const selectedTemplate = visual ? PROJECT_VISUAL_TEMPLATES[visual.templateId] : undefined;
  const removeVisual = () => {
    const next = updateSection(project, section, { ...section, blocks: section.blocks.filter((block) => block.type !== "visual") });
    change(withoutVisualSource(next, section.adminId));
  };
  return (
    <section className="editor-section section-editor" data-selected={selected || undefined} onFocus={select} onClick={select}>
      <div className="section-editor-heading">
        <Flex align="center" gap="2"><Heading size="3">Секция {index + 1}</Heading>{index > 0 ? <IconButton type="button" size="2" variant="ghost" color="red" aria-label={`Удалить секцию ${index + 1}`} onClick={(event) => { event.stopPropagation(); remove(); }}><TrashIcon /></IconButton> : null}</Flex>
        <Flex gap="2"><IconButton type="button" size="2" variant="ghost" color="gray" aria-label="Переместить выше" disabled={index === 0} onClick={() => move(-1)}><ChevronUpIcon /></IconButton><IconButton type="button" size="2" variant="ghost" color="gray" aria-label="Переместить ниже" disabled={index === count - 1} onClick={() => move(1)}><ChevronDownIcon /></IconButton></Flex>
      </div>
      <Field field={`content.${section.adminId}.heading`} label="Заголовок секции" error={issueFor(issues, `content.${section.adminId}.heading`)}><TextField.Root size="3" value={section.heading} onChange={(event) => change(updateSection(project, section, { ...section, heading: event.target.value }), true)} /></Field>
      <Field label="Описание секции"><RichEditor value={section.blocks} onChange={(value) => change(updateSection(project, section, replaceSectionText(section, value)), true)} /></Field>
      <SectionSettings
        project={project}
        section={section}
        change={change}
        interactiveEnabled={Boolean(visual) || addingVisual}
        interactiveAvailable={options.length > 0}
        setInteractiveEnabled={(enabled) => {
          if (enabled) setAddingVisual(true);
          else {
            setAddingVisual(false);
            if (visual) removeVisual();
          }
        }}
      />
      {visual ? (
        <FigmaTemplateField
          key={`${project.slug}:${section.adminId}:${visualSource(project, section.adminId)?.url ?? "empty"}`}
          title="Интерактивный блок"
          description="Вставьте ссылку на утверждённый Frame целиком — Admin сама разложит его содержимое по скрытым слотам."
          templateId={visual.templateId}
          templateLabel={selectedTemplate!.label}
          source={visualSource(project, section.adminId)}
          importFrame={(url) => importFigma("section", visual.templateId, url, section.adminId)}
          remove={removeVisual}
        />
      ) : options.length === 0 ? (
        <Text size="2" color="gray">Для этого профиля интерактивные шаблоны пока не назначены в коде.</Text>
      ) : addingVisual ? (
        <div className="add-visual-panel">
          <FigmaTemplateField
            key={`${project.slug}:${section.adminId}:auto`}
            title="Новый интерактивный блок"
            description="Вставьте ссылку на Frame из Figma. Admin сама определит совместимый утверждённый шаблон; оформление и размеры останутся в Portfolio."
            templateId="auto"
            templateLabel="Определится по Frame"
            importFrame={(url) => importFigma("section", undefined, url, section.adminId)}
          />
        </div>
      ) : null}
    </section>
  );
}

export function ProjectIdentityEditor({ project, update, uploadLogo, issues }: {
  project: AdminProject; update: ProjectUpdate; uploadLogo: (file: File) => Promise<AdminProject["logo"]>; issues: FieldIssue[];
}) {
  return <section className="editor-section project-identity"><div className="form-grid"><Field field="title" label="Название" error={issueFor(issues, "title")} wide><TextField.Root size="3" value={project.title} onChange={(event) => update({ title: event.target.value })} /></Field></div><div className="asset-field logo-field"><div className="asset-copy"><Text weight="medium">Логотип проекта</Text><Text as="p" size="1" color="gray">Необязательно. Этот слот не управляет специальным знаком Sarafan на главной.</Text></div>{project.logo ? <div className="logo-preview">{project.logo.type === "image" ? <ImagePreview src={project.logo.src} label="Логотип проекта"><img src={project.logo.src} alt="" /></ImagePreview> : <Text size="1" color="gray">Составной legacy-логотип будет заменён миграцией</Text>}</div> : <div className="asset-placeholder"><Text size="1" color="gray">Логотип не добавлен</Text></div>}<Flex gap="2"><label><Button asChild size="3" variant="outline" color="gray"><span>{project.logo ? "Заменить" : "Загрузить SVG"}</span></Button><input hidden type="file" accept="image/svg+xml,.svg" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void uploadLogo(file).then((logo) => update({ logo })); }} /></label>{project.logo ? <IconButton size="3" variant="ghost" color="red" aria-label="Удалить логотип" onClick={() => update({ logo: undefined })}><TrashIcon /></IconButton> : null}</Flex></div></section>;
}

export function CardEditor({ project, update, importFigma, issues }: {
  project: AdminProject; update: ProjectUpdate; importFigma: ImportFigma; issues: FieldIssue[];
}) {
  return (
    <div className="editor-stack">
      <section className="editor-section visual-editor-section"><FigmaTemplateField key={`${project.slug}:catalog:${visualSource(project, "catalog")?.url ?? "empty"}`} title="Превью карточки" description="Вставьте ссылку на Frame карточки целиком. Admin сохранит фон, любое число растров, constraints и тени." templateId="adaptive-frame" templateLabel="Адаптивный Figma Frame" source={visualSource(project, "catalog")} previewShape="card" importFrame={(url) => importFigma("catalog", undefined, url)} /></section>
      <section className="editor-section editor-section-primary">
        <div className="form-grid">
          <Field field="description" label="Описание" error={issueFor(issues, "description")} wide><TextArea size="3" rows={4} value={project.description} onChange={(event) => update({ description: event.target.value })} /></Field>
          <Field field="role" label="Роль" error={issueFor(issues, "role")}><TextField.Root size="3" value={project.role} onChange={(event) => update({ role: event.target.value })} /></Field>
          <TagField label="Краткие теги" value={project.tags} onChange={(tags) => update({ tags })} />
          <Field label="Что делал" wide><TextArea size="3" rows={3} value={project.workSummary ?? ""} onChange={(event) => update({ workSummary: event.target.value || undefined })} /></Field>
        </div>
      </section>
    </div>
  );
}

export const groupDefaults: Record<ProjectGalleryDeviceId, { deviceId: ProjectGalleryDeviceId; label: string }> = {
  desktop: { deviceId: "desktop", label: "Desktop" },
  tablet: { deviceId: "tablet", label: "Tablet" },
  mobile: { deviceId: "mobile", label: "Mobile" },
};

const galleryThumbnailBounds: Record<ProjectGalleryDeviceId, { width: number; height: number }> = {
  desktop: { width: 460, height: 320 },
  tablet: { width: 330, height: 360 },
  mobile: { width: 250, height: 320 },
};

function galleryThumbnailSize(image: ProjectImage, deviceId: ProjectGalleryDeviceId) {
  const bounds = galleryThumbnailBounds[deviceId];
  const scale = Math.min(bounds.width / image.width, bounds.height / image.height);
  return { width: Math.round(image.width * scale), height: Math.round(image.height * scale) };
}

function GalleryDeviceStrip({ group, label, change, upload }: {
  group: ProjectGalleryGroup;
  label: string;
  change: (value: ProjectGalleryGroup) => void;
  upload: Upload;
}) {
  const [importing, setImporting] = useState<ProjectGalleryDeviceId>();
  const [uploadSummary, setUploadSummary] = useState<GalleryUploadBatchResult<ProjectImage>>();
  const strip = useRef<HTMLOListElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });
  const slot = PROJECT_VISUAL_TEMPLATES["gallery.devices-v1"].slots[group.deviceId];
  const atLimit = group.images.length >= slot.maxItems;
  const minWidth = slot.logicalWidth! * 2;
  const minHeight = slot.logicalHeight! * 2;
  const firstImage = group.images[0];
  const refreshEdges = () => {
    const node = strip.current;
    if (!node) return;
    const next = {
      atStart: node.scrollLeft <= 1,
      atEnd: node.scrollLeft + node.clientWidth >= node.scrollWidth - 1,
    };
    setEdges((current) => current.atStart === next.atStart && current.atEnd === next.atEnd ? current : next);
  };
  const scrollGallery = (direction: -1 | 1) => {
    const node = strip.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.max(160, node.clientWidth * 0.75), behavior: "smooth" });
  };
  useEffect(() => {
    const node = strip.current;
    if (!node) return;
    const frame = requestAnimationFrame(refreshEdges);
    const observer = new ResizeObserver(refreshEdges);
    observer.observe(node);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [group.images.length]);
  return (
    <div className="gallery-group" data-device={group.deviceId}>
      <div className="section-title"><div className="section-heading-copy"><Heading size="3">{label}</Heading><Text size="1" color="gray">{firstImage ? <>Пропорция пула: {firstImage.width}×{firstImage.height}. Все следующие изображения должны совпадать по пропорции.</> : <>Ширина: {minWidth}–{slot.maxWidth} px · Высота: {minHeight}–{slot.maxHeight} px. Первое изображение фиксирует точный размер этого пула.</>} Изображение впишется без обрезки; внешний лейаут не изменится.</Text></div></div>
      <div className="gallery-scroll-viewport">
        <ol className="gallery-list" ref={strip} tabIndex={0} aria-label={`Изображения ${label}`} data-at-start={edges.atStart || undefined} data-at-end={edges.atEnd || undefined} onScroll={refreshEdges}>
          <li className="gallery-upload-tile"><label className="gallery-upload-zone" data-disabled={importing === group.deviceId || atLimit || undefined}><PlusIcon /><Text size="2" weight="medium">{atLimit ? "Достигнут лимит" : importing === group.deviceId ? "Проверяем…" : "Добавить изображение"}</Text><Text size="1" color="gray">PNG или WebP</Text><input hidden multiple type="file" accept="image/png,image/webp" disabled={importing === group.deviceId || atLimit} onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ""; if (files.length === 0) return; setImporting(group.deviceId); void uploadGalleryBatch(files, slot.maxItems - group.images.length, firstImage?.src, (file, referenceSrc) => upload(file, `Галерея ${label}`, { templateId: "gallery.devices-v1", slot: group.deviceId, operation: "add", referenceSrc })).then((result) => { if (result.accepted.length > 0) change({ ...group, images: [...group.images, ...result.accepted] }); setUploadSummary(result); }).finally(() => setImporting(undefined)); }} /></label></li>
          {group.images.map((item, index) => <li className="gallery-thumbnail" key={`${item.src}-${index}`} style={galleryThumbnailSize(item, group.deviceId)}><ImagePreview src={item.src} label={`Изображение ${index + 1}`}><img src={item.src} alt="" /></ImagePreview><div className="gallery-item-controls"><Flex className="gallery-item-order" gap="1"><IconButton size="1" variant="ghost" color="gray" aria-label="Переместить изображение влево" disabled={index === 0} onClick={() => { const images = [...group.images]; [images[index - 1], images[index]] = [images[index], images[index - 1]]; change({ ...group, images }); }}><ChevronLeftIcon /></IconButton><IconButton size="1" variant="ghost" color="gray" aria-label="Переместить изображение вправо" disabled={index === group.images.length - 1} onClick={() => { const images = [...group.images]; [images[index + 1], images[index]] = [images[index], images[index + 1]]; change({ ...group, images }); }}><ChevronRightIcon /></IconButton></Flex><IconButton className="gallery-item-delete" type="button" size="1" variant="ghost" color="red" aria-label={`Удалить изображение ${index + 1}`} onClick={() => change({ ...group, images: group.images.filter((_, itemIndex) => itemIndex !== index) })}><TrashIcon /></IconButton></div></li>)}
        </ol>
        {!edges.atStart ? <IconButton className="gallery-scroll-button gallery-scroll-button-left" type="button" size="2" variant="solid" color="gray" aria-label={`Прокрутить ${label} влево`} onClick={() => scrollGallery(-1)}><ChevronLeftIcon /></IconButton> : null}
        {!edges.atEnd ? <IconButton className="gallery-scroll-button gallery-scroll-button-right" type="button" size="2" variant="solid" color="gray" aria-label={`Прокрутить ${label} вправо`} onClick={() => scrollGallery(1)}><ChevronRightIcon /></IconButton> : null}
      </div>
      {uploadSummary ? <Callout.Root color={uploadSummary.rejected.length > 0 ? "orange" : "green"} size="1"><Callout.Text>{uploadSummary.accepted.length > 0 ? `Добавлено: ${uploadSummary.accepted.length}.` : "Новые изображения не добавлены."}{uploadSummary.rejected.length > 0 ? ` Не добавлены: ${uploadSummary.rejected.map((item) => `${item.fileName} — ${item.reason}`).join("; ")}` : null}</Callout.Text></Callout.Root> : null}
    </div>
  );
}

function GalleryEditor({ gallery, change, upload }: { gallery: Extract<ProjectContentBlock, { type: "gallery" }>; change: (value: Extract<ProjectContentBlock, { type: "gallery" }>) => void; upload: Upload }) {
  const updateGroup = (deviceId: ProjectGalleryDeviceId, value: ProjectGalleryGroup) => change({ ...gallery, groups: gallery.groups.map((group) => group.deviceId === deviceId ? value : group) });
  return (
    <section className="editor-section gallery-editor">
      <div className="section-title"><div className="section-heading-copy"><Heading size="4">Галерея</Heading><Text size="2" color="gray">Рамки, подписи, иконки и размеры принадлежат шаблону gallery.devices-v1.</Text></div><Badge>{gallery.groups.reduce((sum, group) => sum + group.images.length, 0)} изображений</Badge></div>
      {gallery.groups.map((group) => <GalleryDeviceStrip key={group.deviceId} group={group} label={groupDefaults[group.deviceId].label} change={(value) => updateGroup(group.deviceId, value)} upload={upload} />)}
    </section>
  );
}

export function PageEditor({ project, update, upload, importFigma, selectedSection, selectSection, issues }: {
  project: AdminProject; update: ProjectUpdate; upload: Upload; importFigma: ImportFigma; selectedSection?: string; selectSection: (id: string) => void; issues: FieldIssue[];
}) {
  const sections = project.content.filter((block): block is AdminSection => block.type === "section");
  const gallery = project.content.find((block): block is Extract<ProjectContentBlock, { type: "gallery" }> => block.type === "gallery") ?? { type: "gallery", templateId: "gallery.devices-v1", groups: [] };
  const galleryGroups = (["desktop", "tablet", "mobile"] as const).map((deviceId) => gallery.groups.find((group) => group.deviceId === deviceId) ?? { deviceId, images: [] });
  const galleryForEditing = { ...gallery, groups: galleryGroups };
  const galleryChange = (value: Extract<ProjectContentBlock, { type: "gallery" }>) => {
    const nextGallery = { ...value, groups: value.groups.filter((group) => group.images.length > 0) };
    update({ ...project, content: nextGallery.groups.length === 0 ? project.content.filter((block) => block.type !== "gallery") : project.content.some((block) => block.type === "gallery") ? project.content.map((block) => block.type === "gallery" ? nextGallery : block) : [...project.content, nextGallery] });
  };
  return (
    <div className="editor-stack">
      <section className="editor-section visual-editor-section"><FigmaTemplateField key={`${project.slug}:hero:${visualSource(project, "hero")?.url ?? "empty"}`} title="Главное изображение открытого проекта" description="Вставьте ссылку на hero Frame целиком. Admin сохранит фон, любое число растров, constraints и тени." templateId="adaptive-frame" templateLabel="Адаптивный Figma Frame" source={visualSource(project, "hero")} importFrame={(url) => importFigma("hero", undefined, url)} /></section>
      <section className="editor-section editor-section-primary"><TagField label="Подробные теги" hint="Отображаются наверху открытого проекта · разделитель /" value={project.detailTags} onChange={(detailTags) => update({ detailTags })} /></section>
      <div className="content-heading"><div className="section-heading-copy"><Heading size="4">Содержание страницы</Heading><Text size="2" color="gray">В каждой секции можно добавить один утверждённый интерактивный блок по ссылке на Figma Frame.</Text></div></div>
      {sections.map((section, index) => <SectionEditor key={section.adminId} section={section} project={project} index={index} count={sections.length} selected={selectedSection === section.adminId} select={() => selectSection(section.adminId)} change={(value, textOnly) => update({ content: value.content }, textOnly)} move={(delta) => { const from = project.content.indexOf(section); let to = from + delta; while (to >= 0 && to < project.content.length && project.content[to].type !== "section") to += delta; if (to < 0 || to >= project.content.length) return; const content = [...project.content]; [content[from], content[to]] = [content[to], content[from]]; update({ content }); }} remove={() => update({ content: withoutVisualSource({ ...project, content: project.content.filter((block) => block !== section) }, section.adminId).content })} issues={issues} importFigma={importFigma} />)}
      <Button className="add-section-button" size="3" variant="soft" color="gray" onClick={() => { const adminId = `${project.slug}-section-${Date.now()}`; const section: AdminSection = { type: "section", adminId, heading: "Новая секция", blocks: [] }; update({ content: [...project.content.filter((block) => block.type !== "gallery"), section, ...project.content.filter((block) => block.type === "gallery")] }); selectSection(adminId); requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-field="content.${adminId}.heading"] input`)?.focus()); }}><PlusIcon />Добавить секцию</Button>
      <GalleryEditor gallery={galleryForEditing} change={galleryChange} upload={upload} />
    </div>
  );
}
