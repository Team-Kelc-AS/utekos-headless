import * as z from '@/lib/validation/zodMini'
import { sanitizeOperationalPathname } from './sanitizeOperationalPathname'

export const clientErrorDataSchema = z.strictObject({
  source: z.literal('window_error'),
  message: z.optional(
    z.string().check(
      z.minLength(1),
      z.maxLength(240),
      z.refine(value => !/\S+@\S+\.\S+/.test(value), {
        message:
          'Client error message must not contain email-like values'
      })
    )
  ),
  filename: z.optional(
    z.pipe(
      z.string().check(z.minLength(1), z.maxLength(512)),
      z.transform(sanitizeOperationalPathname)
    )
  ),
  line: z.optional(z.int().check(z.gte(0), z.lte(10_000_000))),
  column: z.optional(z.int().check(z.gte(0), z.lte(10_000_000)))
})
