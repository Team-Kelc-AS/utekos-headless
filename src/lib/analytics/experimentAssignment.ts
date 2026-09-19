import * as z from '@/lib/validation/zodMini'

export const canonicalExperimentAssignmentSchema =
  z.strictObject({
    key: z
      .string()
      .check(
        z.minLength(1),
        z.maxLength(100),
        z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u)
      ),
    variant: z
      .string()
      .check(
        z.minLength(1),
        z.maxLength(100),
        z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u)
      )
  })

export type CanonicalExperimentAssignment = z.infer<
  typeof canonicalExperimentAssignmentSchema
>
