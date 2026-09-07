import { techDownData } from './data'
import { techDownSizeCards } from './techDownSizeCards'

export const techDownSizeSummary = techDownSizeCards.map(
  card =>
    `${card.size}: total lengde fra nakke til bunn er ${techDownData[0][card.id]}. Høyderåd: ${card.heightGuide}. ${card.fitGuidance.join(' ')}`
)
