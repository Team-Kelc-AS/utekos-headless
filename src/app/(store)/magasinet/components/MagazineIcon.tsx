import {
  Anchor,
  BadgeCheck,
  BusFront,
  Check,
  Coffee,
  Compass,
  Feather,
  Flame,
  Heart,
  Home,
  Layers,
  Leaf,
  Lightbulb,
  Map,
  Mountain,
  Package,
  Shield,
  Sparkles,
  Sun,
  Thermometer,
  Waves
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { MagazineBlock } from '../types'

type MagazineIconName = NonNullable<
  Extract<MagazineBlock, { type: 'featureGrid' }>['items'][number]['icon']
>

type MagazineIconProps = {
  name?: MagazineIconName
  className?: string
}

const iconByName = {
  anchor: Anchor,
  badgeCheck: BadgeCheck,
  bus: BusFront,
  check: Check,
  coffee: Coffee,
  compass: Compass,
  feather: Feather,
  flame: Flame,
  heart: Heart,
  home: Home,
  layers: Layers,
  leaf: Leaf,
  lightbulb: Lightbulb,
  map: Map,
  mountain: Mountain,
  package: Package,
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
