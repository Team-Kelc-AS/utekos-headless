import { z } from 'zod'
import {
  metaAudienceSchema,
  metaRuleSetAuditSchema
} from './audienceRegistrySchema'

const count = z.number().int().nonnegative()
const counts = z.object({
  uniqueIdentities: count,
  excludedBuyers: count,
  unmatchedBuyerStatus: count
})
export const registrySnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  runId: z.uuid(),
  observedAt: z.iso.datetime(),
  graphApiVersion: z.literal('v26.0'),
  account: z.object({
    id: z.literal('act_772268237116474'),
    name: z.string(),
    currency: z.literal('NOK'),
    business: z.object({ id: z.string(), name: z.string() })
  }),
  sourceManifest: z.array(
    z.object({
      segment: z.string(),
      source: z.string(),
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
      rows: count,
      permissionEvidence: z.string()
    })
  ),
  buyerSnapshot: z.object({
    total: count,
    buyerProfiles: count,
    uniqueUsableBuyerPhones: count.optional(),
    observedAt: z.iso.datetime(),
    completeness: z.literal(
      'current_shopify_customer_profiles_only'
    ),
    historicalBuyerRows: count,
    offlineCoverage: z.string()
  }),
  legacySources: z
    .array(
      z.object({
        file: z.string(),
        audienceId: z.string(),
        segment: z.string(),
        phoneColumn: z.string(),
        sha256: z.string(),
        rowCount: count,
        numericValueRows: count,
        strongBuyerMatchAudit: counts
          .extend({ invalidRows: count, ambiguousRows: count })
          .optional(),
        providerMembershipVerified: z.literal(false),
        comparison: z.object({
          method: z.literal('exact_normalized_phone_only'),
          sourceUniquePhones: count,
          alsoInCurrentSegment: count,
          sourceNotInCurrentSegment: count,
          knownBuyerPhones: count,
          sourceNotInCurrentAndNotKnownBuyer: count
        })
      })
    )
    .optional(),
  localAudit: counts.extend({
    invalidRows: count,
    ambiguousRows: count,
    segments: z.array(
      counts.extend({
        key: z.string(),
        sources: z.array(
          z.object({ source: z.string(), rows: count })
        )
      })
    ),
    overlap: z.array(
      z.object({
        left: z.string(),
        right: z.string(),
        identities: count
      })
    )
  }),
  segments: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      audienceIds: z.array(z.string()),
      definition: z.string()
    })
  ),
  audiences: z.array(
    metaAudienceSchema.extend({
      sourceFiles: z
        .array(
          z.object({
            file: z.string(),
            sha256: z.string(),
            rows: count
          })
        )
        .optional(),
      seedSourceFiles: z
        .array(
          z.object({
            file: z.string(),
            sha256: z.string(),
            rows: count
          })
        )
        .optional(),
      segment: z.string().nullable(),
      provenance: z.enum([
        'candidate_mapping_requires_upload_receipt',
        'unresolved'
      ]),
      labelOrigin: z.enum([
        'inheritance_or_explicit_unverified',
        'observed'
      ]),
      usage: z.array(
        z.object({
          adsetId: z.string(),
          campaignId: z.string(),
          effectiveStatus: z.string(),
          role: z.enum(['suggestion_or_targeting', 'exclusion'])
        })
      )
    })
  ),
  ruleSets: z.array(
    metaRuleSetAuditSchema.extend({
      attachedAdsets: z.array(z.string())
    })
  ),
  blockers: z.array(z.string())
})
