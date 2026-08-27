import type { ReactNode } from 'react'

export const OptionsColumn = ({ children }: { readonly children: ReactNode }) => (
  <div className='md:col-span-4 md:self-start'>{children}</div>
)
