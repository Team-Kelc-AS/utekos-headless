import { z } from 'zod'
import { canonicalExperimentAssignmentSchema } from '@/lib/analytics/experimentAssignment'

export const SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY =
  'skreddersy-varmen-layout-v1'

export const skreddersyVarmenLayoutVariantSchema = z.enum([
  'current',
  'legacy'
])

export const skreddersyVarmenLayoutAssignmentSchema =
  canonicalExperimentAssignmentSchema.extend({
    key: z.literal(SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY),
    variant: skreddersyVarmenLayoutVariantSchema
  })

export type SkreddersyVarmenLayoutVariant = z.infer<
  typeof skreddersyVarmenLayoutVariantSchema
>

export type SkreddersyVarmenLayoutAssignment = z.infer<
  typeof skreddersyVarmenLayoutAssignmentSchema
>

type ExperimentAssignmentRoot = {
  querySelector: (
    selector: string
  ) => { getAttribute: (name: string) => string | null } | null
}

export function readSkreddersyVarmenLayoutAssignment(
  root?: ExperimentAssignmentRoot
): SkreddersyVarmenLayoutAssignment | undefined {
  const browserRoot =
    root ??
    (typeof document === 'undefined' ? undefined : document)
  if (!browserRoot) return undefined

  const element = browserRoot.querySelector(
    '[data-experiment-key="' +
      SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY +
      '"]'
  )
  if (!element) return undefined

  const parsed =
    skreddersyVarmenLayoutAssignmentSchema.safeParse({
      key: element.getAttribute('data-experiment-key'),
      variant: element.getAttribute('data-experiment-variant')
    })

  return parsed.success ? parsed.data : undefined
}
