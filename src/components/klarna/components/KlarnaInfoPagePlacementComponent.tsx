/**
 * @klarna-agent
 * @id klarna-info-page-placement
 * @title Klarna OSM info page placement
 * @domain Klarna
 * @kind osm-placement
 * @export KlarnaInfoPagePlacement
 * @docs-index /src/components/klarna/agents.txt
 * @data-key info-page
 * @locale nb-NO
 * @dependencies dev/docs/markdown/latest-official/on-site-messaging/product-and-cart-placements.md
 */
// Path: src/components/klarna/components/KlarnaInfoPagePlacementComponent.tsx

/* TODO: Add type. Reuse or expand existing types if possible.
 See @/components/klarna/types/index.ts and
 "global.d.ts".
*/

export function KlarnaInfoPagePlacement() {
  return (  
    <klarna-placement
      data-key='info-page'
      data-locale='nb-NO'
    ></klarna-placement>
  )
}

/** Original code from Klarna documentation */

/* ```html
<klarna-placement
  data-key='info-page'
  data-locale='nb-NO'
></klarna-placement>
``` */

/** Dark theme Original code from Klarna documentation */
/* ```html
<klarna-placement
  data-key='info-page'
  data-locale='nb-NO'
  data-theme='dark'
></klarna-placement>
``` */
