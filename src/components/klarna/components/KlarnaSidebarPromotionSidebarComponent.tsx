/**
 * @klarna-agent
 * @id klarna-sidebar-promotion-auto-size
 * @title Klarna OSM sidebar promotion auto-size
 * @domain Klarna
 * @kind osm-placement
 * @export KlarnaSidebarPromotionAutoSize
 * @docs-index /src/components/klarna/agents.txt
 * @data-key sidebar-promotion-auto-size
 * @locale nb-NO
 * @dependencies dev/docs/markdown/latest-official/on-site-messaging/product-and-cart-placements.md
 */
// Path: src/components/klarna/components/KlarnaSidebarPromotionSidebarComponent.tsx

export function KlarnaSidebarPromotionAutoSize() {
  return (
    <klarna-placement
      data-key='sidebar-promotion-auto-size'
      data-locale='nb-NO'
      data-theme='dark'
    ></klarna-placement>
  )
}

/** Original code from Klarna documentation */

/* ```html
<klarna-placement
  data-key='sidebar-promotion-auto-size'
  data-locale='nb-NO'
></klarna-placement>
``` */

/** Dark theme Original code from Klarna documentation */
/* ```html
<klarna-placement
  data-key='sidebar-promotion-auto-size'
  data-locale='nb-NO'
  data-theme='dark'
></klarna-placement>
``` */
