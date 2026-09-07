import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { z } from 'zod'
import { parseAudienceCsv } from './parseAudienceCsv'
import { compareAudienceSourceIdentities } from './compareAudienceSourceIdentities'
import { auditAudienceSegments } from './auditAudienceSegments'

export async function readLegacyAudienceSources(
  currentRows: unknown,
  buyerRows: unknown
) {
  const definitions = [
    {
      file: 'liste_beriket_meta_klar.csv',
      audienceId: '120246867005550788',
      segment: 'legacy_other_1_candidate',
      phoneColumn: 'tlf'
    },
    {
      file: 'campingtilhenger_personer_liste14_MED_TLF.csv',
      audienceId: '120247539233010788',
      segment: 'caravan',
      phoneColumn: 'tlf'
    },
    {
      file: 'campingtilhenger_personer_liste15_MED_TLF.csv',
      audienceId: '120247539613940788',
      segment: 'caravan',
      phoneColumn: 'tlf'
    },
    {
      file: 'utekos_shopify_customers_value_meta.csv',
      audienceId: '120247549993570788',
      segment: 'buyer_seed_candidate',
      phoneColumn: 'phone'
    },
    {
      file: 'utekos_shopify_customers_value_ranked_2026-09-03.csv',
      audienceId: '120247513767560788',
      segment: 'buyer_seed_candidate',
      phoneColumn: 'phone'
    },
    {
      file: 'meta_customer_value_seed_st_gen.csv',
      audienceId: '120247435045720788',
      segment: 'buyer_seed_candidate',
      phoneColumn: 'phone'
    },
    {
      file: 'meta_customer_value_seed_st.csv',
      audienceId: '120247435041110788',
      segment: 'buyer_seed_candidate',
      phoneColumn: 'phone'
    },
    {
      file: 'meta_high_value_customer_audience_export_rows.csv',
      audienceId: '120246462023810788',
      segment: 'buyer_seed_candidate',
      phoneColumn: 'phone'
    }
  ]
  return Promise.all(
    definitions.map(async source => {
      const text = await readFile(
        join(homedir(), 'Downloads', source.file),
        'utf8'
      )
      const parsed = parseAudienceCsv(text)
      if (parsed.some(row => !(source.phoneColumn in row)))
        throw new Error(
          `Missing documented phone column in ${source.file}`
        )
      const rows = parsed.map(row => ({
        ...row,
        phone: row[source.phoneColumn] ?? ''
      }))
      return {
        ...source,
        sha256: createHash('sha256').update(text).digest('hex'),
        rowCount: rows.length,
        numericValueRows: rows.filter(
          row =>
            'value' in row &&
            z.coerce.number().nonnegative().safeParse(row.value)
              .success &&
            row.value !== ''
        ).length,
        strongBuyerMatchAudit: auditAudienceSegments(
          [
            {
              source: source.file,
              segment: source.segment,
              rows
            }
          ],
          buyerRows
        ),
        providerMembershipVerified: false,
        comparison: compareAudienceSourceIdentities(
          rows,
          source.segment === 'caravan' ? currentRows : [],
          buyerRows
        )
      }
    })
  )
}
