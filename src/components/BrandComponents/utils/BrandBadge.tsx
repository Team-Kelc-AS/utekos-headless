import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils/className'
import {
  Children,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  cloneElement
} from 'react'
import type { LucideIcon } from 'lucide-react'
import { cva, type VariantProps } from '@/lib/utils/className'

const brandBadgeVariants = cva(
  'inline-flex items-center justify-center rounded-full px-8 py-4 text-lg leading-[1.35] tracking-[-0.01em] whitespace-nowrap drop-shadow-lg/50',
  {
    variants: {
      variant: { default: '' },
      tone: {
        'neutral':
          ' bg-card text-card-foreground',
        'promo':
          'bg-promo text-promo-foreground',
        'commerce-primary':
          'bg-commerce-primary text-commerce-primary-foreground hover:bg-commerce-primary-hover hover:text-commerce-primary-hover-foreground',
        'commerce-secondary':
          'bg-commerce-secondary text-commerce-secondary-foreground hover:bg-commerce-secondary-hover hover:text-commerce-secondary-hover-foreground',
        'featured':
          'bg-featured text-foreground',
        'custom':
          'bg-(--brand-badge-bg) text-(--brand-badge-text)'
      }
    },
    defaultVariants: { variant: 'default', tone: 'neutral' }
  }
)

interface BrandBadgeProps
  extends
    HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof brandBadgeVariants> {
  label?: string
  asChild?: boolean
  icon?: LucideIcon
  iconColor?: string
  children?: ReactNode
  bgColor?: string
  fgColor?: string
  /** Alias for `bgColor`; used by existing call sites. */
  backgroundColor?: string
  /** Alias for `fgColor`; used by existing call sites. */
  textColor?: string
  /**
   * @deprecated Use `tone` so surface and foreground remain auditable.
   */
  iconBorderColor?: string
}

export default function BrandBadge({
  label,
  icon: Icon,
  iconColor,
  asChild = false,
  variant = 'default',
  tone = 'neutral',
  className = '',
  bgColor,
  fgColor,
  backgroundColor,
  textColor,
  children,
  style,
  ...rest
}: BrandBadgeProps) {
  const resolvedBg = bgColor ?? backgroundColor
  const resolvedFg = fgColor ?? textColor
  const effectiveTone =
    resolvedBg || resolvedFg ? 'custom' : tone
  const mergedStyle = {
    ...style,
    '--brand-badge-bg': resolvedBg ?? 'var(--card)',
    '--brand-badge-text': resolvedFg ?? 'var(--card-foreground)'
  } as CSSProperties

  const iconClassName = cn(
    'size-4 shrink-0 sm:size-5 lg:size-6',
    iconColor ? `fill-${iconColor}` : 'currentColor'
  )
  const iconStyle = iconColor ? { color: iconColor } : undefined

  if (asChild) {
    const [resolvedChild] = Children.toArray(children).filter(
      child =>
        child !== null &&
        (typeof child !== 'string' || child.trim() !== '')
    )
    if (!resolvedChild) {
      return null
    }

    if (!isValidElement(resolvedChild)) {
      return null
    }

    const slotChild =
      Icon ?
        cloneElement(
          resolvedChild as React.ReactElement<
            { children?: ReactNode } & Record<string, unknown>
          >,
          {
            children: (
              <>
                <Icon
                  className={iconClassName}
                  style={iconStyle}
                  aria-hidden='true'
                />
                {
                  (
                    resolvedChild as React.ReactElement<
                      { children?: ReactNode } & Record<
                        string,
                        unknown
                      >
                    >
                  ).props.children
                }
              </>
            )
          }
        )
      : resolvedChild

    return (
      <Slot
        className={cn(
          brandBadgeVariants({ variant, tone: effectiveTone }),
          className
        )}
        style={mergedStyle}
        {...rest}
      >
        {slotChild}
      </Slot>
    )
  }

  return (
    <span
      className={cn(
        brandBadgeVariants({ variant, tone: effectiveTone }),
        className
      )}
      style={mergedStyle}
      {...rest}
    >
      {Icon ?
        <Icon
          className={iconClassName}
          style={iconStyle}
          aria-hidden='true'
        />
      : null}
      {children ?? label}
    </span>
  )
}
