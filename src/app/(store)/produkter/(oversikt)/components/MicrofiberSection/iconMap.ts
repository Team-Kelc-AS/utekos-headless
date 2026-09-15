import { CloudDrizzle, Feather, WashingMachine } from 'lucide-react'

export const iconMap = {
  'cloud-drizzle': CloudDrizzle,
  'washing-machine': WashingMachine,
  'feather': Feather
}

export type IconName = keyof typeof iconMap
