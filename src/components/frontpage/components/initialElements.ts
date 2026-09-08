import { Check, Feather, Heart, Moon } from 'lucide-react'
import type { EdgeData, NodeData } from 'types/flow.types'

export type IconName = keyof typeof iconMap

export const iconMap = {
  moon: Moon,
  feather: Feather,
  heart: Heart,
  check: Check
}

const centerX = 260
const centerY = 260
const nodeWidth = 208
const nodeHeight = 54
const centerNodeSize = 112

/** Compact orbit — works on mobile. */
export const networkOrbitMobile = { offsetX: 244, offsetY: 214 } as const

/** Wider orbit — iPad / laptop / desktop (more air from center). */
export const networkOrbitDesktop = { offsetX: 254, offsetY: 248 } as const

const benefitDefs = [
  {
    id: 'benefit-1',
    icon: 'moon' as IconName,
    text: 'Forlenget kveldene',
    corner: 'tl' as const
  },
  {
    id: 'benefit-2',
    icon: 'feather' as IconName,
    text: 'Overraskende lett',
    corner: 'tr' as const
  },
  {
    id: 'benefit-3',
    icon: 'heart' as IconName,
    text: 'Gjennomført kvalitet',
    corner: 'bl' as const
  },
  {
    id: 'benefit-4',
    icon: 'check' as IconName,
    text: 'Verdt hver krone',
    corner: 'br' as const
  }
]

function positionForCorner(
  corner: 'tl' | 'tr' | 'bl' | 'br',
  offsetX: number,
  offsetY: number
) {
  switch (corner) {
    case 'tl':
      return { x: centerX - offsetX, y: centerY - offsetY }
    case 'tr':
      return {
        x: centerX + offsetX - nodeWidth,
        y: centerY - offsetY
      }
    case 'bl':
      return {
        x: centerX - offsetX,
        y: centerY + offsetY - nodeHeight
      }
    case 'br':
      return {
        x: centerX + offsetX - nodeWidth,
        y: centerY + offsetY - nodeHeight
      }
  }
}

export function createNetworkNodes(
  offsetX: number,
  offsetY: number
): NodeData[] {
  const center: NodeData = {
    id: 'center',
    type: 'center',
    position: {
      x: centerX - centerNodeSize / 2,
      y: centerY - centerNodeSize / 2
    },
    width: centerNodeSize,
    height: centerNodeSize
  }

  const benefits: NodeData[] = benefitDefs.map(def => ({
    id: def.id,
    type: 'benefit',
    position: positionForCorner(def.corner, offsetX, offsetY),
    width: nodeWidth,
    height: nodeHeight,
    data: {
      icon: def.icon,
      text: def.text,
      color: 'var(--accent)',
      iconColor: 'var(--foreground)'
    }
  }))

  return [center, ...benefits]
}

export const nodes = createNetworkNodes(
  networkOrbitMobile.offsetX,
  networkOrbitMobile.offsetY
)

export const nodesDesktop = createNetworkNodes(
  networkOrbitDesktop.offsetX,
  networkOrbitDesktop.offsetY
)

export const edges: EdgeData[] = [
  {
    id: 'e-center-1',
    sourceId: 'center',
    targetId: 'benefit-1',
    data: { color: 'var(--card-foreground)' }
  },
  {
    id: 'e-center-2',
    sourceId: 'center',
    targetId: 'benefit-2',
    data: { color: 'var(--card-foreground)' }
  },
  {
    id: 'e-center-3',
    sourceId: 'center',
    targetId: 'benefit-3',
    data: { color: 'var(--card-foreground)' }
  },
  {
    id: 'e-center-4',
    sourceId: 'center',
    targetId: 'benefit-4',
    data: { color: 'var(--card-foreground)' }
  }
]
