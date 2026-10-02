import { getStorefrontProductPresentations } from './getProductPresentation'

export function buildProductPresentationLlmsIndex() {
  return getStorefrontProductPresentations()
    .map(
      presentation =>
        `- [${presentation.displayName}](${presentation.canonicalUrl}): ${presentation.description}`
    )
    .join('\n')
}

export function buildProductPresentationLlmsProfiles() {
  return getStorefrontProductPresentations()
    .map(
      presentation => `### ${presentation.displayName}

${presentation.description}

- Kanonisk URL: ${presentation.canonicalUrl}
- Kategori: ${presentation.category}
${[
  presentation.material &&
    `- Materiale: ${presentation.material}`,
  presentation.audience &&
    `- Målgruppe: ${presentation.audience}`
]
  .filter(Boolean)
  .map(line => `${line}\n`)
  .join('')}
- Gjeldende pris, lagerstatus og synlige varianter skal alltid leses fra produktsiden.`
    )
    .join('\n\n')
}
