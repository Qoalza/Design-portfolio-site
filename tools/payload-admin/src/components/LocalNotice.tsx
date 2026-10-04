'use client'

import { Callout, Theme } from '@radix-ui/themes'
import { useTheme } from '@payloadcms/ui'

export function LocalNotice() {
  const { theme } = useTheme()
  return (
    <Theme appearance={theme} hasBackground={false} style={{ minHeight: 0 }}>
      <Callout.Root>
        <Callout.Text>
          Локальная версия редактора. Сохранение и публикация работают только здесь и не меняют действующий сайт.
        </Callout.Text>
      </Callout.Root>
    </Theme>
  )
}
