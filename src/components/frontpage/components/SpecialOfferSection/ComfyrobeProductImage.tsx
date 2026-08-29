import { AspectRatio } from '@/components/ui/aspect-ratio'
import Image from 'next/image'
import type { ShopifyMediaImage } from 'types/media'

type ComfyrobeProductImageProps = { image: ShopifyMediaImage }

export function ComfyrobeProductImage({
  image
}: ComfyrobeProductImageProps) {
  return (
    <AspectRatio
      ratio={1 / 1}
      className='mx-auto w-full bg-transparent lg:aspect-auto! lg:h-full'
    >
      <Image
        src={image.image.url}
        alt={
          image.image.altText ||
          'Comfyrobe™ - Vanntett og vindtett robe'
        }
        height={image.image.height}
        width={image.image.width}
        className='mx-auto block size-full object-cover object-center brightness-[0.92] saturate-[0.92] transition-transform duration-700 motion-safe:hover:scale-[1.025]'
        sizes='(max-width: 1024px) 80vw, 40vw'
        quality={95}
        priority
      />
    </AspectRatio>
  )
}
