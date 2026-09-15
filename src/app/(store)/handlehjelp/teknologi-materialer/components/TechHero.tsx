import { TechHeroArrival } from './TechHeroArrival'
import { TechHeroScrollInvite } from './TechHeroScrollInvite'
import styles from './TechHero.module.css'

export function TechHero() {
  return (
    <section
      data-tech-hero-scene
      className={`${styles.scene} relative mb-24 flex min-h-dvh items-center justify-center overflow-x-hidden bg-background px-3 py-0 sm:px-4`}
    >
      <div className='relative w-full'>
        <TechHeroArrival />
      </div>
      <TechHeroScrollInvite />
    </section>
  )
}
