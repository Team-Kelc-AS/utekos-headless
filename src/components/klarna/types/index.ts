/**
 * @klarna-agent
 * @id klarna-types
 * @title Shared Klarna placement and Express Checkout types
 * @domain Klarna
 * @kind types
 * @export KlarnaPlacementKey, KlarnaPlacementData, KlarnaExpressCheckoutPayload
 * @docs-index /src/components/klarna/agents.txt
 * @dependencies dev/docs/json/API/Klarna-Payments-API.json
 */
export type KlarnaPlacementKey =
  | 'checkout'
  | 'credit-promotion-auto-size'
  | 'credit-promotion-badge'
  | 'footer-promotion-auto-size'
  | 'homepage-promotion-box'
  | 'homepage-promotion-tall'
  | 'homepage-promotion-wide'
  | 'info-page'
  | 'sidebar-promotion-auto-size'
  | 'top-strip-promotion-auto-size'
  | 'top-strip-promotion-badge'

export type KlarnaPlacementTheme = 'default' | 'dark' | 'custom'

export type KlarnaPlacementMessagePreference =
  | 'klarna'
  | 'prequalification'
  | 'in-store'

export type KlarnaPlacementMessagePrefix = 'Or' | 'or'

export type KlarnaPlacementData = {
  key: KlarnaPlacementKey | undefined
  locale: string | 'nb-NO' | undefined
  purchaseAmount: number | string | undefined
}

export type KlarnaPlacementAttributes = {
  'data-key'?: KlarnaPlacementKey
  'data-locale'?: string
  'data-purchase-amount'?: number | string
  'data-theme'?: KlarnaPlacementTheme
  'data-message-preference'?: KlarnaPlacementMessagePreference
  'data-message-prefix'?: KlarnaPlacementMessagePrefix
  'data-custom-payment-method-ids'?: string
}

export type {
  KlarnaCollectedShippingAddress,
  KlarnaExpressOrderPayload,
  KlarnaOrderLine
} from '@/components/klarna/schemas/klarnaExpressOrderSchema'

/** @deprecated Use KlarnaExpressOrderPayload from schemas instead */
export type KlarnaExpressCheckoutPayload =
  import('@/components/klarna/schemas/klarnaExpressOrderSchema').KlarnaExpressOrderPayload

export type KlarnaExpressCheckoutAuthorizeOptions = {
  auto_finalize?: boolean
  collect_shipping_address?: boolean
}

export type KlarnaExpressCheckoutAuthorizationResult = {
  authorization_token?: string
  approved?: boolean
  show_form?: boolean
  finalize_required?: boolean
  collected_shipping_address?: import('@/components/klarna/schemas/klarnaExpressOrderSchema').KlarnaCollectedShippingAddress
}

export type KlarnaExpressCheckoutAuthorize = (
  options: KlarnaExpressCheckoutAuthorizeOptions,
  payload: KlarnaExpressCheckoutPayload,
  callback: (
    result: KlarnaExpressCheckoutAuthorizationResult
  ) => void
) => void

export type KlarnaExpressCheckoutLoadConfig = {
  container: string
  theme?: 'default' | string
  shape?: 'default' | string
  locale?: string
  on_click?: (authorize: KlarnaExpressCheckoutAuthorize) => void
}

export type KlarnaExpressCheckoutLoadResult = {
  show_form?: boolean
  [key: string]: unknown
}

export type KlarnaPaymentsButtons = {
  init: (config: { client_id: string }) => {
    load: (
      config: KlarnaExpressCheckoutLoadConfig,
      callback?: (
        loadResult: KlarnaExpressCheckoutLoadResult
      ) => void
    ) => void
  }
}

declare global {
  interface Window {
    klarnaAsyncCallback?: () => void
    Klarna?: { Payments: { Buttons: KlarnaPaymentsButtons } }
  }
}
