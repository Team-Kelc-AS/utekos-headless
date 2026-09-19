import * as z from '@/lib/validation/zodMini'

export const klarnaPublicConfigSchema = z.object({
  client_id: z
    .string()
    .check(
      z.trim(),
      z.startsWith('klarna_live_client_'),
      z.regex(/^\S+$/)
    ),
  environment: z.enum(['production', 'playground'])
})

export type KlarnaPublicConfig = z.infer<
  typeof klarnaPublicConfigSchema
>
