import { z } from 'zod'
import type { CanonicalEventEnvelope } from '../canonicalEventEnvelope'
import {
  findMicrosoftUetAnonymousId,
  findMicrosoftUetExternalId
} from '../microsoftUetIdentity'
import { findMicrosoftClickId } from './findMicrosoftClickId'

const microsoftIdentifierNames = [
  'anonymousId',
  'externalId',
  'em',
  'ph',
  'msclkid',
  'idfa',
  'gaid'
] as const

export const microsoftUetCapiUserDataSchema = z
  .strictObject({
    anonymousId: z.string().min(1).optional(),
    clientIpAddress: z.string().min(1).optional(),
    clientUserAgent: z.string().min(1).optional(),
    em: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
    externalId: z.string().min(1).optional(),
    gaid: z.string().uuid().optional(),
    idfa: z.string().uuid().optional(),
    msclkid: z.string().uuid().optional(),
    ph: z.string().regex(/^[a-f0-9]{64}$/i).optional()
  })
  .refine(
    userData =>
      microsoftIdentifierNames.some(identifier =>
        Boolean(userData[identifier])
      ),
    {
      message:
        'Microsoft UET CAPI userData requires at least one supported identifier'
    }
  )

export type MicrosoftUetCapiUserData = z.infer<
  typeof microsoftUetCapiUserDataSchema
>

type MicrosoftUetIdentitySource = Pick<
  CanonicalEventEnvelope,
  | 'browser_id'
  | 'click_id'
  | 'client_ip_address'
  | 'event_device_info'
  | 'external_id'
  | 'user_data'
>

function readIdentifier(
  identifiers: Record<string, string> | undefined,
  keys: readonly string[]
) {
  for (const key of keys) {
    const value = identifiers?.[key]?.trim()
    if (value) return value
  }

  return undefined
}

function readUuidIdentifier(
  identifiers: Record<string, string> | undefined,
  keys: readonly string[]
) {
  const value = readIdentifier(identifiers, keys)
  const parsed = z.string().uuid().safeParse(value)
  return parsed.success ? parsed.data : undefined
}

export function buildMicrosoftUetCapiUserData(
  event: MicrosoftUetIdentitySource
): MicrosoftUetCapiUserData {
  const anonymousId = findMicrosoftUetAnonymousId(event)
  const externalId = findMicrosoftUetExternalId(event)
  const rawMsclkid = findMicrosoftClickId(event.click_id)
  const parsedMsclkid = z.string().uuid().safeParse(rawMsclkid)
  const msclkid =
    parsedMsclkid.success ? parsedMsclkid.data : undefined
  const gaid = readUuidIdentifier(event.browser_id, ['gaid'])
  const idfa = readUuidIdentifier(event.browser_id, ['idfa'])
  const emailHash = event.user_data?.email_sha256?.[0]
  const phoneHash = event.user_data?.phone_sha256?.[0]

  return microsoftUetCapiUserDataSchema.parse({
    ...(anonymousId ? { anonymousId } : {}),
    ...(event.client_ip_address ?
      { clientIpAddress: event.client_ip_address }
    : {}),
    ...(event.event_device_info?.user_agent ?
      { clientUserAgent: event.event_device_info.user_agent }
    : {}),
    ...(emailHash ? { em: emailHash } : {}),
    ...(externalId ? { externalId } : {}),
    ...(gaid ? { gaid } : {}),
    ...(idfa ? { idfa } : {}),
    ...(msclkid ? { msclkid } : {}),
    ...(phoneHash ? { ph: phoneHash } : {})
  })
}
