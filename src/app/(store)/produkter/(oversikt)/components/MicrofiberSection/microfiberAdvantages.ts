import type { IconName } from './iconMap'

export const microfiberAdvantages: {
  icon: IconName
  title: string
  description: string
  color: string
}[] = [
  {
    icon: 'cloud-drizzle',
    title: 'Overlegen i fuktig Vær',
    description: 'Beholder isolasjonsevnen og varmen selv når den blir våt.',
    color: 'text-sky-800'
  },
  {
    icon: 'washing-machine',
    title: 'Enkelt vedlikehold',
    description:
      'Tørker raskt og er enkel å vaske uten å bekymre seg for klumping.',
    color: 'text-slate-200'
  },
  {
    icon: 'feather',
    title: 'Allergivennlig og vegansk',
    description: 'Et 100 % dunfritt alternativ som er trygt for alle.',
    color: 'text-teal-400'
  }
]
