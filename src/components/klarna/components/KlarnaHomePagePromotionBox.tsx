/**
 * @klarna-agent
 * @id klarna-homepage-promotion-box
 * @title Klarna OSM homepage promotion box
 * @domain Klarna
 * @kind osm-placement
 * @export KlarnaHomePagePromotionBox
 * @docs-index /src/components/klarna/agents.txt
 * @data-key homepage-promotion-box
 * @locale nb-NO
 * @dependencies dev/docs/markdown/latest-official/on-site-messaging/product-and-cart-placements.md
 */
// Path: src/components/klarna/components/KlarnaHomePagePromotionBox.tsx

/* TODO: Add type. Reuse or expand existing types if possible.
 See @/components/klarna/types/index.ts and
 "global.d.ts".
*/

export function KlarnaHomePagePromotionBox() {
  return (
    <klarna-placement
      data-key='homepage-promotion-box'
      data-locale='nb-NO'
      data-theme='dark'
    ></klarna-placement>
  )
}
