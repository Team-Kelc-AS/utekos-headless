import { H1 } from '@/components/typography/TypographyH1'

export function ProductSpecPageHeader() {
  return (
    <header className='mx-auto max-w-4xl bg-jungle px-4 text-left'>
      <H1 Text='Kvalitet i hver fiber' ID='ProductSpecHeader' />
      <div className='my-2'></div>
      <p className='font-utekos-text text-xl'>
        Vi er kompromissløse i våre materialvalg fordi vi vet at
        ekte utekos starter med total komfort. Her kan du
        utforske funksjonaliteten og teknologien som
        revolusjonerer utendørsopplevelsen.
      </p>
    </header>
  )
}
