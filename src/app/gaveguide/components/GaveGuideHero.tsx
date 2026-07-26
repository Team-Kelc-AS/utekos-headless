import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'

export function GaveGuideHero() {
  return (
    <article className='dark:border-dark-background/20 dark:bg-dark-foreground dark:text-dark-background border-b border-background/20 bg-foreground py-24 text-center text-background'>
      <div className='container mx-auto px-4'>
        <UtekosBreadcrumbBar
          embedded
          surface='transparent'
          className='mb-6 justify-center'
          listClassName='justify-center'
          items={[
            { label: 'Hjem', href: '/' },
            { label: 'Gaveguiden' }
          ]}
        />
        <p
          data-nosnippet
          className='dark:text-dark-background mb-2 font-utekos-text-medium text-background'
        >
          Gaveguiden
        </p>
        <h1 className='font-google-sans text-4xl font-bold sm:text-5xl lg:text-6xl'>
          Gaven som varmer. Lenge.
        </h1>
        <p className='dark:text-dark-background mx-auto mt-6 max-w-2xl text-xl text-background'>
          Gi bort kompromissløs komfort, kvalitetstid og utallige
          #utekosøyeblikk. Perfekt for den som har alt, men som
          fortjener det aller beste.
        </p>
      </div>
    </article>
  )
}
