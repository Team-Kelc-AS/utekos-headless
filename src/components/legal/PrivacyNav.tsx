'use client'

import { cn } from '@/lib/utils/className'
import { useEffect, useState } from 'react'

type Section = { id: string; title: string }
type PrivacyNavProps = { sections: Section[] }

export function PrivacyNav({ sections }: PrivacyNavProps) {
  const [activeId, setActiveId] = useState<string>(
    sections[0]?.id || ''
  )

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: '-20% 0px -80% 0px' }
    )

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => {
      sections.forEach(({ id }) => {
        const el = document.getElementById(id)
        if (el) observer.unobserve(el)
      })
    }
  }, [sections])

  return (
    <nav
      className='sticky top-28 hidden lg:block'
      aria-label='På denne siden'
    >
      <h3 className='mb-4 font-utekos-text-medium text-sm'>
        På denne siden
      </h3>
      <ul className='space-y-3'>
        {sections.map(section => {
          const active = activeId === section.id
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={cn(
                  'block text-sm text-current opacity-60 transition-opacity hover:opacity-100',
                  active && 'font-medium opacity-100'
                )}
                aria-current={active ? 'location' : undefined}
              >
                {section.title}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
