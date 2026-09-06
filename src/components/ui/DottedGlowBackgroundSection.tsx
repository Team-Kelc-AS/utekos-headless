import { DottedGlowBackground } from '@/components/ui/DottedGlowBackground'

export function DottedGlowBackgroundSection() {
  return (
    <div className='relative mx-auto flex w-full max-w-7xl items-center justify-center'>
      <DottedGlowBackground
        className='pointer-events-none mask-radial-to-90% mask-radial-at-center opacity-70'
        opacity={0.9}
        gap={10}
        radius={1.8}
        colorLightVar='--color-foreground'
        glowColorLightVar='--color-secondary'
        colorDarkVar='--color-foreground'
        glowColorDarkVar='--color-secondary'
        backgroundOpacity={0}
        speedMin={0.3}
        speedMax={1.6}
        speedScale={1}
      />

      <div className='relative z-10 flex w-full flex-col items-center justify-between space-y-6 px-8 py-16 text-center md:flex-row'>
        <div>
          <h2 className='text-center text-4xl font-normal tracking-tight text-foreground sm:text-5xl md:text-left'>
            Klar til å kjøpe{' '}
            <span className='font-google-sans font-bold'>
              Utekos
            </span>
            ?
          </h2>
          <p className='mt-4 max-w-lg text-center text-base text-muted md:text-left'>
            Utekos er designet for å gi deg den beste opplevelsen
            mulig når du er ute. Vi har utviklet en helt ny
            kategori av personlig komfort.
          </p>
        </div>
        <div className='flex flex-col gap-4 sm:flex-row'>
          <button className='inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-8 py-3 text-sm font-medium text-neutral-700 shadow-sm transition-all duration-200 hover:bg-neutral-50 hover:shadow-md'>
            Se priser
          </button>
        </div>
      </div>
    </div>
  )
}
