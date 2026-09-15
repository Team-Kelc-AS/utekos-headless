// Path: src/app/skreddersy-varmen/utekos-orginal/utils/modes.ts

import type { StaticImageData } from 'next/image'
import { ArrowUpToLine, LayoutDashboard, Shield, type LucideIcon } from 'lucide-react'
import type { Mode } from '@types'
import mikrofiberWoodsDesktop from '@/assets/images/mikrofiber/Mikrofiber-Woods-1600x900.webp'
import aspectVideoJacket from '@/assets/images/gallery/aspect-video-jacket.png'
import aspectVideoParkas from '@/assets/images/gallery/aspect-video-parkas.png'
import classicBlueFull34 from '@/assets/images/gallery/classic-blue-full-3-4.png'
import classicBlueJacket34 from '@/assets/images/gallery/classic-blue-jacket-3-4.png'
import classicBlueParkas34 from '@/assets/images/gallery/classic-blue-parkas-3-4.png'


export const modes: {
  id: Mode
  title: string
  desc: string
  icon: LucideIcon
  mobileSrc: string | StaticImageData // 3:4 format (f.eks 1080x1440)
  desktopSrc: string | StaticImageData // 16:9 format
}[] = [
  {
    id: 'parkas',
    title: 'Parkas',
    desc: 'Klassisk passform for bevegelse og aktivitet.',
    icon: LayoutDashboard,
    mobileSrc: classicBlueParkas34,
    desktopSrc: aspectVideoParkas
  },
  {
    id: 'oppfestet',
    title: 'Oppfestet',
    desc: 'Maksimal mobilitet rundt leirplassen.',
    icon: ArrowUpToLine,
    mobileSrc: classicBlueJacket34,
    desktopSrc: aspectVideoJacket
  },
  {
    id: 'fulldekket',
    title: 'Kokong',
    desc: 'Total isolasjon fra topp til tå for rolig hygge.',
    icon: Shield,
    mobileSrc: classicBlueFull34,
    desktopSrc: mikrofiberWoodsDesktop
  }
]
