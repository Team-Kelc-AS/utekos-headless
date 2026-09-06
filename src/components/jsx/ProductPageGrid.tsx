// Path: src/components/jsx/ProductGrid.tsx
import type { ReactNode } from 'react'
export const ProductPageGrid = ({
  children
}: {
  readonly children: ReactNode
}) => (
  <div className='flex flex-col gap-4 md:flex-row md:items-start md:gap-8'>
    {children}
  </div>
)
