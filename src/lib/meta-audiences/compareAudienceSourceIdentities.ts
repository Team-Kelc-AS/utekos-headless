import { z } from 'zod'
import { normalizeAudienceIdentity } from './normalizeAudienceIdentity'

export function compareAudienceSourceIdentities(
  sourceInput: unknown,
  currentInput: unknown,
  buyerInput: unknown
) {
  const schema = z.array(
    z.record(z.string(), z.string().nullable())
  )
  const source = new Set(
    schema
      .parse(sourceInput)
      .map(row => normalizeAudienceIdentity(row).phone)
      .filter((phone): phone is string => Boolean(phone))
  )
  const current = new Set(
    schema
      .parse(currentInput)
      .map(row => normalizeAudienceIdentity(row).phone)
      .filter((phone): phone is string => Boolean(phone))
  )
  const buyers = new Set(
    schema
      .parse(buyerInput)
      .map(row => normalizeAudienceIdentity(row).phone)
      .filter((phone): phone is string => Boolean(phone))
  )
  return {
    method: 'exact_normalized_phone_only',
    sourceUniquePhones: source.size,
    alsoInCurrentSegment: [...source].filter(phone =>
      current.has(phone)
    ).length,
    sourceNotInCurrentSegment: [...source].filter(
      phone => !current.has(phone)
    ).length,
    knownBuyerPhones: [...source].filter(phone =>
      buyers.has(phone)
    ).length,
    sourceNotInCurrentAndNotKnownBuyer: [...source].filter(
      phone => !current.has(phone) && !buyers.has(phone)
    ).length
  }
}
