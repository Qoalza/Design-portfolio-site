'use client'

import { Callout, Theme } from '@radix-ui/themes'
import { useTheme } from '@payloadcms/ui'

export function LocalNotice() {
  const { theme } = useTheme()
  return (
    <Theme appearance={theme} hasBackground={false} style={{ minHeight: 0 }}>
      <Callout.Root>
        <Callout.Text>
          Черновики доступны только в редакторе и предпросмотре. Опубликованные версии проектов используются сайтом.
        </Callout.Text>
      </Callout.Root>
    </Theme>
  )
}
