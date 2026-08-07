import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/className'

const badgeVariants = cva(
  'group/badge dark:focus-visible:border-dark-ring dark:focus-visible:ring-dark-ring/50 dark:aria-invalid:border-dark-destructive dark:aria-invalid:ring-dark-destructive/20 dark:aria-invalid:ring-dark-destructive/40 inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        popover:
          'bg-popover text-foreground hover:scale-102 hover:bg-popover/80 dark:bg-popover',
        default:
          'dark:bg-dark-primary dark:[a]:hover:bg-dark-primary/80 bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        secondary:
          'dark:[a]:hover:bg-dark-secondary/80 bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
        promo: 'bg-badge py-6 px-6 font-utekos-text-medium tracking-normal text-foreground rounded-xl',
        destructive:
          'dark:bg-dark-destructive/10 dark:text-dark-destructive dark:focus-visible:ring-dark-destructive/20 dark:bg-dark-destructive/20 dark:focus-visible:ring-dark-destructive/40 dark:[a]:hover:bg-dark-destructive/20 bg-destructive/10 text-destructive focus-visible:ring-destructive/20 [a]:hover:bg-destructive/20',
        outline:
          'dark:bg-dark-background dark:[a]:hover:bg-dark-muted dark:[a]:hover:text-dark-muted-foreground border-border bg-background text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
        ghost:
          'dark:hover:bg-dark-muted dark:hover:text-dark-muted-foreground dark:hover:bg-dark-muted/50 hover:bg-muted hover:text-muted-foreground',
        link: 'dark:text-dark-primary text-primary underline-offset-4 hover:underline'
      }
    },
    defaultVariants: { variant: 'default' }
  }
)

function Badge({
  className,
  variant = 'default',
  render,
  ...props
}: useRender.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      { className: cn(badgeVariants({ variant }), className) },
      props
    ),
    render,
    state: { slot: 'badge', variant }
  })
}

export { Badge, badgeVariants }
