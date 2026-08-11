/**
 * @klarna-agent
 * @id klarna-top-strip-promotion-auto-size
 * @title Klarna OSM top strip promotion auto-size
 * @domain Klarna
 * @kind osm-placement
 * @export KlarnaTopStripPromotionAutoSize
 * @docs-index /src/components/klarna/agents.txt
 * @data-key top-strip-promotion-auto-size
 * @locale nb-NO
 * @dependencies dev/docs/markdown/latest-official/on-site-messaging/product-and-cart-placements.md
 */
// Path: src/components/klarna/components/KlarnaTopStripPromotionAutoSize.tsx

/* TODO: Add type. Reuse or expand existing types if possible.
 See @/components/klarna/types/index.ts and
 "global.d.ts".
*/

export function KlarnaTopStripPromotionAutoSize() {
  return (
    <klarna-placement
      data-key='top-strip-promotion-auto-size'
      data-locale='nb-NO'
      data-theme='dark'
    ></klarna-placement>
  )
}

/** Original code from Klarna documentation */

/* ```html
<klarna-placement
data-key="top-strip-promotion-auto-size"
  data-locale='nb-NO'
></klarna-placement>
``` */

/** Dark theme Original code from Klarna documentation */
/* ```html
<klarna-placement
  data-key='top-strip-promotion-auto-size'
  data-locale='nb-NO'
  data-theme='dark'
></klarna-placement>
``` */
