export const metaInsightsFieldPacks = {
  account:
    'id,name,currency,timezone_name,timezone_offset_hours_utc,opportunity_score,account_status,disable_reason,amount_spent,balance,spend_cap',
  campaign:
    'id,name,status,effective_status,configured_status,daily_budget,lifetime_budget,objective,smart_promotion_type,bid_strategy,issues_info,advantage_state_info',
  adSet:
    'id,name,status,effective_status,configured_status,campaign_id,optimization_goal,daily_budget,lifetime_budget,learning_stage_info,value_rules_applied,value_rule_set_id,promoted_object,issues_info,destination_type,bid_strategy,billing_event,attribution_spec,targeting',
  ads: 'id,name,status,effective_status,configured_status,adset_id,issues_info,recommendations,creative{id,name,thumbnail_url,title,body}',
  recommendations:
    'recommendation_type,title,message,importance,estimated_impact,blame_field,object_id,recommendation_data',
  conversion:
    'adset_id,adset_name,campaign_id,campaign_name,ad_id,ad_name,spend,impressions,clicks,cpc,cpm,cpp,ctr,reach,frequency,actions,action_values,cost_per_action_type,outbound_clicks,inline_link_clicks,inline_link_click_ctr,website_ctr,purchase_roas,website_purchase_roas,conversions,conversion_values,cost_per_conversion,quality_ranking,engagement_rate_ranking,conversion_rate_ranking,video_play_actions,video_thruplay_watched_actions,catalog_segment_value,catalog_segment_actions,attribution_setting,objective,results,cost_per_result,auction_bid,auction_competitiveness,date_start,date_stop',
  conversionTotals:
    'adset_id,adset_name,campaign_id,campaign_name,ad_id,ad_name,spend,impressions,clicks,cpc,cpm,cpp,ctr,reach,frequency,actions,action_values,cost_per_action_type,outbound_clicks,inline_link_clicks,inline_link_click_ctr,website_ctr,purchase_roas,website_purchase_roas,conversions,conversion_values,cost_per_conversion,quality_ranking,engagement_rate_ranking,conversion_rate_ranking,video_play_actions,video_thruplay_watched_actions,catalog_segment_value,catalog_segment_actions,attribution_setting,objective,results,cost_per_result,auction_bid,auction_competitiveness,date_start,date_stop,cost_per_inline_link_click,landing_page_view_per_link_click,inline_post_engagement,optimization_goal,wish_bid,unique_clicks,unique_inline_link_clicks,cost_per_unique_click',
  delivery:
    'adset_id,adset_name,campaign_id,campaign_name,spend,impressions,clicks,cpm,ctr,cpc,inline_link_clicks,date_start,date_stop',
  customconversions:
    'id,name,custom_event_type,event_source_id,is_unavailable,retention_days',
  audience:
    'id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,delivery_status,operation_status,lookalike_spec,time_created,time_updated,data_source'
} as const

export type MetaInsightsFieldPack = keyof typeof metaInsightsFieldPacks
