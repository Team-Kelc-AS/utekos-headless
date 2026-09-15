import { iconMap, type IconName } from './iconMap'

export function IconRenderer({
  name,
  className
}: {
  name: IconName
  className?: string
}) {
  const Icon = iconMap[name]
  return Icon ? <Icon className={className} aria-hidden='true' /> : null
}
