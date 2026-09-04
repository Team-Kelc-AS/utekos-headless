import {
  META_CATALOG_DEFAULT_PREFERRED_IMAGE_TAGS,
  META_CATALOG_DEFAULT_TRACKING_URL_TAGS
} from './metaCatalogAdDefaults'
import {
  metaCatalogAdInputSchema,
  metaCatalogAdRequestSchema,
  type MetaCatalogAdInput
} from './metaCatalogAdSchema'

export function buildMetaCatalogAd(input: MetaCatalogAdInput) {
  const parsed = metaCatalogAdInputSchema.parse(input)

  return metaCatalogAdRequestSchema.parse({
    name: parsed.adName,
    adset_id: parsed.adSetId,
    conversion_domain: 'utekos.no',
    creative: {
      name: parsed.adName,
      product_set_id: parsed.productSetId,
      object_type: 'SHARE',
      object_story_spec: {
        page_id: parsed.pageId,
        ...(parsed.instagramUserId ?
          { instagram_user_id: parsed.instagramUserId }
        : {}),
        template_data: {
          multi_share_end_card: true,
          link: parsed.link,
          message: parsed.message,
          name: '{{product.name}}',
          description: '{{product.current_price}}',
          call_to_action: { type: 'SHOP_NOW' },
          preferred_image_tags: [
            ...META_CATALOG_DEFAULT_PREFERRED_IMAGE_TAGS
          ]
        }
      },
      asset_feed_spec: {
        optimization_type: 'FORMAT_AUTOMATION',
        ad_formats: ['CAROUSEL', 'COLLECTION'],
        descriptions: [{ text: '{{product.description}}' }]
      },
      degrees_of_freedom_spec: {
        creative_features_spec: {
          adapt_to_placement: { enroll_status: 'OPT_IN' },
          media_type_automation: {
            enroll_status:
              parsed.includeProductVideo ? 'OPT_IN' : 'OPT_OUT'
          }
        }
      },
      url_tags: META_CATALOG_DEFAULT_TRACKING_URL_TAGS
    },
    status: 'PAUSED',
    tracking_specs: [
      {
        'action.type': 'offsite_conversion',
        fb_pixel: parsed.pixelId
      }
    ]
  })
}
