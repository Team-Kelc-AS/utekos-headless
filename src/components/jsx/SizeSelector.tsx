import Link from 'next/link'
import { Check } from 'lucide-react'
import { useRef, useState } from 'react'

import { safeJsonParse } from '@/lib/utils/safeJsonParse'

import type { Dimension, SizeSelectorProps } from '@types'

export function SizeSelector({
  optionName,
  values,
  variants,
  selectedVariant,
  onSelect,
  productHandle,
  optionValues,
  isSelectionDisabled = false
}: SizeSelectorProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const optionButtonRefs = useRef<
    Array<HTMLButtonElement | null>
  >([])

  const handlesToHideGuide = ['utekos-buff', 'utekos-stapper']

  return (
    <div className='space-y-3'>
      <div
        role='radiogroup'
        aria-label={optionName}
        className='grid grid-cols-3 gap-2 md:flex md:flex-col md:gap-3'
      >
        {values.map((sizeValue, index) => {
          const optionValue = optionValues?.find(
            candidate => candidate.name === sizeValue
          )
          const exists = optionValue?.exists ?? true
          const isDifferentProduct =
            optionValue?.isDifferentProduct ?? false
          const hasTargetVariant =
            optionValue ? Boolean(optionValue.variantId) : true
          const isDisabled =
            isSelectionDisabled ||
            !exists ||
            !hasTargetVariant ||
            isDifferentProduct
          const representativeVariant = variants.find(v =>
            v.selectedOptions.some(
              opt =>
                opt.name === optionName &&
                opt.value === sizeValue
            )
          )

          const variantProfileRef =
            representativeVariant?.variantProfileData
          const lengthJson = variantProfileRef?.length?.value
          const centerToWristJson =
            variantProfileRef?.centerToWrist?.value
          const flatWidthJson =
            variantProfileRef?.flatWidth?.value
          const length = safeJsonParse<Dimension>(
            lengthJson,
            null
          )
          const centerToWrist = safeJsonParse<Dimension>(
            centerToWristJson,
            null
          )
          const flatWidth = safeJsonParse<Dimension>(
            flatWidthJson,
            null
          )
          const isSelected =
            selectedVariant.selectedOptions.some(
              opt =>
                opt.name === optionName &&
                opt.value === sizeValue
            )
          const isAvailable =
            isSelected ?
              selectedVariant.availableForSale
            : (optionValue?.variantAvailableForSale ?? true)

          return (
            <button
              key={sizeValue}
              type='button'
              ref={element => {
                optionButtonRefs.current[index] = element
              }}
              onClick={() => onSelect(optionName, sizeValue)}
              disabled={isDisabled}
              onKeyDown={event => {
                const enabledIndices =
                  optionButtonRefs.current.flatMap(
                    (button, buttonIndex) =>
                      button && !button.disabled ?
                        [buttonIndex]
                      : []
                  )

                if (!enabledIndices.length) return

                const enabledPosition =
                  enabledIndices.indexOf(index)
                let nextIndex: number | undefined

                if (
                  event.key === 'ArrowRight' ||
                  event.key === 'ArrowDown'
                ) {
                  nextIndex =
                    enabledIndices[
                      (enabledPosition + 1) %
                        enabledIndices.length
                    ]
                } else if (
                  event.key === 'ArrowLeft' ||
                  event.key === 'ArrowUp'
                ) {
                  nextIndex =
                    enabledIndices[
                      (enabledPosition -
                        1 +
                        enabledIndices.length) %
                        enabledIndices.length
                    ]
                } else if (event.key === 'Home') {
                  nextIndex = enabledIndices[0]
                } else if (event.key === 'End') {
                  nextIndex = enabledIndices.at(-1)
                }

                if (nextIndex === undefined) {
                  return
                }

                const nextValue = values[nextIndex]

                if (!nextValue) {
                  return
                }

                event.preventDefault()
                onSelect(optionName, nextValue)
                optionButtonRefs.current[nextIndex]?.focus()
              }}
              role='radio'
              aria-checked={isSelected}
              aria-label={`${sizeValue}${
                (
                  !exists ||
                  !hasTargetVariant ||
                  isDifferentProduct
                ) ?
                  ', ikke tilgjengelig'
                : !isAvailable ? ', utsolgt'
                : ''
              }`}
              data-product-option-name={optionName}
              data-product-option-value={sizeValue}
              tabIndex={isSelected ? 0 : -1}
              data-selected={isSelected}
              data-available={isAvailable}
              className='dark:border-dark-card-foreground/24 dark:hover:border-dark-card-foreground/45 dark:focus-visible:ring-dark-card-foreground/45 flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-card-foreground/24 bg-card px-3 py-3 text-center text-sm text-card-foreground transition-all duration-200 ease-in-out hover:border-card-foreground/45 focus-visible:ring-2 focus-visible:ring-card-foreground/45 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45 data-[available=false]:border-dashed data-[selected=true]:border-foreground data-[selected=true]:bg-background data-[selected=true]:text-foreground data-[selected=true]:shadow-[0_14px_32px_-24px_color-mix(in_oklch,var(--foreground)_72%,transparent)] data-[selected=true]:ring-2 data-[selected=true]:ring-foreground/55 md:w-full md:justify-between md:p-4 md:text-left md:text-base'
            >
              <span className='inline-flex flex-wrap items-center justify-center gap-2 font-sans md:justify-start'>
                <span>{sizeValue}</span>
                {(
                  !exists ||
                  !hasTargetVariant ||
                  isDifferentProduct ||
                  !isAvailable
                ) ?
                  <span className='text-xs text-card-foreground/70'>
                    {(
                      !exists ||
                      !hasTargetVariant ||
                      isDifferentProduct
                    ) ?
                      'Ikke tilgjengelig'
                    : 'Utsolgt'}
                  </span>
                : null}
                {isSelected ?
                  <Check
                    className='size-4 shrink-0'
                    strokeWidth={2.5}
                    aria-hidden='true'
                  />
                : null}
              </span>
              <div className='/72 hidden text-right text-xs text-card-foreground/72 md:block'>
                {length && (
                  <div>
                    Lengde til hals: {`${length.value} cm`}
                  </div>
                )}
                {centerToWrist && (
                  <div>
                    Senter til ermetupp:{' '}
                    {`${centerToWrist.value} cm`}
                  </div>
                )}
                {flatWidth && (
                  <div>
                    Flatmål bunn: {`${flatWidth.value} cm`}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {!handlesToHideGuide.includes(productHandle) && (
        <div className='dark:border-dark-card-foreground/24 flex w-full flex-col rounded-2xl border border-card-foreground/24 bg-card p-4 text-left transition-colors'>
          <button
            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
            className='dark:focus-visible:ring-dark-card-foreground/45 flex w-full cursor-pointer justify-between p-0 font-utekos-text-medium text-card-foreground transition-colors focus-visible:ring-2 focus-visible:ring-card-foreground/45 focus-visible:outline-none'
            aria-expanded={isDetailsOpen}
            aria-controls='size-details'
          >
            <span className='font-utekos-text-medium'>
              Usikker på størrelsen?
            </span>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              className={`dark:ring-dark-card-foreground/45 transform rounded-full text-card-foreground ring-1 ring-card-foreground/45 transition-transform duration-200 hover:scale-105 hover:ring-2 ${isDetailsOpen ? 'rotate-45' : ''}`}
              aria-hidden='true'
            >
              <path d='M5 12h14' />
              <path d='M12 5v14' />
            </svg>
          </button>
          <div
            id='size-details'
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isDetailsOpen ? 'max-h-40 pt-3 opacity-100' : 'max-h-0 opacity-0'} `}
          >
            <p className='text-xs text-card-foreground'>
              Se dimensjonene på Utekos-modellene{' '}
              <Link
                href='/handlehjelp/storrelsesguide'
                className='/76 text-card-foreground underline hover:text-card-foreground/76'
              >
                her
              </Link>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
