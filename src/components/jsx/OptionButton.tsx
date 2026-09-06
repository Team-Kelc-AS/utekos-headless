// Path: src/components/jsx/OptionButton.tsx

import type { OptionButtonProps } from '@types'

export function OptionButton({
  isSelected,
  isAvailable = true,
  disabled = false,
  ariaLabel,
  optionName,
  optionValue,
  onClick,
  children
}: OptionButtonProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      role='radio'
      aria-checked={isSelected}
      aria-label={ariaLabel}
      data-product-option-name={optionName}
      data-product-option-value={optionValue}
      data-selected={isSelected}
      data-available={isAvailable}
      className='data-[selected=true]:border-jungle data-[selected=true]:bg-jungle data-[selected=true]:text-foreground data-[selected=true]:ring-jungle/55 data-[selected=true]:[&_span]:text-foreground flex w-full cursor-pointer items-center justify-between rounded-2xl border border-card-foreground/24 bg-jungle p-4 text-left text-card-foreground transition-all duration-200 ease-in-out hover:border-card-foreground/45 focus-visible:ring-2 focus-visible:ring-card-foreground/45 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45 data-[available=false]:border-dashed data-[selected=true]:shadow-[0_12px_28px_-22px_color-mix(in_oklch,var(--jungle)_70%,transparent)] data-[selected=true]:ring-2'
    >
      {children}
    </button>
  )
}
