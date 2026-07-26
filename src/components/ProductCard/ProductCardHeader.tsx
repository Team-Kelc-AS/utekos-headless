import { CardHeader, CardTitle } from '@/components/ui/card'
import type { ProductCardHeaderProps } from '@types'
import { cn } from '@/lib/utils/className'
import Link from 'next/link'
import { ProductColorSwatches } from './ProductColorSwatches'
import { ProductVariantSelector } from './ProductVariantSelector'
import { H3 } from '@/components/typography/TypographyH3'
import { InlineText } from '@/components/typography/TypographyInlineText'

type ProductCardHeaderViewProps = ProductCardHeaderProps & {
  compactMobile?: boolean
}

export function ProductCardHeader({
  title,
  options,
  colorHexMap,
  selectedOptions,
  onOptionChange,
  price,
  productUrl,
  onViewProduct,
  compactMobile = false
}: ProductCardHeaderViewProps) {
  const colorOption = options.find(option => {
    const optionName = option.name.toLowerCase()

    return optionName === 'farge' || optionName === 'color'
  })
  const optionsWithoutColor = options.filter(option => {
    const optionName = option.name.toLowerCase()

    return optionName !== 'farge' && optionName !== 'color'
  })
  const productViewClickProps =
    onViewProduct ? { onClick: onViewProduct } : {}

  return (
    <CardHeader
      className={cn(
        'flex grow flex-col gap-3 rounded-t-xl border-t border-border p-6 pb-4',
        compactMobile && 'p-2 pb-2 md:p-6 md:pb-4'
      )}
    >
      <div
        className={cn(
          'grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-4',
          compactMobile && 'gap-1.5 md:gap-4'
        )}
      >
        <Link
          href={productUrl}
          {...productViewClickProps}
          title={title}
          className={cn(
            'dark:focus-visible:outline-dark-card-foreground w-full min-w-0 rounded-sm font-utekos-text-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card-foreground'
          )}
        >
          <CardTitle
            className={cn(
              'text-card-foreground',
              compactMobile && 'text-card-foreground'
            )}
          >
            <H3
              className={cn(
                'truncate pb-0 font-utekos-text-medium text-xl leading-8 text-card-foreground',
                compactMobile &&
                  'text-[0.82rem] leading-5 md:text-xl md:leading-8'
              )}
            >
              {title}
            </H3>
          </CardTitle>
        </Link>

        {colorOption && (
          <ProductColorSwatches
            colorOption={colorOption}
            colorHexMap={colorHexMap}
            selectedOptions={selectedOptions}
            onOptionChange={onOptionChange}
            {...(compactMobile ?
              {
                className: 'justify-self-end gap-1 md:gap-2',
                swatchClassName: '!size-5 md:!size-8'
              }
            : { className: 'justify-self-end' })}
          />
        )}
      </div>
      <InlineText
        className={cn(
          'font-google-sans text-2xl leading-none font-bold text-card-foreground',
          compactMobile && 'text-base md:text-2xl'
        )}
      >
        {price}
      </InlineText>
      <ProductVariantSelector
        options={optionsWithoutColor}
        colorHexMap={colorHexMap}
        selectedOptions={selectedOptions}
        onOptionChange={onOptionChange}
        compactMobile={compactMobile}
      />
    </CardHeader>
  )
}
