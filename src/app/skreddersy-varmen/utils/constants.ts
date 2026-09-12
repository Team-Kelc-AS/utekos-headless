// Bytter fra generisk 'primary' til 'very-peri' for å gi fokus-ringer en lekker merkevare-look
export const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-very-peri'

// Justert til å passe perfekt inn i den lyse og rene kjøps-seksjonen
export const maritimePanelClass =
  'rounded-3xl border border-maritime-darkest/10 bg-white-sand p-5 text-maritime-darkest shadow-sm'

// Tynn, elegant delelinje i panelet
export const maritimePanelHeaderClass =
  'mb-3 border-b border-maritime-darkest/10 pb-3'

export const choiceGridClass = 'grid grid-cols-3 gap-2 sm:gap-3'

// Pillene får beholde formen sin, fargene på pillene styres allerede briljant i PurchaseClientViewLanding.tsx
// whitespace-nowrap + tettere mobil-padding/type: unngår linjebryting i grid-cols-3 på iPhone 12 (~390px)
export const choicePillClass =
  'inline-flex min-h-12 min-w-0 items-center justify-center whitespace-nowrap rounded-full px-1.5 py-2 text-center text-[10px] font-utekos-text-medium leading-none tracking-normal transition-all sm:px-4 sm:text-sm sm:leading-[1.15] md:text-base'
