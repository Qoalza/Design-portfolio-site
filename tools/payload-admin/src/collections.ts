import type { Access, Block, CollectionConfig } from 'payload'
import { protectMediaDelete, validateMediaOperation } from './media-safety'
import { releaseFields, validateReleaseProject, protectReleaseFileDelete, validateReleaseFileOperation } from './release-content'

const authenticated: Access = ({ req }) => Boolean(req.user)
const privateAccess = {
  read: authenticated, create: authenticated, update: authenticated, delete: authenticated,
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Пользователь', plural: 'Пользователи' },
  auth: true,
  access: privateAccess,
  admin: { useAsTitle: 'email' },
  fields: [],
}

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Изображение', plural: 'Изображения' },
  access: privateAccess,
  upload: true,
  hooks: { beforeOperation: [validateMediaOperation], beforeDelete: [protectMediaDelete] },
  fields: [{ name: 'alt', label: 'Описание изображения', type: 'text', required: true }],
}

const Section: Block = {
  slug: 'section',
  labels: { singular: 'Секция', plural: 'Секции' },
  fields: [
    { name: 'heading', label: 'Заголовок', type: 'text', required: true },
    { name: 'text', label: 'Текст', type: 'richText', required: true },
    { name: 'image', label: 'Изображение', type: 'upload', relationTo: 'media' },
    { name: 'note', label: 'Примечание', type: 'textarea' },
  ],
}

const Gallery: Block = {
  slug: 'gallery',
  labels: { singular: 'Галерея', plural: 'Галереи' },
  fields: [
    { name: 'heading', label: 'Заголовок', type: 'text' },
    {
      name: 'images', label: 'Изображения', type: 'array', minRows: 1,
      fields: [
        { name: 'image', label: 'Изображение', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', label: 'Подпись', type: 'text' },
      ],
    },
  ],
}

export const ProjectFiles: CollectionConfig = {
  slug: 'project-files', labels: { singular: 'Файл проекта', plural: 'Файлы проектов' },
  access: privateAccess, upload: true,
  hooks: { beforeOperation: [validateReleaseFileOperation], beforeDelete: [protectReleaseFileDelete] },
  fields: [{ name: 'label', label: 'Название', type: 'text', required: true }],
}

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: 'Проект', plural: 'Проекты' },
  access: { ...privateAccess, readVersions: authenticated },
  admin: {
    useAsTitle: 'title', defaultColumns: ['title', '_status', 'updatedAt'],
    preview: (doc) => doc.id ? `/preview/projects/${encodeURIComponent(String(doc.id))}?mode=draft` : null,
    description: 'Локальные проекты. Публикация здесь не меняет действующий сайт.',
  },
  versions: { drafts: true, maxPerDoc: 20 },
  hooks: { beforeChange: [validateReleaseProject] },
  fields: [
    { name: 'title', label: 'Название проекта', type: 'text', required: true },
    {
      name: 'slug', label: 'Адрес проекта', type: 'text', required: true, unique: true,
      admin: { description: 'Латинские буквы, цифры и дефис. Например: sample-project' },
      validate: (value: unknown) => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
        ? true : 'Используйте латинские буквы в нижнем регистре, цифры и дефис.',
    },
    {
      name: 'hero', label: 'Херо', type: 'group',
      fields: [{ name: 'image', label: 'Главное изображение', type: 'upload', relationTo: 'media', validate: (value: unknown, { data }: { data?: Record<string, unknown> }) => data?.releaseContent || value ? true : 'Выберите изображение.' }],
    },
    {
      name: 'header', label: 'Заголовок кейса', type: 'group',
      fields: [
        { name: 'heading', label: 'Заголовок', type: 'text', validate: (value: unknown, { data }: { data?: Record<string, unknown> }) => data?.releaseContent || value ? true : 'Укажите заголовок.' },
        { name: 'description', label: 'Краткое описание', type: 'textarea' },
      ],
    },
    ...releaseFields,
    { name: 'blocks', label: 'Содержимое кейса', labels: { singular: 'Блок', plural: 'Блоки' }, type: 'blocks', blocks: [Section, Gallery] },
  ],
}
