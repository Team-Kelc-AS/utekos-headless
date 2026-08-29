import TechDownMobImage from '@/assets/images/techdown/UtekosTechDownMob.webp'
import TechDownKateKikkertImage from '@/assets/images/techdown/TechDown-Kyst-W-1600x1600.webp'
import TechDownFullLengthMobileImage from '@/assets/images/techdown/TechDown-1080x1350-2.webp'
import TechDownFullLengthDesktopImage from '@/assets/images/techdown/TechDown-1200x1200-4.webp'
import type { StaticImageData } from 'next/image'
import type { ThreeModeSceneId } from '../data/skreddersyVarmenPageModel'

type ThreeModeSceneAsset = {
  desktop: StaticImageData
  mobile: StaticImageData
  objectFit: 'contain' | 'cover'
}

export const THREE_MODE_SCENE_ASSETS: Record<
  ThreeModeSceneId,
  ThreeModeSceneAsset
> = {
  fullengde: {
    mobile: TechDownFullLengthMobileImage,
    desktop: TechDownFullLengthDesktopImage,
    objectFit: 'cover'
  },
  oppjustert: {
    mobile: TechDownMobImage,
    desktop: TechDownMobImage,
    objectFit: 'cover'
  },
  parkas: {
    mobile: TechDownKateKikkertImage,
    desktop: TechDownKateKikkertImage,
    objectFit: 'cover'
  }
}
