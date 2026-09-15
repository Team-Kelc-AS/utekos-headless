'use client'

import { useEffect, useRef } from 'react'
import { Heart } from 'lucide-react'
import { animate, inView, stagger } from 'motion'

export function CreatedForSection() {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = container.current
    if (!root) return

    const q = (selector: string) =>
      Array.from(root.querySelectorAll<HTMLElement>(selector))
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    const iconWrapper = q('.motion-icon-wrapper')
    const iconGlow = q('.motion-icon-glow')
    const blobs = q('.motion-blob-1, .motion-blob-2')
    const revealTargets = q(
      '.motion-icon-wrapper, .motion-title-line, .motion-divider, .motion-text'
    )

    if (reduced) return

    revealTargets.forEach(target => {
      target.style.willChange = 'transform, opacity'
    })

    let played = false
    const stopReveal = inView(
      root,
      () => {
        if (played) return
        played = true

        const controls = animate(
          [
            [
              iconWrapper,
              {
                opacity: [0, 1],
                scale: [0, 1],
                rotate: [-90, 0]
              },
              { duration: 1, ease: [0.34, 1.56, 0.64, 1] }
            ],
            [
              q('.motion-title-line'),
              { y: ['100%', '0%'], skewY: [5, 0] },
              {
                duration: 0.9,
                at: 0.18,
                delay: stagger(0.15),
                ease: [0.16, 1, 0.3, 1]
              }
            ],
            [
              q('.motion-divider'),
              { opacity: [0, 1], scaleX: [0, 1] },
              {
                duration: 0.85,
                at: 0.42,
                ease: [0.34, 1.56, 0.64, 1]
              }
            ],
            [
              q('.motion-text'),
              { opacity: [0, 1], y: [30, 0] },
              {
                duration: 0.75,
                at: 0.55,
                ease: [0.22, 1, 0.36, 1]
              }
            ],
            [
              q(
                '.motion-desc-underline, .motion-desc-highlight'
              ),
              { scaleX: [0, 1] },
              {
                duration: 0.65,
                at: 0.72,
                delay: stagger(0.08),
                ease: [0.16, 1, 0.3, 1]
              }
            ]
          ],
          { defaultTransition: { type: 'tween' } }
        )

        controls.then(() => {
          revealTargets.forEach(target => {
            target.style.willChange = 'auto'
          })
        })

        return () => controls.stop()
      },
      { margin: '0px 0px -18% 0px', amount: 0.16 }
    )

    const loopControls = [
      ...iconWrapper.map(element =>
        animate(
          element,
          { y: [0, -10, 0] },
          {
            duration: 2,
            delay: 1.2,
            ease: 'easeInOut',
            repeat: Infinity
          }
        )
      ),
      ...iconGlow.map(element =>
        animate(
          element,
          {
            boxShadow: [
              '0 0 15px rgba(255,255,255,0.05)',
              '0 0 25px rgba(255,255,255,0.15)',
              '0 0 15px rgba(255,255,255,0.05)'
            ]
          },
          { duration: 2, ease: 'easeInOut', repeat: Infinity }
        )
      ),
      ...blobs.map((element, index) =>
        animate(
          element,
          {
            x:
              index === 0 ?
                ['0%', '20%', '0%']
              : ['0%', '-20%', '0%'],
            y:
              index === 0 ?
                ['0%', '-20%', '0%']
              : ['0%', '20%', '0%'],
            scale: index === 0 ? [1, 1.1, 1] : [1, 0.9, 1],
            rotate: index === 0 ? [0, 10, 0] : [0, -10, 0]
          },
          {
            duration: index === 0 ? 8 : 10,
            delay: index === 0 ? 0 : 1,
            ease: 'easeInOut',
            repeat: Infinity
          }
        )
      )
    ]

    return () => {
      stopReveal()
      loopControls.forEach(control => control.stop())
    }
  }, [])

  return (
    <div
      ref={container}
      className='relative mt-6 mb-12 w-full overflow-hidden rounded-3xl border-y border-white/5 bg-overcast py-8 text-center md:mb-20 md:py-32'
    >
      <div className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
        <div className='absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] bg-[size:32px_32px]' />

        <div className='motion-blob-1 bg-bleached-mauve absolute top-[20%] left-[30%] size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen blur-[120px]' />
        <div className='motion-blob-2 absolute right-[30%] bottom-[20%] h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-white/5 mix-blend-screen blur-[100px]' />
      </div>

      <div className='relative z-10 container mx-auto flex flex-col items-center px-4'>
        <div className='motion-icon-wrapper mb-10 will-change-transform'>
          <div className='motion-icon-glow bg-bleached-mauve/80 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] backdrop-blur-sm'>
            <Heart className='text-bleached-mauve fill-bleached-mauve size-7' />
          </div>
        </div>

        <h2 className='font-google-sans text-4xl leading-tight font-bold text-balance sm:text-5xl md:text-7xl'>
          <span className='block overflow-hidden'>
            <span className='motion-title-line block text-havdyp will-change-transform'>
              Skapt for
            </span>
          </span>
          <span className='block overflow-hidden pb-2'>
            <span className='motion-title-line block will-change-transform'>
              <span className='animate-shine bg-linear-to-r from-slate-900 via-slate-400 to-slate-900 bg-[length:200%_auto] bg-clip-text py-1 text-transparent'>
                din Utekos
              </span>
            </span>
          </span>
        </h2>

        <div className='motion-divider my-10 h-[2px] w-32 origin-center bg-linear-to-r from-transparent via-slate-500/30 to-transparent will-change-transform' />

        <p className='motion-text mx-auto max-w-2xl text-lg leading-relaxed font-light text-background/90 opacity-0 md:text-xl'>
          Våre komfortplagg er{' '}
          <span className='relative inline-block font-medium text-background'>
            designet
            <span className='motion-desc-underline absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-slate-500' />
          </span>{' '}
          for å holde deg varm, slik at du kan{' '}
          <span className='relative inline-block px-1'>
            <span className='motion-desc-highlight absolute inset-0 origin-left scale-x-0 -skew-x-6 rounded bg-white/10 text-background/90' />
            <span className='relative z-10 font-medium text-background/90'>
              nyte
            </span>
          </span>{' '}
          de gode øyeblikkene lenger.
        </p>
      </div>
    </div>
  )
}
