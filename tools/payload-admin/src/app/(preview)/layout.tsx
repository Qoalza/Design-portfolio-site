import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import './preview.css'

export const metadata: Metadata = { title: 'Локальный предпросмотр', robots: { index: false, follow: false } }
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="ru"><body>{children}</body></html>
}
