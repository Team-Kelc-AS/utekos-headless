// Path: src/components/frontpage/TestimonialSection.tsx
'use client'

import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/utils/className'
import { TestimonialCard } from './TestimonialCard'
import { testimonials } from './testimonials'

export function TestimonialSection() {
  const [hLineRef, hLineInView] = useInView({ threshold: 0.5 })

  return (
    <>
      <div className='relative mb-8'>
        <div
          ref={hLineRef}
          className={cn(
            'will-animate-scale-x dark:bg-dark-border absolute top-4 left-0 h-px w-full origin-left bg-border transition-transform duration-1000 ease-out',
            hLineInView ? 'scale-x-100' : 'scale-x-0'
          )}
        />
      </div>

      <div className='grid auto-rows-fr grid-cols-1 items-stretch gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3'>
        {testimonials.map((testimonial, i) => (
          <TestimonialCard
            key={`${testimonial.name}-${i}`}
            testimonial={testimonial}
            index={i}
          />
        ))}
      </div>
    </>
  )
}
