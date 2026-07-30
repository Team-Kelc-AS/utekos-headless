#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(import.meta.dirname, '..')
const isDirectRun =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

function write(relPath, content) {
  const fullPath = path.join(ROOT, relPath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, content)
}

function pascalFromSnake(name) {
  return name
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function camelFromSnake(name) {
  const pascal = pascalFromSnake(name)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

const EVENTS = [
  {
    name: 'view_item_list',
    commerce: true,
    meta: null,
    pageViewRequired: true,
    customDataSchema: `z.strictObject({
  item_list_id: z.string().min(1),
  impression_sequence: z.number().int().positive(),
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  value: z.number().finite().nonnegative().optional(),
  items: z.array(canonicalCommerceItemSchema).min(1)
})`,
    reporterOnly:
      'Reporter exported for product list visibility wiring; no detector is active yet.'
  },
  {
    name: 'select_item',
    commerce: true,
    meta: null,
    pageViewRequired: false,
    customDataSchema: `z.strictObject({
  interaction_id: z.string().min(1),
  item_list_id: z.string().min(1),
  destination_url: z.string().url().optional(),
  items: z.array(canonicalCommerceItemSchema).min(1).max(1)
})`,
    reporterOnly:
      'Reporter exported for product list selection wiring; no detector is active yet.'
  },
  {
    name: 'add_to_wishlist',
    commerce: true,
    meta: 'AddToWishlist',
    pageViewRequired: false,
    customDataSchema: `canonicalCommerceValueSchema.extend({
  wishlist_mutation_id: z.string().min(1)
})`,
    reporterOnly:
      'Reporter exported for wishlist persistence wiring; no wishlist store detector is active yet.'
  },
  {
    name: 'remove_from_cart',
    commerce: true,
    meta: null,
    pageViewRequired: false,
    customDataSchema: `canonicalCommerceValueSchema.extend({
  cart_mutation_id: z.string().min(1),
  cart_id: z.string().min(1)
})`,
    wired: true
  },
  {
    name: 'view_cart',
    commerce: true,
    meta: null,
    pageViewRequired: true,
    customDataSchema: `canonicalCommerceValueSchema.extend({
  cart_id: z.string().min(1),
  view_sequence: z.number().int().positive()
})`,
    wired: true
  },
  {
    name: 'search',
    commerce: false,
    meta: 'Search',
    pageViewRequired: false,
    customDataSchema: `z.strictObject({
  search_id: z.string().min(1),
  search_term: z.string().min(1),
  result_state: z.enum(['results', 'empty', 'error']).optional()
})`,
    reporterOnly:
      'Reporter exported for search controller wiring; no search detector is active yet.'
  },
  {
    name: 'view_search_results',
    commerce: false,
    meta: null,
    pageViewRequired: false,
    customDataSchema: `z.strictObject({
  search_id: z.string().min(1),
  result_revision: z.number().int().positive(),
  search_term: z.string().min(1),
  result_count: z.number().int().nonnegative()
})`,
    reporterOnly:
      'Reporter exported for search results visibility wiring; no detector is active yet.'
  },
  {
    name: 'view_promotion',
    commerce: true,
    meta: null,
    pageViewRequired: true,
    customDataSchema: `z.strictObject({
  promotion_id: z.string().min(1),
  creative_name: z.string().min(1),
  impression_sequence: z.number().int().positive(),
  items: z.array(canonicalCommerceItemSchema).optional()
})`,
    reporterOnly:
      'Reporter exported for promotion impression wiring; no promotion observer is active yet.'
  },
  {
    name: 'select_promotion',
    commerce: true,
    meta: null,
    pageViewRequired: false,
    customDataSchema: `z.strictObject({
  interaction_id: z.string().min(1),
  promotion_id: z.string().min(1),
  creative_name: z.string().min(1),
  items: z.array(canonicalCommerceItemSchema).optional()
})`,
    reporterOnly:
      'Reporter exported for promotion selection wiring; no promotion observer is active yet.'
  },
  {
    name: 'generate_lead',
    browser: false,
    source: 'server',
    commerce: false,
    meta: 'Lead',
    customDataSchema: `z.strictObject({
  submission_id: z.string().min(1),
  form_id: z.string().min(1),
  lead_type: z.string().min(1).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  value: z.number().finite().nonnegative().optional()
})`,
    reporterOnly:
      'Server-only event; call acceptCanonicalGenerateLead from lead submission services.'
  },
  {
    name: 'form_start',
    commerce: false,
    meta: null,
    pageViewRequired: true,
    customDataSchema: `z.strictObject({
  form_id: z.string().min(1),
  form_name: z.string().min(1),
  field_category: z.string().min(1).optional()
})`,
    reporterOnly:
      'Reporter exported for form controller wiring; no form detector is active yet.'
  },
  {
    name: 'form_submit',
    browser: false,
    source: 'server',
    commerce: false,
    meta: null,
    customDataSchema: `z.strictObject({
  submission_id: z.string().min(1),
  form_id: z.string().min(1),
  form_name: z.string().min(1),
  result: z.enum(['accepted', 'rejected'])
})`,
    reporterOnly:
      'Server-only event; call acceptCanonicalFormSubmit from form submission services.'
  },
  {
    name: 'form_error',
    commerce: false,
    meta: null,
    pageViewRequired: false,
    consentMode: 'analytics_or_operational',
    customDataSchema: `z.strictObject({
  attempt_id: z.string().min(1),
  form_id: z.string().min(1),
  error_category: z.string().min(1)
})`,
    reporterOnly:
      'Reporter exported for form error wiring; no form detector is active yet.'
  },
  {
    name: 'filter_apply',
    commerce: false,
    meta: null,
    pageViewRequired: false,
    customDataSchema: `z.strictObject({
  interaction_id: z.string().min(1),
  result_revision: z.number().int().positive(),
  filter_name: z.string().min(1),
  filter_value: z.string().min(1),
  result_count: z.number().int().nonnegative()
})`,
    reporterOnly:
      'Reporter exported for product filter wiring; no filter detector is active yet.'
  },
  {
    name: 'sort_apply',
    commerce: false,
    meta: null,
    pageViewRequired: false,
    customDataSchema: `z.strictObject({
  interaction_id: z.string().min(1),
  result_revision: z.number().int().positive(),
  sort_key: z.string().min(1),
  result_count: z.number().int().nonnegative()
})`,
    reporterOnly:
      'Reporter exported for product sort wiring; no sort detector is active yet.'
  },
  {
    name: 'variant_select',
    commerce: false,
    meta: null,
    pageViewRequired: false,
    customDataSchema: `z.strictObject({
  interaction_id: z.string().min(1),
  product_id: z.string().min(1),
  variant_id: z.string().min(1),
  item_id: z.string().min(1),
  item_variant: z.string().min(1),
  availability: z.enum(['available', 'unavailable'])
})`,
    wired: true
  },
  {
    name: 'size_guide_view',
    commerce: false,
    meta: null,
    pageViewRequired: true,
    customDataSchema: `z.strictObject({
  guide_id: z.string().min(1),
  open_sequence: z.number().int().positive()
})`,
    reporterOnly:
      'Reporter exported for size guide visibility wiring; no size guide detector is active yet.'
  },
  {
    name: 'scroll_depth',
    commerce: false,
    meta: null,
    pageViewRequired: true,
    customDataSchema: `z.strictObject({
  threshold: z.union([
    z.literal(25),
    z.literal(50),
    z.literal(75),
    z.literal(90)
  ]),
  percent_scrolled: z.number().int().min(1).max(100),
  document_height: z.number().int().positive()
})`,
    wired: true
  },
  {
    name: 'video_progress',
    commerce: false,
    meta: null,
    pageViewRequired: true,
    customDataSchema: `z.strictObject({
  video_id: z.string().min(1),
  milestone: z.union([
    z.literal(10),
    z.literal(25),
    z.literal(50),
    z.literal(75),
    z.literal(90),
    z.literal(100)
  ]),
  video_title: z.string().min(1),
  video_duration: z.number().finite().nonnegative(),
  video_current_time: z.number().finite().nonnegative(),
  video_percent: z.number().int().min(1).max(100)
})`,
    reporterOnly:
      'Reporter exported for video milestone wiring; no video controller is active yet.'
  }
]

function generateEventSchema(event) {
  const Pascal = pascalFromSnake(event.name)
  const source = event.source ?? 'web'
  const pageViewField =
    event.pageViewRequired ?
      'page_view_id: z.string().uuid(),'
    : 'page_view_id: z.string().uuid().optional(),'
  const browserOnly =
    source === 'web' ?
      `
    page_url: z.string().url(),
    referrer_url: z.string().url().optional(),
    page_title: z.string().min(1),`
    : `
    page_url: z.string().url().optional(),`

  const imports = [
    'import { z } from \'zod\'',
    event.commerce && event.customDataSchema.includes('canonicalCommerceValueSchema') ?
      'import { canonicalCommerceValueSchema } from \'./canonicalCommerceItem\''
    : event.commerce ?
      'import { canonicalCommerceItemSchema, canonicalCommerceValueSchema } from \'./canonicalCommerceItem\''
    : '',
    'import { canonicalEventEnvelopeSchema, type CanonicalEventEnvelope, type ConsentSnapshot } from \'./canonicalEventEnvelope\'',
    'import { mapEventDeviceInfo } from \'./mapEventDeviceInfo\''
  ]
    .filter(Boolean)
    .join('\n')

  return `${imports}

export const canonical${Pascal}CustomDataSchema = ${event.customDataSchema}

export type Canonical${Pascal}CustomData = z.infer<
  typeof canonical${Pascal}CustomDataSchema
>

export const canonical${Pascal}Schema = canonicalEventEnvelopeSchema.extend({
  event_name: z.literal('${event.name}'),
  source: z.literal('${source}'),${browserOnly}
  ${pageViewField}
  custom_data: canonical${Pascal}CustomDataSchema
})

export type Canonical${Pascal} = z.infer<typeof canonical${Pascal}Schema>

type CreateCanonical${Pascal}Input = {
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  consent: ConsentSnapshot
  customData: Canonical${Pascal}CustomData
  environment: CanonicalEventEnvelope['environment']
  eventDeviceInfo?: Parameters<typeof mapEventDeviceInfo>[0]
  eventId: string
  eventTime: string
  externalId?: string
  impressionId?: string
  pageTitle?: string
  pageUrl?: string
  pageViewId?: string
  referrerUrl?: string
}

export type ${Pascal}DataLayerEvent = {
  event: '${event.name}'
  event_id: string
  event_time: string
  source: '${source}'
  ${event.pageViewRequired ? 'page_view_id: string' : 'page_view_id?: string'}
  custom_data: Canonical${Pascal}CustomData
  canonical_event: Canonical${Pascal}
}

export function createCanonical${Pascal}(
  input: CreateCanonical${Pascal}Input
): Canonical${Pascal} {
  const eventDeviceInfo = mapEventDeviceInfo(input.eventDeviceInfo)

  return canonical${Pascal}Schema.parse({
    schema_version: 1,
    event_name: '${event.name}',
    event_id: input.eventId,
    event_time: input.eventTime,
    source: '${source}',
    environment: input.environment,
    ...(input.pageUrl ? { page_url: input.pageUrl } : {}),
    ...(input.pageViewId ? { page_view_id: input.pageViewId } : {}),
    ...(input.referrerUrl ? { referrer_url: input.referrerUrl } : {}),
    ...(input.pageTitle ? { page_title: input.pageTitle } : {}),
    consent: input.consent,
    custom_data: input.customData,
    ...(input.browserId ? { browser_id: input.browserId } : {}),
    ...(input.clickId ? { click_id: input.clickId } : {}),
    ...(input.externalId ? { external_id: input.externalId } : {}),
    ...(input.impressionId ? { impression_id: input.impressionId } : {}),
    ...(eventDeviceInfo ? { event_device_info: eventDeviceInfo } : {})
  })
}

export function build${Pascal}DataLayerEvent(
  event: Canonical${Pascal}
): ${Pascal}DataLayerEvent {
  return {
    event: '${event.name}',
    event_id: event.event_id,
    event_time: event.event_time,
    source: event.source,
    ...(event.page_view_id ? { page_view_id: event.page_view_id } : {}),
    custom_data: event.custom_data,
    canonical_event: event
  }
}
`
}

function generateCollectorTransport(event) {
  if (event.browser === false) return null
  const Pascal = pascalFromSnake(event.name)
  const kebab = event.name.replaceAll('_', '-')

  return `import { createCanonicalCollectorTransport } from './createCanonicalCollectorTransport'
import type { Canonical${Pascal} } from './${camelFromSnake(event.name)}Event'

export const start${Pascal}CollectorTransport =
  createCanonicalCollectorTransport<Canonical${Pascal}>({
    analyticsEventName: '${event.name}',
    endpoint: '/api/events/${kebab}'
  })
`
}

function generateReporter(event) {
  if (event.browser === false) return null
  const Pascal = pascalFromSnake(event.name)
  const camel = camelFromSnake(event.name)
  const comment = event.reporterOnly ?
    `// ${event.reporterOnly}\n`
  : event.wired ?
    ''
  : '// Reporter exported for later wiring.\n'

  return `'use client'

${comment}import { sendGTMEvent } from '@next/third-parties/google'
import { readBrowserReporterContext } from './browserReporterContext'
import { browserPageViewSession } from './pageViewSession'
import {
  build${Pascal}DataLayerEvent,
  createCanonical${Pascal},
  type Canonical${Pascal},
  type Canonical${Pascal}CustomData
} from './${camel}Event'
import { start${Pascal}CollectorTransport } from './${camel}CollectorTransport'

export type ReportCanonical${Pascal}Input = {
  customData: Canonical${Pascal}CustomData
  pageViewId?: string
}

export function reportCanonical${Pascal}(
  input: ReportCanonical${Pascal}Input
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  try {
    const clientContext = readBrowserReporterContext()
    const pageView = browserPageViewSession.ensure({
      pageUrl: clientContext.pageUrl,
      ...(clientContext.documentReferrer ?
        { documentReferrer: clientContext.documentReferrer }
      : {})
    })

    const event = createCanonical${Pascal}({
      environment: clientContext.environment,
      eventId: globalThis.crypto.randomUUID(),
      eventTime: new Date().toISOString(),
      pageUrl: clientContext.pageUrl,
      pageTitle: clientContext.pageTitle,
      pageViewId: input.pageViewId ?? pageView.pageViewId,
      ...(pageView.referrerUrl ?
        { referrerUrl: pageView.referrerUrl }
      : {}),
      consent: clientContext.consent,
      customData: input.customData,
      ...(clientContext.browserId ?
        { browserId: clientContext.browserId }
      : {}),
      ...(clientContext.clickId ?
        { clickId: clientContext.clickId }
      : {}),
      eventDeviceInfo: clientContext.eventDeviceInfo
    })

    sendGTMEvent(build${Pascal}DataLayerEvent(event))
    return start${Pascal}CollectorTransport(event)
  } catch (error) {
    queueMicrotask(() => {
      throw error
    })
    return () => {}
  }
}

export type { Canonical${Pascal} }
`
}

function generateNormalize(event) {
  const Pascal = pascalFromSnake(event.name)
  const camel = camelFromSnake(event.name)
  const importPath =
    event.browser === false ?
      './normalizeCanonicalPurchase'
    : './normalizeCanonicalBrowserEvent'

  if (event.browser === false) {
    return `import {
  canonical${Pascal}Schema,
  type Canonical${Pascal}
} from '../${camel}Event'
import type { CanonicalPurchaseRequestContext } from './normalizeCanonicalPurchase'

export type Canonical${Pascal}RequestContext =
  CanonicalPurchaseRequestContext

export function normalizeCanonical${Pascal}(
  payload: unknown,
  requestContext: Canonical${Pascal}RequestContext
): Canonical${Pascal} {
  const parsed = canonical${Pascal}Schema.parse(payload)
  const normalized = { ...parsed }
  const deviceInfo = { ...parsed.event_device_info }

  delete normalized.client_ip_address
  delete normalized.event_device_info
  delete normalized.location
  delete normalized.region_code
  delete deviceInfo.user_agent

  Object.assign(deviceInfo, {
    ...(requestContext.userAgent ?
      { user_agent: requestContext.userAgent }
    : {})
  })

  const serverLocation = {
    ...(requestContext.city ? { city: requestContext.city } : {}),
    ...(requestContext.countryCode ?
      { country_code: requestContext.countryCode.toUpperCase() }
    : {}),
    ...(requestContext.postalCode ?
      { postal_code: requestContext.postalCode }
    : {}),
    ...(requestContext.regionCode ?
      { region_code: requestContext.regionCode }
    : {})
  }

  const hasDeviceInfo = Object.keys(deviceInfo).length > 0
  const hasLocation = Object.keys(serverLocation).length > 0
  const hasMarketingConsent = parsed.consent.marketing === 'granted'
  const preservedClientIp =
    parsed.client_ip_address ?? requestContext.clientIpAddress

  if (hasDeviceInfo) normalized.event_device_info = deviceInfo
  if (requestContext.regionCode) {
    normalized.region_code = requestContext.regionCode
  }
  if (hasLocation) {
    normalized.location = {
      ...serverLocation,
      source: 'ip_geolocation'
    }
  }

  if (preservedClientIp) {
    normalized.client_ip_address = preservedClientIp
  }

  if (!hasMarketingConsent) {
    const analyticsBrowserId = {
      ...(parsed.browser_id?.ga_client ?
        { ga_client: parsed.browser_id.ga_client }
      : {}),
      ...(parsed.browser_id?.ga_client_id ?
        { ga_client_id: parsed.browser_id.ga_client_id }
      : {}),
      ...(parsed.browser_id?.ga_cookie ?
        { ga_cookie: parsed.browser_id.ga_cookie }
      : {}),
      ...(parsed.browser_id?.ga_session_id ?
        { ga_session_id: parsed.browser_id.ga_session_id }
      : {})
    }

    if (
      parsed.consent.analytics === 'granted' &&
      Object.keys(analyticsBrowserId).length > 0
    ) {
      normalized.browser_id = analyticsBrowserId
    } else {
      delete normalized.browser_id
    }

    delete normalized.click_id
    delete normalized.external_id
    delete normalized.impression_id
    delete normalized.user_data
  } else {
    if (parsed.browser_id) normalized.browser_id = parsed.browser_id
    if (parsed.click_id) normalized.click_id = parsed.click_id
    if (parsed.external_id) normalized.external_id = parsed.external_id
    if (parsed.impression_id) {
      normalized.impression_id = parsed.impression_id
    }
    if (parsed.user_data) normalized.user_data = parsed.user_data
  }

  return canonical${Pascal}Schema.parse(normalized)
}
`
  }

  return `import {
  canonical${Pascal}Schema,
  type Canonical${Pascal}
} from '../${camel}Event'
import {
  normalizeCanonicalBrowserEvent,
  type CanonicalBrowserEventRequestContext
} from '${importPath}'

export type Canonical${Pascal}RequestContext =
  CanonicalBrowserEventRequestContext

export function normalizeCanonical${Pascal}(
  payload: unknown,
  requestContext: Canonical${Pascal}RequestContext
): Canonical${Pascal} {
  return normalizeCanonicalBrowserEvent(
    canonical${Pascal}Schema,
    payload,
    requestContext
  )
}
`
}

function generateAccept(event) {
  const Pascal = pascalFromSnake(event.name)
  const camel = camelFromSnake(event.name)
  const consentCheck =
    event.consentMode === 'analytics_or_operational' ?
      `const hasPermittedPurpose =
    event.consent.analytics === 'granted'`
    : event.source === 'server' ?
      `const hasPermittedPurpose =
    event.consent.analytics === 'granted' ||
    event.consent.marketing === 'granted'`
    : `const hasPermittedPurpose =
    event.consent.analytics === 'granted' ||
    event.consent.marketing === 'granted'`

  return `import type { Canonical${Pascal} } from '../${camel}Event'
import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonical${Pascal},
  type Canonical${Pascal}RequestContext
} from './normalizeCanonical${Pascal}'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type Canonical${Pascal}Store = CanonicalEventStore

type AcceptCanonical${Pascal}Input = {
  payload: unknown
  requestContext: Canonical${Pascal}RequestContext
  store: Canonical${Pascal}Store
}

export type AcceptCanonical${Pascal}Result =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonical${Pascal}(
  input: AcceptCanonical${Pascal}Input
): Promise<AcceptCanonical${Pascal}Result> {
  const event = normalizeCanonical${Pascal}(
    input.payload,
    input.requestContext
  )
  ${consentCheck}

  if (!hasPermittedPurpose) {
    return { reason: 'consent_denied', status: 'rejected' }
  }

  const result = await input.store.accept({
    dispatches: planCanonicalEventDispatch(event),
    event
  })

  return {
    event_id: event.event_id,
    status: result === 'inserted' ? 'accepted' : 'duplicate'
  }
}
`
}

function generateHandleRequest(event) {
  const Pascal = pascalFromSnake(event.name)
  const camel = camelFromSnake(event.name)

  return `import { acceptCanonical${Pascal} } from './acceptCanonical${Pascal}'
import { createBrowserEventRequestHandler } from './createBrowserEventRequestHandler'

export const handleCanonical${Pascal}Request =
  createBrowserEventRequestHandler(acceptCanonical${Pascal})
`
}

function generateHandleRoute(event) {
  const Pascal = pascalFromSnake(event.name)
  const kebab = event.name.replaceAll('_', '-')

  return `import { createBrowserEventRouteHandler } from './createBrowserEventRouteHandler'

export const handleCanonical${Pascal}Route =
  createBrowserEventRouteHandler('${kebab}')
`
}

function generateMapGoogle(event) {
  const Pascal = pascalFromSnake(event.name)
  const camel = camelFromSnake(event.name)

  if (event.commerce && event.meta === 'AddToWishlist') {
    return `import type { Canonical${Pascal} } from '../${camel}Event'
import { mapCanonicalCommerceEventToGoogleDataManager } from './mapCanonicalCommerceEventToGoogleDataManager'

export function mapCanonical${Pascal}ToGoogleDataManager(
  event: Canonical${Pascal}
) {
  return mapCanonicalCommerceEventToGoogleDataManager(
    event,
    '${event.name}'
  )
}
`
  }

  if (event.commerce) {
    return `import type { Canonical${Pascal} } from '../${camel}Event'
import { mapCanonicalCommerceEventToGoogleDataManager } from './mapCanonicalCommerceEventToGoogleDataManager'

export function mapCanonical${Pascal}ToGoogleDataManager(
  event: Canonical${Pascal}
) {
  return mapCanonicalCommerceEventToGoogleDataManager(
    event,
    '${event.name}'
  )
}
`
  }

  return `import type { Canonical${Pascal} } from '../${camel}Event'
import { mapCanonicalWebEventToGoogleDataManager } from './mapCanonicalWebEventToGoogleDataManager'

export function mapCanonical${Pascal}ToGoogleDataManager(
  event: Canonical${Pascal}
) {
  return mapCanonicalWebEventToGoogleDataManager(event, '${event.name}')
}
`
}

function generateMapMeta(event) {
  if (!event.meta) return null
  const Pascal = pascalFromSnake(event.name)
  const camel = camelFromSnake(event.name)

  if (event.meta === 'AddToWishlist') {
    return `import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { Canonical${Pascal} } from '../${camel}Event'
import { mapCanonicalCommerceEventToMeta } from './mapCanonicalCommerceEventToMeta'

export function mapCanonical${Pascal}ToMeta(
  event: Canonical${Pascal}
): ServerEvent {
  return mapCanonicalCommerceEventToMeta(event, 'AddToWishlist')
}
`
  }

  if (event.meta === 'Search') {
    return `import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { Canonical${Pascal} } from '../${camel}Event'
import { mapCanonicalSearchToMeta } from './mapCanonicalSearchToMeta'

export function mapCanonical${Pascal}ToMeta(
  event: Canonical${Pascal}
): ServerEvent {
  return mapCanonicalSearchToMeta(event)
}
`
  }

  if (event.meta === 'Lead') {
    return `import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { Canonical${Pascal} } from '../${camel}Event'
import { mapCanonicalLeadToMeta } from './mapCanonicalLeadToMeta'

export function mapCanonical${Pascal}ToMeta(
  event: Canonical${Pascal}
): ServerEvent {
  return mapCanonicalLeadToMeta(event)
}
`
  }

  return null
}

function generateDispatchGoogle(event) {
  const Pascal = pascalFromSnake(event.name)
  const camel = camelFromSnake(event.name)

  return `import type { Canonical${Pascal} } from '../${camel}Event'
import { createCanonicalGoogleDataManagerDispatch } from './createCanonicalGoogleDataManagerDispatch'
import { mapCanonical${Pascal}ToGoogleDataManager } from './mapCanonical${Pascal}ToGoogleDataManager'

export const dispatchCanonical${Pascal}ToGoogleDataManager =
  createCanonicalGoogleDataManagerDispatch<
    Canonical${Pascal},
    '${event.name}'
  >({
    eventName: '${event.name}',
    mapEvent: mapCanonical${Pascal}ToGoogleDataManager
  })
`
}

function generateDispatchMeta(event) {
  if (!event.meta) return null
  const Pascal = pascalFromSnake(event.name)
  const camel = camelFromSnake(event.name)

  return `import type { Canonical${Pascal} } from '../${camel}Event'
import { createCanonicalMetaDispatch } from './createCanonicalMetaDispatch'
import { mapCanonical${Pascal}ToMeta } from './mapCanonical${Pascal}ToMeta'

export const dispatchCanonical${Pascal}ToMeta =
  createCanonicalMetaDispatch<Canonical${Pascal}, '${event.name}'>({
    eventName: '${event.name}',
    mapEvent: mapCanonical${Pascal}ToMeta
  })
`
}

function generateGoogleAdapter(event) {
  const Pascal = pascalFromSnake(event.name)
  const camel = camelFromSnake(event.name)

  return `import { canonical${Pascal}Schema } from '../../${camel}Event'
import { createGoogleDataManagerProviderAdapter } from '../createGoogleDataManagerProviderAdapter'
import { dispatchCanonical${Pascal}ToGoogleDataManager } from '../dispatchCanonical${Pascal}ToGoogleDataManager'

export const googleDataManager${Pascal}ProviderAdapter =
  createGoogleDataManagerProviderAdapter({
    dispatch: dispatchCanonical${Pascal}ToGoogleDataManager,
    eventName: '${event.name}',
    key: 'google:${event.name}',
    schema: canonical${Pascal}Schema
  })
`
}

function generateMetaAdapter(event) {
  if (!event.meta) return null
  const Pascal = pascalFromSnake(event.name)
  const camel = camelFromSnake(event.name)

  return `import { canonical${Pascal}Schema } from '../../${camel}Event'
import { createMetaProviderAdapter } from '../createMetaProviderAdapter'
import { dispatchCanonical${Pascal}ToMeta } from '../dispatchCanonical${Pascal}ToMeta'

export const meta${Pascal}ProviderAdapter = createMetaProviderAdapter({
  dispatch: dispatchCanonical${Pascal}ToMeta,
  eventName: '${event.name}',
  key: 'meta:${event.name}',
  schema: canonical${Pascal}Schema
})
`
}

function generateApiRoute(event) {
  const Pascal = pascalFromSnake(event.name)

  return `import { geolocation, ipAddress } from '@vercel/functions'
import { handleCanonical${Pascal}Request } from '@/lib/analytics/server/handleCanonical${Pascal}Request'
import { handleCanonical${Pascal}Route } from '@/lib/analytics/server/handleCanonical${Pascal}Route'
import { postgresCanonicalEventStore } from '@/lib/analytics/server/postgresCanonicalPageViewStore'

export const maxDuration = 60

export function POST(request: Request) {
  return handleCanonical${Pascal}Route(request, {
    collect: currentRequest =>
      handleCanonical${Pascal}Request(currentRequest, {
        getRequestContext: requestWithContext => {
          const geo = geolocation(requestWithContext)
          const clientIpAddress = ipAddress(requestWithContext)
          const userAgent =
            requestWithContext.headers.get('user-agent')

          return {
            ...(geo.city ? { city: geo.city } : {}),
            ...(clientIpAddress ? { clientIpAddress } : {}),
            ...(geo.country ? { countryCode: geo.country } : {}),
            ...(geo.postalCode ?
              { postalCode: geo.postalCode }
            : {}),
            ...(geo.countryRegion ?
              { regionCode: geo.countryRegion }
            : {}),
            ...(userAgent ? { userAgent } : {})
          }
        },
        store: postgresCanonicalEventStore
      })
  })
}
`
}

function main() {
  for (const event of EVENTS) {
    const camel = camelFromSnake(event.name)
    write(`src/lib/analytics/${camel}Event.ts`, generateEventSchema(event))

    const collector = generateCollectorTransport(event)
    if (collector) {
      write(`src/lib/analytics/${camel}CollectorTransport.ts`, collector)
    }

    const reporter = generateReporter(event)
    if (reporter) {
      write(`src/lib/analytics/${camel}Reporter.ts`, reporter)
    }

    write(
      `src/lib/analytics/server/normalizeCanonical${pascalFromSnake(event.name)}.ts`,
      generateNormalize(event)
    )
    write(
      `src/lib/analytics/server/acceptCanonical${pascalFromSnake(event.name)}.ts`,
      generateAccept(event)
    )
    write(
      `src/lib/analytics/server/handleCanonical${pascalFromSnake(event.name)}Request.ts`,
      generateHandleRequest(event)
    )
    write(
      `src/lib/analytics/server/handleCanonical${pascalFromSnake(event.name)}Route.ts`,
      generateHandleRoute(event)
    )
    write(
      `src/lib/analytics/server/mapCanonical${pascalFromSnake(event.name)}ToGoogleDataManager.ts`,
      generateMapGoogle(event)
    )

    const mapMeta = generateMapMeta(event)
    if (mapMeta) {
      write(
        `src/lib/analytics/server/mapCanonical${pascalFromSnake(event.name)}ToMeta.ts`,
        mapMeta
      )
    }

    write(
      `src/lib/analytics/server/dispatchCanonical${pascalFromSnake(event.name)}ToGoogleDataManager.ts`,
      generateDispatchGoogle(event)
    )

    const dispatchMeta = generateDispatchMeta(event)
    if (dispatchMeta) {
      write(
        `src/lib/analytics/server/dispatchCanonical${pascalFromSnake(event.name)}ToMeta.ts`,
        dispatchMeta
      )
    }

    write(
      `src/lib/analytics/server/providerAdapters/googleDataManager${pascalFromSnake(event.name)}ProviderAdapter.ts`,
      generateGoogleAdapter(event)
    )

    const metaAdapter = generateMetaAdapter(event)
    if (metaAdapter) {
      write(
        `src/lib/analytics/server/providerAdapters/meta${pascalFromSnake(event.name)}ProviderAdapter.ts`,
        metaAdapter
      )
    }

    write(
      `src/app/api/events/${event.name.replaceAll('_', '-')}/route.ts`,
      generateApiRoute(event)
    )
  }

  // Update canonicalEvent.ts
  const schemaImports = EVENTS.map(
    event =>
      `import { canonical${pascalFromSnake(event.name)}Schema } from './${camelFromSnake(event.name)}Event'`
  ).join('\n')

  const existingImports = `import { canonicalAddToCartSchema } from './addToCartEvent'
import { canonicalBeginCheckoutSchema } from './beginCheckoutEvent'
import { canonicalPageViewSchema } from './pageViewEvent'
import { canonicalPurchaseSchema } from './purchaseEvent'
import { canonicalRefundSchema } from './refundEvent'
import { canonicalViewItemSchema } from './viewItemEvent'`

  const unionMembers = [
    'canonicalPageViewSchema',
    'canonicalViewItemSchema',
    'canonicalAddToCartSchema',
    'canonicalBeginCheckoutSchema',
    'canonicalPurchaseSchema',
    'canonicalRefundSchema',
    ...EVENTS.map(
      event => `canonical${pascalFromSnake(event.name)}Schema`
    )
  ].join(',\n    ')

  write(
    'src/lib/analytics/canonicalEvent.ts',
    `import { z } from 'zod'
${existingImports}
${schemaImports}

export const canonicalEventSchema = z.discriminatedUnion(
  'event_name',
  [
    ${unionMembers}
  ]
)

export type CanonicalEvent = z.infer<typeof canonicalEventSchema>
export type ImplementedCanonicalEventName =
  CanonicalEvent['event_name']

export function parseCanonicalEvent(
  input: unknown
): CanonicalEvent {
  return canonicalEventSchema.parse(input)
}
`
  )

  // Update registries
  const googleAdapters = EVENTS.map(event => {
    const Pascal = pascalFromSnake(event.name)
    return `  'google:${event.name}': googleDataManager${Pascal}ProviderAdapter`
  }).join(',\n')

  const metaEvents = EVENTS.filter(event => event.meta)
  const metaAdapters = metaEvents.map(event => {
    const Pascal = pascalFromSnake(event.name)
    return `  'meta:${event.name}': meta${Pascal}ProviderAdapter`
  }).join(',\n')

  const googleImports = EVENTS.map(event => {
    const Pascal = pascalFromSnake(event.name)
    return `import { googleDataManager${Pascal}ProviderAdapter } from './providerAdapters/googleDataManager${Pascal}ProviderAdapter'`
  }).join('\n')

  const metaImports = metaEvents.map(event => {
    const Pascal = pascalFromSnake(event.name)
    return `import { meta${Pascal}ProviderAdapter } from './providerAdapters/meta${Pascal}ProviderAdapter'`
  }).join('\n')

  write(
    'src/lib/analytics/server/providerAdapterRegistry.ts',
    `${googleImports}
import { googleDataManagerAddToCartProviderAdapter } from './providerAdapters/googleDataManagerAddToCartProviderAdapter'
import { googleDataManagerBeginCheckoutProviderAdapter } from './providerAdapters/googleDataManagerBeginCheckoutProviderAdapter'
import { googleDataManagerPurchaseProviderAdapter } from './providerAdapters/googleDataManagerPurchaseProviderAdapter'
import { googleDataManagerRefundProviderAdapter } from './providerAdapters/googleDataManagerRefundProviderAdapter'
import { googleDataManagerViewItemProviderAdapter } from './providerAdapters/googleDataManagerViewItemProviderAdapter'
${metaImports}
import { metaAddToCartProviderAdapter } from './providerAdapters/metaAddToCartProviderAdapter'
import { metaBeginCheckoutProviderAdapter } from './providerAdapters/metaBeginCheckoutProviderAdapter'
import { metaPurchaseProviderAdapter } from './providerAdapters/metaPurchaseProviderAdapter'
import { metaViewItemProviderAdapter } from './providerAdapters/metaViewItemProviderAdapter'
import type { ProviderAdapterKey } from './providerAdapter'

export const providerAdapterRegistry = {
  'google:add_to_cart': googleDataManagerAddToCartProviderAdapter,
  'google:begin_checkout':
    googleDataManagerBeginCheckoutProviderAdapter,
${googleAdapters},
  'google:purchase': googleDataManagerPurchaseProviderAdapter,
  'google:refund': googleDataManagerRefundProviderAdapter,
  'google:view_item': googleDataManagerViewItemProviderAdapter,
  'meta:add_to_cart': metaAddToCartProviderAdapter,
  'meta:begin_checkout': metaBeginCheckoutProviderAdapter,
${metaAdapters},
  'meta:purchase': metaPurchaseProviderAdapter,
  'meta:view_item': metaViewItemProviderAdapter
} as const satisfies Partial<Record<ProviderAdapterKey, unknown>>

export type RegisteredProviderAdapterKey =
  keyof typeof providerAdapterRegistry

export const registeredProviderAdapterKeys = Object.freeze(
  Object.keys(
    providerAdapterRegistry
  ) as RegisteredProviderAdapterKey[]
)
`
  )

  write(
    'src/lib/analytics/server/providerOutboxWorkerRegistry.ts',
    `import { createPostgresProviderOutboxWorker } from './createPostgresProviderOutboxWorker'
import type { RegisteredProviderAdapterKey } from './providerAdapterRegistry'
import { googleDataManagerAddToCartProviderAdapter } from './providerAdapters/googleDataManagerAddToCartProviderAdapter'
import { googleDataManagerBeginCheckoutProviderAdapter } from './providerAdapters/googleDataManagerBeginCheckoutProviderAdapter'
${googleImports}
import { googleDataManagerPurchaseProviderAdapter } from './providerAdapters/googleDataManagerPurchaseProviderAdapter'
import { googleDataManagerRefundProviderAdapter } from './providerAdapters/googleDataManagerRefundProviderAdapter'
import { googleDataManagerViewItemProviderAdapter } from './providerAdapters/googleDataManagerViewItemProviderAdapter'
import { metaAddToCartProviderAdapter } from './providerAdapters/metaAddToCartProviderAdapter'
import { metaBeginCheckoutProviderAdapter } from './providerAdapters/metaBeginCheckoutProviderAdapter'
${metaImports}
import { metaPurchaseProviderAdapter } from './providerAdapters/metaPurchaseProviderAdapter'
import { metaViewItemProviderAdapter } from './providerAdapters/metaViewItemProviderAdapter'
import type { ProviderOutboxBatchSummary } from './runProviderOutboxWorker'

export const providerOutboxWorkerRegistry = {
  'google:add_to_cart': createPostgresProviderOutboxWorker(
    googleDataManagerAddToCartProviderAdapter
  ),
  'google:begin_checkout': createPostgresProviderOutboxWorker(
    googleDataManagerBeginCheckoutProviderAdapter
  ),
${EVENTS.map(event => {
  const Pascal = pascalFromSnake(event.name)
  return `  'google:${event.name}': createPostgresProviderOutboxWorker(
    googleDataManager${Pascal}ProviderAdapter
  )`
}).join(',\n')},
  'google:purchase': createPostgresProviderOutboxWorker(
    googleDataManagerPurchaseProviderAdapter
  ),
  'google:refund': createPostgresProviderOutboxWorker(
    googleDataManagerRefundProviderAdapter
  ),
  'google:view_item': createPostgresProviderOutboxWorker(
    googleDataManagerViewItemProviderAdapter
  ),
  'meta:add_to_cart': createPostgresProviderOutboxWorker(
    metaAddToCartProviderAdapter
  ),
  'meta:begin_checkout': createPostgresProviderOutboxWorker(
    metaBeginCheckoutProviderAdapter
  ),
${metaEvents.map(event => {
  const Pascal = pascalFromSnake(event.name)
  return `  'meta:${event.name}': createPostgresProviderOutboxWorker(
    meta${Pascal}ProviderAdapter
  )`
}).join(',\n')},
  'meta:purchase': createPostgresProviderOutboxWorker(
    metaPurchaseProviderAdapter
  ),
  'meta:view_item': createPostgresProviderOutboxWorker(
    metaViewItemProviderAdapter
  )
} as const satisfies Record<
  RegisteredProviderAdapterKey,
  (input: { maxItems: number }) => Promise<ProviderOutboxBatchSummary>
>
`
  )

  console.log(`Generated ${EVENTS.length} canonical events`)
}

export { generateApiRoute, main }

if (isDirectRun) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(
      'Usage: node scripts/generate-phase2-canonical-events.mjs\n' +
        'Generates phase-2 canonical event modules into the repo.'
    )
    process.exit(0)
  }
  main()
}
