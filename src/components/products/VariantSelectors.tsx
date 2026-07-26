// Path: src/components/products/VariantSelectors.tsx
'use client'

import { Button } from '@/components/ui/button'
import type {
  ShopifyProduct,
  ShopifyProductVariant
} from 'types/product'
import { cn } from '@/lib/utils/className'

interface VariantSelectorsProps {
  product: ShopifyProduct
  selectedVariant: ShopifyProductVariant
  onUpdateVariant: (optionName: string, value: string) => void
}

export function VariantSelectors({
  product,
  selectedVariant,
  onUpdateVariant
}: VariantSelectorsProps) {
  return (
    <div className='space-y-6'>
      {product.options
        .filter(option => option.name !== 'Kjønn')
        .map(option => {
          const isColorOption =
            option.name === 'Farge' || option.name === 'Color'
          const currentSelectedValue =
            selectedVariant.selectedOptions.find(
              selected => selected.name === option.name
            )?.value

          if (option.optionValues.length === 1) {
            return (
              <div key={option.name} className='space-y-2'>
                <h3 className='font-utekos-text-medium text-sm tracking-wide text-foreground uppercase'>
                  {option.name}
                </h3>
                <p className='flex items-center gap-2 text-base font-medium text-foreground'>
                  {isColorOption && (
                    <span
                      aria-hidden='true'
                      className='size-3 rounded-full border border-foreground/35 bg-havdyp shadow-[0_0_0_2px_color-mix(in_oklab,var(--foreground)_12%,transparent)]'
                    />
                  )}
                  {currentSelectedValue}
                </p>
              </div>
            )
          }

          return (
            <div key={option.name} className='space-y-3'>
              <h3 className='font-utekos-text-medium text-sm tracking-wide text-foreground uppercase'>
                {option.name}
              </h3>

              <div className='flex flex-wrap gap-2'>
                {option.optionValues.map(({ name: value }) => {
                  const isActive = currentSelectedValue === value

                  return (
                    <Button
                      key={value}
                      variant={isActive ? 'outline' : 'default'}
                      onClick={() =>
                        onUpdateVariant(option.name, value)
                      }
                      className={cn(
                        'rounded-lg px-6 py-2.5 text-sm transition-all duration-200 hover:scale-105 active:scale-95',
                        isActive ?
                          'border-foreground bg-foreground text-background shadow-md hover:bg-foreground/90 hover:text-background'
                        : 'text-primary-foreground hover:border-transparent'
                      )}
                      aria-pressed={isActive}
                      aria-label={`Velg ${option.name} ${value}`}
                    >
                      {isColorOption && (
                        <span
                          aria-hidden='true'
                          className='size-3 rounded-full border border-background/25 bg-havdyp shadow-[0_0_0_2px_color-mix(in_oklab,var(--foreground)_35%,transparent)]'
                        />
                      )}
                      {value}
                    </Button>
                  )
                })}
              </div>
            </div>
          )
        })}
    </div>
  )
}
