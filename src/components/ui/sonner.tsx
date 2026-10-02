'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { TriangleAlertIcon, OctagonXIcon, Loader2Icon } from 'lucide-react'
import { CheckCheckedIcon, InfoCircleOutlineIcon } from '@/components/utekos-icons'

type SonnerTheme = NonNullable<ToasterProps['theme']>

function resolveSonnerTheme(theme: string | undefined): SonnerTheme {
  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    return theme
  }

  return 'dark'
}

const Toaster = ({ theme: themeProp, ...props }: ToasterProps) => {
  const { theme } = useTheme()
  const resolvedTheme = themeProp ?? resolveSonnerTheme(theme)

  return (
    <Sonner
      {...props}
      theme={resolvedTheme}
      className='toaster group'
      icons={{
        success: <CheckCheckedIcon tone="orange" className='size-4' />,
        info: <InfoCircleOutlineIcon tone="orange" className='size-4' />,
        warning: <TriangleAlertIcon className='size-4' />,
        error: <OctagonXIcon className='size-4' />,
        loading: <Loader2Icon className='size-4 animate-spin' />
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)'
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'cn-toast'
        }
      }}
    />
  )
}

export { Toaster }
