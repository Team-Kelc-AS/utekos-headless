'use client'

import * as React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { cn } from '@/lib/utils/className'
import { Button } from '@/components/ui/button'

type ThemeChoice = 'light' | 'dark' | 'system'

type ModeToggleProps = {
  className?: string
  showLabel?: boolean
}

const themeOptions = [
  { value: 'dark' as const, label: 'Mørk', Icon: Moon },
  { value: 'light' as const, label: 'Lys', Icon: Sun },
  { value: 'system' as const, label: 'System', Icon: Monitor }
]

function useIsClient() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

function getActiveTheme(
  theme: string | undefined,
  isClient: boolean
): ThemeChoice {
  if (!isClient) {
    return 'dark'
  }

  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    return theme
  }

  return 'dark'
}

export function ModeToggle({
  className,
  showLabel = false
}: ModeToggleProps) {
  const { theme, setTheme } = useTheme()
  const isClient = useIsClient()
  const activeTheme = getActiveTheme(theme, isClient)

  return (
    <div
      role='group'
      aria-label='Fargetema'
      className={cn(
        ' inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5',
        className
      )}
    >
      {themeOptions.map(({ value, label, Icon }) => {
        const isActive = activeTheme === value

        return (
          <Button
            key={value}
            type='button'
            variant='ghost'
            disabled={!isClient}
            aria-label={label}
            aria-pressed={isActive}
            onClick={() => setTheme(value)}
            className={cn(
              'h-9 shrink-0 rounded-sm text-foreground',
              showLabel ? 'gap-1.5 px-3' : 'size-9 px-0',
              isActive &&
                'bg-background text-foreground shadow-sm',
              !isActive &&
                'hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className='size-4' aria-hidden />
            {showLabel ?
              <span className='text-sm font-medium'>
                {label}
              </span>
            : null}
          </Button>
        )
      })}
    </div>
  )
}
