// src/app/(store)/magasinet/layout.tsx

import type { ReactNode } from 'react'

export default function MagazineLayout({ children }: { children: ReactNode }) {
  return <div className='min-h-screen bg-overcast'>{children}</div>
}
