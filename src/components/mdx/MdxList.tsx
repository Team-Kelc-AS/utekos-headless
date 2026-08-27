import { cn } from '@/lib/utils'
import type { ComponentPropsWithoutRef } from 'react'

type MdxListProps =
  | ({ ordered: true } & ComponentPropsWithoutRef<'ol'>)
  | ({ ordered?: false } & ComponentPropsWithoutRef<'ul'>)

export function MdxList({
  ordered = false,
  className,
  ...props
}: MdxListProps) {
  const listClassName = cn(
    'grid max-w-[65ch] gap-3 pl-6 font-utekos-text text-base leading-relaxed text-foreground/82 marker:font-utekos-text-medium marker:text-primary sm:text-lg',
    ordered ? 'list-decimal' : 'list-disc',
    className
  )

  if (ordered) {
    return <ol className={listClassName} {...props} />
  }

  return <ul className={listClassName} {...props} />
}
