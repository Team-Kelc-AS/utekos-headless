import type { ReactNode } from 'react'

export const GalleryColumn = ({ children }: { readonly children: ReactNode }) => (
  <div className='order-1 min-w-0 md:col-start-1 md:row-start-1'>
    {children}
  </div>
)
