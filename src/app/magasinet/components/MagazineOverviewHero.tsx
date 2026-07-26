import UtekosWordmark from '@/components/BrandComponents/utils/UtekosWordmark'

type MagazineOverviewHeroProps = { articleCount: number }

export function MagazineOverviewHero({
  articleCount
}: MagazineOverviewHeroProps) {
  return (
    <article className='bg-muted py-10 text-foreground sm:py-14'>
      <div className='container mx-auto px-4'>
        <div className='max-w-5xl'>
          <span className='inline-flex items-center rounded-2xl bg-magazine-article-card px-5 py-3.5 font-utekos-text-medium text-xl leading-none tracking-[-0.01em] text-white drop-shadow-lg/50 sm:px-6 sm:py-4 sm:text-2xl'>
            <span className='inline-flex items-center gap-1 sm:gap-1.5'>
              <span>Magasinet for</span>
              <span
                className='inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 sm:px-6 sm:py-3'
                aria-hidden='true'
              >
                <UtekosWordmark className='h-5 w-auto text-white sm:h-6' />
              </span>
              <span className='sr-only'>Utekos</span>
            </span>
          </span>
          <h1 className='font-google-sans mt-7 max-w-4xl font-sans text-5xl leading-[0.9] font-bold text-balance sm:text-6xl lg:text-7xl'>
            Inspirasjon for gode stunder ute
          </h1>
          <p className='mt-6 max-w-3xl text-xl text-foreground/86 sm:text-2xl'>
            Guider, råd og historier for deg som vil forlenge
            sesongen på hytten, terrassen, båten eller i bobilen
            med varme, komfort og mer tid ute.
          </p>
          <p className='mt-8 text-sm leading-4 text-foreground/80'>
            {articleCount} publiserte artikler
          </p>
        </div>
      </div>
    </article>
  )
}
