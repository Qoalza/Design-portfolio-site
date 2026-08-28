/* eslint-disable @next/next/no-img-element -- local admin previews draft files outside Next Image */
import {
  CheckIcon,
  HeadingIcon,
  Link2Icon,
  ListBulletIcon,
  RowsIcon,
  TextIcon,
} from "@radix-ui/react-icons";
import {
  Button,
  Flex,
  IconButton,
  Text,
  TextArea,
  Tooltip,
} from "@radix-ui/themes";
import { useRef } from "react";
import type { ProjectImage } from "../../../src/lib/project-contract";

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
          if (file) upload(file);
          event.target.value = "";
        }}
      />
    </div>
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
  return (
    <div className="rich-editor">
      <div className="rich-toolbar" aria-label="Форматирование описания">
        <Tool label="Обычный текст" onClick={() => textarea.current?.focus()}><TextIcon /></Tool>
        <Tool label="Подзаголовок" onClick={() => format("### ", "")}><HeadingIcon /></Tool>
        <span className="toolbar-separator" />
        <Tool label="Полужирный" onClick={() => format("**")}><strong>B</strong></Tool>
        <Tool label="Курсив" onClick={() => format("_")}><em>I</em></Tool>
        <Tool label="Подчёркивание" onClick={() => format("<u>", "</u>")}><u>U</u></Tool>
        <Tool label="Ссылка" onClick={() => format("[", "](https://)")}><Link2Icon /></Tool>
        <span className="toolbar-separator" />
        <Tool label="Маркированный список" onClick={() => format("- ", "")}><ListBulletIcon /></Tool>
        <Tool label="Нумерованный список" onClick={() => format("1. ", "")}><RowsIcon /></Tool>
      </div>
      <TextArea
        ref={textarea}
        rows={9}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Описание секции"
      />
    </div>
  );
}

export function SavedMark({ children }: { children: React.ReactNode }) {
  return <span className="saved-mark"><CheckIcon />{children}</span>;
}
