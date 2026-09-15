import { nbccProducts } from './nbccLandingPageContent'

export function formatProductFacts(): string {
  return nbccProducts
    .map(product => {
      const color = product.color ? `\n  Fargevariant i NBCC-utvalg: ${product.color}` : ''

      return `- ${product.title}
  Kortnavn: ${product.shortTitle}
  Beskrivelse: ${product.description}
  Best for: ${product.bestFor}
  Størrelser vist på NBCC-siden: ${product.sizes.join(' → ')}${color}`
    })
    .join('\n\n')
}
