/**
 * @klarna-agent
 * @id klarna-top-strip-promotion-badge
 * @title Klarna OSM top strip promotion badge
 * @domain Klarna
 * @kind osm-placement
 * @export KlarnaTopStripPromotionBadge
 * @docs-index /src/components/klarna/agents.txt
 * @data-key top-strip-promotion-badge
 * @locale nb-NO
 * @dependencies dev/docs/markdown/latest-official/on-site-messaging/product-and-cart-placements.md
 */
// Path: src/components/klarna/components/KlarnaTopStripPromotionBadge.tsx

export function KlarnaTopStripPromotionBadge() {
  return (
    <klarna-placement
      data-key='top-strip-promotion-badge'
      data-locale='nb-NO'
      data-theme='dark'
      data-purchase-amount=''
    ></klarna-placement>
  )
}

/** Original code from Klarna documentation */

/* ```html
   <klarna-placement
        data-key="top-strip-promotion-badge"
        data-locale="nb-NO"
    data-purchase-amount=""
      ></klarna-placement>
      ``` */

/** Dark theme Original code from Klarna documentation */
/* ```html
  <klarna-placement
    data-key="top-strip-promotion-badge"
    data-locale="nb-NO"
    data-purchase-amount=""
    data-theme="dark"
  ></klarna-placement>
  ``` */
