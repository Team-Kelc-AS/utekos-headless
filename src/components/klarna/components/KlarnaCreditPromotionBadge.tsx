/**
 * @klarna-agent
 * @id klarna-credit-promotion-badge
 * @title Klarna OSM credit promotion badge
 * @domain Klarna
 * @kind osm-placement
 * @export KlarnaCreditPromotionBadge
 * @docs-index /src/components/klarna/agents.txt
 * @data-key credit-promotion-badge
 * @locale nb-NO
 * @dependencies dev/docs/markdown/latest-official/on-site-messaging/product-and-cart-placements.md
 */
// Path: src/components/klarna/components/KlarnaCreditPromotionBadge.tsx

/* TODO: Add type. Reuse or expand existing types if possible.
 See @src/components/klarna/types/index.ts and
 "types/global.d.ts".
*/

export function KlarnaCreditPromotionBadge() {
  return (
    <klarna-placement
      data-key='credit-promotion-badge'
      data-locale='nb-NO'
      data-purchase-amount=''
    ></klarna-placement>
  )
}

/** Original code from Klarna documentation */

/* ```html
 <klarna-placement
      data-key="credit-promotion-badge"
      data-locale="nb-NO"
  data-purchase-amount=""
    ></klarna-placement>
    ``` */

/** Dark theme Original code from Klarna documentation */
/* ```html
<klarna-placement
  data-key="credit-promotion-badge"
  data-locale="nb-NO"
  data-purchase-amount=""
  data-theme="dark"
></klarna-placement>
``` */
