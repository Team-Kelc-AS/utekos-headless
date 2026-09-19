import { z } from 'zod'

export const controlInputSchema = z
  .strictObject({
    name: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z][a-z0-9_]*$/)
      .optional(),
    query: z.string().trim().min(1).max(120).optional(),
    limit: z.number().int().min(1).max(5).default(3)
  })
  .refine(
    input => !(input.name && input.query),
    'Use name or query, not both'
  )

export const controlToolInputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 120,
      pattern: '^[a-z][a-z0-9_]*$',
      description:
        'Exact canonical event name. Returns full schema, mappings, parameter lineage and source pipeline without bootstrap.'
    },
    query: {
      type: 'string',
      minLength: 1,
      maxLength: 120,
      description:
        'Text search across event names, policies, parameters and provider mappings. Mutually exclusive with name.'
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      default: 3
    }
  }
} as const
