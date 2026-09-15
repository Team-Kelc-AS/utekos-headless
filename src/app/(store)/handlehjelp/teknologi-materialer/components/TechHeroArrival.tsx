import type { CSSProperties } from 'react'
import UtekosWordmark from '@/components/BrandComponents/utils/UtekosWordmark'
import styles from './TechHeroArrival.module.css'

const ARRIVAL_LINES = [
  {
    word: 'JUSTER',
    delay: '0ms',
    duration: '0.7s',
    className: 'font-sans text-cloud-dancer font-extrabold'
  },
  {
    word: 'FORM',
    delay: '1.15s',
    duration: '0.7s',
    className: 'font-sans text-cloud-dancer font-extrabold'
  },
  {
    word: 'NYT',
    delay: '2.55s',
    duration: '1.25s',
    className: 'font-sans text-primary font-extrabold'
  }
] as const

export function TechHeroArrival() {
  return (
    <div className='mx-auto w-fit max-w-full text-left'>
      <h1 className='font-sans text-[clamp(4.5rem,12vw,10rem)] leading-none font-extrabold tracking-tighter'>
        {ARRIVAL_LINES.map(line => (
          <span
            key={line.word}
            className='block overflow-hidden'
          >
            <span
              className={`${styles.shoot} block ${line.className}`}
              style={
                {
                  '--arrival-delay': line.delay,
                  '--arrival-duration': line.duration
                } as CSSProperties
              }
            >
              {line.word}
            </span>
          </span>
        ))}
      </h1>

      <div className='mt-8 max-w-136 md:mt-10'>
        <div className='overflow-hidden py-1'>
          <p
            className={`${styles.shoot} flex items-center gap-[0.32em] font-utekos-text text-xl leading-none text-cloud-dancer md:text-2xl`}
            style={
              {
                '--arrival-delay': '4.7s',
                '--arrival-duration': '1.45s'
              } as CSSProperties
            }
          >
            <UtekosWordmark className='h-[0.86em] w-auto shrink-0 translate-y-[-0.12em] text-cloud-dancer' />
            <span>gir deg friheten til å velge.</span>
          </p>
        </div>
        <p className='mt-3 flex flex-wrap items-baseline gap-x-[0.35em] font-utekos-text text-xl text-cloud-dancer md:mt-3.5 md:text-2xl'>
          <span className='overflow-hidden'>
            <span
              className={`${styles.shoot} inline-block`}
              style={
                {
                  '--arrival-delay': '6.85s',
                  '--arrival-duration': '0.95s'
                } as CSSProperties
              }
            >
              Vi kaller det{' '}
            </span>
          </span>
          <span className='overflow-hidden pb-1'>
            <span
              className={`${styles.shoot} inline-block font-utekos-text-medium leading-[1.1] italic`}
              style={
                {
                  '--arrival-delay': '9.55s',
                  '--arrival-duration': '1.15s'
                } as CSSProperties
              }
            >
              adaptiv funksjonalitet.
            </span>
          </span>
        </p>
      </div>
    </div>
  )
}
