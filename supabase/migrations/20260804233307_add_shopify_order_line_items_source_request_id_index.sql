create index if not exists shopify_order_line_items_source_request_id_idx
  on commerce.shopify_order_line_items (source_request_id);

analyze commerce.shopify_order_line_items;;
