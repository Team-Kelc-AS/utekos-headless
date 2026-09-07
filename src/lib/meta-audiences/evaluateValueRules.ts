import { z } from 'zod'
import { valueRuleSetSchema } from './valueRuleSchema'

export function evaluateValueRules(
  input: unknown,
  subjectInput: unknown
) {
  const set = valueRuleSetSchema.parse(input)
  const subject = z
    .record(z.string(), z.array(z.string()))
    .parse(subjectInput)
  const rule = set.rules.find(r =>
    r.criterias.every(c =>
      c.criteria_values.some(value =>
        (subject[c.criteria_type] ?? []).some(
          actual => actual.toUpperCase() === value.toUpperCase()
        )
      )
    )
  )
  return rule ?
      1 +
        ((rule.adjust_sign === 'INCREASE' ? 1 : -1) *
          rule.adjust_value) /
          100
    : 1
}
