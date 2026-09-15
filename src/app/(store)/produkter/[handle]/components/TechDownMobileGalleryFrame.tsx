import type { ReactNode } from 'react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import UtekosWordmark from '@/components/BrandComponents/utils/UtekosWordmark'
import { TechDownGalleryJusterFormNyt } from './TechDownGalleryJusterFormNyt'

type TechDownMobileGalleryFrameProps = {
  children: ReactNode
}

export function TechDownMobileGalleryFrame({
  children
}: TechDownMobileGalleryFrameProps) {
  return (
    <div className='-mx-4 bg-primary px-5 pt-4 pb-3'>
      <AspectRatio ratio={910 / 1450} className='w-full'>
        <div className='relative isolate size-full overflow-hidden bg-primary'>
          {children}
          <div className='pointer-events-none absolute right-4 bottom-[calc(118/1450*100%+1rem)] z-10'>
            <TechDownGalleryJusterFormNyt />
          </div>
          <div className='absolute inset-x-0 bottom-0 z-20 flex h-[calc(118/1450*100%)] items-center px-2'>
            <UtekosWordmark className='h-3.5 w-auto text-foreground' />
          </div>
        </div>
      </AspectRatio>
    </div>
  )
}
