import { z } from 'zod'
import { valueRuleSetSchema } from './valueRuleSchema'

export function buildTechDownValueRules(input: unknown) {
  const regions = z
    .array(
      z.object({
        key: z.string().regex(/^\d+$/),
        name: z.enum(['Nordland', 'Troms']),
        country_code: z.literal('NO')
      })
    )
    .length(2)
    .parse(input)
  if (
    new Set(regions.map(r => r.name)).size !== 2 ||
    new Set(regions.map(r => r.key)).size !== 2
  )
    throw new Error('Both verified regions required')
  const label = {
    criteria_type: 'AUDIENCE_LABEL',
    operator: 'CONTAINS',
    criteria_values: ['OTHER_1'],
    criteria_value_types: ['NONE']
  }
  return valueRuleSetSchema.parse({
    name: 'UTEKOS | TechDown | New customer 4C | v1',
    rules: [
      {
        name: '01 | Bobil x 55-64 x Nordland/Troms x FB Feed | +20% total',
        adjust_sign: 'INCREASE',
        adjust_value: 20,
        criterias: [
          label,
          {
            criteria_type: 'AGE',
            operator: 'CONTAINS',
            criteria_values: ['55-64'],
            criteria_value_types: ['NONE']
          },
          {
            criteria_type: 'LOCATION',
            operator: 'CONTAINS',
            criteria_values: regions.map(r => r.key),
            criteria_value_types: [
              'LOCATION_REGION',
              'LOCATION_REGION'
            ]
          },
          {
            criteria_type: 'PLACEMENT',
            operator: 'CONTAINS',
            criteria_values: ['FB_FEED'],
            criteria_value_types: ['NONE']
          }
        ]
      },
      {
        name: '02 | Bobil | +10% total',
        adjust_sign: 'INCREASE',
        adjust_value: 10,
        criterias: [label]
      }
    ]
  })
}
