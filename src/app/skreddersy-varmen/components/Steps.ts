import TechDownMobImage from '@/assets/images/techdown/UtekosTechDownMob.webp'
import TechDownKateKikkertImage from '@/assets/images/techdown/TechDown-Kyst-W-1600x1600.webp'
import TechDownFullLengthMobileImage from '@/assets/images/techdown/TechDown-1080x1350-2.webp'
import type { StaticImageData } from 'next/image'
import type { ThreeModeSceneId } from '../data/skreddersyVarmenPageModel'

type ThreeModeSceneAsset = {
  src: StaticImageData
  objectFit: 'contain' | 'cover'
  objectPosition?: string
}

export const THREE_MODE_SCENE_ASSETS: Record<
  ThreeModeSceneId,
  ThreeModeSceneAsset
> = {
  fullengde: {
    src: TechDownFullLengthMobileImage,
    objectFit: 'cover',
    objectPosition: 'center center'
  },
  oppjustert: {
    src: TechDownMobImage,
    objectFit: 'cover',
    objectPosition: 'center center'
  },
  parkas: {
    src: TechDownKateKikkertImage,
    objectFit: 'cover',
    objectPosition: 'center center'
  }
}
