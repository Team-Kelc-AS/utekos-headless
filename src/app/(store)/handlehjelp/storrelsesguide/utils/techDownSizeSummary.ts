import { TECH_DOWN_PUBLIC_SIZE_DEFINITIONS } from '@/lib/products/techDownSizes'

export const techDownSizeSummary =
  TECH_DOWN_PUBLIC_SIZE_DEFINITIONS.map(
    size =>
      `${size.size}: total lengde fra nakke til bunn er ${size.measurements.length}. Høyderåd: ${size.heightGuide}. ${size.fitGuidance.join(' ')}`
  )
