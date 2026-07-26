// Path: src/app/skreddersy-varmen/components/LandingPurchaseFallback.tsx

export function LandingPurchaseFallback() {
  return (
    <div className='bg-foreground-muted dark:text-dark-background w-full px-6 py-16 text-background'>
      <div className='dark:border-dark-background/12 dark:bg-dark-foreground mx-auto max-w-3xl rounded-sm border border-background/12 bg-foreground p-6 text-center shadow-sm'>
        <p className='font-google-sans font-sans text-xl font-bold'>
          Henter produktvalg
        </p>
        <p className='dark:text-dark-background/75 mt-2 text-sm leading-relaxed text-background/75'>
          Siden er klar, og kjøpsvalgene lastes inn.
        </p>
      </div>
    </div>
  )
}
