import { getAllProductPresentations } from './getProductPresentation'

export function buildProductPresentationLlmsIndex() {
  return getAllProductPresentations()
    .map(
      presentation =>
        `- [${presentation.displayName}](${presentation.canonicalUrl}): ${presentation.description}`
    )
    .join('\n')
}

export function buildProductPresentationLlmsProfiles() {
  return getAllProductPresentations()
    .map(
      presentation => `### ${presentation.displayName}

${presentation.description}

- Kanonisk URL: ${presentation.canonicalUrl}
- Kategori: ${presentation.category}
- Materiale: ${presentation.material}
- Målgruppe: ${presentation.audience}
- Gjeldende pris, lagerstatus og synlige varianter skal alltid leses fra produktsiden.`
    )
    .join('\n\n')
}
