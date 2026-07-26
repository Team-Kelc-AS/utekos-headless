import Link from 'next/link'

export default function UtekosAdFrame() {
  return (
    <article className='grid min-h-[80vh] w-full grid-cols-1 overflow-hidden bg-(--brand-maritime) font-sans text-(--brand-light) md:grid-cols-12'>
      {/* TYPOGRAFI SOM ARKITEKTUR & MASSIV FARGEBLOKK (66% av skjermen)
        Her dominerer merkevarefargen og skrifttypen umiddelbart (Share of Screen).
      */}
      <div className='z-10 flex flex-col justify-between p-8 md:col-span-8 md:p-16 lg:p-24'>
        <header className='flex flex-col gap-6'>
          {/* Gigantisk, overdimensjonert typografi for umiddelbar gjenkjennelse i scrollen */}
          <h1 className='text-7xl leading-none font-black tracking-tighter break-words uppercase md:text-9xl'>
            Utekos
            <br />
            Original.
          </h1>
          <p className='max-w-2xl text-xl leading-relaxed font-medium opacity-90 md:text-3xl'>
            Norsk ekstremkomfort. Konstruert for å tåle
            elementene, designet for å dominere stillheten.
          </p>
        </header>

        {/* Kontrastmarkør / Call to action - Geometrisk og brutalistisk */}
        <div className='mt-12'>
          <Link
            href='/produkter/original'
            className='font-google-sans inline-flex items-center justify-center bg-(--brand-light) px-10 py-6 text-lg font-bold text-(--brand-maritime) transition-opacity hover:opacity-90 focus:ring-4 focus:ring-(--brand-light) focus:ring-offset-4 focus:outline-hidden md:text-xl'
            aria-label='Kjøp Utekos Original'
          >
            Utforsk Stadionjakken
          </Link>
        </div>
      </div>

      {/* MAKROFORMAT / "HERO PRODUCT" (33% av skjermen)
        Fastlåst proporsjon som alltid viser tekstur eller et massivt utsnitt.
      */}
      <figure className='relative min-h-[400px] w-full shrink-0 border-t-8 border-(--brand-light) bg-gray-200 md:col-span-4 md:h-full md:border-t-0 md:border-l-8'>
        {/* Bilde-placeholder. 
          Regel: Ikke vis hele jakken. Zoom inn på glidelåsen, CloudWeave-fyllet eller en strukturell søm slik at teksturen blir nesten abstrakt stor. 
        */}
        <div className='absolute inset-0 flex items-center justify-center bg-gray-300 p-8'>
          <span className='font-google-sans p-4 text-center font-bold text-gray-700'>
            [Makro-bilde av Stadionjakke-detalj]
          </span>
        </div>
      </figure>
    </article>
  )
}
