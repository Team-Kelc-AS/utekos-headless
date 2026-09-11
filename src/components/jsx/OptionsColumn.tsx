import type { ReactNode } from 'react'

export const OptionsColumn = ({ children }: { readonly children: ReactNode }) => (
  <div className='order-2 min-w-0 md:col-start-2 md:row-start-1'>{children}</div>
)
