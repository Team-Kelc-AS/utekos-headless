import { z } from 'zod'

export const canonicalExperimentAssignmentSchema =
  z.strictObject({
    key: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
    variant: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u)
  })

export type CanonicalExperimentAssignment = z.infer<
  typeof canonicalExperimentAssignmentSchema
>
