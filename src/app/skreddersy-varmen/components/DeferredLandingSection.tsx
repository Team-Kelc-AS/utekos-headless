'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

const Slider = dynamic(
  () => import('./TechDownSlider').then(m => m.TechDownSlider),
  { ssr: false }
)
const Reviews = dynamic(
  () =>
    import('./SectionSocialProof').then(
      m => m.SectionSocialProof
    ),
  { ssr: false }
)

export function DeferredLandingSection({
  section
}: {
  section: 'slider' | 'reviews'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '800px' }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      id={
        section === 'reviews' && !visible ?
          'reviews-section'
        : undefined
      }
      className='min-h-screen w-full'
    >
      {visible ?
        section === 'slider' ?
          <Slider />
        : <Reviews />
      : <div className='px-6 py-16'>
          <h2 className='text-3xl'>
            {section === 'slider' ?
              'Varme som tåler fukt'
            : 'Dette sier kundene'}
          </h2>
          <p>
            {section === 'slider' ?
              'Utforsk isolasjonen i Utekos TechDown™.'
            : '4,8 av 5 i kundeanmeldelser.'}
          </p>
        </div>
      }
    </div>
  )
}
