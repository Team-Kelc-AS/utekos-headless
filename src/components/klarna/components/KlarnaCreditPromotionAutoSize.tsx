/**
 * @klarna-agent
 * @id klarna-credit-promotion-auto-size
 * @title Klarna OSM credit promotion auto-size
 * @domain Klarna
 * @kind osm-placement
 * @export KlarnaCreditPromotionAutoSize
 * @docs-index /src/components/klarna/agents.txt
 * @data-key credit-promotion-auto-size
 * @locale nb-NO
 * @dependencies dev/docs/markdown/latest-official/on-site-messaging/product-and-cart-placements.md
 */
// Path: src/components/klarna/components/KlarnaCreditPromotionAutoSize.tsx

import type { KlarnaPlacementTheme } from '@/components/klarna/types'

type KlarnaCreditPromotionAutoSizeProps = {
  id?: string
  purchaseAmount?: number | string
  /** Klarna OSM themes: omit/`default` = light, `dark`, or `custom` (Merchant portal). */
  theme?: KlarnaPlacementTheme
  className?: string
}

export function KlarnaCreditPromotionAutoSize({
  id,
  purchaseAmount = '',
  theme = 'default',
  className = ''
}: KlarnaCreditPromotionAutoSizeProps) {
  return (
    <klarna-placement
      id={id}
      className={['klarna-credit-promotion-auto-size', className]
        .filter(Boolean)
        .join(' ')}
      data-key='credit-promotion-auto-size'
      data-locale='nb-NO'
      data-theme={theme}
      data-purchase-amount={purchaseAmount}
    ></klarna-placement>
  )
}

/** Original code from Klarna documentation */

/* ```html
 <klarna-placement
      data-key="credit-promotion-auto-size"
      data-locale="nb-NO"
  data-purchase-amount=""
    ></klarna-placement>
    ``` */
