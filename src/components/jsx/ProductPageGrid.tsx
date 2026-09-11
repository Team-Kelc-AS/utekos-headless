// Path: src/components/jsx/ProductGrid.tsx
import type { ReactNode } from 'react'
export const ProductPageGrid = ({
  children
}: {
  readonly children: ReactNode
}) => (
  <div className='grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:gap-8'>
    {children}
  </div>
)
