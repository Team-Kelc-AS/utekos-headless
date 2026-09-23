import * as z from '@/lib/validation/zodMini'

export const facebookLoginStatusResponseSchema = z.strictObject({
  connected: z.optional(z.boolean()),
  linked: z.optional(z.boolean()),
  needs_contact: z.optional(z.boolean())
})

export const facebookLoginCompleteResponseSchema = z.strictObject({
  status: z.enum(['connected', 'needs_contact'])
})
