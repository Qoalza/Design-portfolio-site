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
} from "@radix-ui/react-icons";
import {
  Button,
  AlertDialog,
  Dialog,
  Flex,
  IconButton,
  Text,
  TextArea,
  Tooltip,
} from "@radix-ui/themes";
import { useEffect, useRef, useState } from "react";
import type { ProjectImage } from "../../../src/lib/project-contract";
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
        <img className="asset-preview" src={image.src} alt="" />
      ) : (
        <div className="asset-placeholder"><Text size="1" color="gray">Нет изображения</Text></div>
      )}
      <Flex gap="2" wrap="wrap">
        <Button size="1" variant="soft" onClick={() => input.current?.click()}>
          {image ? "Заменить" : "Загрузить"}
        </Button>
        {image && remove && !managed ? (
          <Button size="1" variant="ghost" color="red" onClick={remove}>Удалить</Button>
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
          <Flex justify="end" gap="3" mt="5"><AlertDialog.Cancel><Button variant="soft" color="gray">Отмена</Button></AlertDialog.Cancel><AlertDialog.Action><Button onClick={() => { if (pendingFile) upload(pendingFile); setPendingFile(undefined); }}>Заменить</Button></AlertDialog.Action></Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </div>
  );
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
      <input
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

function Tool({ label, children, onClick }: { label: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Tooltip content={label}>
      <IconButton type="button" size="1" variant="ghost" color="gray" aria-label={label} onClick={onClick}>
        {children}
      </IconButton>
    </Tooltip>
  );
}

export function RichEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const format = (before: string, after = before) => {
    const node = textarea.current;
    if (!node) return;
    const start = node.selectionStart;
    const end = node.selectionEnd;
    const selection = value.slice(start, end) || "текст";
    onChange(`${value.slice(0, start)}${before}${selection}${after}${value.slice(end)}`);
    requestAnimationFrame(() => {
      node.focus();
      node.setSelectionRange(start + before.length, start + before.length + selection.length);
    });
  };
  const prefixLines = (prefix: string) => {
    const node = textarea.current;
    if (!node) return;
    const lineStart = value.lastIndexOf("\n", Math.max(0, node.selectionStart - 1)) + 1;
    const lineEndIndex = value.indexOf("\n", node.selectionEnd);
    const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
    const selected = value.slice(lineStart, lineEnd);
    const next = selected.split("\n").map((line, index) => `${prefix === "ordered" ? `${index + 1}. ` : prefix}${line}`).join("\n");
    onChange(`${value.slice(0, lineStart)}${next}${value.slice(lineEnd)}`);
    requestAnimationFrame(() => { node.focus(); node.setSelectionRange(lineStart, lineStart + next.length); });
  };
  const applyLink = () => {
    const node = textarea.current;
    if (!node || !/^https?:\/\//i.test(linkUrl)) return;
    const start = node.selectionStart;
    const end = node.selectionEnd;
    const selection = value.slice(start, end) || "ссылка";
    onChange(`${value.slice(0, start)}[${selection}](${linkUrl})${value.slice(end)}`);
    setLinkOpen(false);
  };
  return (
    <div className="rich-editor">
      <div className="rich-toolbar" aria-label="Форматирование описания">
        <Tool label="Обычный текст" onClick={() => textarea.current?.focus()}><TextIcon /></Tool>
        <Tool label="Подзаголовок" onClick={() => prefixLines("### ")}><HeadingIcon /></Tool>
        <span className="toolbar-separator" />
        <Tool label="Полужирный" onClick={() => format("**")}><FontBoldIcon /></Tool>
        <Tool label="Курсив" onClick={() => format("_")}><FontItalicIcon /></Tool>
        <Tool label="Подчёркивание" onClick={() => format("<u>", "</u>")}><UnderlineIcon /></Tool>
        <Tool label="Ссылка" onClick={() => setLinkOpen(true)}><Link2Icon /></Tool>
        <span className="toolbar-separator" />
        <Tool label="Маркированный список" onClick={() => prefixLines("- ")}><ListBulletIcon /></Tool>
        <Tool label="Нумерованный список" onClick={() => prefixLines("ordered")}><RowsIcon /></Tool>
      </div>
      <TextArea
        ref={textarea}
        rows={9}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Описание секции"
      />
      <Dialog.Root open={linkOpen} onOpenChange={setLinkOpen}>
        <Dialog.Content maxWidth="440px">
          <Dialog.Title>Добавить ссылку</Dialog.Title>
          <Dialog.Description>Выделенный текст станет ссылкой.</Dialog.Description>
          <div className="dialog-field"><Text size="2" weight="medium">URL</Text><input className="tag-input" autoFocus value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} /></div>
          <Flex justify="end" gap="3" mt="5"><Dialog.Close><Button variant="soft" color="gray">Отмена</Button></Dialog.Close><Button disabled={!/^https?:\/\//i.test(linkUrl)} onClick={applyLink}>Добавить</Button></Flex>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}

export function SavedMark({ children }: { children: React.ReactNode }) {
  return <span className="saved-mark"><CheckIcon />{children}</span>;
}
