import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import type { ConsentSnapshot } from '../canonicalEventEnvelope'
import type { CanonicalGenerateLead } from '../generateLeadEvent'
import type {
  RecordAcceptedGenerateLeadInput,
  RecordAcceptedGenerateLeadResult
} from './recordAcceptedGenerateLead'
import type { CanonicalGenerateLeadRequestContext } from './normalizeCanonicalGenerateLead'

const afterCalls: Array<() => Promise<void>> = []
const runBatchCalls: Array<{ maxItems: number }> = []
const acceptCalls: Array<{
  payload: unknown
  requestContext: CanonicalGenerateLeadRequestContext
  store: unknown
}> = []

let acceptImpl: (input: {
  payload: unknown
  requestContext: CanonicalGenerateLeadRequestContext
  store: unknown
}) => Promise<
  | {
      event: CanonicalGenerateLead
      event_id: string
      status: 'accepted' | 'duplicate'
    }
  | { reason: 'consent_denied'; status: 'rejected' }
> = async () => {
  throw new Error('acceptImpl not configured')
}

const moduleWithLoad = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const originalLoad = moduleWithLoad._load.bind(Module)

function isRelativeRequest(request: string, baseName: string) {
  return (
    request === `./${baseName}` ||
    request === `./${baseName}.ts` ||
    request.endsWith(`/${baseName}`) ||
    request.endsWith(`/${baseName}.ts`)
  )
}

moduleWithLoad._load = (request, parent, isMain) => {
  if (request === 'server-only') {
    return {}
  }

  if (request === 'next/server') {
    return {
      after: (task: () => Promise<void>) => {
        afterCalls.push(task)
        void task()
      }
    }
  }

  if (
    isRelativeRequest(
      request,
      'runRegisteredProviderOutboxBatch'
    )
  ) {
    return {
      runRegisteredProviderOutboxBatch: async (input: {
        maxItems: number
      }) => {
        runBatchCalls.push(input)
      }
    }
  }

  if (
    isRelativeRequest(request, 'acceptCanonicalGenerateLead')
  ) {
    return {
      acceptCanonicalGenerateLead: async (input: {
        payload: unknown
        requestContext: CanonicalGenerateLeadRequestContext
        store: unknown
      }) => {
        acceptCalls.push(input)
        return acceptImpl(input)
      }
    }
  }

  if (
    isRelativeRequest(request, 'postgresCanonicalPageViewStore')
  ) {
    return {
      postgresCanonicalEventStore: {
        accept: async () => 'inserted'
      }
    }
  }

  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { recordAcceptedGenerateLead } =
  require('./recordAcceptedGenerateLead.ts') as {
    recordAcceptedGenerateLead: (
      input: RecordAcceptedGenerateLeadInput
    ) => Promise<RecordAcceptedGenerateLeadResult>
  }
const { normalizeCanonicalGenerateLead } = require(
  './normalizeCanonicalGenerateLead.ts'
) as {
  normalizeCanonicalGenerateLead: (
    payload: unknown,
    requestContext: CanonicalGenerateLeadRequestContext
  ) => CanonicalGenerateLead
}

const SUBMISSION_ID = '22222222-2222-4222-8222-222222222222'
const PAGE_VIEW_ID = '11111111-1111-4111-8111-111111111111'

const grantedConsent: ConsentSnapshot = {
  analytics: 'granted',
  marketing: 'granted',
  preferences: 'granted',
  source: 'cookiebot',
  version: '1'
}

const deniedConsent: ConsentSnapshot = {
  analytics: 'denied',
  marketing: 'denied',
  preferences: 'denied',
  source: 'cookiebot',
  version: '1'
}

const requestContext: CanonicalGenerateLeadRequestContext = {
  clientIpAddress: '203.0.113.10',
  countryCode: 'NO',
  userAgent: 'UtekosLeadTestAgent/1.0'
}

function resetSpies() {
  afterCalls.length = 0
  runBatchCalls.length = 0
  acceptCalls.length = 0
}

function baseInput(
  overrides: Partial<RecordAcceptedGenerateLeadInput> = {}
): RecordAcceptedGenerateLeadInput {
  return {
    consent: grantedConsent,
    formId: 'newsletter_signup',
    leadType: 'newsletter',
    pageUrl: 'https://utekos.no/nyhetsbrev',
    requestContext,
    submissionId: SUBMISSION_ID,
    ...overrides
  }
}

test('accepted lead returns existing result and does not schedule registry dispatch', async () => {
  resetSpies()
  acceptImpl = async input => {
    const event = input.payload as CanonicalGenerateLead
    return { event, event_id: event.event_id, status: 'accepted' }
  }

  const result = await recordAcceptedGenerateLead(
    baseInput({
      email: 'lead@example.com',
      pageUrl: 'https://utekos.no/nyhetsbrev',
      pageViewId: PAGE_VIEW_ID
    })
  )

  if (result.status !== 'accepted') {
    assert.fail(`expected accepted, got ${result.status}`)
  }
  assert.equal(result.eventId, SUBMISSION_ID)
  assert.equal(result.dataLayerEvent.event, 'generate_lead')
  assert.equal(result.dataLayerEvent.event_id, SUBMISSION_ID)
  assert.equal(acceptCalls.length, 1)
  assert.equal(afterCalls.length, 0)
  assert.equal(runBatchCalls.length, 0)
})

test('duplicate lead returns existing result and schedules nothing', async () => {
  resetSpies()
  acceptImpl = async input => {
    const event = input.payload as CanonicalGenerateLead
    return { event, event_id: event.event_id, status: 'duplicate' }
  }

  const result = await recordAcceptedGenerateLead(baseInput())

  if (result.status !== 'duplicate') {
    assert.fail(`expected duplicate, got ${result.status}`)
  }
  assert.equal(result.eventId, SUBMISSION_ID)
  assert.equal(result.dataLayerEvent.event_id, SUBMISSION_ID)
  assert.equal(afterCalls.length, 0)
  assert.equal(runBatchCalls.length, 0)
})

test('rejected consent returns skipped result and schedules nothing', async () => {
  resetSpies()
  acceptImpl = async () => ({
    reason: 'consent_denied',
    status: 'rejected'
  })

  const result = await recordAcceptedGenerateLead(
    baseInput({ consent: deniedConsent })
  )

  assert.deepEqual(result, {
    reason: 'consent_denied',
    status: 'skipped'
  })
  assert.equal(afterCalls.length, 0)
  assert.equal(runBatchCalls.length, 0)
})

test('acceptance error propagates without scheduling registry dispatch', async () => {
  resetSpies()
  const expectedError = new Error('accept failed')
  acceptImpl = async () => {
    throw expectedError
  }

  await assert.rejects(
    recordAcceptedGenerateLead(baseInput()),
    error => error === expectedError
  )

  assert.equal(afterCalls.length, 0)
  assert.equal(runBatchCalls.length, 0)
})

test('generated canonical event retains submissionId and current context', async () => {
  resetSpies()
  acceptImpl = async input => {
    const event = input.payload as CanonicalGenerateLead
    return { event, event_id: event.event_id, status: 'accepted' }
  }

  await recordAcceptedGenerateLead(
    baseInput({
      email: 'context@example.com',
      pageUrl: 'https://utekos.no/venteliste?fbclid=abc123',
      pageViewId: PAGE_VIEW_ID,
      cookieHeader:
        'utekos_external_id=anon_aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee; _fbp=fb.1.1; _fbc=fb.1.1753099200000.abc123; _epik=pinterest-cookie-1'
    })
  )

  assert.equal(acceptCalls.length, 1)
  const { payload, requestContext: capturedContext } =
    acceptCalls[0]!
  const event = payload as {
    event_id: string
    click_id?: Record<string, string>
    page_view_id?: string
    page_url: string
    custom_data: { submission_id: string; form_id: string }
    event_device_info?: {
      userAgent?: string
      user_agent?: string
    }
  }

  assert.equal(event.event_id, SUBMISSION_ID)
  assert.equal(event.custom_data.submission_id, SUBMISSION_ID)
  assert.equal(event.custom_data.form_id, 'newsletter_signup')
  assert.equal(event.page_view_id, PAGE_VIEW_ID)
  assert.equal(event.click_id?.epik, 'pinterest-cookie-1')
  assert.equal(
    event.page_url,
    'https://utekos.no/venteliste?fbclid=abc123'
  )
  assert.equal(capturedContext, requestContext)
  assert.equal(
    capturedContext.userAgent,
    'UtekosLeadTestAgent/1.0'
  )
  assert.equal(afterCalls.length, 0)
  assert.equal(runBatchCalls.length, 0)
})

test('denied marketing lead audits marketing signals as consent_denied', async () => {
  resetSpies()
  acceptImpl = async input => {
    const payload = input.payload as CanonicalGenerateLead
    const event = normalizeCanonicalGenerateLead(
      payload,
      input.requestContext
    )
    return { event, event_id: event.event_id, status: 'accepted' }
  }

  const result = await recordAcceptedGenerateLead(
    baseInput({
      consent: {
        analytics: 'granted',
        marketing: 'denied',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      },
      email: 'consent-denied@example.com',
      pageUrl:
        'https://utekos.no/nyhetsbrev?fbclid=denied-click',
      cookieHeader: '_fbp=fb.1.1; _fbc=fb.1.2.denied-click'
    })
  )

  assert.equal(acceptCalls.length, 1)
  const payload = acceptCalls[0]!
    .payload as CanonicalGenerateLead
  assert.equal(payload.click_id, undefined)
  assert.equal(payload.external_id, undefined)
  assert.notEqual(payload.user_data, undefined)
  if (result.status === 'skipped') {
    assert.fail('expected analytics-only lead to be accepted')
  }
  assert.equal(
    result.dataLayerEvent.canonical_event.user_data,
    undefined
  )
  assert.equal(
    payload.signal_audit?.external_id.state,
    'unavailable'
  )
  if (
    payload.signal_audit?.external_id.state === 'unavailable'
  ) {
    assert.equal(
      payload.signal_audit.external_id.reason,
      'consent_denied'
    )
  }
})
