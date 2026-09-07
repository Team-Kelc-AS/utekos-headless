import { z } from 'zod'

export function getLabelMigrationBlockers(input: unknown) {
  const plan = z
    .object({
      targetLabel: z.string(),
      targetAudienceIds: z.array(z.string()),
      sourceReceiptVerified: z.boolean(),
      audiences: z.array(
        z.object({
          id: z.string(),
          subtype: z.string(),
          labels: z.array(z.string())
        })
      ),
      ruleSets: z.array(
        z.object({
          id: z.string(),
          labels: z.array(z.string()),
          attachedAdsets: z.array(
            z.object({
              id: z.string(),
              effectiveStatus: z.string()
            })
          )
        })
      )
    })
    .parse(input)
  const blockers: Array<{ code: string; ids: string[] }> = []
  const occupied = plan.audiences.filter(
    a =>
      !plan.targetAudienceIds.includes(a.id) &&
      a.labels.some(
        label =>
          label.toUpperCase() === plan.targetLabel.toUpperCase()
      )
  )
  if (occupied.length)
    blockers.push({
      code: 'label_occupied',
      ids: occupied.map(a => a.id)
    })
  const affectedLabels = new Set([
    plan.targetLabel.toUpperCase(),
    ...plan.audiences
      .filter(a => plan.targetAudienceIds.includes(a.id))
      .flatMap(a => a.labels.map(label => label.toUpperCase()))
  ])
  const liveDependencies = plan.ruleSets.filter(
    set =>
      set.labels.some(label =>
        affectedLabels.has(label.toUpperCase())
      ) &&
      set.attachedAdsets.some(
        a => a.effectiveStatus === 'ACTIVE'
      )
  )
  if (liveDependencies.length)
    blockers.push({
      code: 'live_rule_dependency',
      ids: liveDependencies.map(set => set.id)
    })
  if (!plan.sourceReceiptVerified)
    blockers.push({
      code: 'source_receipt_missing',
      ids: plan.targetAudienceIds
    })
  return blockers
}
