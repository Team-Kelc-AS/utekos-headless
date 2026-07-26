import assert from 'node:assert/strict'
import test from 'node:test'
import type { CanonicalHeroInteract } from '../heroInteractEvent'
import type { CanonicalInteractWithAccordion } from '../interactWithAccordionEvent'
import type { CanonicalOpenQuickView } from '../openQuickViewEvent'
import type { CanonicalScrollDepth } from '../scrollDepthEvent'
import type { CanonicalViewCart } from '../viewCartEvent'
import type { CanonicalViewCategory } from '../viewCategoryEvent'
import type { CanonicalViewItemList } from '../viewItemListEvent'
import { mapCanonicalHeroInteractToMeta } from './mapCanonicalHeroInteractToMeta'
import { mapCanonicalInteractWithAccordionToMeta } from './mapCanonicalInteractWithAccordionToMeta'
import { mapCanonicalOpenQuickViewToMeta } from './mapCanonicalOpenQuickViewToMeta'
import { mapCanonicalScrollDepthToMeta } from './mapCanonicalScrollDepthToMeta'
import { mapCanonicalViewCartToMeta } from './mapCanonicalViewCartToMeta'
import { mapCanonicalViewCategoryToMeta } from './mapCanonicalViewCategoryToMeta'
import { mapCanonicalViewItemListToMeta } from './mapCanonicalViewItemListToMeta'

const eventId = '61c2ef59-6e6f-4f56-a63a-567ca398f9de'
const pageViewId = 'e58460a4-5a60-450c-962a-7f22254c25dd'
const pageUrl = 'https://utekos.no/produkter/utekos-techdown'

const base = {
  schema_version: 1 as const,
  event_id: eventId,
  event_time: '2026-07-26T10:00:00.000Z',
  source: 'web' as const,
  environment: 'test' as const,
  page_url: pageUrl,
  page_title: 'Utekos TechDown',
  page_view_id: pageViewId,
  browser_id: {
    fbc: 'fb.1.1785060000000.meta-click',
    fbp: 'fb.1.1785060000000.123456789'
  },
  click_id: { fbclid: 'meta-click' },
  client_ip_address: '203.0.113.10',
  event_device_info: { user_agent: 'Mozilla/5.0' },
  consent: {
    analytics: 'granted' as const,
    marketing: 'granted' as const,
    preferences: 'denied' as const,
    source: 'cookiebot' as const,
    version: '1'
  }
}

const item = {
  item_id: 'gid://shopify/ProductVariant/46944403882232',
  product_id: 'gid://shopify/Product/456',
  variant_id: 'gid://shopify/ProductVariant/46944403882232',
  item_name: 'Utekos TechDown',
  product_handle: 'utekos-techdown',
  quantity: 1,
  unit_price: 1_272,
  gross_unit_price: 1_590,
  tax_amount: 318,
  tax_rate: 0.25,
  taxable: true,
  price_includes_tax: true,
  available_for_sale: true,
  currently_not_in_stock: false,
  quantity_available: 8,
  selected_options: [],
  collection_ids: [],
  collection_titles: []
}

const commerce = {
  currency: 'NOK',
  value: 1_272,
  gross_value: 1_590,
  tax_value: 318,
  items: [item]
}

type NormalizedMetaEvent = {
  action_source?: string
  custom_data?: Record<string, unknown>
  event_id?: string
  event_name?: string
  event_source_url?: string
  user_data?: Record<string, unknown>
}

test('maps every cutover event to its exact Meta name and canonical event id', () => {
  const cases = [
    {
      expectedName: 'ViewItemList',
      expectedProperty: ['item_list_id', 'featured_products'],
      normalized: mapCanonicalViewItemListToMeta({
        ...base,
        event_name: 'view_item_list',
        custom_data: {
          ...commerce,
          impression_sequence: 1,
          item_list_id: 'featured_products',
          item_list_name: 'Utvalgte produkter',
          total_item_count: 1
        }
      } as CanonicalViewItemList).normalize()
    },
    {
      expectedName: 'ViewCart',
      expectedProperty: ['cart_id', 'gid://shopify/Cart/abc'],
      normalized: mapCanonicalViewCartToMeta({
        ...base,
        event_name: 'view_cart',
        custom_data: {
          ...commerce,
          cart_id: 'gid://shopify/Cart/abc',
          view_sequence: 1
        }
      } as CanonicalViewCart).normalize()
    },
    {
      expectedName: 'LandingScrollDepth',
      expectedProperty: ['threshold', 50],
      normalized: mapCanonicalScrollDepthToMeta({
        ...base,
        event_name: 'scroll_depth',
        custom_data: {
          threshold: 50,
          percent_scrolled: 51,
          document_height: 2_000
        }
      } as CanonicalScrollDepth).normalize()
    },
    {
      expectedName: 'ViewCategory',
      expectedProperty: ['category_id', 'all_products'],
      normalized: mapCanonicalViewCategoryToMeta({
        ...base,
        event_name: 'view_category',
        custom_data: {
          category_id: 'all_products',
          category_name: 'Alle produkter',
          view_sequence: 1
        }
      } as CanonicalViewCategory).normalize()
    },
    {
      expectedName: 'HeroInteract',
      expectedProperty: ['cta_id', 'read_more'],
      normalized: mapCanonicalHeroInteractToMeta({
        ...base,
        event_name: 'hero_interact',
        custom_data: {
          cta_id: 'read_more',
          destination_path: '/produkter',
          click_sequence: 1
        }
      } as CanonicalHeroInteract).normalize()
    },
    {
      expectedName: 'InteractWithAccordion',
      expectedProperty: ['accordion_id', 'materialer'],
      normalized: mapCanonicalInteractWithAccordionToMeta({
        ...base,
        event_name: 'interact_with_accordion',
        custom_data: {
          ...commerce,
          accordion_id: 'materialer',
          accordion_title: 'Materialer',
          interaction_sequence: 1,
          interaction_type: 'open'
        }
      } as CanonicalInteractWithAccordion).normalize()
    },
    {
      expectedName: 'OpenQuickView',
      expectedProperty: ['source_surface', 'hytte_pricing'],
      normalized: mapCanonicalOpenQuickViewToMeta({
        ...base,
        event_name: 'open_quick_view',
        custom_data: {
          ...commerce,
          open_sequence: 1,
          source_surface: 'hytte_pricing'
        }
      } as CanonicalOpenQuickView).normalize()
    }
  ]

  for (const current of cases) {
    const normalized = current.normalized as NormalizedMetaEvent
    assert.equal(normalized.event_name, current.expectedName)
    assert.equal(normalized.event_id, eventId)
    assert.equal(normalized.action_source, 'website')
    assert.match(normalized.event_source_url ?? '', /^https:\/\//)
    assert.equal(
      normalized.custom_data?.[current.expectedProperty[0] as string],
      current.expectedProperty[1]
    )
  }
})

test('does not create fbc or fbp during provider mapping when absent', () => {
  const event = {
    ...base,
    browser_id: undefined,
    click_id: undefined,
    event_name: 'scroll_depth',
    custom_data: {
      threshold: 50,
      percent_scrolled: 51,
      document_height: 2_000
    }
  } as CanonicalScrollDepth
  const normalized = mapCanonicalScrollDepthToMeta(
    event
  ).normalize() as NormalizedMetaEvent

  assert.equal(normalized.user_data?.fbc, undefined)
  assert.equal(normalized.user_data?.fbp, undefined)
  assert.equal(
    normalized.user_data?.client_ip_address,
    '203.0.113.10'
  )
})

test('fails closed for Meta mapping without marketing consent', () => {
  const event = {
    ...base,
    event_name: 'view_category',
    consent: { ...base.consent, marketing: 'denied' },
    custom_data: {
      category_id: 'all_products',
      category_name: 'Alle produkter',
      view_sequence: 1
    }
  } as CanonicalViewCategory

  assert.throws(
    () => mapCanonicalViewCategoryToMeta(event),
    /marketing consent/i
  )
})
