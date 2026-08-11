/**
 * @klarna-agent
 * @id klarna-homepage-promotion-tall
 * @title Klarna OSM homepage promotion tall
 * @domain Klarna
 * @kind osm-placement
 * @export KlarnaHomePagePromotionTall
 * @docs-index /src/components/klarna/agents.txt
 * @data-key homepage-promotion-tall
 * @locale nb-NO
 * @dependencies dev/docs/markdown/latest-official/on-site-messaging/product-and-cart-placements.md
 */
// Path: src/components/klarna/components/KlarnaHomePagePromotionTall.tsx

/* TODO: Add type.
 See @/components/klarna/types/index.ts and
 "global.d.ts".
*/

export function KlarnaHomePagePromotionTall() {
  return (
    <klarna-placement
      data-key='homepage-promotion-tall'
      data-locale='nb-NO'
      data-theme='dark'
    ></klarna-placement>
  )
}

/** Original code from Klarna documentation */

/* ```html  
<klarna-placement
data-key='homepage-promotion-tall'
data-locale='nb-NO'
></klarna-placement>
``` */

/** Dark theme Original code from Klarna documentation */
/* ```html
<klarna-placement
  data-key='homepage-promotion-tall'
  data-locale='nb-NO'
  data-theme='dark'
></klarna-placement>
``` */
