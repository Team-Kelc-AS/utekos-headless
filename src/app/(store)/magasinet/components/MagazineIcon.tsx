import { Anchor, BusFront, Coffee, Compass, Feather, Flame, Home, Layers, Leaf, Lightbulb, Map, Mountain, Shield, Sparkles, Sun, Thermometer, Waves } from 'lucide-react'
import type { ComponentType } from 'react'
import type { MagazineBlock } from '../types'
import { BoxOutlineIcon, CheckMarkIcon, HeartOutlineIcon, SealIcon } from '@/components/utekos-icons'

type MagazineIconName = NonNullable<
  Extract<MagazineBlock, { type: 'featureGrid' }>['items'][number]['icon']
>

type MagazineIconProps = {
  name?: MagazineIconName
  className?: string
}

const iconByName = {
  anchor: Anchor,
  badgeCheck: SealIcon,
  bus: BusFront,
  check: CheckMarkIcon,
  coffee: Coffee,
  compass: Compass,
  feather: Feather,
  flame: Flame,
  heart: HeartOutlineIcon,
  home: Home,
  layers: Layers,
  leaf: Leaf,
  lightbulb: Lightbulb,
  map: Map,
  mountain: Mountain,
  package: BoxOutlineIcon,
  shield: Shield,
  sparkles: Sparkles,
  sun: Sun,
  thermometer: Thermometer,
  waves: Waves
} satisfies Record<MagazineIconName, ComponentType<{ className?: string; 'aria-hidden'?: boolean }>>

export function MagazineIcon({ name = 'sparkles', className }: MagazineIconProps) {
  const Icon = iconByName[name]

  return <Icon className={className} aria-hidden />
}
