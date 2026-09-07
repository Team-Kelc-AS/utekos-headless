import { z } from 'zod'

export const valueCriterionSchema = z
  .strictObject({
    criteria_type: z.enum([
      'AUDIENCE_LABEL',
      'AGE',
      'LOCATION',
      'PLACEMENT'
    ]),
    operator: z.literal('CONTAINS'),
    criteria_values: z.array(z.string().min(1)).min(1),
    criteria_value_types: z
      .array(z.enum(['NONE', 'LOCATION_REGION']))
      .min(1)
  })
  .refine(
    c =>
      c.criteria_values.length === c.criteria_value_types.length,
    'Criterion arrays must align'
  )
  .refine(
    c =>
      c.criteria_value_types.every(
        t =>
          t ===
          (c.criteria_type === 'LOCATION' ?
            'LOCATION_REGION'
          : 'NONE')
      ),
    'Invalid criterion value type'
  )

export const valueRuleSetSchema = z.strictObject({
  name: z.string().min(1),
  rules: z
    .array(
      z
        .strictObject({
          name: z.string().min(1),
          adjust_sign: z.enum(['INCREASE', 'DECREASE']),
          adjust_value: z.number().int().min(1).max(1000),
          criterias: z.array(valueCriterionSchema).min(1).max(4)
        })
        .refine(
          r =>
            r.adjust_sign === 'INCREASE' || r.adjust_value <= 90,
          'Decrease maximum is 90'
        )
        .refine(
          r =>
            new Set(r.criterias.map(c => c.criteria_type))
              .size === r.criterias.length,
          'Duplicate criterion type'
        )
    )
    .min(1)
    .max(10)
})
