'use client'

import { useState, useEffect } from 'react'
import {
  ProductLayersVisual,
  MobileProductLayersVisual
} from './ProductLayersVisual'
import { TechnologyBlock } from './TechnoloyBlock'
import type { TechnologyGroup } from '../types'

export function ProductSpecsView({
  technologyGroups
}: {
  technologyGroups: readonly TechnologyGroup[]
}) {
  const [activeTech, setActiveTech] = useState(
    technologyGroups?.[0]?.technologies?.[0]?.title || ''
  )

  useEffect(() => {
    const handleIntersect = (
      entries: IntersectionObserverEntry[]
    ) => {
      entries.forEach(entry => {
        const title = entry.target.getAttribute(
          'data-tech-title'
        )
        if (!title) return

        if (entry.isIntersecting) {
          setActiveTech(title)
        }
      })
    }

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '-45% 0px -45% 0px',
      threshold: 0
    })

    const elements = document.querySelectorAll(
      '[data-tech-title]'
    )
    elements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [technologyGroups])

  return (
    <div className='mt-24 grid grid-cols-1 gap-16 lg:grid-cols-2'>
      <div className='lg:hidden'>
        <MobileProductLayersVisual activeTech={activeTech} />
      </div>

      <div className='hidden lg:block'>
        <div className='sticky top-32'>
          <ProductLayersVisual activeTech={activeTech} />
        </div>
      </div>

      <div className='space-y-24 pb-24'>
        {technologyGroups.map(group => (
          <article key={group.groupTitle}>
            <h2 className='font-google-sans mb-8 border-b border-border pb-4 text-sm font-bold tracking-widest text-muted-foreground'>
              {group.groupTitle}
            </h2>
            <div className='space-y-8'>
              {group.technologies.map(tech => (
                <div
                  key={tech.title}
                  data-tech-title={tech.title}
                >
                  <TechnologyBlock
                    tech={tech}
                    isActive={activeTech === tech.title}
                  />
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
