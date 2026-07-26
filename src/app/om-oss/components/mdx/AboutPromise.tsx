import { Heart, ShieldCheck } from 'lucide-react'
import { AboutBadge } from './AboutBadge'

const promises = [
  {
    icon: Heart,
    title: 'Mer enn et plagg',
    text: 'Vi lover deg følelsen av umiddelbar varme og velvære. En garanti for at du kan nyte øyeblikket lenger, uten å fryse.'
  },
  {
    icon: ShieldCheck,
    title: 'En varig verdi',
    text: 'Se på det som en investering i din egen livskvalitet. Kompromissløs komfort og overlegen allsidighet, designet for å gi deg flere timer utendørs, år etter år.'
  }
]

export function AboutPromise() {
  return (
    <article className='mx-auto bg-background px-8 py-20 text-center text-foreground sm:py-28 md:px-12 lg:px-16'>
      <div className='max-w-5xl px-4 text-left sm:px-6 lg:px-8'>
        <AboutBadge className='mb-6'>Vårt løfte</AboutBadge>
        <h2 className='font-google-sans text-left font-sans text-5xl leading-[0.95] font-bold text-foreground sm:text-5xl'>
          Vårt løfte til deg
        </h2>
        <p className='mt-5 max-w-2xl text-left font-utekos-text-medium text-xl leading-8 text-foreground'>
          Komforten skal merkes med en gang, og kvaliteten skal
          fortsette å bære øyeblikkene ute.
        </p>

        <div className='mt-12 grid grid-cols-1 gap-5 md:grid-cols-2'>
          {promises.map(item => (
            <article
              key={item.title}
              className='rounded-lg border border-border bg-card p-7 text-card-foreground'
            >
              <div className='flex items-center gap-4'>
                <span className='flex size-12 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground'>
                  <item.icon
                    aria-hidden='true'
                    className='size-6'
                    strokeWidth={1.8}
                  />
                </span>
                <h3 className='font-utekos-text-medium text-2xl text-inherit'>
                  {item.title}
                </h3>
              </div>
              <p className='/78 mt-3 text-base leading-7 text-inherit/78'>
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </article>
  )
}
