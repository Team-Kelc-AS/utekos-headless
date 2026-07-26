import { CompassIcon } from '@/components/animate-icons/icons/compass'
import { nbccUseCases } from '../utils/nbccLandingPageContent'
import { useCaseIcons } from '../utils/useCaseIcons'

export function NbccUseCasesSection() {
  return (
    <article className='relative overflow-hidden bg-[#f5efe4] px-4 py-20 text-[#17130f] sm:px-6 lg:px-8'>
      <div className='absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#17130f]/20 to-transparent' />
      <div className='mx-auto max-w-7xl'>
        <div
          data-nbcc-reveal
          data-nbcc-animate
          className='grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end'
        >
          <div>
            <p className='font-utekos-text-medium text-sm tracking-[0.18em] text-[#17130f] uppercase'>
              Campinglivet har mange former
            </p>
            <h2 className='mt-4 max-w-xl font-utekos-text-medium text-3xl tracking-normal text-balance sm:text-4xl'>
              Fra morgenkaffe til den siste praten i forteltet.
            </h2>
          </div>
          <p className='max-w-2xl text-base text-[#17130f] lg:justify-self-end'>
            For noen ligger den største gleden i friheten til å
            våkne til ny utsikt, for andre er det det trygge
            fellesskapet på fastplassen eller latteren rundt
            bordet på et regionstreff. Uansett hvor du slår leir,
            eller om du nyter roen på terrassen hjemme, er
            fellesnevneren den samme: De aller beste stundene
            skapes utendørs.
          </p>
        </div>

        <div className='mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {nbccUseCases.map((useCase, index) => {
            const Icon = useCaseIcons[index] ?? CompassIcon
            return (
              <article
                key={useCase.title}
                data-nbcc-reveal
                data-nbcc-animate
                className='rounded-lg border border-[#17130f]/10 bg-white/55 p-6 shadow-[0_1px_0_rgba(255,255,255,0.5)_inset]'
              >
                <Icon
                  size={28}
                  animateOnHover='default'
                  className='mb-5 text-[#6d4a20]'
                  aria-hidden
                />
                <h3 className='font-utekos-text-medium text-lg'>
                  {useCase.title}
                </h3>
                <p className='mt-3 text-sm leading-7 text-[#5a5046]'>
                  {useCase.description}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </article>
  )
}
