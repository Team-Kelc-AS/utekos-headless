#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const catalogPath = path.resolve(
  import.meta.dirname,
  '../src/lib/analytics/eventCatalog.ts'
)
let source = fs.readFileSync(catalogPath, 'utf8')

const helper = `
type ActiveProviderInput = PlannedProviderInput & {
  commerce?: boolean
  firstPartyRequired?: readonly string[]
}

function activeEventProviders(
  eventName: string,
  input: ActiveProviderInput = {}
): Readonly<Record<ProviderId, ProviderCatalogEntry>> {
  const googleRequired =
    input.commerce ?
      ([
        'client_id',
        'transaction_id',
        'currency',
        'value',
        'items',
        ...(input.googleRequired ?? [])
      ] as const)
    : (['client_id', ...(input.googleRequired ?? [])] as const)

  return {
    supabase: providerMapping({
      support: 'supported',
      eventName,
      transport: { browser: null, server: 'first_party_api' },
      requiredParameters: [
        ...baseCanonicalParameters,
        ...(input.firstPartyRequired ?? [])
      ],
      dedupeField: 'event_id',
      consentRequirement:
        input.firstPartyConsentRequirement ??
        'analytics_or_marketing',
      adapterVersion: 1,
      productionStatus: 'active',
      productionDetail: 'Canonical first-party persistence is active.',
      serverOutbox: 'disabled'
    }),
    google: providerMapping({
      support: 'supported',
      eventName,
      transport: {
        browser: 'google_tag_manager',
        server: 'google_data_manager'
      },
      requiredParameters: [
        ...baseProviderParameters,
        ...googleRequired
      ],
      dedupeField: input.commerce ? 'transaction_id' : 'event_id',
      consentRequirement: 'analytics',
      adapterVersion: 1,
      productionStatus: 'active',
      productionDetail:
        'GTM/sGTM and Data Manager outbox are active.',
      serverOutbox: 'active'
    }),
    meta:
      input.meta ?
        providerMapping({
          support: 'supported',
          eventName: input.meta.eventName,
          transport: {
            browser: null,
            server: 'meta_conversions_api'
          },
          requiredParameters: [
            ...baseProviderParameters,
            'action_source',
            'event_source_url',
            'user_data',
            ...(input.meta.requiredParameters ?? [])
          ],
          dedupeField: 'event_id',
          consentRequirement: 'marketing',
          adapterVersion: 1,
          productionStatus: 'active',
          productionDetail: 'Meta CAPI delivery is active.',
          serverOutbox: 'active'
        })
      : notRelevantProvider(
          'No v1 marketing use case justifies a Meta export.'
        ),
    microsoft_uet:
      input.microsoft ?
        providerMapping({
          support: 'supported',
          eventName: input.microsoft.eventName,
          transport: {
            browser: 'microsoft_uet',
            server: 'microsoft_uet_capi'
          },
          requiredParameters: [
            ...baseProviderParameters,
            ...(input.microsoft.requiredParameters ?? [])
          ],
          dedupeField: 'event_id',
          consentRequirement: 'marketing',
          adapterVersion: 1,
          productionStatus: 'active',
          productionDetail:
            'Browser UET is active; server delivery is blocked because no UET CAPI worker exists.',
          serverOutbox: 'blocked_no_worker'
        })
      : notRelevantProvider(
          'No v1 marketing use case justifies a Microsoft UET export.'
        ),
  }
}
`

if (!source.includes('function activeEventProviders')) {
  source = source.replace(
    'function dedupe(',
    `${helper}\nfunction dedupe(`
  )
}

const eventConfigs = {
  view_item_list: {
    lifecycle: 'active',
    providers: `activeEventProviders('view_item_list', {
      commerce: true,
      googleRequired: ['item_list_id', 'items'],
      firstPartyRequired: ['page_view_id', 'item_list_id', 'items'],
      microsoft: {
        eventName: 'view_item_list',
        requiredParameters: ['items']
      }
    })`
  },
  select_item: {
    lifecycle: 'active',
    providers: `activeEventProviders('select_item', {
      commerce: true,
      googleRequired: ['item_list_id', 'items'],
    })`
  },
  add_to_wishlist: {
    lifecycle: 'active',
    providers: `activeEventProviders('add_to_wishlist', {
      commerce: true,
      googleRequired: ['currency', 'value', 'items'],
      meta: {
        eventName: 'AddToWishlist',
        requiredParameters: ['content_ids', 'currency', 'value']
      },
      microsoft: {
        eventName: 'add_to_wishlist',
        requiredParameters: ['items']
      }
    })`
  },
  remove_from_cart: {
    lifecycle: 'active',
    providers: `activeEventProviders('remove_from_cart', {
      commerce: true,
      googleRequired: ['currency', 'value', 'items'],
      microsoft: {
        eventName: 'remove_from_cart',
        requiredParameters: ['items']
      }
    })`
  },
  view_cart: {
    lifecycle: 'active',
    providers: `activeEventProviders('view_cart', {
      commerce: true,
      googleRequired: ['currency', 'value', 'items'],
      firstPartyRequired: ['page_view_id', 'currency', 'value', 'items'],
      microsoft: {
        eventName: 'view_cart',
        requiredParameters: ['items', 'currency', 'value']
      }
    })`
  },
  search: {
    lifecycle: 'active',
    providers: `activeEventProviders('search', {
      googleRequired: ['search_term'],
      meta: { eventName: 'Search', requiredParameters: ['search_string'] },
      microsoft: {
        eventName: 'search',
        requiredParameters: ['search_term']
      }
    })`
  },
  view_search_results: {
    lifecycle: 'active',
    providers: `activeEventProviders('view_search_results', {
      googleRequired: ['search_term']
    })`
  },
  view_promotion: {
    lifecycle: 'active',
    providers: `activeEventProviders('view_promotion', {
      commerce: true,
      googleRequired: ['promotion_id', 'creative_name', 'items']
    })`
  },
  select_promotion: {
    lifecycle: 'active',
    providers: `activeEventProviders('select_promotion', {
      commerce: true,
      googleRequired: ['promotion_id', 'creative_name', 'items']
    })`
  },
  generate_lead: {
    lifecycle: 'active',
    providers: `activeEventProviders('generate_lead', {
      googleRequired: ['currency', 'value'],
      meta: { eventName: 'Lead' },
      microsoft: { eventName: 'generate_lead' }
    })`
  },
  form_start: {
    lifecycle: 'active',
    providers: `activeEventProviders('form_start', {
      googleRequired: ['form_id', 'form_name'],
      firstPartyRequired: ['form_id', 'page_view_id']
    })`
  },
  form_submit: {
    lifecycle: 'active',
    providers: `activeEventProviders('form_submit', {
      googleRequired: ['form_id', 'form_name']
    })`
  },
  form_error: {
    lifecycle: 'active',
    providers: `activeEventProviders('form_error', {
      firstPartyConsentRequirement: 'analytics_or_operational',
      googleRequired: ['form_id', 'error_category'],
    })`
  },
  filter_apply: {
    lifecycle: 'active',
    providers: `activeEventProviders('filter_apply', {
      googleRequired: ['filter_name', 'filter_value'],
    })`
  },
  sort_apply: {
    lifecycle: 'active',
    providers: `activeEventProviders('sort_apply', {
      googleRequired: ['sort_key'],
    })`
  },
  variant_select: {
    lifecycle: 'active',
    providers: `activeEventProviders('variant_select', {
      googleRequired: ['item_id', 'item_variant'],
    })`
  },
  size_guide_view: {
    lifecycle: 'active',
    providers: `activeEventProviders('size_guide_view', {
      googleRequired: ['guide_id'],
      firstPartyRequired: ['page_view_id', 'guide_id'],
    })`
  },
  scroll_depth: {
    lifecycle: 'active',
    providers: `activeEventProviders('scroll_depth', {
      googleRequired: ['percent_scrolled'],
      firstPartyRequired: ['page_view_id', 'threshold'],
    })`
  },
  video_progress: {
    lifecycle: 'active',
    providers: `activeEventProviders('video_progress', {
      googleRequired: [
        'video_current_time',
        'video_duration',
        'video_percent',
        'video_title'
      ],
      firstPartyRequired: ['page_view_id', 'video_id', 'milestone'],
    })`
  }
}

for (const [name, config] of Object.entries(eventConfigs)) {
  source = source.replace(
    new RegExp(`${name}: \\{\\n    version: 1,\\n    name: '${name}',\\n    lifecycle: 'planned',`, 'g'),
    `${name}: {\n    version: 1,\n    name: '${name}',\n    lifecycle: '${config.lifecycle}',`
  )

  const plannedPattern = new RegExp(
    `(  ${name}: \\{[\\s\\S]*?providers: )plannedProviders\\('${name}'[\\s\\S]*?\\)\\n  \\}`,
    'm'
  )
  source = source.replace(
    plannedPattern,
    `$1${config.providers}\n  }`
  )
}

fs.writeFileSync(catalogPath, source)
console.log('Updated eventCatalog.ts')
