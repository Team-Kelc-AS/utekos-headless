import { CardHorizontalMorgenstund } from './CardHorizontalMorgenstund'
import { CardHorizontalUtsikt } from './CardHorizontalUtsikt'
import { CardHorizontalStjerneklarKveld } from './CardHorizontalStjerneklarKveld'
import { CardFastDelivery } from './CardFastDelivery'
import { CardHappyCustomers } from './CardHappyCustomers'
import { CardSafeShopping } from './CardSafeShopping'
import { CardTweetDemo } from './CardTweetDemo'
import { CardBottomImage } from '@/app/inspirasjon/components/cards/CardBottomImage'

export default function CardsPage() {
  return (
    <article className='container mx-auto px-4 py-16 sm:py-24'>
      <h1 className='font-google-sans text-2xl font-bold'>
        Cards
      </h1>
      <div className='container mx-auto grid max-w-7xl grid-cols-3 gap-4 px-4 py-16 sm:py-24'>
        <CardHorizontalMorgenstund />
        <CardHorizontalUtsikt />
        <CardHorizontalStjerneklarKveld />
      </div>
      <div className='container mx-auto grid max-w-7xl grid-cols-3 gap-4 px-4 py-16 sm:py-24'>
        <CardHappyCustomers />
        <CardSafeShopping />
        <CardFastDelivery />
      </div>
      <CardTweetDemo />
      <CardBottomImage />
    </article>
  )
}
