import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import type { ConsentSnapshot } from '@/lib/analytics/canonicalEventEnvelope'
import type {
  RecordAcceptedGenerateLeadInput,
  RecordAcceptedGenerateLeadResult
} from '@/lib/analytics/server/recordAcceptedGenerateLead'
import {
  appLogInputSchema,
  type AppLogInput
} from '@/lib/observability/logging/appLogContract'
import type { InsertMarketingLeadInput } from './insertMarketingLead'
import {
  LEAD_FORM_IDS,
  LEAD_SOURCES,
  LEAD_TYPES
} from './leadFormIds'
import type {
  RecordLeadSubmissionInput,
  RecordLeadSubmissionResult
} from './recordLeadSubmission'

const insertCalls: InsertMarketingLeadInput[] = []
const recordCalls: RecordAcceptedGenerateLeadInput[] = []
const logCalls: AppLogInput[] = []

let insertImpl: (input: InsertMarketingLeadInput) => Promise<void> =
  async () => {}
let recordImpl: (
  input: RecordAcceptedGenerateLeadInput
) => Promise<RecordAcceptedGenerateLeadResult> = async input =>
  acceptedResult(input.submissionId)

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

  if (
    request === '@/lib/analytics/server/getLeadRequestContextFromHeaders' ||
    isRelativeRequest(request, 'getLeadRequestContextFromHeaders')
  ) {
    return {
      getLeadRequestContextFromHeaders: async () => ({
        countryCode: 'NO',
        userAgent: 'UtekosLeadOrchestrationTest/1.0'
      })
    }
  }

  if (
    request === '@/lib/analytics/server/recordAcceptedGenerateLead' ||
    isRelativeRequest(request, 'recordAcceptedGenerateLead')
  ) {
    return {
      recordAcceptedGenerateLead: async (
        input: RecordAcceptedGenerateLeadInput
      ) => {
        recordCalls.push(input)
        return recordImpl(input)
      }
    }
  }

  if (
    request === '@/lib/utils/logToAppLogs' ||
    isRelativeRequest(request, 'logToAppLogs')
  ) {
    return {
      logToAppLogs: async (input: AppLogInput) => {
        logCalls.push(appLogInputSchema.parse(input))
      }
    }
  }

  if (isRelativeRequest(request, 'insertMarketingLead')) {
    return {
      insertMarketingLead: async (input: InsertMarketingLeadInput) => {
        insertCalls.push(input)
        await insertImpl(input)
        return { id: input.id }
      }
    }
  }

  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { recordLeadSubmission } = require(
  './recordLeadSubmission.ts'
) as {
  recordLeadSubmission: (
    input: RecordLeadSubmissionInput
  ) => Promise<RecordLeadSubmissionResult>
}

const LEAD_ID = '33333333-3333-4333-8333-333333333333'
const PAGE_VIEW_ID = '44444444-4444-4444-8444-444444444444'
const testEmail = ['lead', 'example.test'].join('@')
const testPhone = ['400', '00', '000'].join('')
const testFirstName = ['Nora', 'Test'].join(' ')

const grantedConsent: ConsentSnapshot = {
  analytics: 'granted',
  marketing: 'granted',
  preferences: 'granted',
  source: 'cookiebot',
  version: '1'
}

function acceptedResult(submissionId: string) {
  return {
    dataLayerEvent: {
      event: 'generate_lead',
      event_id: submissionId
    },
    eventId: submissionId,
    status: 'accepted'
  } as RecordAcceptedGenerateLeadResult
}

function resetSpies() {
  insertCalls.length = 0
  recordCalls.length = 0
  logCalls.length = 0
  insertImpl = async () => {}
  recordImpl = async input => acceptedResult(input.submissionId)
}

function baseInput(
  overrides: Partial<RecordLeadSubmissionInput> = {}
): RecordLeadSubmissionInput {
  return {
    email: testEmail,
    firstName: testFirstName,
    formId: LEAD_FORM_IDS.newsletterSignup,
    leadId: LEAD_ID,
    leadType: LEAD_TYPES.newsletter,
    phone: testPhone,
    source: LEAD_SOURCES.newsletterSignup,
    trackingContext: {
      consent: grantedConsent,
      page_url: 'https://utekos.no/nyhetsbrev',
      page_view_id: PAGE_VIEW_ID
    },
    ...overrides
  }
}

function assertLogsExcludeSubmittedCustomerValues() {
  const serializedDiagnostic = JSON.stringify(logCalls)

  assert.equal(serializedDiagnostic.includes(testEmail), false)
  assert.equal(serializedDiagnostic.includes(testPhone), false)
  assert.equal(serializedDiagnostic.includes(testFirstName), false)
}

test('granted lead persists once and returns canonical browser evidence for its submission ID', async () => {
  resetSpies()

  const result = await recordLeadSubmission(baseInput())

  assert.equal(insertCalls.length, 1)
  assert.equal(insertCalls[0]?.id, LEAD_ID)
  assert.equal(insertCalls[0]?.consentMarketing, true)
  assert.equal(insertCalls[0]?.consentSource, 'cookiebot')
  assert.equal(recordCalls.length, 1)
  assert.equal(recordCalls[0]?.submissionId, LEAD_ID)
  assert.equal(recordCalls[0]?.consent.marketing, 'granted')
  assert.equal(result.leadId, LEAD_ID)
  assert.equal(result.eventId, LEAD_ID)
  assert.equal(result.dataLayerEvent?.event_id, LEAD_ID)
  assert.equal(logCalls.length, 0)
})

test('lead without page URL persists once and emits one validated skip without tracking', async () => {
  resetSpies()

  const result = await recordLeadSubmission(
    baseInput({ trackingContext: undefined })
  )

  assert.equal(insertCalls.length, 1)
  assert.equal(recordCalls.length, 0)
  assert.deepEqual(logCalls, [
    {
      context: {},
      data: {
        formId: LEAD_FORM_IDS.newsletterSignup,
        reasonCode: 'missing_page_url'
      },
      event: 'lead.record_skipped',
      level: 'ERROR'
    }
  ])
  assert.equal(result.leadId, LEAD_ID)
  assertLogsExcludeSubmittedCustomerValues()
})

test('tracking failure after persistence is PII-free and fails open', async () => {
  resetSpies()
  recordImpl = async () => {
    throw new TypeError('network failed')
  }

  const result = await recordLeadSubmission(baseInput())

  assert.equal(insertCalls.length, 1)
  assert.equal(recordCalls.length, 1)
  assert.deepEqual(logCalls, [
    {
      context: {},
      data: {
        formId: LEAD_FORM_IDS.newsletterSignup,
        reasonCode: 'network'
      },
      event: 'lead.record_failed',
      level: 'ERROR'
    }
  ])
  assert.deepEqual(result, { leadId: LEAD_ID })
  assertLogsExcludeSubmittedCustomerValues()
})

test('persistence failure logs once and does not attempt tracking', async () => {
  resetSpies()
  insertImpl = async () => {
    throw new Error('provider rejected lead persistence')
  }

  const result = await recordLeadSubmission(baseInput())

  assert.equal(insertCalls.length, 1)
  assert.equal(recordCalls.length, 0)
  assert.deepEqual(logCalls, [
    {
      context: {},
      data: {
        formId: LEAD_FORM_IDS.newsletterSignup,
        reasonCode: 'provider_rejected'
      },
      event: 'lead.persist_failed',
      level: 'ERROR'
    }
  ])
  assert.deepEqual(result, { leadId: LEAD_ID })
  assertLogsExcludeSubmittedCustomerValues()
})
