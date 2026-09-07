import { z } from 'zod'

export function getBuyerExclusions(input: unknown) {
  const audiences = z
    .array(
      z.object({
        id: z.string().regex(/^\d+$/),
        subtype: z.string(),
        labels: z.array(z.string()),
        buyerEvidence: z.boolean()
      })
    )
    .parse(input)
  return [
    ...new Set(
      audiences
        .filter(
          a => a.subtype !== 'LOOKALIKE' && a.buyerEvidence
        )
        .map(a => a.id)
    )
  ]
}
