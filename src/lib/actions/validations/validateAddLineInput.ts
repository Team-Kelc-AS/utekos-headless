// Path: src/lib/helpers/validations/validateAddLineInput.ts
import 'server-only'

import { AddToCartSchema } from '@/db/zod/schemas/AddToCartSchema'
import type { AddToCartFormValues } from 'types/cart'
import { fromZodError } from 'zod-validation-error'

export async function validateAddLineInput(
  input: AddToCartFormValues
): Promise<void> {
  const result = await AddToCartSchema.safeParseAsync(input)
  if (!result.success) {
    throw fromZodError(result.error)
  }
}
