import type { MicrofiberColor, MicrofiberSize } from 'types/product/'

export const variantMap: Record<
  MicrofiberColor,
  Record<MicrofiberSize, string>
> = {
  vargnatt: {
    medium: '42903231004920',
    large: '42903231070456'
  },
  fjellbla: {
    medium: '42903231037688',
    large: '42903231103224'
  }
}
