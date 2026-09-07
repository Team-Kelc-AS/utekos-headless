import { techDownData } from '@/app/handlehjelp/storrelsesguide/utils/data'

export function formatTechDownSizeFacts(): string {
  return techDownData
    .map(
      row =>
        `- ${row.measurement}: Middels ${row.middels}, Stor ${row.stor}, Større ${row.storre}`
    )
    .join('\n')
}
