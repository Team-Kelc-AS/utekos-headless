import { CheckMarkIcon, MinusIcon } from '@/components/utekos-icons'

export const variantStyles = {
  do: {
    container:
      'border-primary/24 bg-card',
    iconWrap:
      'border-primary/30 bg-primary text-foreground',
    Icon: CheckMarkIcon
  },
  dont: {
    container:
      'border-foreground/12 bg-night/40',
    iconWrap:
      'border-foreground/18 bg-card  text-foreground',
    Icon: MinusIcon
  }
} as const
