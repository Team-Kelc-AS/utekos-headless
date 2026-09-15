import { cacheLife, cacheTag } from 'next/cache'
import { VIDEO_EMBED_URL } from '@/constants'
import { ProductVideoPlayer } from './ProductVideoPlayer'

type TensorPixVideoCacheWrapperProps = {
  variant?: 'section' | 'embed'
}

export async function TensorPixVideoCacheWrapper({ variant = 'section' }: TensorPixVideoCacheWrapperProps) {
  'use cache'

  cacheTag('tensorpix-video', 'media')
  cacheLife('marketing')

  if (variant === 'embed') {
    return (
      <ProductVideoPlayer
        className='relative aspect-430/932 w-full max-w-[430px] overflow-hidden bg-background'
        src={VIDEO_EMBED_URL}
        title='Utekos produktvideo'
      />
    )
  }

  return <ProductVideoPlayer src={VIDEO_EMBED_URL} />
}
