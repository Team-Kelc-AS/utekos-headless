import { utekosData } from '@/app/handlehjelp/storrelsesguide/utils/data'

export function formatMikrofiberSizeFacts(): string {
  return utekosData
    .map(
      row =>
        `- ${row.measurement}: Medium ${row.m}, Large ${row.l}`
    )
    .join('\n')
}
