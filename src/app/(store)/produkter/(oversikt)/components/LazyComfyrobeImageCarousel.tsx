'use client'

import dynamic from 'next/dynamic'
import { LoadWhenVisible } from '@/components/utils/LoadWhenVisible'

const ComfyrobeImageCarousel = dynamic(
  () => import('./ComfyrobeImageCarousel').then(module => module.ComfyrobeImageCarousel),
  {
    ssr: false,
    loading: () => (
      <div
        className='mx-auto aspect-square size-full rounded-[1.35rem] bg-background/45'
        aria-hidden='true'
      />
    )
  }
)

const fallback = (
  <div
    className='mx-auto aspect-square size-full rounded-[1.35rem] bg-background/45'
    aria-hidden='true'
  />
)

export function LazyComfyrobeImageCarousel() {
  return (
    <LoadWhenVisible fallback={fallback}>
      <ComfyrobeImageCarousel />
    </LoadWhenVisible>
  )
}
