const TECH_DOWN_SIZE_ORDER = [
  'Stor',
  'Større',
  'Middels',
  'Liten'
] as const

type TechDownHelpChooseCard = {
  sizeLabel: string
  availableForSale: boolean
}

function techDownSizeRank(sizeLabel: string) {
  const index = TECH_DOWN_SIZE_ORDER.indexOf(
    sizeLabel as (typeof TECH_DOWN_SIZE_ORDER)[number]
  )
  return index === -1 ? TECH_DOWN_SIZE_ORDER.length : index
}

export function orderTechDownHelpChooseCards<
  T extends TechDownHelpChooseCard
>(cards: readonly T[]): T[] {
  return [...cards].sort((left, right) => {
    const leftIsSmall = left.sizeLabel === 'Liten'
    const rightIsSmall = right.sizeLabel === 'Liten'
    if (leftIsSmall !== rightIsSmall) return leftIsSmall ? 1 : -1

    if (left.availableForSale !== right.availableForSale) {
      return left.availableForSale ? -1 : 1
    }

    return (
      techDownSizeRank(left.sizeLabel) -
      techDownSizeRank(right.sizeLabel)
    )
  })
}
