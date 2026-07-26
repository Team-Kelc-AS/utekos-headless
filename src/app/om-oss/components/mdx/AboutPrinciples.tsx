import { Award, Coffee, Handshake, Leaf } from 'lucide-react'
import { AboutBadge } from './AboutBadge'

const principles = [
  {
    icon: Coffee,
    title: 'Designet for hygge',
    text: 'Vi vet at en sommerkveld kan bli kjølig og en høstdag krever ekstra varme. Derfor er produktene våre designet med en dyp forståelse for den norske livsstilen og behovet for å forlenge de sosiale, gode øyeblikkene utendørs.'
  },
  {
    icon: Award,
    title: 'Kompromissløs komfort',
    text: 'Kvalitet er en følelse. Vi velger materialer som er myke, funksjonelle og behagelige, slik at du kan slappe helt av og nyte stunden.'
  },
  {
    icon: Leaf,
    title: 'Et bevisst valg',
    text: 'I en verden av rask mote, fokuserer vi på tidløs design og solid håndverk som tåler å bli brukt igjen og igjen. Et Utekos-plagg er et bevisst valg for deg, og et mer ansvarlig valg for naturen vi alle setter pris på.'
  },
  {
    icon: Handshake,
    title: 'Mer utekos',
    text: 'Utekos handler for oss om å verdsette de rolige øyeblikkene: en kaffekopp på en kjølig morgen, en god samtale rundt bålpannen, eller en solnedgang fra terrassen.'
  }
]

export function AboutPrinciples() {
  return (
    <article className='w-full bg-card py-20 text-card-foreground sm:py-28'>
      <div className='mx-auto flex w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8'>
        <div className='mb-12 flex max-w-3xl flex-col items-start pt-6 pb-6 md:pt-8 lg:mb-16 lg:pt-10'>
          <AboutBadge className='mb-6'>Vårt DNA</AboutBadge>
          <h2 className='font-google-sans text-left font-sans text-4xl leading-tight font-bold text-inherit sm:text-5xl'>
            Kjernen i alt vi gjør
          </h2>
          <p className='mt-6 max-w-prose text-left font-utekos-text-medium text-lg leading-relaxed text-inherit/90'>
            Fire ufravikelige prinsipper som sikrer at du alltid
            får den opplevelsen du fortjener.
          </p>
        </div>

        <div className='grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:gap-8'>
          {principles.map(item => (
            <article
              key={item.title}
              className='flex min-w-0 shrink-0 flex-col bg-muted/40 p-2'
            >
              <div className='flex h-full flex-col rounded-xl border border-border bg-background p-6 text-foreground shadow-sm sm:p-8 md:p-10'>
                <div className='mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5'>
                  <div className='flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground'>
                    <item.icon
                      aria-hidden='true'
                      className='size-6'
                      strokeWidth={1.8}
                    />
                  </div>
                  <h3 className='text-left font-sans font-utekos-text-medium text-xl leading-tight sm:text-2xl'>
                    {item.title}
                  </h3>
                </div>

                <p className='mt-auto max-w-prose text-left font-utekos-text text-base leading-relaxed text-foreground/90'>
                  {item.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </article>
  )
}
