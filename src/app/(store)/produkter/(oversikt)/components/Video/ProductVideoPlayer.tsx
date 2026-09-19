'use client'

type ProductVideoPlayerProps = {
  className?: string
  src: string
  title?: string
}

export function ProductVideoPlayer({
  className = 'relative aspect-430/932 w-full overflow-hidden',
  src,
  title = 'Produktvideo som viser Utekos i bruk'
}: ProductVideoPlayerProps) {
  return (
    <div className={className}>
      <iframe
        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
        allowFullScreen
        className='absolute inset-0 size-full border-0'
        height='932'
        loading='lazy'
        referrerPolicy='strict-origin-when-cross-origin'
        src={src}
        title={title}
        width='430'
      />
    </div>
  )
}
