'use client'

import { INTERSPORT_LAKSEVAG_MAPS_URL } from '@/constants/maps'
import { useInStoreNoticeAnimation } from '@/hooks/useInStoreNoticeAnimation'



import { NewProductInStoreNoticeView } from './NewProductInStoreNoticeView'
export function NewProductInStoreNotice() {
  const { containerRef, logoBoxRef, contentRef } = useInStoreNoticeAnimation()

  return (
    <NewProductInStoreNoticeView
      containerRef={containerRef}
      logoBoxRef={logoBoxRef}
      contentRef={contentRef}
      mapsUrl={INTERSPORT_LAKSEVAG_MAPS_URL}
    />
  )
}
