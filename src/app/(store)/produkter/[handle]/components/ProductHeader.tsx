import type { ReactNode } from 'react'

export interface ProductHeaderProps {
  productTitle: string
  productSubtitle: string
  action?: ReactNode
}

export default function ProductHeader({
  productTitle,
  productSubtitle,
  action
}: ProductHeaderProps) {
  return (
    <div className='text-left text-foreground md:mb-6'>
      <hgroup>
        <div className='flex items-start justify-between gap-3'>
          <h1 className='mx-0 min-w-0 flex-1 text-left font-sans text-3xl leading-tight font-bold tracking-tight text-foreground xl:text-4xl'>
            {productTitle}
          </h1>
          {action ?
            <div className='relative z-10 shrink-0'>{action}</div>
          : null}
        </div>

        {typeof productSubtitle === 'string' &&
          productSubtitle.trim() !== '' && (
            <p className='leading-text-paragraph mt-4 max-w-2xl text-lg text-foreground'>
              {productSubtitle}
            </p>
          )}
      </hgroup>
    </div>
  )
}
