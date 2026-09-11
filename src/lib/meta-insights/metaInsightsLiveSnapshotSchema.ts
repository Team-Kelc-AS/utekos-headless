import { z } from 'zod'

const actionRowSchema = z.object({
  action_type: z.string(),
  value: z.string()
})

export const metaInsightsEntitySchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    status: z.string().optional(),
    effective_status: z.string().optional(),
    currency: z.string().optional(),
    timezone_name: z.string().optional(),
    timezone_offset_hours_utc: z.coerce.number().optional(),
    opportunity_score: z.number().optional(),
    account_status: z.number().optional(),
    disable_reason: z.number().optional(),
    amount_spent: z.string().optional(),
    bid_strategy: z.string().optional(),
    configured_status: z.string().optional(),
    daily_budget: z.string().optional(),
    lifetime_budget: z.string().optional(),
    objective: z.string().optional(),
    smart_promotion_type: z.string().optional(),
    campaign_id: z.string().optional(),
    optimization_goal: z.string().optional(),
    destination_type: z.string().optional(),
    billing_event: z.string().optional(),
    attribution_spec: z.unknown().optional(),
    targeting: z.unknown().optional(),
    advantage_state_info: z
      .object({
        advantage_state: z.string().optional(),
        advantage_audience_state: z.string().optional(),
        advantage_budget_state: z.string().optional(),
        advantage_placement_state: z.string().optional()
      })
      .passthrough()
      .optional(),
    value_rules_applied: z.boolean().optional(),
    value_rule_set_id: z.string().optional(),
    promoted_object: z
      .object({
        pixel_id: z.string().optional(),
        custom_event_type: z.string().optional()
      })
      .passthrough()
      .optional(),
    issues_info: z.unknown().optional(),
    learning_stage_info: z
      .object({
        attribution_windows: z.array(z.string()).optional(),
        conversions: z.number().optional(),
        last_sig_edit_ts: z.number().optional(),
        status: z.string().optional()
      })
      .passthrough()
      .optional()
  })
  .passthrough()

export const metaInsightsAdSchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    status: z.string().optional(),
    effective_status: z.string().optional(),
    configured_status: z.string().optional(),
    adset_id: z.string().optional(),
    issues_info: z.unknown().optional(),
    recommendations: z.unknown().optional(),
    creative: z
      .object({
        body: z.string().optional(),
        id: z.string().optional(),
        name: z.string().optional(),
        thumbnail_url: z.string().optional(),
        title: z.string().optional()
      })
      .passthrough()
      .optional()
  })
  .passthrough()

export const metaInsightsRowSchema = z
  .object({
    adset_id: z.string().optional(),
    adset_name: z.string().optional(),
    campaign_id: z.string().optional(),
    campaign_name: z.string().optional(),
    ad_id: z.string().optional(),
    ad_name: z.string().optional(),
    spend: z.string().optional(),
    impressions: z.string().optional(),
    clicks: z.string().optional(),
    cpc: z.string().optional(),
    cpm: z.string().optional(),
    cpp: z.string().optional(),
    ctr: z.string().optional(),
    reach: z.string().optional(),
    frequency: z.string().optional(),
    inline_link_clicks: z.string().optional(),
    quality_ranking: z.string().optional(),
    engagement_rate_ranking: z.string().optional(),
    conversion_rate_ranking: z.string().optional(),
    date_start: z.string().optional(),
    date_stop: z.string().optional(),
    age: z.string().optional(),
    gender: z.string().optional(),
    region: z.string().optional(),
    publisher_platform: z.string().optional(),
    platform_position: z.string().optional(),
    rule_set_id: z.union([z.string(), z.number()]).optional(),
    rule_set_name: z.string().optional(),
    hourly_stats_aggregated_by_advertiser_time_zone: z
      .string()
      .optional(),
    actions: z.array(actionRowSchema).optional(),
    action_values: z.array(actionRowSchema).optional(),
    cost_per_action_type: z.array(actionRowSchema).optional(),
    outbound_clicks: z.array(actionRowSchema).optional(),
    website_ctr: z.array(actionRowSchema).optional(),
    conversions: z.array(actionRowSchema).optional(),
    conversion_values: z.array(actionRowSchema).optional(),
    cost_per_conversion: z.array(actionRowSchema).optional(),
    video_play_actions: z.array(actionRowSchema).optional(),
    video_thruplay_watched_actions: z.array(actionRowSchema).optional(),
    purchase_roas: z.array(actionRowSchema).optional(),
    website_purchase_roas: z.array(actionRowSchema).optional(),
    results: z.array(z.unknown()).optional(),
    cost_per_result: z.array(z.unknown()).optional(),
    attribution_setting: z.string().optional(),
    objective: z.string().optional(),
    optimization_goal: z.string().optional(),
    auction_bid: z.string().optional(),
    auction_competitiveness: z.string().optional(),
    cost_per_inline_link_click: z.string().optional(),
    landing_page_view_per_link_click: z.string().optional(),
    inline_post_engagement: z.string().optional(),
    wish_bid: z.string().optional(),
    unique_clicks: z.string().optional(),
    unique_inline_link_clicks: z.string().optional(),
    cost_per_unique_click: z.string().optional()
  })
  .passthrough()

export const metaInsightsEdgeSchema = z
  .object({
    data: z.array(z.unknown())
  })
  .passthrough()

export const metaInsightsErrorBodySchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.number(),
    error_subcode: z.number().optional()
  })
})
