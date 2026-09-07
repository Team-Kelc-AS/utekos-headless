import { z } from 'zod'

export const metaAudienceSchema = z.object({
  id: z.string(),
  name: z.string(),
  subtype: z.string(),
  audience_labels: z.array(z.string()).default([]),
  is_value_based: z.boolean().optional(),
  customer_file_source: z.string().optional(),
  time_updated: z.number().optional(),
  approximate_count_lower_bound: z.number().optional(),
  approximate_count_upper_bound: z.number().optional(),
  delivery_status: z
    .object({ code: z.number(), description: z.string() })
    .optional(),
  operation_status: z
    .object({ code: z.number(), description: z.string() })
    .optional(),
  lookalike_spec: z
    .object({
      origin: z
        .array(
          z.object({
            id: z.string(),
            name: z.string().optional(),
            type: z.string().optional()
          })
        )
        .optional(),
      ratio: z.number().optional(),
      starting_ratio: z.number().optional()
    })
    .optional()
})

export const metaAdSetAuditSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  effective_status: z.string(),
  campaign_id: z.string(),
  value_rules_applied: z.boolean().optional(),
  value_rule_set_id: z.string().optional(),
  targeting: z
    .object({
      custom_audiences: z
        .array(
          z.object({
            id: z.string(),
            name: z.string().optional()
          })
        )
        .optional(),
      excluded_custom_audiences: z
        .array(
          z.object({
            id: z.string(),
            name: z.string().optional()
          })
        )
        .optional()
    })
    .optional()
})

export const metaRuleSetAuditSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  is_default_setting: z.boolean(),
  rules: z.object({
    data: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        status: z.string(),
        adjust_sign: z.string(),
        adjust_value: z.number(),
        criterias: z
          .object({
            data: z.array(
              z.object({
                id: z.string(),
                criteria_type: z.string(),
                operator: z.string(),
                criteria_values: z.array(z.string()),
                criteria_value_types: z.array(z.string())
              })
            ),
            paging: z
              .object({ next: z.string().optional() })
              .optional()
          })
          .optional()
      })
    ),
    paging: z.object({ next: z.string().optional() }).optional()
  })
})
