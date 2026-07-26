import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import UtekosWordmark from '@/components/BrandComponents/utils/UtekosWordmark'

const STAR_POSITIONS = [
  { top: 8, left: 12 },
  { top: 18, left: 78 },
  { top: 26, left: 34 },
  { top: 39, left: 91 },
  { top: 47, left: 56 },
  { top: 58, left: 21 }
] as const

export function ProductsPageHeader() {
  return (
    <header className='relative left-[calc(-50vw+50%)] mb-12 w-screen overflow-hidden bg-[radial-gradient(circle_at_top,color-mix(in_oklab,var(--sidebar-primary)_28%,transparent),transparent_44%),linear-gradient(180deg,color-mix(in_oklab,var(--sidebar)_88%,black)_0%,color-mix(in_oklab,var(--background)_96%,black)_100%)] pt-12 pb-16'>
      <div className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
        <div className='motion-grid absolute inset-0 bg-[linear-gradient(to_right,rgba(245,243,239,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(245,243,239,0.045)_1px,transparent_1px)] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-size-[32px_32px]' />

        <div className='absolute top-0 left-1/2 h-200 w-250 -translate-x-1/2 opacity-30 mix-blend-screen'>
          <div
            className='motion-spotlight size-full bg-linear-to-b from-sidebar-primary via-primary/20 to-transparent blur-[120px] will-change-transform'
            style={{ transform: 'translate(0, 0)' }}
          />
        </div>

        <div className='absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-foreground/30 to-transparent' />

        {STAR_POSITIONS.map((position, i) => (
          <div
            key={i}
            className='motion-star absolute h-1 w-1 animate-pulse rounded-full bg-foreground opacity-16'
            style={{
              top: `${position.top}%`,
              left: `${position.left}%`,
              boxShadow: '0 0 10px rgba(245,243,239,0.42)'
            }}
          />
        ))}
      </div>

      <div className='relative z-10 container mx-auto px-4 text-center'>
        <div className='motion-badge mb-8 inline-flex items-center justify-center'>
          <BrandBadge
            backgroundColor='var(--primary)'
            textColor='var(--primary-foreground)'
            className='group relative rounded-lg border border-primary-foreground/18 bg-primary px-5 py-2.5 shadow-[0_14px_32px_-24px_rgba(8,10,24,0.62)] sm:px-6 sm:py-3'
          >
            <span className='absolute inset-0 overflow-hidden rounded-lg bg-primary'>
              <span className='absolute top-0 -left-full size-full skew-x-12 bg-linear-to-r from-transparent via-primary-foreground/25 to-transparent transition-all duration-1000 group-hover:left-full' />
            </span>
            <UtekosWordmark
              className='relative z-10 h-auto w-24.5 sm:w-28'
              style={{ color: 'var(--primary-foreground)' }}
            />
          </BrandBadge>
        </div>

        <h1 className='perspective-1000 font-google-sans mx-auto max-w-5xl font-sans text-3xl font-bold text-foreground sm:text-5xl md:text-7xl'>
          <span className='block overflow-hidden'>
            <span className='motion-title-line block'>
              Kolleksjonen for
            </span>
          </span>
          <span className='block overflow-hidden pt-0.5'>
            <span className='motion-title-line block py-0.5 font-sans leading-tight text-foreground'>
              kompromissløs komfort
            </span>
          </span>
        </h1>

        <p className='motion-desc /95 mx-auto mt-4 max-w-3xl text-lg leading-normal text-foreground/95 md:text-xl'>
          Vi har{' '}
          <span className='relative inline-block font-medium text-foreground'>
            redefinert
            <span className='motion-underline dark:bg-dark-primary absolute bottom-0 left-0 h-0.5 w-full origin-left bg-primary' />
          </span>{' '}
          utekosen gjennom teknologi og funksjonalitet.
          <br className='hidden md:block' />
          Utforsk vår kolleksjon og{' '}
          <span className='relative inline-block px-1'>
            <span className='motion-highlight absolute inset-0 origin-left -skew-x-6 rounded bg-sidebar-primary/35' />
            <span className='relative z-10 font-medium text-foreground'>
              skreddersy
            </span>
          </span>{' '}
          din egen varme.
        </p>
      </div>

      <div className='dark:from-dark-background dark:via-dark-background/80 pointer-events-none absolute right-0 bottom-0 left-0 h-32 bg-linear-to-t from-background via-background/80 to-transparent' />
    </header>
  )
}
