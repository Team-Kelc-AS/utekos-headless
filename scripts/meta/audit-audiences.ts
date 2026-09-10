import { createHash, randomUUID } from 'node:crypto'
import {
  readFile,
  readdir,
  mkdir,
  writeFile
} from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { z } from 'zod'
import { parseAudienceCsv } from '../../src/lib/meta-audiences/parseAudienceCsv'
import { auditAudienceSegments } from '../../src/lib/meta-audiences/auditAudienceSegments'
import { readShopifyBuyerIdentities } from '../../src/lib/meta-audiences/readShopifyBuyerIdentities'
import { readMetaAudienceEdge } from '../../src/lib/meta-audiences/readMetaAudienceEdge'
import { readMetaAudienceGraph } from '../../src/lib/meta-audiences/readMetaAudienceGraph'
import {
  metaAudienceSchema,
  metaAdSetAuditSchema,
  metaRuleSetAuditSchema
} from '../../src/lib/meta-audiences/audienceRegistrySchema'
import { buildTechDownValueRules } from '../../src/lib/meta-audiences/buildTechDownValueRules'
import { readLegacyAudienceSources } from '../../src/lib/meta-audiences/readLegacyAudienceSources'

async function main() {
  const token = z
    .string()
    .min(1)
    .parse(
      process.env.META_SYSTEM_USER_TOKEN ??
        process.env.META_ACCESS_TOKEN
    )
  const root = join(homedir(), 'Lister')
  const files = (await readdir(root))
    .filter(name =>
      /^(bobil|campingtilhenger|nbcc)_meta_\d\d\.csv$/.test(name)
    )
    .sort()
  if (files.length !== 8)
    throw new Error(
      'Expected eight reviewed prospect partitions; review source manifest before continuing'
    )
  const sources = await Promise.all(
    files.map(async source => {
      const text = await readFile(join(root, source), 'utf8')
      return {
        segment:
          source.startsWith('bobil') ? 'motorhome'
          : source.startsWith('nbcc') ? 'nbcc'
          : 'caravan',
        source,
        rows: parseAudienceCsv(text),
        sha256: createHash('sha256').update(text).digest('hex')
      }
    })
  )
  const buyerSnapshot = await readShopifyBuyerIdentities()
  const knownBuyerFiles = [
    'bobil_eksisterende_kunder.csv',
    'Reste/eksisterende_kunder/campingtilhenger_eksisterende_kunder.csv',
    'Reste/eksisterende_kunder/nbcc_eksisterende_kunder.csv'
  ]
  const historicalBuyers = (
    await Promise.all(
      knownBuyerFiles.map(async file =>
        parseAudienceCsv(
          await readFile(join(root, file), 'utf8')
        )
      )
    )
  ).flat()
  const localAudit = auditAudienceSegments(sources, [
    ...buyerSnapshot.rows,
    ...historicalBuyers
  ])
  const legacySources = await readLegacyAudienceSources(
    sources
      .filter(source => source.segment === 'caravan')
      .flatMap(source => source.rows),
    [...buyerSnapshot.rows, ...historicalBuyers]
  )
  const account = await readMetaAudienceGraph(
    'act_772268237116474',
    { fields: 'id,name,currency,business' },
    z.object({
      id: z.literal('act_772268237116474'),
      name: z.string(),
      currency: z.literal('NOK'),
      business: z.object({ id: z.string(), name: z.string() })
    }),
    token
  )
  const audiences = await readMetaAudienceEdge(
    'act_772268237116474/customaudiences',
    {
      fields:
        'id,name,subtype,audience_labels,is_value_based,customer_file_source,delivery_status,operation_status,lookalike_spec,time_updated,approximate_count_lower_bound,approximate_count_upper_bound'
    },
    metaAudienceSchema,
    token
  )
  const adsets = await readMetaAudienceEdge(
    'act_772268237116474/adsets',
    {
      fields:
        'id,name,status,effective_status,campaign_id,targeting,value_rules_applied,value_rule_set_id'
    },
    metaAdSetAuditSchema,
    token
  )
  const ruleSets = await readMetaAudienceEdge(
    'act_772268237116474/value_rule_set',
    {
      fields:
        'id,name,status,is_default_setting,rules.limit(100){id,name,adjust_sign,adjust_value,status,criterias.limit(100)}'
    },
    metaRuleSetAuditSchema,
    token
  )
  if (
    ruleSets.some(
      set =>
        set.rules.paging?.next ||
        set.rules.data.some(rule => rule.criterias?.paging?.next)
    )
  )
    throw new Error('Nested rule pagination incomplete')
  const regions = (
    await Promise.all(
      ['Nordland', 'Troms'].map(q =>
        readMetaAudienceEdge(
          'search',
          {
            q,
            type: 'adgeolocation',
            location_types: '["region"]',
            country_code: 'NO'
          },
          z.object({
            key: z.string(),
            name: z.string(),
            country_code: z.string()
          }),
          token
        )
      )
    )
  )
    .flat()
    .filter(
      r =>
        ['Nordland', 'Troms'].includes(r.name) &&
        r.country_code === 'NO'
    )
  const rules = buildTechDownValueRules(regions)
  const definitions = [
    {
      key: 'motorhome',
      label: 'OTHER_1',
      audienceIds: ['120247535673630788'],
      definition:
        'Current customer-filtered motorhome owner/co-owner source partitions; category provenance per OVERSIKT, not independent registry re-verification.'
    },
    {
      key: 'caravan',
      label: 'OTHER_2',
      audienceIds: [
        '120247535674940788',
        '120247539233010788',
        '120247539613940788'
      ],
      definition:
        'Current caravan source partitions plus legacy lists 14/15 pending source and membership reconciliation.'
    },
    {
      key: 'nbcc',
      label: 'OTHER_3',
      audienceIds: ['120247535674090788'],
      definition:
        'Current NBCC prospect partition; membership provenance per source record.'
    }
  ]
  const registry = audiences.map(audience => ({
    ...audience,
    sourceFiles: legacySources
      .filter(source => source.audienceId === audience.id)
      .map(source => ({
        file: source.file,
        sha256: source.sha256,
        rows: source.rowCount
      })),
    seedSourceFiles: legacySources
      .filter(source =>
        audience.lookalike_spec?.origin?.some(
          origin => origin.id === source.audienceId
        )
      )
      .map(source => ({
        file: source.file,
        sha256: source.sha256,
        rows: source.rowCount
      })),
    segment:
      definitions.find(segment =>
        segment.audienceIds.includes(audience.id)
      )?.key ?? null,
    provenance:
      (
        definitions.some(segment =>
          segment.audienceIds.includes(audience.id)
        ) ||
        legacySources.some(
          source => source.audienceId === audience.id
        )
      ) ?
        'candidate_mapping_requires_upload_receipt'
      : 'unresolved',
    labelOrigin:
      audience.subtype === 'LOOKALIKE' ?
        'inheritance_or_explicit_unverified'
      : 'observed',
    usage: adsets.flatMap(adset =>
      ['custom_audiences', 'excluded_custom_audiences'].flatMap(
        field =>
          (
            (
              adset.targeting?.[field as 'custom_audiences'] ??
              []
            ).some(item => item.id === audience.id)
          ) ?
            [
              {
                adsetId: adset.id,
                campaignId: adset.campaign_id,
                effectiveStatus: adset.effective_status,
                role:
                  field === 'custom_audiences' ?
                    'suggestion_or_targeting'
                  : 'exclusion'
              }
            ]
          : []
      )
    )
  }))
  const labelMigration = definitions.map(segment => ({
    ...segment,
    currentOccupants: audiences
      .filter(a =>
        a.audience_labels.some(
          label => label.toUpperCase() === segment.label
        )
      )
      .map(a => ({
        id: a.id,
        name: a.name,
        subtype: a.subtype
      })),
    intendedChanges: segment.audienceIds.map(id => {
      const a = registry.find(item => item.id === id)
      return {
        id,
        before: a?.audience_labels ?? null,
        after: [segment.label],
        dependencies: a?.usage ?? [],
        affectedRuleSets: ruleSets
          .filter(set =>
            set.rules.data.some(
              rule =>
                rule.status === 'ACTIVE' &&
                rule.criterias?.data.some(
                  c =>
                    c.criteria_type === 'AUDIENCE_LABEL' &&
                    c.criteria_values.some(value =>
                      [
                        ...(a?.audience_labels ?? []),
                        segment.label
                      ].some(
                        label =>
                          label.toLowerCase() ===
                          value.toLowerCase()
                      )
                    )
                )
            )
          )
          .map(set => ({
            id: set.id,
            attachedAdsets: adsets
              .filter(
                adset => adset.value_rule_set_id === set.id
              )
              .map(adset => ({
                id: adset.id,
                effectiveStatus: adset.effective_status
              }))
          }))
      }
    }),
    status: 'review_required_no_changes_applied'
  }))
  const report = {
    schemaVersion: 1,
    runId: randomUUID(),
    observedAt: new Date().toISOString(),
    graphApiVersion: 'v26.0',
    account,
    sourceManifest: sources.map(({ rows, ...source }) => ({
      ...source,
      rows: rows.length,
      permissionEvidence:
        'operator_attestation_in_task; row-level provenance not independently verified'
    })),
    buyerSnapshot: {
      total: buyerSnapshot.total,
      buyerProfiles: buyerSnapshot.buyerProfiles,
      uniqueUsableBuyerPhones:
        buyerSnapshot.uniqueUsableBuyerPhones,
      observedAt: buyerSnapshot.observedAt,
      completeness: buyerSnapshot.completeness,
      historicalBuyerRows: historicalBuyers.length,
      offlineCoverage: 'incomplete_unverified'
    },
    localAudit,
    legacySources,
    segments: definitions,
    audiences: registry,
    adsets,
    ruleSets: ruleSets.map(set => ({
      ...set,
      attachedAdsets: adsets
        .filter(adset => adset.value_rule_set_id === set.id)
        .map(adset => adset.id)
    })),
    labelMigration,
    regions,
    proposedRules: rules,
    mutations: [],
    blockers: [
      'Label occupants and live rule dependencies require reconciliation before relabeling.',
      'Legacy lists 14/15 compared locally; existing Meta membership and source receipts still unverified.',
      'Unknown buyer status is not verified new-customer status.',
      'Contribution costs, economic stop-loss and review approval missing.',
      'No randomized ad study scheduled; start time requires approval.'
    ]
  }
  const output = join(
    root,
    'Meta-audience-governance',
    report.observedAt.replace(/[:.]/g, '-')
  )
  await mkdir(output, { recursive: true, mode: 0o700 })
  await writeFile(
    join(output, 'registry.json'),
    JSON.stringify(report, null, 2),
    { mode: 0o600, flag: 'wx' }
  )
  await writeFile(
    join(output, 'value-rules-v1.json'),
    JSON.stringify(rules, null, 2),
    { mode: 0o600, flag: 'wx' }
  )
  console.log(
    JSON.stringify(
      {
        output,
        observedAt: report.observedAt,
        audiences: audiences.length,
        customerLists: audiences.filter(
          a => a.subtype === 'CUSTOM'
        ).length,
        lookalikes: audiences.filter(
          a => a.subtype === 'LOOKALIKE'
        ).length,
        buyerSnapshot: report.buyerSnapshot,
        localAudit,
        labelMigration,
        ruleSets: report.ruleSets.map(set => ({
          id: set.id,
          name: set.name,
          attachedAdsets: set.attachedAdsets
        })),
        regions,
        blockers: report.blockers
      },
      null,
      2
    )
  )
}

main().catch(error => {
  console.error(
    error instanceof z.ZodError ?
      'External input validation failed; no raw data logged'
    : error instanceof Error ? error.message
    : 'Audience audit failed'
  )
  process.exitCode = 1
})
