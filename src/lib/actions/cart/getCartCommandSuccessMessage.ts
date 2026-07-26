import type { CartCommand } from 'types/cart'

export function getCartCommandSuccessMessage(command: CartCommand): string {
  switch (command.type) {
    case 'add-lines':
      return 'Varer lagt til.'
    case 'update-line':
      return 'Handlekurv oppdatert.'
    case 'remove-line':
      return 'Vare fjernet fra handlekurv.'
    case 'clear':
      return 'Handlekurven er tømt.'
  }
}
