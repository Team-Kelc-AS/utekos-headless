/**
 * @klarna-agent
 * @id klarna-homepage-promotion-wide
 * @title Klarna OSM homepage promotion wide
 * @domain Klarna
 * @kind osm-placement
 * @export KlarnaHomePagePromotionWide
 * @docs-index /src/components/klarna/agents.txt
 * @data-key homepage-promotion-wide
 * @locale nb-NO
 * @dependencies dev/docs/markdown/latest-official/on-site-messaging/product-and-cart-placements.md
 */
// Path: src/components/klarna/components/KlarnaHomePagePromotionWideComponent.tsx

/* TODO: Add type.
 See @/components/klarna/types/index.ts and
 "global.d.ts".
*/

export function KlarnaHomePagePromotionWide() {
  return (
    <klarna-placement
      data-key='homepage-promotion-wide'
      data-locale='nb-NO'
      data-theme='dark'
    ></klarna-placement>
  )
}

/** Original code from Klarna documentation */

/* ```html
<klarna-placement
  data-key='homepage-promotion-wide'
  data-locale='nb-NO'
  data-theme='dark'
></klarna-placement>
``` */
