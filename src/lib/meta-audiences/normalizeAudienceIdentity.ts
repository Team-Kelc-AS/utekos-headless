import { z } from 'zod'

export function normalizeAudienceIdentity(input: unknown) {
  const row = z
    .object({
      phone: z.string().nullish(),
      email: z.string().nullish()
    })
    .parse(input)
  const raw = row.phone?.trim() ?? ''
  let phone =
    /^\+?[\d\s().-]+$/.test(raw) ?
      raw.replace(/[\s().+-]/g, '')
    : ''
  if (phone.startsWith('00')) phone = phone.slice(2)
  if (/^[2-9]\d{7}$/.test(phone)) phone = `47${phone}`
  const email = row.email?.trim().toLowerCase() ?? ''
  return {
    phone: /^47[2-9]\d{7}$/.test(phone) ? phone : null,
    email: z.email().safeParse(email).success ? email : null
  }
}
