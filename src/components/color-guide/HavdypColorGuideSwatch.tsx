import Image from 'next/image'
import maritimeBluePantone from '@/assets/images/color-guide/MARITIME_BLUE_PANTONE-19-3831_TCX.png'

export function HavdypColorGuideSwatch() {
  return (
    <figure className='col-start-2 row-start-1 mr-11 w-[5.75rem] self-start sm:w-[6.5rem]'>
      <div className='rounded-lg bg-white/25 p-1 shadow-[0_18px_36px_-22px_rgba(12,18,16,0.45)] ring-1 ring-night/10'>
        <div className='overflow-hidden rounded-[calc(0.5rem-2px)] bg-white'>
          <Image
            src={maritimeBluePantone}
            alt='PANTONE 19-3831 TCX Maritime Blue'
            sizes='(min-width: 640px) 104px, 92px'
            className='h-auto w-full'
            placeholder='blur'
          />
        </div>
      </div>
      <figcaption className='sr-only'>
        Offisiell PANTONE Cotton TCX-fargeprøve for 19-3831 Maritime
        Blue.
      </figcaption>
    </figure>
  )
}
