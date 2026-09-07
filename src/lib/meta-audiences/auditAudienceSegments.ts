import { z } from 'zod'
import { normalizeAudienceIdentity } from './normalizeAudienceIdentity'

const rowSchema = z.record(z.string(), z.string().nullable())
const sourceSchema = z.object({
  segment: z.string(),
  source: z.string(),
  rows: z.array(rowSchema)
})

export function auditAudienceSegments(
  input: unknown,
  buyerInput: unknown
) {
  const sources = z.array(sourceSchema).parse(input)
  const buyers = z.array(rowSchema).parse(buyerInput)
  const buyerKeys = new Set<string>()
  for (const row of buyers) {
    const id = normalizeAudienceIdentity(row)
    if (id.phone) buyerKeys.add(`p:${id.phone}`)
    if (id.email) buyerKeys.add(`e:${id.email}`)
  }
  const identities = new Map<
    string,
    {
      buyer: boolean
      ambiguous: boolean
      segments: Set<string>
      emails: Set<string>
      phones: Set<string>
    }
  >()
  const aliases = new Map<string, string>()
  let invalidRows = 0,
    ambiguousRows = 0
  for (const source of sources)
    for (const row of source.rows) {
      const id = normalizeAudienceIdentity(row)
      const keys = [
        id.phone ? `p:${id.phone}` : null,
        id.email ? `e:${id.email}` : null
      ].filter((key): key is string => key !== null)
      if (!keys[0]) {
        invalidRows++
        continue
      }
      const existing = [
        ...new Set(
          keys
            .map(key => aliases.get(key))
            .filter((key): key is string => Boolean(key))
        )
      ]
      if (existing.length > 1) {
        ambiguousRows++
        for (const candidate of existing) {
          const profile = identities.get(candidate)
          if (profile) profile.ambiguous = true
        }
        continue
      }
      const key = existing[0] ?? keys[0]
      const profile = identities.get(key) ?? {
        buyer: false,
        ambiguous: false,
        segments: new Set<string>(),
        emails: new Set<string>(),
        phones: new Set<string>()
      }
      if (
        (id.phone &&
          profile.phones.size > 0 &&
          !profile.phones.has(id.phone)) ||
        (id.email &&
          profile.emails.size > 0 &&
          !profile.emails.has(id.email))
      ) {
        ambiguousRows++
        profile.ambiguous = true
        continue
      }
      if (id.phone) profile.phones.add(id.phone)
      if (id.email) profile.emails.add(id.email)
      profile.buyer ||= keys.some(item => buyerKeys.has(item))
      profile.segments.add(source.segment)
      identities.set(key, profile)
      for (const alias of keys) aliases.set(alias, key)
    }
  const profiles = [...identities.values()].filter(
    profile => !profile.ambiguous
  )
  const keys = [
    ...new Set(sources.map(source => source.segment))
  ].sort()
  const segments = keys.map(key => {
    const members = profiles.filter(profile =>
      profile.segments.has(key)
    )
    return {
      key,
      sources: sources
        .filter(source => source.segment === key)
        .map(source => ({
          source: source.source,
          rows: source.rows.length
        })),
      uniqueIdentities: members.length,
      excludedBuyers: members.filter(profile => profile.buyer)
        .length,
      unmatchedBuyerStatus: members.filter(
        profile => !profile.buyer
      ).length
    }
  })
  const overlap = keys.flatMap((left, index) =>
    keys
      .slice(index + 1)
      .map(right => ({
        left,
        right,
        identities: profiles.filter(
          profile =>
            profile.segments.has(left) &&
            profile.segments.has(right)
        ).length
      }))
  )
  return {
    uniqueIdentities: profiles.length,
    excludedBuyers: profiles.filter(profile => profile.buyer)
      .length,
    unmatchedBuyerStatus: profiles.filter(
      profile => !profile.buyer
    ).length,
    invalidRows,
    ambiguousRows,
    segments,
    overlap
  }
}
