import { TechHeroArrival } from './TechHeroArrival'

export function TechHero() {
  return (
    <section className='relative -mt-34 mb-24 flex min-h-dvh items-center justify-center overflow-x-hidden bg-background px-3 py-0 sm:px-4'>
      <div className='relative w-full'>
        <TechHeroArrival />
      </div>
    </section>
  )
}
