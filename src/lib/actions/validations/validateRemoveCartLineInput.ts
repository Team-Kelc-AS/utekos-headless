// Path: src/lib/helpers/validations/validateRemoveCartLineInput.ts
import 'server-only'

import { fromZodError } from 'zod-validation-error'
import { RemoveCartLineSchema } from '@/db/zod/schemas/RemoveCartLineSchema'
import type { RemoveCartLineInput } from 'types/cart'

export async function validateRemoveCartLineInput(
  input: RemoveCartLineInput
): Promise<void> {
  const result = await RemoveCartLineSchema.safeParseAsync(input)
  if (!result.success) {
    throw fromZodError(result.error)
  }
}
