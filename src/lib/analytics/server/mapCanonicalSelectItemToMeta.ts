import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { CanonicalSelectItem } from '../selectItemEvent'
import { mapCanonicalCommerceEventToMeta } from './mapCanonicalCommerceEventToMeta'

const META_CUSTOMIZE_PRODUCT_ITEM_LIST_IDS = new Set([
  'sticky-cta-catalog',
  'techdown-size-selector'
])

export function resolveMetaSelectItemEventName(
  event: CanonicalSelectItem
): 'CustomizeProduct' | 'SelectItem' {
  return (
      META_CUSTOMIZE_PRODUCT_ITEM_LIST_IDS.has(
        event.custom_data.item_list_id
      )
    ) ?
      'CustomizeProduct'
    : 'SelectItem'
}

export function mapCanonicalSelectItemToMeta(
  event: CanonicalSelectItem
): ServerEvent {
  return mapCanonicalCommerceEventToMeta(
    event,
    resolveMetaSelectItemEventName(event),
    {
      interaction_id: event.custom_data.interaction_id,
      item_list_id: event.custom_data.item_list_id
    }
  )
}
