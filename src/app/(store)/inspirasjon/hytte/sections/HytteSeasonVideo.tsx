'use client'

import { useEffect, useRef } from 'react'

interface HytteSeasonVideoProps {
  src: string
}

export function HytteSeasonVideo({ src }: HytteSeasonVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current

    if (!video) {
      return
    }

    void video.play()
  }, [src])

  return (
    <video
      ref={videoRef}
      aria-hidden='true'
      autoPlay
      className='block size-full object-cover'
      height={1080}
      loop
      muted
      playsInline
      preload='auto'
      src={src}
      width={1920}
    >
      <source
        src={src}
        type='video/mp4'
      />
      Nettleseren din støtter ikke videoavspilling.
    </video>
  )
}
