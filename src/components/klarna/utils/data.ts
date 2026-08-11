/**
 * @klarna-agent
 * @id default-klarna-placement-data
 * @title Default Klarna placement data constant
 * @domain Klarna
 * @kind utility
 * @export DEFAULT_KLARNA_PLACEMENT_DATA
 * @docs-index /src/components/klarna/agents.txt
 * @dependencies types/index.ts
 */
import type { KlarnaPlacementData } from '../types'

export const DEFAULT_KLARNA_PLACEMENT_DATA: KlarnaPlacementData = {
  key: 'credit-promotion-badge',
  locale: 'nb-NO',
  purchaseAmount: undefined as number | string | undefined
} as const
