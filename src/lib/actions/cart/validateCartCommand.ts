import { validateAddLineInput } from '@/lib/actions/validations/validateAddLineInput'
import { validateClearCartInput } from '@/lib/actions/validations/validateClearCartInput'
import { validateRemoveCartLineInput } from '@/lib/actions/validations/validateRemoveCartLineInput'
import { validateUpdateLineInput } from '@/lib/actions/validations/validateUpdateLineInput'
import type { CartCommand } from 'types/cart'

export async function validateCartCommand(
  command: CartCommand
): Promise<void> {
  switch (command.type) {
    case 'add-lines':
      await Promise.all(command.lines.map(validateAddLineInput))
      return
    case 'update-line':
      await validateUpdateLineInput(command.input)
      return
    case 'remove-line':
      await validateRemoveCartLineInput(command.input)
      return
    case 'clear':
      await validateClearCartInput({})
  }
}
