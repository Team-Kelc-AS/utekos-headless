// Path: src/components/header/MobileMenu/MobileMenuPanel.tsx

'use client'

import { MobileMenuItem } from '@/components/header/MobileMenu/MobileMenuItem'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import type { MenuItem } from '@types'
import { HeaderLogo } from '../HeaderLogo'
import { Accordion } from '@/components/ui/accordion'
import { useLayoutEffect, useRef } from 'react'
import { MenuIcon } from 'lucide-react'
import {
  stagger,
  useAnimate,
  useReducedMotion
} from 'motion/react'

function nextFrame() {
  return new Promise<void>(resolve =>
    requestAnimationFrame(() => resolve())
  )
}

export function MobileMenuPanel({
  menu = [],
  isOpen,
  onOpenChange
}: {
  menu?: MenuItem[]
  isOpen: boolean
  onOpenChange: (_open: boolean) => void
}) {
  const [scope, animate] = useAnimate<HTMLElement>()
  const shouldReduceMotion = useReducedMotion()
  const subtitleRef = useRef<HTMLSpanElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const animationRef = useRef<{ stop: () => void } | null>(null)
  const runIdRef = useRef(0)

  useLayoutEffect(() => {
    runIdRef.current += 1
    const runId = runIdRef.current

    if (!isOpen) {
      if (animationRef.current) {
        animationRef.current.stop()
        animationRef.current = null
      }

      return
    }

    const run = async () => {
      await nextFrame()
      if (runId !== runIdRef.current) return

      const subtitle = subtitleRef.current
      const list = listRef.current
      if (!subtitle || !list) return

      const items = Array.from(
        list.querySelectorAll<HTMLElement>(
          '[data-mm-item="true"]'
        )
      )

      if (!items.length) return

      if (animationRef.current) animationRef.current.stop()

      if (shouldReduceMotion) {
        subtitle.style.opacity = '1'
        subtitle.style.transform = 'none'
        subtitle.style.filter = 'none'

        for (const item of items) {
          item.style.opacity = '1'
          item.style.transform = 'none'
          item.style.filter = 'none'
        }

        animationRef.current = null
        return
      }

      if (runId !== runIdRef.current) return

      animationRef.current = animate([
        [
          subtitle,
          {
            opacity: [0, 1],
            y: [10, 0],
            filter: ['blur(6px)', 'blur(0px)']
          },
          {
            duration: 0.65,
            delay: 0.08,
            ease: [0.22, 1, 0.36, 1]
          }
        ],
        [
          items,
          {
            opacity: [0, 1],
            x: [-18, 0],
            filter: ['blur(8px)', 'blur(0px)']
          },
          {
            duration: 0.55,
            at: 0.32,
            delay: stagger(0.055),
            ease: [0.22, 1, 0.36, 1]
          }
        ]
      ])
    }

    void run()

    return () => {
      runIdRef.current += 1
      if (animationRef.current) {
        animationRef.current.stop()
        animationRef.current = null
      }
    }
  }, [animate, isOpen, menu.length, shouldReduceMotion])

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <div>
        <SheetTrigger
          render={
            <Button
              variant='outline'
              className='h-11 min-w-11 rounded-md border-transparent bg-transparent px-0 font-utekos-text-medium text-sm text-foreground hover:bg-accent hover:text-accent-foreground md:min-w-[5.75rem] md:px-3'
              aria-label='Åpne meny'
              data-track='MobileMenuClick'
            />
          }
        >
          <MenuIcon className='size-4' />
          <span className='hidden md:inline'>Meny</span>
        </SheetTrigger>
      </div>

      <SheetContent
        side='left'
        className='w-full max-w-sm border-foreground/12 bg-background p-0 text-foreground backdrop-blur-xl'
      >
        <div className='pointer-events-none absolute inset-0 -z-10'>
          <div className='absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-maritime-800)_36%,var(--background))_0%,var(--background)_54%,color-mix(in_oklab,var(--color-maritime-950)_22%,var(--background))_100%)]' />
          <div className='absolute inset-0 bg-[radial-gradient(105%_78%_at_20%_0%,color-mix(in_oklab,var(--color-primary)_18%,transparent)_0%,transparent_64%),radial-gradient(95%_72%_at_88%_34%,color-mix(in_oklab,var(--color-maritime-100)_12%,transparent)_0%,transparent_66%)]' />
          <div className='absolute inset-0 bg-linear-to-b from-transparent via-background/8 to-background/48' />
        </div>

        <SheetHeader className='relative border-b border-foreground/10 p-6'>
          <div className='absolute top-0 right-0 left-0 h-px bg-linear-to-r from-transparent via-foreground/24 to-transparent' />

          <div className='mb-2 flex items-start justify-between gap-3'>
            <div className='flex items-center gap-2'>
              <HeaderLogo />
              <SheetTitle className='font-google-sans ml-2 text-xl leading-[0.95] font-bold tracking-[-0.01em] text-foreground'>
                Meny
              </SheetTitle>
            </div>
          </div>

          <SheetDescription className='leading-text-paragraph /66 text-sm tracking-[-0.01em] text-foreground/66'>
            <span className='block overflow-hidden'>
              <span
                ref={subtitleRef}
                className={
                  isOpen && !shouldReduceMotion ?
                    'block opacity-0'
                  : 'block'
                }
              >
                Utforsk vår kolleksjon
              </span>
            </span>
          </SheetDescription>
        </SheetHeader>

        <nav
          ref={scope}
          className='relative grow overflow-y-auto px-4 pt-4 pb-6'
        >
          <div ref={listRef}>
            <Accordion className='flex flex-col gap-2'>
              {menu.map(item => (
                <div
                  key={item.title}
                  data-mm-item='true'
                  className={
                    isOpen && !shouldReduceMotion ? 'opacity-0'
                    : undefined
                  }
                >
                  <MobileMenuItem item={item} />
                </div>
              ))}
            </Accordion>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
