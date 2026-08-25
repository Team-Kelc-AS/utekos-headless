import * as React from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils/className'

const buttonVariants = cva(
  'group/button focus-visible:border-dark-ring focus-visible:ring-dark-ring/50 aria-invalid:border-dark-destructive aria-invalid:ring-dark-destructive/20 aria-invalid:border-dark-destructive/50 aria-invalid:ring-dark-destructive/40 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
        variant: {
          'utekos':
            'bg-primary text-foreground hover:opacity-60 rounded-2xl',
        },
      size: {
        'default':
          'h-9 gap-1.5 px-3 in-data-[slot=utekos button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        'xs': 'h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*="size-"])]:size-3',
        'sm': 'h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5',
        'lg': 'h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        'icon': 'size-9',
        'icon-xs':
          'size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*="size-"])]:size-3',
        'icon-sm':
          'size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg',
        'icon-lg': 'size-10'
      }
    },
    defaultVariants: { variant: 'utekos', size: 'default' }
  }
)

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }

function Button({
  asChild = false,
  className,
  children,
  nativeButton,
  variant = 'utekos',
  size = 'icon',
  ...props
}: ButtonProps) {
  const buttonClassName = cn(
    buttonVariants({ variant, size, className })
  )

  if (asChild && React.isValidElement(children)) {
    const child = React.Children.only(
      children
    ) as React.ReactElement<{ className?: string }>

    return React.cloneElement(child, {
      ...(props as Record<string, unknown>),
      'data-slot': 'button',
      'className': cn(buttonClassName, child.props.className)
    } as React.Attributes & {
      'className'?: string
      'data-slot': string
    })
  }

  return (
    <ButtonPrimitive
      data-slot='button'
      className={buttonClassName}
      nativeButton={nativeButton}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  )
}

function AddToCartButton() {
  return (
    <Button
      className={cn(
        'font-google-sans transform rounded-full px-12 py-4 font-utekos-text font-bold tracking-normal transition-colors duration-200 hover:scale-105'
      )}
    >
      Legg i handlekurv
    </Button>
  )
}

function CheckoutButton() {
  return (
    <Button
      className={cn(
        'bg-primary text-foreground hover:opacity-60 rounded-2xl',
        'transform rounded-full px-12 py-4 font-sans tracking-normal transition-colors duration-200 hover:scale-105'
      )}
    >
      Gå til kassen
    </Button>
  )
}

function UtekosButton() {
  return (
    <Button
      className={cn(
        'bg-primary text-foreground hover:opacity-60 rounded-2xl',
        'transform rounded-full px-12 py-4 font-sans tracking-normal transition-colors duration-200 hover:scale-105'
      )}
        variant='utekos'
        size='default'
    >
      Utekos  
    </Button>
  )
}

export {
  Button,
  buttonVariants,
  AddToCartButton,
  CheckoutButton,
  UtekosButton
}
