/* eslint-disable @next/next/no-img-element -- local admin previews draft files outside Next Image */
import {
  CheckIcon,
  FontBoldIcon,
  FontItalicIcon,
  HeadingIcon,
  Link2Icon,
  ListBulletIcon,
  RowsIcon,
  TextIcon,
  UnderlineIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import {
  Button,
  AlertDialog,
  Dialog,
  Flex,
  IconButton,
  Text,
  TextField,
  Tooltip,
} from "@radix-ui/themes";
import { useEffect, useRef, useState } from "react";
import type { ProjectFrameComposition, ProjectFrameNode, ProjectImage, ProjectInlineContent, ProjectSectionBlock, ProjectTextMark } from "../../../src/lib/project-contract";
import { formatTagInput, parseTagInput } from "./admin-model";

export function Field({
  label,
  hint,
  error,
  wide,
  field,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  wide?: boolean;
  field?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`field${wide ? " field-wide" : ""}`} data-field={field} tabIndex={field ? -1 : undefined}>
      <Text size="2" weight="medium">{label}</Text>
      {children}
      <span className={`field-help${error ? " field-error" : ""}`}>
        {error ?? hint ?? "\u00a0"}
      </span>
    </label>
  );
}

export function RailGroup({
  title,
  description,
  children,
  selected,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  selected?: boolean;
}) {
  return (
    <section className="rail-group" data-selected={selected || undefined}>
      <div className="rail-group-heading">
        <Text weight="bold">{title}</Text>
        {description ? <Text as="p" size="1" color="gray">{description}</Text> : null}
      </div>
      {children}
    </section>
  );
}

export function AssetField({
  title,
  description,
  image,
  managed,
  upload,
  remove,
}: {
  title: string;
  description: string;
  image?: ProjectImage;
  managed?: boolean;
  upload: (file: File) => void;
  remove?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File>();
  return (
    <div className="asset-field">
      <div className="asset-copy">
        <Text weight="medium">{title}</Text>
        <Text as="p" size="1" color="gray">{description}</Text>
      </div>
      {image ? (
        <ImagePreview src={image.src} label={title}><img className="asset-preview" src={image.src} alt="" /></ImagePreview>
      ) : (
        <div className="asset-placeholder"><Text size="1" color="gray">Нет изображения</Text></div>
      )}
      <Flex gap="2" wrap="wrap">
        <Button size="3" variant="outline" color="gray" onClick={() => input.current?.click()}>
          {image ? "Заменить" : "Загрузить"}
        </Button>
        {image && remove && !managed ? (
          <IconButton size="3" variant="ghost" color="red" aria-label={`Удалить ${title}`} onClick={remove}><TrashIcon /></IconButton>
        ) : null}
      </Flex>
      <input
        ref={input}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file && managed) setPendingFile(file);
          else if (file) upload(file);
          event.target.value = "";
        }}
      />
      <AlertDialog.Root open={Boolean(pendingFile)} onOpenChange={(open) => { if (!open) setPendingFile(undefined); }}>
        <AlertDialog.Content maxWidth="520px">
          <AlertDialog.Title>Заменить управляемую композицию?</AlertDialog.Title>
          <AlertDialog.Description>Текущая сложная композиция будет заменена одним обычным изображением в тестовом черновике.</AlertDialog.Description>
          <Flex justify="end" gap="3" mt="5"><AlertDialog.Cancel><Button size="3" variant="soft" color="gray">Отмена</Button></AlertDialog.Cancel><AlertDialog.Action><Button size="3" onClick={() => { if (pendingFile) upload(pendingFile); setPendingFile(undefined); }}>Заменить</Button></AlertDialog.Action></Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </div>
  );
}

export function ImagePreview({ src, label, children }: { src: string; label: string; children: React.ReactNode }) {
  return <Dialog.Root><Dialog.Trigger><button className="image-preview-trigger" type="button" aria-label={`Увеличить ${label}`}>{children}</button></Dialog.Trigger><Dialog.Content className="asset-lightbox" maxWidth="1100px"><Dialog.Title>{label}</Dialog.Title><img className="image-lightbox-content" src={src} alt="" /><Flex justify="end" mt="4"><Dialog.Close><Button size="3" variant="outline" color="gray">Закрыть</Button></Dialog.Close></Flex></Dialog.Content></Dialog.Root>;
}

function frameRootWidthUnit(value: number, rootWidth: number) { return `${value / rootWidth * 100}cqw`; }
function frameRootHeightUnit(value: number, rootHeight: number) { return `${value / rootHeight * 100}cqh`; }
function frameStrokeShadow(stroke: ProjectFrameNode["stroke"], rootWidth: number) {
  if (!stroke) return undefined;
  if (stroke.align === "INSIDE") return `inset 0 0 0 ${frameRootWidthUnit(stroke.width, rootWidth)} ${stroke.color}`;
  if (stroke.align === "OUTSIDE") return `0 0 0 ${frameRootWidthUnit(stroke.width, rootWidth)} ${stroke.color}`;
  const half = frameRootWidthUnit(stroke.width / 2, rootWidth);
  return `inset 0 0 0 ${half} ${stroke.color}, 0 0 0 ${half} ${stroke.color}`;
}

function frameEffectStyle(effects: ProjectFrameNode["effects"], root: { width: number; height: number }) {
  const shadows: string[] = [];
  const filters: string[] = [];
  let backdropFilter: string | undefined;
  for (const effect of effects ?? []) {
    if (effect.type === "drop-shadow" || effect.type === "inner-shadow") {
      shadows.push(`${effect.type === "inner-shadow" ? "inset " : ""}${frameRootWidthUnit(effect.offsetX, root.width)} ${frameRootHeightUnit(effect.offsetY, root.height)} ${frameRootWidthUnit(effect.blur, root.width)} ${frameRootWidthUnit(effect.spread, root.width)} ${effect.color}`);
    } else if (effect.type === "layer-blur") filters.push(`blur(${frameRootWidthUnit(effect.radius, root.width)})`);
    else if (effect.type === "background-blur") backdropFilter = `blur(${frameRootWidthUnit(effect.radius, root.width)})`;
  }
  return { shadows, filter: filters.length ? filters.join(" ") : undefined, backdropFilter };
}

function frameCompositionStyle(composition: ProjectFrameComposition, aspectRatio: string): React.CSSProperties {
  const visualEffects = frameEffectStyle(composition.effects, composition);
  return {
    aspectRatio,
    background: composition.background,
    borderRadius: frameRootWidthUnit(composition.radius, composition.width),
    boxShadow: [frameStrokeShadow(composition.stroke, composition.width), ...visualEffects.shadows].filter(Boolean).join(", ") || undefined,
    filter: visualEffects.filter,
    backdropFilter: visualEffects.backdropFilter,
    mixBlendMode: composition.blendMode as React.CSSProperties["mixBlendMode"],
  };
}

function FrameNodePreview({ node, parent, root, inLayout = false }: { node: ProjectFrameNode; parent: { width: number; height: number }; root: { width: number; height: number }; inLayout?: boolean }) {
  const transforms: string[] = [];
  const style: React.CSSProperties = inLayout ? {
    position: "relative", width: `${node.width / parent.width * 100}%`, height: `${node.height / parent.height * 100}%`,
    flex: node.layoutGrow ? `${node.layoutGrow} 1 0` : node.constraints.horizontal === "STRETCH" ? "1 1 auto" : "0 0 auto",
  } : {
    position: "absolute", width: `${node.width / parent.width * 100}%`, height: `${node.height / parent.height * 100}%`,
  };
  if (!inLayout) {
    if (node.constraints.horizontal === "MAX") style.right = `${(parent.width - node.x - node.width) / parent.width * 100}%`;
    else if (node.constraints.horizontal === "CENTER") {
      style.left = `calc(50% + ${(node.x + node.width / 2 - parent.width / 2) / parent.width * 100}%)`;
      transforms.push("translateX(-50%)");
    }
    else if (node.constraints.horizontal === "STRETCH") { style.left = `${node.x / parent.width * 100}%`; style.right = `${(parent.width - node.x - node.width) / parent.width * 100}%`; delete style.width; }
    else style.left = `${node.x / parent.width * 100}%`;
    if (node.constraints.vertical === "MAX") style.bottom = `${(parent.height - node.y - node.height) / parent.height * 100}%`;
    else if (node.constraints.vertical === "CENTER") {
      style.top = `calc(50% + ${(node.y + node.height / 2 - parent.height / 2) / parent.height * 100}%)`;
      transforms.push("translateY(-50%)");
    }
    else if (node.constraints.vertical === "STRETCH") { style.top = `${node.y / parent.height * 100}%`; style.bottom = `${(parent.height - node.y - node.height) / parent.height * 100}%`; delete style.height; }
    else style.top = `${node.y / parent.height * 100}%`;
  }
  if (node.rotation) transforms.push(`rotate(${node.rotation}deg)`);
  if (transforms.length) style.transform = transforms.join(" ");
  const visualEffects = frameEffectStyle(node.effects, root);
  Object.assign(style, {
    opacity: node.opacity,
    overflow: node.asset?.bounds ? "visible" : node.clip ? "hidden" : "visible",
    borderRadius: node.radius === undefined ? undefined : frameRootWidthUnit(node.radius, root.width),
    background: node.background,
    boxShadow: [frameStrokeShadow(node.stroke, root.width), ...visualEffects.shadows].filter(Boolean).join(", ") || undefined,
    filter: visualEffects.filter,
    backdropFilter: visualEffects.backdropFilter,
    mixBlendMode: node.blendMode as React.CSSProperties["mixBlendMode"],
    zIndex: node.zIndex,
  });
  if (inLayout && node.layoutAlign) style.alignSelf = node.layoutAlign === "start" ? "flex-start" : node.layoutAlign === "end" ? "flex-end" : node.layoutAlign;
  if (node.layout) {
    const [top, right, bottom, left] = node.layout.padding;
    Object.assign(style, {
      display: "flex", boxSizing: "border-box", flexDirection: node.layout.direction === "horizontal" ? "row" : "column",
      gap: node.layout.direction === "horizontal" ? frameRootWidthUnit(node.layout.gap, root.width) : frameRootHeightUnit(node.layout.gap, root.height),
      padding: `${frameRootHeightUnit(top, root.height)} ${frameRootWidthUnit(right, root.width)} ${frameRootHeightUnit(bottom, root.height)} ${frameRootWidthUnit(left, root.width)}`,
      justifyContent: node.layout.align === "space-between" ? "space-between" : node.layout.align === "end" ? "flex-end" : node.layout.align,
      alignItems: node.layout.crossAlign === "end" ? "flex-end" : node.layout.crossAlign === "start" || node.layout.crossAlign === undefined ? "flex-start" : node.layout.crossAlign,
    });
  }
  const assetStyle: React.CSSProperties | undefined = node.asset ? node.asset.bounds ? {
    position: "absolute",
    left: `${node.asset.bounds.x / node.width * 100}%`,
    top: `${node.asset.bounds.y / node.height * 100}%`,
    width: `${node.asset.bounds.width / node.width * 100}%`,
    height: `${node.asset.bounds.height / node.height * 100}%`,
    objectFit: node.asset.fit,
    opacity: node.asset.opacity,
  } : { width: "100%", height: "100%", objectFit: node.asset.fit, opacity: node.asset.opacity } : undefined;
  return <div className="frame-node-preview" style={style}>
    {node.asset ? <img src={node.asset.src} alt="" style={assetStyle} /> : null}
    {node.children?.map((child) => <FrameNodePreview key={child.id} node={child} parent={node} root={root} inLayout={Boolean(node.layout) && !child.absoluteInLayout} />)}
  </div>;
}

export function FrameField({ title, description, composition, source, required, importing, previewVariant = "hero", onImport }: {
  title: string; description: string; composition?: ProjectFrameComposition; source?: string; required?: boolean; importing?: boolean; previewVariant?: "hero" | "cover" | "interactive"; onImport: (url: string) => Promise<void>;
}) {
  const [value, setValue] = useState(source ?? composition?.source.url ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const busy = Boolean(importing || submitting);
  const submit = async () => {
    if (busy) return;
    setError("");
    setSubmitting(true);
    try { await onImport(value.trim()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Не удалось импортировать Frame."); }
    finally { setSubmitting(false); }
  };
  const previewAspect = composition ? `${composition.width}/${composition.height}` : undefined;
  return <div className={`frame-field frame-field-${previewVariant}${error ? " frame-field-error" : ""}`}>
    <div className="asset-copy"><Text weight="medium">{title}{required ? " *" : ""}</Text><Text as="p" size="1" color="gray">{description}</Text></div>
    {composition ? <Dialog.Root><Dialog.Trigger><button className="frame-preview-button" type="button" aria-label={`Увеличить ${title}`}><div className={`frame-preview${error ? " frame-preview-broken" : ""}`} style={frameCompositionStyle(composition, previewAspect ?? `${composition.width}/${composition.height}`)}>{composition.nodes.map((node) => <FrameNodePreview key={node.id} node={node} parent={composition} root={composition} />)}{error ? <span className="frame-warning"><ExclamationTriangleIcon /></span> : null}</div></button></Dialog.Trigger><Dialog.Content className="asset-lightbox" maxWidth="1100px"><Dialog.Title>{title}</Dialog.Title><div className="frame-preview frame-preview-large" style={frameCompositionStyle(composition, `${composition.width}/${composition.height}`)}>{composition.nodes.map((node) => <FrameNodePreview key={node.id} node={node} parent={composition} root={composition} />)}</div><Flex justify="end" mt="4"><Dialog.Close><Button size="3" variant="outline" color="gray">Закрыть</Button></Dialog.Close></Flex></Dialog.Content></Dialog.Root> : null}
    <div className="frame-source"><TextField.Root size="3" value={value} placeholder="Вставьте ссылку на Figma Frame" onChange={(event) => setValue(event.target.value)} aria-invalid={Boolean(error)} disabled={busy} /><Button size="3" variant="outline" color="gray" disabled={!value.trim() || busy} onClick={() => void submit()}>{busy ? <><span className="spinner" aria-hidden="true" />Импортируется…</> : composition ? "Обновить" : "Импортировать"}</Button></div>
    {busy ? <span className="frame-import-status" role="status">Получаем структуру Frame и сохраняем ассеты…</span> : null}
    <span className={`field-help${error ? " field-error" : ""}`}>{error || "Production использует локальный snapshot и не зависит от Figma после публикации."}</span>
  </div>;
}

export function TagField({ value, onChange, label, hint }: { value: string[]; onChange: (value: string[]) => void; label: string; hint?: string }) {
  const [raw, setRaw] = useState(() => formatTagInput(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setRaw(formatTagInput(value));
  }, [value]);
  const commit = () => {
    focused.current = false;
    const tags = parseTagInput(raw);
    setRaw(formatTagInput(tags));
    onChange(tags);
  };
  return (
    <Field label={label} hint={hint ?? "Разделяйте теги символом /"}>
      <TextField.Root
        size="3"
        className="tag-input"
        value={raw}
        onFocus={() => { focused.current = true; }}
        onChange={(event) => setRaw(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commit(); event.currentTarget.blur(); } }}
      />
    </Field>
  );
}

function Tool({ label, children, onClick, active }: { label: string; children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <Tooltip content={label}>
      <IconButton
        type="button"
        size="3"
        variant={active ? "soft" : "ghost"}
        color={active ? "blue" : "gray"}
        aria-label={label}
        aria-pressed={active}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}

const TEXT_BLOCKS = new Set(["paragraph", "heading", "list"]);

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function inlineHtml(content: ProjectInlineContent[]): string {
  return content.map((item) => {
    const marks = new Set<ProjectTextMark>(item.type === "text" || item.type === "link" ? item.marks : []);
    if (item.type === "strong") marks.add("strong");
    if (item.type === "emphasis") marks.add("emphasis");
    if (item.type === "underline") marks.add("underline");
    let html = escapeHtml(item.text);
    if (marks.has("strong")) html = `<strong>${html}</strong>`;
    if (marks.has("emphasis")) html = `<em>${html}</em>`;
    if (marks.has("underline")) html = `<u>${html}</u>`;
    if (item.type === "link") html = `<a href="${escapeHtml(item.href)}">${html}</a>`;
    return html;
  }).join("");
}

function editorHtml(blocks: ProjectSectionBlock[]): string {
  return blocks.filter((block) => TEXT_BLOCKS.has(block.type)).map((block) => {
    if (block.type === "paragraph") return `<p>${inlineHtml(block.content)}</p>`;
    if (block.type === "heading") return `<h3>${inlineHtml(block.content)}</h3>`;
    if (block.type === "list") {
      const tag = block.style === "ordered" ? "ol" : "ul";
      return `<${tag}>${block.items.map((item) => `<li>${inlineHtml(item)}</li>`).join("")}</${tag}>`;
    }
    return "";
  }).join("") || "<p><br></p>";
}

function inlineFromNode(root: Node): ProjectInlineContent[] {
  const output: ProjectInlineContent[] = [];
  const visit = (node: Node, marks: ProjectTextMark[] = [], href?: string) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (!text) return;
      const normalizedMarks = [...new Set(marks)];
      output.push(href
        ? { type: "link", text, href, marks: normalizedMarks.length ? normalizedMarks : undefined }
        : { type: "text", text, marks: normalizedMarks.length ? normalizedMarks : undefined });
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    const tag = node.tagName.toLowerCase();
    const nextMarks = [...marks];
    if (tag === "strong" || tag === "b") nextMarks.push("strong");
    if (tag === "em" || tag === "i") nextMarks.push("emphasis");
    if (tag === "u") nextMarks.push("underline");
    const nextHref = tag === "a" ? node.getAttribute("href") ?? undefined : href;
    node.childNodes.forEach((child) => visit(child, nextMarks, nextHref));
  };
  root.childNodes.forEach((node) => visit(node));
  return output.length ? output : [{ type: "text", text: "" }];
}

function blocksFromEditor(root: HTMLElement): ProjectSectionBlock[] {
  const result: ProjectSectionBlock[] = [];
  const elements = Array.from(root.children);
  const appendParagraph = (node: Node) => result.push({ type: "paragraph", content: inlineFromNode(node) });
  for (const element of elements) {
    const tag = element.tagName.toLowerCase();
    if (tag === "h3" || tag === "h4" || tag === "h5" || tag === "h6") {
      result.push({ type: "heading", level: Number(tag.slice(1)) as 3 | 4 | 5 | 6, content: inlineFromNode(element) });
    } else if (tag === "ul" || tag === "ol") {
      const items = Array.from(element.children).filter((item) => item.tagName.toLowerCase() === "li").map(inlineFromNode);
      if (items.length) result.push({ type: "list", style: tag === "ol" ? "ordered" : "unordered", items });
    } else {
      appendParagraph(element);
    }
  }
  if (!elements.length && root.textContent) appendParagraph(root);
  return result.filter((block) => block.type !== "paragraph" || block.content.some((item) => item.text.length > 0));
}

type EditorState = { bold: boolean; italic: boolean; underline: boolean; ordered: boolean; unordered: boolean; heading: boolean };
const EMPTY_EDITOR_STATE: EditorState = { bold: false, italic: false, underline: false, ordered: false, unordered: false, heading: false };

export function RichEditor({ value, onChange }: { value: ProjectSectionBlock[]; onChange: (value: ProjectSectionBlock[]) => void }) {
  const editor = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const lastValue = useRef("");
  const [state, setState] = useState<EditorState>(EMPTY_EDITOR_STATE);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  useEffect(() => {
    const node = editor.current;
    if (!node) return;
    const html = editorHtml(value);
    if (lastValue.current !== html && document.activeElement !== node) node.innerHTML = html;
    lastValue.current = html;
  }, [value]);

  const emit = () => {
    const node = editor.current;
    if (!node) return;
    const blocks = blocksFromEditor(node);
    lastValue.current = editorHtml(blocks);
    onChange(blocks);
  };

  const refreshState = () => {
    const node = editor.current;
    const selection = window.getSelection();
    if (!node || !selection?.anchorNode || !node.contains(selection.anchorNode)) return;
    const anchor = selection.anchorNode.nodeType === Node.ELEMENT_NODE
      ? selection.anchorNode as Element
      : selection.anchorNode.parentElement;
    const closest = (selector: string) => Boolean(anchor?.closest(selector) && node.contains(anchor.closest(selector)));
    setState({
      bold: closest("strong, b") || document.queryCommandState("bold"),
      italic: closest("em, i") || document.queryCommandState("italic"),
      underline: closest("u") || document.queryCommandState("underline"),
      ordered: closest("ol"),
      unordered: closest("ul"),
      heading: closest("h3"),
    });
  };

  const command = (name: string, argument?: string) => {
    editor.current?.focus();
    document.execCommand(name, false, argument);
    emit();
    refreshState();
  };
  const selectedBlocks = () => {
    const root = editor.current;
    const selection = window.getSelection();
    if (!root || !selection?.rangeCount) return [];
    const range = selection.getRangeAt(0);
    return Array.from(root.children).filter((child) => {
      try { return range.intersectsNode(child); } catch { return false; }
    }) as HTMLElement[];
  };
  const blockCommand = (tag: "p" | "h3") => {
    const root = editor.current;
    const blocks = selectedBlocks();
    if (!root || !blocks.length) return command("formatBlock", tag);
    for (const block of blocks) {
      if (block.tagName.toLowerCase() === tag) continue;
      if (block.matches("ul, ol")) {
        const fragment = document.createDocumentFragment();
        Array.from(block.children).forEach((item) => {
          const replacement = document.createElement(tag);
          replacement.innerHTML = item.innerHTML;
          fragment.append(replacement);
        });
        block.replaceWith(fragment);
        continue;
      }
      const replacement = document.createElement(tag);
      replacement.innerHTML = block.innerHTML;
      block.replaceWith(replacement);
    }
    root.focus();
    emit();
    setState((current) => ({ ...current, heading: tag === "h3", ordered: false, unordered: false }));
  };
  const listCommand = (name: "insertOrderedList" | "insertUnorderedList") => {
    const root = editor.current;
    const blocks = selectedBlocks();
    if (!root || !blocks.length) return command(name);
    const listTag = name === "insertOrderedList" ? "ol" : "ul";
    const removing = blocks.length === 1 && blocks[0].tagName.toLowerCase() === listTag;
    if (removing) {
      const fragment = document.createDocumentFragment();
      Array.from(blocks[0].children).forEach((item) => {
        const paragraph = document.createElement("p");
        paragraph.innerHTML = item.innerHTML;
        fragment.append(paragraph);
      });
      blocks[0].replaceWith(fragment);
    } else {
      const list = document.createElement(listTag);
      for (const block of blocks) {
        const lines = (block.innerText || block.textContent || "").split("\n").filter(Boolean);
        for (const line of lines) {
          const item = document.createElement("li");
          item.textContent = line;
          list.append(item);
        }
      }
      blocks[0].before(list);
      blocks.forEach((block) => block.remove());
    }
    root.focus();
    emit();
    setState((current) => ({
      ...current,
      heading: false,
      ordered: !removing && listTag === "ol",
      unordered: !removing && listTag === "ul",
    }));
  };
  const openLink = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount && editor.current?.contains(selection.anchorNode)) savedRange.current = selection.getRangeAt(0).cloneRange();
    setLinkOpen(true);
  };
  const applyLink = () => {
    if (!/^https?:\/\//i.test(linkUrl) && !linkUrl.startsWith("/") && !linkUrl.startsWith("#")) return;
    const selection = window.getSelection();
    if (savedRange.current && selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange.current);
    }
    command("createLink", linkUrl);
    setLinkOpen(false);
  };
  return (
    <div className="rich-editor">
      <div className="rich-toolbar" aria-label="Форматирование описания">
        <Tool label="Обычный текст" active={!state.heading && !state.ordered && !state.unordered} onClick={() => blockCommand("p")}><TextIcon /></Tool>
        <Tool label="Подзаголовок" active={state.heading} onClick={() => blockCommand("h3")}><HeadingIcon /></Tool>
        <span className="toolbar-separator" />
        <Tool label="Полужирный" active={state.bold} onClick={() => command("bold")}><FontBoldIcon /></Tool>
        <Tool label="Курсив" active={state.italic} onClick={() => command("italic")}><FontItalicIcon /></Tool>
        <Tool label="Подчёркивание" active={state.underline} onClick={() => command("underline")}><UnderlineIcon /></Tool>
        <Tool label="Ссылка" onClick={openLink}><Link2Icon /></Tool>
        <span className="toolbar-separator" />
        <Tool label="Маркированный список" active={state.unordered} onClick={() => listCommand("insertUnorderedList")}><ListBulletIcon /></Tool>
        <Tool label="Нумерованный список" active={state.ordered} onClick={() => listCommand("insertOrderedList")}><RowsIcon /></Tool>
      </div>
      <div
        ref={editor}
        className="rich-editor-content"
        contentEditable
        role="textbox"
        aria-label="Описание секции"
        aria-multiline="true"
        data-placeholder="Описание секции"
        suppressContentEditableWarning
        onInput={emit}
        onKeyUp={refreshState}
        onMouseUp={refreshState}
        onFocus={refreshState}
        onPaste={(event) => {
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          const html = text.split(/\n{2,}/).map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`).join("");
          document.execCommand("insertHTML", false, html);
          emit();
        }}
      />
      <Dialog.Root open={linkOpen} onOpenChange={setLinkOpen}>
        <Dialog.Content maxWidth="440px">
          <Dialog.Title>Добавить ссылку</Dialog.Title>
          <Dialog.Description>Выделенный текст станет ссылкой.</Dialog.Description>
          <div className="dialog-field"><Text size="2" weight="medium">URL</Text><TextField.Root size="3" className="tag-input" autoFocus value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} /></div>
          <Flex justify="end" gap="3" mt="5"><Dialog.Close><Button size="3" variant="soft" color="gray">Отмена</Button></Dialog.Close><Button size="3" disabled={!/^https?:\/\//i.test(linkUrl)} onClick={applyLink}>Добавить</Button></Flex>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}

export function SavedMark({ children }: { children: React.ReactNode }) {
  return <span className="saved-mark"><CheckIcon />{children}</span>;
}
