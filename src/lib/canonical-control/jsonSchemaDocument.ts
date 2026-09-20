import { z } from 'zod'

const jsonPrimitiveSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null()
])

// Closed vocabulary for the JSON Schema emitted by the canonical Zod schemas.
// A new keyword must be supported explicitly, not silently accepted as unknown.
export const jsonSchemaDocument = z.strictObject({
  $schema: z
    .literal('https://json-schema.org/draft/2020-12/schema')
    .optional(),
  $id: z.string().optional(),
  $ref: z.string().optional(),
  type: z
    .enum([
      'object',
      'array',
      'string',
      'number',
      'integer',
      'boolean',
      'null'
    ])
    .optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  const: jsonPrimitiveSchema.optional(),
  enum: z.array(jsonPrimitiveSchema).optional(),
  format: z.string().optional(),
  pattern: z.string().optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  exclusiveMinimum: z.number().optional(),
  exclusiveMaximum: z.number().optional(),
  multipleOf: z.number().positive().optional(),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().nonnegative().optional(),
  minItems: z.number().int().nonnegative().optional(),
  maxItems: z.number().int().nonnegative().optional(),
  uniqueItems: z.boolean().optional(),
  required: z.array(z.string()).optional(),
  readOnly: z.boolean().optional(),
  get properties() {
    return z.record(z.string(), jsonSchemaDocument).optional()
  },
  get $defs() {
    return z.record(z.string(), jsonSchemaDocument).optional()
  },
  get items() {
    return z.union([z.boolean(), jsonSchemaDocument]).optional()
  },
  get prefixItems() {
    return z.array(jsonSchemaDocument).optional()
  },
  get additionalProperties() {
    return z.union([z.boolean(), jsonSchemaDocument]).optional()
  },
  get propertyNames() {
    return jsonSchemaDocument.optional()
  },
  get anyOf() {
    return z.array(jsonSchemaDocument).optional()
  },
  get oneOf() {
    return z.array(jsonSchemaDocument).optional()
  },
  get allOf() {
    return z.array(jsonSchemaDocument).optional()
  }
})
