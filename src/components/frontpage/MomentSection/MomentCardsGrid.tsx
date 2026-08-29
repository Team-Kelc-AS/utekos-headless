'use client'

import { MomentCard } from '@/components/frontpage/MomentSection/MomentCard'
import { moments } from '@/components/frontpage/MomentSection/utils/moments'
import {
  motion,
  MotionConfig,
  useReducedMotion,
  useScroll,
  useSpring
} from 'motion/react'
import { useRef } from 'react'

export function MomentCardsGrid() {
  const storyRef = useRef<HTMLUListElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: storyRef,
    offset: ['start 82%', 'end 38%']
  })
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 115,
    damping: 24,
    mass: 0.42
  })

  return (
    <MotionConfig reducedMotion='user'>
      <div className='relative mt-12 sm:mt-16 lg:mt-20'>
        <div
          className='absolute top-7 bottom-7 left-[1.125rem] w-px overflow-hidden bg-foreground/12 md:hidden'
          aria-hidden
        >
          <motion.div
            className='size-full origin-top bg-light-teal'
            style={{
              scaleY: shouldReduceMotion ? 1 : smoothProgress
            }}
          />
        </div>

        <ul
          ref={storyRef}
          className='m-0 grid list-none grid-cols-1 gap-8 p-0 md:grid-cols-3 md:gap-5 lg:gap-8'
        >
          {moments.map((moment, index) => (
            <li
              key={moment.id}
              className='@container/moment-card relative h-full min-w-0 pl-12 md:pl-0'
            >
              <motion.span
                className='absolute top-7 left-0 z-10 flex size-9 items-center justify-center rounded-full border border-light-teal/30 bg-jungle font-utekos-text-medium text-[0.7rem] text-light-teal ring-4 ring-muted md:hidden'
                initial={{ opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{
                  duration: 0.5,
                  delay: 0.08,
                  ease: [0.22, 1, 0.36, 1]
                }}
                aria-hidden
              >
                {String(index + 1).padStart(2, '0')}
              </motion.span>

              <MomentCard moment={moment} index={index} />
            </li>
          ))}
        </ul>
      </div>
    </MotionConfig>
  )
}
