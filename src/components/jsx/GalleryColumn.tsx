import type { ReactNode } from 'react'

export const GalleryColumn = ({ children }: { readonly children: ReactNode }) => (
  <div className='contents md:flex md:min-w-0 md:flex-[8] md:flex-col md:gap-8'>
    {children}
  </div>
)
