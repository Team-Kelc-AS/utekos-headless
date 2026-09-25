import assert from 'node:assert/strict'
import Module, { createRequire } from 'node:module'
import test from 'node:test'
import type { DunWaitlistPageActionState } from './submitDunWaitlistPage'

test('a valid signup records a Dun waitlist lead and returns the confirmation', async () => {
  const submissions: Array<Record<string, unknown>> = []
  const moduleWithLoad = Module as typeof Module & {
    _load: (
      request: string,
      parent: NodeModule | null,
      isMain: boolean
    ) => unknown
  }
  const originalLoad = moduleWithLoad._load
  const matches = (request: string, baseName: string) =>
    request.endsWith(`/${baseName}`) ||
    request.endsWith(`/${baseName}.ts`)

  moduleWithLoad._load = (request, parent, isMain) => {
    if (request === 'server-only') return {}
    if (matches(request, 'recordLeadSubmission')) {
      return {
        recordLeadSubmission: async (
          input: Record<string, unknown>
        ) => {
          submissions.push(input)
          return {
            leadId: '11111111-1111-4111-8111-111111111111',
            eventId: '11111111-1111-4111-8111-111111111111',
            dataLayerEvent: {
              event: 'generate_lead',
              event_id: '11111111-1111-4111-8111-111111111111'
            }
          }
        }
      }
    }
    return originalLoad.call(Module, request, parent, isMain)
  }

  try {
    const require = createRequire(import.meta.url)
    const { submitDunWaitlistPage } =
      require('./submitDunWaitlistPage.ts') as {
        submitDunWaitlistPage: (
          previous: DunWaitlistPageActionState,
          formData: FormData
        ) => Promise<DunWaitlistPageActionState>
      }
    const form = new FormData()
    form.set('email', 'Kari@Example.com')
    form.set('phone', '+47 400 00 000')
    form.set('website', '')

    const result = await submitDunWaitlistPage(
      { status: 'idle', message: '' },
      form
    )

    assert.equal(result.status, 'success')
    assert.equal(result.message, 'Du står på ventelisten.')
    assert.equal(submissions.length, 1)
    assert.equal(submissions[0]?.email, 'kari@example.com')
    assert.equal(submissions[0]?.phone, '+47 400 00 000')
    assert.equal(
      submissions[0]?.source,
      'product_waitlist_utekos_dun'
    )
    assert.equal(
      submissions[0]?.formId,
      'product_waitlist_utekos_dun'
    )
    assert.equal(submissions[0]?.leadType, 'product_waitlist')
    assert.equal(submissions[0]?.productHandle, 'utekos-dun')
    assert.equal(
      submissions[0]?.entryPoint,
      'dun_waitlist_page'
    )
    assert.equal('firstName' in (submissions[0] ?? {}), false)
  } finally {
    moduleWithLoad._load = originalLoad
  }
})

test('a honeypot submission does not record a lead', async () => {
  let recorded = 0
  const moduleWithLoad = Module as typeof Module & {
    _load: (
      request: string,
      parent: NodeModule | null,
      isMain: boolean
    ) => unknown
  }
  const originalLoad = moduleWithLoad._load
  const matches = (request: string, baseName: string) =>
    request.endsWith(`/${baseName}`) ||
    request.endsWith(`/${baseName}.ts`)

  moduleWithLoad._load = (request, parent, isMain) => {
    if (request === 'server-only') return {}
    if (matches(request, 'recordLeadSubmission')) {
      return {
        recordLeadSubmission: async () => {
          recorded += 1
          return { leadId: 'unused' }
        }
      }
    }
    return originalLoad.call(Module, request, parent, isMain)
  }

  try {
    const require = createRequire(import.meta.url)
    const { submitDunWaitlistPage } =
      require('./submitDunWaitlistPage.ts') as {
        submitDunWaitlistPage: (
          previous: DunWaitlistPageActionState,
          formData: FormData
        ) => Promise<DunWaitlistPageActionState>
      }
    const form = new FormData()
    form.set('email', 'kari@example.com')
    form.set('phone', '+47 400 00 000')
    form.set('website', 'https://spam.example')

    const result = await submitDunWaitlistPage(
      { status: 'idle', message: '' },
      form
    )

    assert.equal(result.status, 'success')
    assert.equal(recorded, 0)
    assert.equal('dataLayerEvent' in result, false)
  } finally {
    moduleWithLoad._load = originalLoad
  }
})
