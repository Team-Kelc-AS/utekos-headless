import {
  TECH_DOWN_MEASUREMENT_ROWS,
  TECH_DOWN_PUBLIC_SIZES
} from '@/lib/products/techDownSizes'

export function formatTechDownSizeFacts(): string {
  return TECH_DOWN_MEASUREMENT_ROWS.map(
    row =>
      `- ${row.measurement}: ${TECH_DOWN_PUBLIC_SIZES.map((size, index) => `${size} ${row.values[index]}`).join(', ')}`
  ).join('\n')
}
