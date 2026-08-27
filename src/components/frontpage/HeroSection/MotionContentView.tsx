import { TypographyH2 } from '@/app/inspirasjon/components/typography/TypographyH2'
import { SeeMoreButton } from './SeeMoreButton'
import { Fragment } from 'react'
export function MotionContentView() {
  return (
    <Fragment>
      <h1 id='hero-h1' className='sr-only'>
        Skreddersy varmen
      </h1>
      <div className='w-full px-4 sm:px-0'>
        <TypographyH2 />

        <div
          data-nosnippet
          className='mt-7 flex justify-center sm:mt-9'
        >
          <SeeMoreButton />
       </div>
      </div>
    </Fragment>
  )
}
