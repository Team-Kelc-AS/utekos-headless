import { Feather, ShieldCheck } from 'lucide-react'
import { ArrowsCollapseIcon, SettingsIcon } from '@/components/utekos-icons'
export type IconName = keyof typeof iconMap
export const iconMap = {
  'minimize-2': ArrowsCollapseIcon,
  'feather': Feather,
  'shield-check': ShieldCheck,
  'settings-2': SettingsIcon
}
