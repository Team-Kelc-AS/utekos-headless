import { Cite } from '@/components/knowledge/Cite'
import { comparisonArticle } from '../utils/comparisonArticle'

const targets = Object.fromEntries(
  comparisonArticle.references.map(reference => [
    reference.number,
    {
      id: `reference-${reference.id}`,
      label: `Kilde ${reference.number}: ${reference.author}`
    }
  ])
)

export function ComparisonReference({
  id
}: {
  id: (typeof comparisonArticle.references)[number]['id']
}) {
  const reference = comparisonArticle.references.find(
    item => item.id === id
  )!
  return <Cite ids={[reference.number]} targets={targets} />
}
