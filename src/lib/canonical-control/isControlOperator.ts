import { z } from 'zod'

const identitySchema = z.object({
  user: z.object({
    id: z.string(),
    emailVerified: z.literal(true)
  }),
  organizationId: z.string(),
  impersonator: z.undefined().optional()
})

export function isControlOperator(
  input: unknown,
  expected: { userId: string; organizationId: string }
) {
  const identity = identitySchema.safeParse(input)
  return (
    identity.success &&
    identity.data.user.id === expected.userId &&
    identity.data.organizationId === expected.organizationId
  )
}
