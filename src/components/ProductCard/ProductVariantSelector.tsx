// Path: src/components/ProductCard/ProductVariantSelector.tsx

import { SizeLabel } from '@/components/ProductCard/SizeLabel'
import { variantSwatchButtonClassName } from '@/components/ProductCard/ProductColorSwatches'
import { InlineText } from '@/components/typography/TypographyInlineText'
import { cn } from '@/lib/utils/className'
import type { ProductVariantSelectorProps } from '@types'

type ProductVariantSelectorViewProps =
  ProductVariantSelectorProps & { compactMobile?: boolean }

const sizeOptionClassName =
  'btn-variant-option inline-flex min-h-9 w-18 shrink-0 touch-manipulation items-center justify-center rounded-md border px-2 py-1.5 text-sm leading-none font-medium whitespace-nowrap motion-safe:transition-colors motion-safe:duration-200 hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-card-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none'

const selectedSizeOptionClassName =
  'border-card-foreground bg-transparent text-card-foreground'

const unselectedSizeOptionClassName =
  'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/85'

export function ProductVariantSelector({
  options,
  selectedOptions,
  onOptionChange,
  colorHexMap,
  compactMobile = false
}: ProductVariantSelectorViewProps) {
  return (
    <>
      {options
        .filter(option => option.name.toLowerCase() !== 'kjønn')
        .map(option => {
          const optionName = option.name.toLowerCase()
          const isSizeOption =
            optionName === 'størrelse' || optionName === 'size'
          const isColorOption =
            optionName === 'farge' || optionName === 'color'
          const visibleOptionValues =
            isSizeOption ?
              option.optionValues.filter(
                value =>
                  value.name.toLocaleLowerCase('nb-NO') !==
                  'ekstra stor'
              )
            : option.optionValues

          return (
            <div
              key={option.name}
              className={cn(
                compactMobile && isSizeOption ?
                  'flex flex-col gap-0 md:contents'
                : 'contents'
              )}
            >
              {!isSizeOption ?
                <InlineText
                  className={cn(
                    'font-sans font-utekos-text-medium text-sm tracking-wide text-card-foreground uppercase',
                    compactMobile && 'text-[0.68rem] md:text-sm'
                  )}
                >
                  {option.name}
                </InlineText>
              : null}

              <div
                role='group'
                aria-label={option.name}
                className={cn(
                  isSizeOption ?
                    'grid w-full grid-cols-3 items-center gap-2'
                  : 'flex flex-wrap items-center gap-2',
                  compactMobile && 'gap-1 md:gap-2'
                )}
              >
                {isColorOption ?
                  visibleOptionValues.map(value => {
                    const colorCode = colorHexMap.get(value.name)
                    if (!colorCode) return null

                    const isSelected =
                      selectedOptions[option.name] === value.name

                    return (
                      <button
                        type='button'
                        key={value.name}
                        onClick={event => {
                          event.preventDefault()
                          event.stopPropagation()
                          onOptionChange(previousOptions => ({
                            ...previousOptions,
                            [option.name]: value.name
                          }))
                        }}
                        className={cn(
                          variantSwatchButtonClassName,
                          isSelected ?
                            'border-card-foreground ring-2 ring-card-foreground ring-offset-1 ring-offset-card'
                          : 'border-card-foreground/70 hover:border-card-foreground hover:ring-2 hover:ring-card-foreground/70'
                        )}
                        style={{
                          backgroundColor: colorCode,
                          outlineColor: 'var(--card-foreground)'
                        }}
                        title={value.name}
                        aria-label={`Velg farge ${value.name}`}
                        aria-pressed={isSelected}
                      />
                    )
                  })
                : visibleOptionValues.map(value => {
                    const isSelected =
                      selectedOptions[option.name] === value.name

                    return (
                      <button
                        type='button'
                        aria-pressed={isSelected}
                        key={value.name}
                        onClick={event => {
                          event.preventDefault()
                          event.stopPropagation()
                          onOptionChange(previousOptions => ({
                            ...previousOptions,
                            [option.name]: value.name
                          }))
                        }}
                        className={cn(
                          sizeOptionClassName,
                          isSizeOption && 'w-full min-w-0',
                          compactMobile &&
                            'min-h-11 py-1 text-[0.68rem] md:min-h-10 md:text-sm xl:min-h-9 xl:py-1.5',
                          isSelected ?
                            selectedSizeOptionClassName
                          : unselectedSizeOptionClassName
                        )}
                      >
                        <InlineText>{value.name}</InlineText>
                      </button>
                    )
                  })
                }
              </div>

              {isSizeOption ?
                <SizeLabel
                  className={cn(
                    'dark:focus-visible:outline-dark-card-foreground text-card-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card-foreground',
                    compactMobile &&
                      '!text-[0.68rem] max-md:min-h-11 md:!text-sm'
                  )}
                />
              : null}
            </div>
          )
        })}
    </>
  )
}
