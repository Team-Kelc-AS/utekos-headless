import { z } from 'zod'

export const metaParameterBuilderProtectedValueSchema = z
  .string()
  .regex(/^[a-f0-9]{64}\.[A-Za-z0-9_-]{8}$/u)

const metaParameterBuilderProtectedValueListSchema = z
  .array(metaParameterBuilderProtectedValueSchema)
  .min(1)
  .max(2)

export const metaParameterBuilderUserDataSchema = z.strictObject(
  {
    city: metaParameterBuilderProtectedValueListSchema.optional(),
    country:
      metaParameterBuilderProtectedValueListSchema.optional(),
    email:
      metaParameterBuilderProtectedValueListSchema.optional(),
    first_name:
      metaParameterBuilderProtectedValueListSchema.optional(),
    last_name:
      metaParameterBuilderProtectedValueListSchema.optional(),
    phone:
      metaParameterBuilderProtectedValueListSchema.optional(),
    postal_code:
      metaParameterBuilderProtectedValueListSchema.optional(),
    state:
      metaParameterBuilderProtectedValueListSchema.optional()
  }
)

export const metaParameterBuilderContextSchema = z.strictObject({
  user_data: metaParameterBuilderUserDataSchema
})

export type MetaParameterBuilderUserData = z.infer<
  typeof metaParameterBuilderUserDataSchema
>
