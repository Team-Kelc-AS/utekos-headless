import {
  getImageProps,
  type StaticImageData
} from 'next/image'

const COMFYROBE_TABLET_MEDIA = '(min-width: 51rem)'
const COMFYROBE_DESKTOP_MEDIA =
  '(min-width: 85.0625rem)'

type ComfyrobeResponsiveImageProps = {
  alt: string
  mobileSrc: StaticImageData
  tabletSrc: StaticImageData
  desktopSrc: StaticImageData
  sizes: string
  className?: string
  eager?: boolean
  quality?: number
}

function joinClassNames(
  ...classNames: Array<string | undefined>
): string {
  return classNames
    .filter(
      (className): className is string =>
        Boolean(className)
    )
    .join(' ')
}

export function ComfyrobeResponsiveImage({
  alt,
  mobileSrc,
  tabletSrc,
  desktopSrc,
  sizes,
  className,
  eager = false,
  quality = 75
}: ComfyrobeResponsiveImageProps) {
  const sharedImageProps = {
    alt,
    sizes,
    quality
  }

  const {
    props: { srcSet: desktopSrcSet }
  } = getImageProps({
    ...sharedImageProps,
    src: desktopSrc
  })

  const {
    props: { srcSet: tabletSrcSet }
  } = getImageProps({
    ...sharedImageProps,
    src: tabletSrc
  })

  const { props: mobileImageProps } = getImageProps({
    ...sharedImageProps,
    src: mobileSrc,
    ...(eager ?
      {
        loading: 'eager' as const,
        fetchPriority: 'high' as const
      }
    : {
        loading: 'lazy' as const
      })
  })

  return (
    <picture className='absolute inset-0 block'>
      <source
        media={COMFYROBE_DESKTOP_MEDIA}
        srcSet={desktopSrcSet}
        sizes={sizes}
      />

      <source
        media={COMFYROBE_TABLET_MEDIA}
        srcSet={tabletSrcSet}
        sizes={sizes}
      />

      {/* getImageProps provides Next.js-optimized src and srcSet. */}
      <img
        {...mobileImageProps}
        alt={alt}
        className={joinClassNames(
          'absolute inset-0 size-full',
          className
        )}
      />
    </picture>
  )
}