import { z } from 'zod'

export function buildValueRuleAttachment(input: unknown) {
  const id = z.string().regex(/^\d+$/).nullable().parse(input)
  return id === null ?
      { value_rules_applied: false as const }
    : {
        value_rules_applied: true as const,
        value_rule_set_id: id
      }
}
