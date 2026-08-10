import { z } from 'zod'

const uuidSchema = z.string().uuid()
const anonymousExternalIdSchema = z
  .string()
  .regex(/^anon_([0-9a-f-]{36})$/i)

type MicrosoftIdentitySource = {
  browser_id?: Record<string, string> | undefined
  external_id?: string | undefined
}

function parseUuid(value: string | undefined) {
  const parsed = uuidSchema.safeParse(value)
  return parsed.success ? parsed.data : undefined
}

export function findMicrosoftUetAnonymousId(
  source: MicrosoftIdentitySource
) {
  const explicit =
    parseUuid(source.browser_id?.microsoft_vid) ??
    parseUuid(source.browser_id?.microsoft_anonymous_id)

  if (explicit) return explicit

  const externalId = anonymousExternalIdSchema.safeParse(
    source.external_id
  )

  if (!externalId.success) return undefined

  return parseUuid(externalId.data.slice('anon_'.length))
}

export function findMicrosoftUetExternalId(
  source: MicrosoftIdentitySource
) {
  const externalId = source.external_id?.trim()

  if (!externalId) return undefined
  if (anonymousExternalIdSchema.safeParse(externalId).success) {
    return undefined
  }

  return externalId
}
