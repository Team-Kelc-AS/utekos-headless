/**
 * @klarna-agent
 * @id klarna-footer-promotion-auto-size
 * @title Klarna OSM footer promotion auto-size
 * @domain Klarna
 * @kind osm-placement
 * @export KlarnaFooterPromotionAutoSize
 * @docs-index /src/components/klarna/agents.txt
 * @data-key footer-promotion-auto-size
 * @locale nb-NO
 * @dependencies dev/docs/markdown/latest-official/on-site-messaging/product-and-cart-placements.md
 */
// Path: src/components/klarna/components/KlarnaFooterPromotionAutoSize.tsx
/* TODO: Add type. Reuse or expand existing types if possible.
 See @/components/klarna/types/index.ts and
 "global.d.ts".
*/

export function KlarnaFooterPromotionAutoSize() {
  return (
    <klarna-placement
      data-key='footer-promotion-auto-size'
      data-locale='nb-NO'
      data-theme='dark'
    ></klarna-placement>
  )
}

/** Original code from Klarna documentation */

/* ```html
<klarna-placement
  data-key='footer-promotion-auto-size'
  data-locale='nb-NO'
></klarna-placement>
``` */

/** Dark theme Original code from Klarna documentation */
/* ```html
<klarna-placement
  data-key='footer-promotion-auto-size'
  data-locale='nb-NO'
  data-theme='dark'
></klarna-placement>
``` */
