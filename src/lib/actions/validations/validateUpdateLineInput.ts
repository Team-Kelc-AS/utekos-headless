// Path: src/lib/helpers/validations/validateUpdateLineInput.ts
import 'server-only'

import { fromZodError } from 'zod-validation-error'
import { UpdateCartSchema } from '@/db/zod/schemas/UpdateCartSchema'
import type { UpdateCartLineInput } from 'types/cart'

export async function validateUpdateLineInput(
  input: UpdateCartLineInput
): Promise<void> {
  const result = await UpdateCartSchema.safeParseAsync(input)
  if (!result.success) {
    throw fromZodError(result.error)
  }
}
