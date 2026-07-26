import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { CanonicalViewItemList } from '../viewItemListEvent'
import { mapCanonicalCommerceEventToMeta } from './mapCanonicalCommerceEventToMeta'

export function mapCanonicalViewItemListToMeta(
  event: CanonicalViewItemList
): ServerEvent {
  return mapCanonicalCommerceEventToMeta(event, 'ViewItemList', {
    gross_value: event.custom_data.gross_value,
    impression_sequence: event.custom_data.impression_sequence,
    item_list_id: event.custom_data.item_list_id,
    item_list_name: event.custom_data.item_list_name,
    net_value: event.custom_data.value,
    tax_value: event.custom_data.tax_value,
    total_item_count: event.custom_data.total_item_count
  })
}
