import type { ShopifyCheckoutObservation } from '../shopifyCheckoutObservationContract'

export type ShopifyCheckoutObservationWriteResult = {
  status: 'inserted' | 'duplicate' | 'conflict'
  observationCount: number
}

export interface ShopifyCheckoutObservationStore {
  persist(
    observation: ShopifyCheckoutObservation
  ): Promise<ShopifyCheckoutObservationWriteResult>
}
