import type { ZodType } from 'zod'
import { canonicalAddToCartSchema } from '../../src/lib/analytics/addToCartEvent'
import { canonicalAddToWishlistSchema } from '../../src/lib/analytics/addToWishlistEvent'
import { canonicalBeginCheckoutSchema } from '../../src/lib/analytics/beginCheckoutEvent'
import { canonicalFilterApplySchema } from '../../src/lib/analytics/filterApplyEvent'
import { canonicalFormErrorSchema } from '../../src/lib/analytics/formErrorEvent'
import { canonicalFormStartSchema } from '../../src/lib/analytics/formStartEvent'
import { canonicalFormSubmitSchema } from '../../src/lib/analytics/formSubmitEvent'
import { canonicalGenerateLeadSchema } from '../../src/lib/analytics/generateLeadEvent'
import { canonicalHeroInteractSchema } from '../../src/lib/analytics/heroInteractEvent'
import { canonicalInteractWithAccordionSchema } from '../../src/lib/analytics/interactWithAccordionEvent'
import { canonicalOpenQuickViewSchema } from '../../src/lib/analytics/openQuickViewEvent'
import { canonicalPageViewSchema } from '../../src/lib/analytics/pageViewEvent'
import { canonicalRemoveFromCartSchema } from '../../src/lib/analytics/removeFromCartEvent'
import { canonicalScrollDepthSchema } from '../../src/lib/analytics/scrollDepthEvent'
import { canonicalSearchSchema } from '../../src/lib/analytics/searchEvent'
import { canonicalSelectItemSchema } from '../../src/lib/analytics/selectItemEvent'
import { canonicalSelectPromotionSchema } from '../../src/lib/analytics/selectPromotionEvent'
import { canonicalSizeGuideViewSchema } from '../../src/lib/analytics/sizeGuideViewEvent'
import { canonicalSortApplySchema } from '../../src/lib/analytics/sortApplyEvent'
import { canonicalVariantSelectSchema } from '../../src/lib/analytics/variantSelectEvent'
import { canonicalVideoProgressSchema } from '../../src/lib/analytics/videoProgressEvent'
import { canonicalViewCartSchema } from '../../src/lib/analytics/viewCartEvent'
import { canonicalViewCategorySchema } from '../../src/lib/analytics/viewCategoryEvent'
import { canonicalViewItemSchema } from '../../src/lib/analytics/viewItemEvent'
import { canonicalViewItemListSchema } from '../../src/lib/analytics/viewItemListEvent'
import { canonicalViewPromotionSchema } from '../../src/lib/analytics/viewPromotionEvent'
import { canonicalViewSearchResultsSchema } from '../../src/lib/analytics/viewSearchResultsEvent'

type EventCatalogEntry = Readonly<{
  acceptFile: string
  componentName: string
  description: string
  eventName: string
  example: unknown
  normalizerFile: string
  requestHandlerFile: string
  routeHandlerFile: string
  routeSegment: string
  schema: ZodType
  schemaFile: string
  summary: string
  tag: string
}>

const eventId = '11111111-1111-4111-8111-111111111111'
const pageViewId = '22222222-2222-4222-8222-222222222222'
const eventTime = '2026-08-15T10:00:00.000Z'
const pageUrl = 'https://utekos.no/products/example-product'

const consent = {
  analytics: 'granted',
  marketing: 'granted',
  preferences: 'granted',
  source: 'cookiebot',
  version: '1'
} as const

const commerceItem = {
  item_id: 'gid://shopify/ProductVariant/1',
  product_id: 'gid://shopify/Product/1',
  variant_id: 'gid://shopify/ProductVariant/1',
  item_name: 'Example product',
  product_handle: 'example-product',
  quantity: 1,
  unit_price: 100,
  gross_unit_price: 125,
  tax_amount: 25,
  tax_rate: 0.25,
  taxable: true,
  price_includes_tax: true,
  available_for_sale: true,
  currently_not_in_stock: false,
  quantity_available: 10,
  selected_options: [],
  collection_ids: [],
  collection_titles: []
}

const commerceValue = {
  currency: 'NOK',
  value: 100,
  gross_value: 125,
  tax_value: 25,
  items: [commerceItem]
}

function envelope(
  eventName: string,
  source: 'server' | 'web' | 'webhook'
) {
  return {
    schema_version: 1,
    event_name: eventName,
    event_id: eventId,
    event_time: eventTime,
    source,
    environment: 'test',
    consent
  }
}

function browserPageContext() {
  return {
    page_url: pageUrl,
    page_title: 'Example product | Utekos',
    page_view_id: pageViewId
  }
}

function entry(
  input: Omit<
    EventCatalogEntry,
    | 'acceptFile'
    | 'normalizerFile'
    | 'requestHandlerFile'
    | 'routeHandlerFile'
    | 'schemaFile'
  > & { symbol: string }
) {
  const { symbol, ...rest } = input

  return {
    ...rest,
    acceptFile: `src/lib/analytics/server/acceptCanonical${symbol}.ts`,
    normalizerFile: `src/lib/analytics/server/normalizeCanonical${symbol}.ts`,
    requestHandlerFile: `src/lib/analytics/server/handleCanonical${symbol}Request.ts`,
    routeHandlerFile: `src/lib/analytics/server/handleCanonical${symbol}Route.ts`,
    schemaFile: `src/lib/analytics/${rest.eventName
      .split('_')
      .map((part, index) =>
        index === 0 ? part : (
          `${part[0]?.toUpperCase()}${part.slice(1)}`
        )
      )
      .join('')}Event.ts`
  } satisfies EventCatalogEntry
}

export const utekosEventsContractCatalog = [
  entry({
    symbol: 'AddToCart',
    componentName: 'AddToCartEvent',
    description:
      'Accepts the canonical add_to_cart payload produced after a successful cart mutation.',
    eventName: 'add_to_cart',
    example: {
      ...envelope('add_to_cart', 'web'),
      ...browserPageContext(),
      custom_data: {
        ...commerceValue,
        cart_mutation_id: 'cart-mutation-1',
        cart_id: 'gid://shopify/Cart/1'
      }
    },
    routeSegment: 'add-to-cart',
    schema: canonicalAddToCartSchema,
    summary: 'Collect an add-to-cart event',
    tag: 'Commerce'
  }),
  entry({
    symbol: 'AddToWishlist',
    componentName: 'AddToWishlistEvent',
    description:
      'Accepts a canonical wishlist intent with the referenced commerce item.',
    eventName: 'add_to_wishlist',
    example: {
      ...envelope('add_to_wishlist', 'web'),
      ...browserPageContext(),
      custom_data: {
        ...commerceValue,
        wishlist_mutation_id: 'wishlist-mutation-1'
      }
    },
    routeSegment: 'add-to-wishlist',
    schema: canonicalAddToWishlistSchema,
    summary: 'Collect an add-to-wishlist event',
    tag: 'Commerce'
  }),
  entry({
    symbol: 'BeginCheckout',
    componentName: 'BeginCheckoutEvent',
    description:
      'Accepts the canonical begin_checkout payload and records the checkout method resolved from the request header.',
    eventName: 'begin_checkout',
    example: {
      ...envelope('begin_checkout', 'web'),
      ...browserPageContext(),
      custom_data: {
        ...commerceValue,
        cart_id: 'gid://shopify/Cart/1',
        checkout_id: 'checkout-1',
        creation_revision: '1'
      }
    },
    routeSegment: 'begin-checkout',
    schema: canonicalBeginCheckoutSchema,
    summary: 'Collect a begin-checkout event',
    tag: 'Commerce'
  }),
  entry({
    symbol: 'FilterApply',
    componentName: 'FilterApplyEvent',
    description:
      'Accepts a canonical product-list filter interaction.',
    eventName: 'filter_apply',
    example: {
      ...envelope('filter_apply', 'web'),
      ...browserPageContext(),
      custom_data: {
        interaction_id: 'filter-1',
        result_revision: 1,
        filter_name: 'size',
        filter_value: 'large',
        result_count: 8
      }
    },
    routeSegment: 'filter-apply',
    schema: canonicalFilterApplySchema,
    summary: 'Collect a filter-apply event',
    tag: 'Discovery'
  }),
  entry({
    symbol: 'FormError',
    componentName: 'FormErrorEvent',
    description:
      'Accepts a canonical form failure classification without free-text error content.',
    eventName: 'form_error',
    example: {
      ...envelope('form_error', 'web'),
      ...browserPageContext(),
      custom_data: {
        attempt_id: 'attempt-1',
        form_id: 'contact',
        error_category: 'validation'
      }
    },
    routeSegment: 'form-error',
    schema: canonicalFormErrorSchema,
    summary: 'Collect a form-error event',
    tag: 'Leads'
  }),
  entry({
    symbol: 'FormStart',
    componentName: 'FormStartEvent',
    description:
      'Accepts the first interaction with a tracked form.',
    eventName: 'form_start',
    example: {
      ...envelope('form_start', 'web'),
      ...browserPageContext(),
      custom_data: {
        form_id: 'contact',
        form_name: 'Contact form'
      }
    },
    routeSegment: 'form-start',
    schema: canonicalFormStartSchema,
    summary: 'Collect a form-start event',
    tag: 'Leads'
  }),
  entry({
    symbol: 'FormSubmit',
    componentName: 'FormSubmitEvent',
    description:
      'Accepts the server-classified outcome of a form submission.',
    eventName: 'form_submit',
    example: {
      ...envelope('form_submit', 'server'),
      page_url: pageUrl,
      page_view_id: pageViewId,
      custom_data: {
        submission_id: 'submission-1',
        form_id: 'contact',
        form_name: 'Contact form',
        result: 'accepted'
      }
    },
    routeSegment: 'form-submit',
    schema: canonicalFormSubmitSchema,
    summary: 'Collect a form-submit event',
    tag: 'Leads'
  }),
  entry({
    symbol: 'GenerateLead',
    componentName: 'GenerateLeadEvent',
    description:
      'Accepts the server-classified canonical lead generated by a successful submission.',
    eventName: 'generate_lead',
    example: {
      ...envelope('generate_lead', 'server'),
      page_url: pageUrl,
      page_view_id: pageViewId,
      custom_data: {
        submission_id: 'submission-1',
        form_id: 'contact',
        lead_type: 'contact'
      }
    },
    routeSegment: 'generate-lead',
    schema: canonicalGenerateLeadSchema,
    summary: 'Collect a generate-lead event',
    tag: 'Leads'
  }),
  entry({
    symbol: 'HeroInteract',
    componentName: 'HeroInteractEvent',
    description:
      'Accepts an interaction with a tracked hero call to action.',
    eventName: 'hero_interact',
    example: {
      ...envelope('hero_interact', 'web'),
      ...browserPageContext(),
      custom_data: {
        cta_id: 'hero-primary',
        destination_path: '/collections/all',
        click_sequence: 1
      }
    },
    routeSegment: 'hero-interact',
    schema: canonicalHeroInteractSchema,
    summary: 'Collect a hero-interaction event',
    tag: 'Engagement'
  }),
  entry({
    symbol: 'InteractWithAccordion',
    componentName: 'InteractWithAccordionEvent',
    description:
      'Accepts an accordion-open interaction associated with one commerce item.',
    eventName: 'interact_with_accordion',
    example: {
      ...envelope('interact_with_accordion', 'web'),
      ...browserPageContext(),
      custom_data: {
        ...commerceValue,
        accordion_id: 'materials',
        accordion_title: 'Materials',
        interaction_sequence: 1,
        interaction_type: 'open'
      }
    },
    routeSegment: 'interact-with-accordion',
    schema: canonicalInteractWithAccordionSchema,
    summary: 'Collect an accordion-interaction event',
    tag: 'Engagement'
  }),
  entry({
    symbol: 'OpenQuickView',
    componentName: 'OpenQuickViewEvent',
    description:
      'Accepts the opening of a product quick-view surface.',
    eventName: 'open_quick_view',
    example: {
      ...envelope('open_quick_view', 'web'),
      ...browserPageContext(),
      custom_data: {
        ...commerceValue,
        open_sequence: 1,
        source_surface: 'product-card'
      }
    },
    routeSegment: 'open-quick-view',
    schema: canonicalOpenQuickViewSchema,
    summary: 'Collect an open-quick-view event',
    tag: 'Engagement'
  }),
  entry({
    symbol: 'PageView',
    componentName: 'PageViewEvent',
    description:
      'Accepts a canonical browser page view and may set first-party browser identifier cookies.',
    eventName: 'page_view',
    example: {
      ...envelope('page_view', 'web'),
      ...browserPageContext()
    },
    routeSegment: 'page-view',
    schema: canonicalPageViewSchema,
    summary: 'Collect a page-view event',
    tag: 'Core'
  }),
  entry({
    symbol: 'RemoveFromCart',
    componentName: 'RemoveFromCartEvent',
    description:
      'Accepts a canonical removal after a successful cart mutation.',
    eventName: 'remove_from_cart',
    example: {
      ...envelope('remove_from_cart', 'web'),
      ...browserPageContext(),
      custom_data: {
        ...commerceValue,
        cart_mutation_id: 'cart-mutation-2',
        cart_id: 'gid://shopify/Cart/1'
      }
    },
    routeSegment: 'remove-from-cart',
    schema: canonicalRemoveFromCartSchema,
    summary: 'Collect a remove-from-cart event',
    tag: 'Commerce'
  }),
  entry({
    symbol: 'ScrollDepth',
    componentName: 'ScrollDepthEvent',
    description: 'Accepts a canonical page scroll milestone.',
    eventName: 'scroll_depth',
    example: {
      ...envelope('scroll_depth', 'web'),
      ...browserPageContext(),
      custom_data: {
        threshold: 50,
        percent_scrolled: 50,
        document_height: 2400
      }
    },
    routeSegment: 'scroll-depth',
    schema: canonicalScrollDepthSchema,
    summary: 'Collect a scroll-depth event',
    tag: 'Engagement'
  }),
  entry({
    symbol: 'Search',
    componentName: 'SearchEvent',
    description:
      'Accepts a canonical search action and its immediate result state.',
    eventName: 'search',
    example: {
      ...envelope('search', 'web'),
      ...browserPageContext(),
      custom_data: {
        search_id: 'search-1',
        search_term: 'utepeis',
        result_state: 'results'
      }
    },
    routeSegment: 'search',
    schema: canonicalSearchSchema,
    summary: 'Collect a search event',
    tag: 'Discovery'
  }),
  entry({
    symbol: 'SelectItem',
    componentName: 'SelectItemEvent',
    description:
      'Accepts selection of exactly one item from a product list.',
    eventName: 'select_item',
    example: {
      ...envelope('select_item', 'web'),
      ...browserPageContext(),
      custom_data: {
        interaction_id: 'select-item-1',
        item_list_id: 'featured-products',
        destination_url: pageUrl,
        ...commerceValue
      }
    },
    routeSegment: 'select-item',
    schema: canonicalSelectItemSchema,
    summary: 'Collect a select-item event',
    tag: 'Discovery'
  }),
  entry({
    symbol: 'SelectPromotion',
    componentName: 'SelectPromotionEvent',
    description:
      'Accepts selection of a named promotional creative.',
    eventName: 'select_promotion',
    example: {
      ...envelope('select_promotion', 'web'),
      ...browserPageContext(),
      custom_data: {
        interaction_id: 'promotion-click-1',
        promotion_id: 'summer-1',
        promotion_name: 'Summer campaign',
        creative_name: 'Hero summer',
        creative_slot: 'hero',
        items: [commerceItem]
      }
    },
    routeSegment: 'select-promotion',
    schema: canonicalSelectPromotionSchema,
    summary: 'Collect a select-promotion event',
    tag: 'Promotion'
  }),
  entry({
    symbol: 'SizeGuideView',
    componentName: 'SizeGuideViewEvent',
    description: 'Accepts opening of a product size guide.',
    eventName: 'size_guide_view',
    example: {
      ...envelope('size_guide_view', 'web'),
      ...browserPageContext(),
      custom_data: {
        guide_id: 'comfyrobe-size-guide',
        open_sequence: 1
      }
    },
    routeSegment: 'size-guide-view',
    schema: canonicalSizeGuideViewSchema,
    summary: 'Collect a size-guide-view event',
    tag: 'Engagement'
  }),
  entry({
    symbol: 'SortApply',
    componentName: 'SortApplyEvent',
    description: 'Accepts a product-list sorting interaction.',
    eventName: 'sort_apply',
    example: {
      ...envelope('sort_apply', 'web'),
      ...browserPageContext(),
      custom_data: {
        interaction_id: 'sort-1',
        result_revision: 1,
        sort_key: 'price-ascending',
        result_count: 8
      }
    },
    routeSegment: 'sort-apply',
    schema: canonicalSortApplySchema,
    summary: 'Collect a sort-apply event',
    tag: 'Discovery'
  }),
  entry({
    symbol: 'VariantSelect',
    componentName: 'VariantSelectEvent',
    description:
      'Accepts a product variant selection and its availability state.',
    eventName: 'variant_select',
    example: {
      ...envelope('variant_select', 'web'),
      ...browserPageContext(),
      custom_data: {
        interaction_id: 'variant-select-1',
        product_id: commerceItem.product_id,
        variant_id: commerceItem.variant_id,
        item_id: commerceItem.item_id,
        item_variant: 'Large',
        availability: 'available'
      }
    },
    routeSegment: 'variant-select',
    schema: canonicalVariantSelectSchema,
    summary: 'Collect a variant-select event',
    tag: 'Commerce'
  }),
  entry({
    symbol: 'VideoProgress',
    componentName: 'VideoProgressEvent',
    description:
      'Accepts a canonical milestone for a tracked video.',
    eventName: 'video_progress',
    example: {
      ...envelope('video_progress', 'web'),
      ...browserPageContext(),
      custom_data: {
        video_id: 'hero-video',
        milestone: 50,
        video_title: 'Utekos product guide',
        video_duration: 60,
        video_current_time: 30,
        video_percent: 50
      }
    },
    routeSegment: 'video-progress',
    schema: canonicalVideoProgressSchema,
    summary: 'Collect a video-progress event',
    tag: 'Engagement'
  }),
  entry({
    symbol: 'ViewCart',
    componentName: 'ViewCartEvent',
    description:
      'Accepts a canonical view of the current cart contents.',
    eventName: 'view_cart',
    example: {
      ...envelope('view_cart', 'web'),
      ...browserPageContext(),
      custom_data: {
        ...commerceValue,
        cart_id: 'gid://shopify/Cart/1',
        view_sequence: 1
      }
    },
    routeSegment: 'view-cart',
    schema: canonicalViewCartSchema,
    summary: 'Collect a view-cart event',
    tag: 'Commerce'
  }),
  entry({
    symbol: 'ViewCategory',
    componentName: 'ViewCategoryEvent',
    description: 'Accepts a canonical category-page view.',
    eventName: 'view_category',
    example: {
      ...envelope('view_category', 'web'),
      ...browserPageContext(),
      custom_data: {
        category_id: 'outdoor-living',
        category_name: 'Outdoor living',
        view_sequence: 1
      }
    },
    routeSegment: 'view-category',
    schema: canonicalViewCategorySchema,
    summary: 'Collect a view-category event',
    tag: 'Discovery'
  }),
  entry({
    symbol: 'ViewItem',
    componentName: 'ViewItemEvent',
    description:
      'Accepts a canonical product detail view with commerce value.',
    eventName: 'view_item',
    example: {
      ...envelope('view_item', 'web'),
      ...browserPageContext(),
      custom_data: commerceValue
    },
    routeSegment: 'view-item',
    schema: canonicalViewItemSchema,
    summary: 'Collect a view-item event',
    tag: 'Commerce'
  }),
  entry({
    symbol: 'ViewItemList',
    componentName: 'ViewItemListEvent',
    description:
      'Accepts a bounded product-list impression batch.',
    eventName: 'view_item_list',
    example: {
      ...envelope('view_item_list', 'web'),
      ...browserPageContext(),
      custom_data: {
        ...commerceValue,
        impression_sequence: 1,
        item_list_id: 'featured-products',
        item_list_name: 'Featured products',
        total_item_count: 1
      }
    },
    routeSegment: 'view-item-list',
    schema: canonicalViewItemListSchema,
    summary: 'Collect a view-item-list event',
    tag: 'Discovery'
  }),
  entry({
    symbol: 'ViewPromotion',
    componentName: 'ViewPromotionEvent',
    description:
      'Accepts an observed promotional creative impression.',
    eventName: 'view_promotion',
    example: {
      ...envelope('view_promotion', 'web'),
      ...browserPageContext(),
      custom_data: {
        promotion_id: 'summer-1',
        promotion_name: 'Summer campaign',
        creative_name: 'Hero summer',
        creative_slot: 'hero',
        impression_sequence: 1,
        items: [commerceItem]
      }
    },
    routeSegment: 'view-promotion',
    schema: canonicalViewPromotionSchema,
    summary: 'Collect a view-promotion event',
    tag: 'Promotion'
  }),
  entry({
    symbol: 'ViewSearchResults',
    componentName: 'ViewSearchResultsEvent',
    description:
      'Accepts the rendered result count for a canonical search.',
    eventName: 'view_search_results',
    example: {
      ...envelope('view_search_results', 'web'),
      ...browserPageContext(),
      custom_data: {
        search_id: 'search-1',
        result_revision: 1,
        search_term: 'utepeis',
        result_count: 8
      }
    },
    routeSegment: 'view-search-results',
    schema: canonicalViewSearchResultsSchema,
    summary: 'Collect a view-search-results event',
    tag: 'Discovery'
  })
] as const satisfies readonly EventCatalogEntry[]
