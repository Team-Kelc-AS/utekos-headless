import assert from 'node:assert/strict'
import Module, { createRequire } from 'node:module'
import test from 'node:test'
import type { ProductWaitlistActionState } from './submitProductWaitlist'

test('invalid Dun waitlist submissions never persist a lead or emit an event', async () => {
  const calls = {
    notification: 0,
    subscriberSync: 0,
    leadSubmission: 0,
    log: 0
  }
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
    if (matches(request, 'sendProductWaitlistNotification')) {
      return {
        sendProductWaitlistNotification: async () => {
          calls.notification += 1
          return { ok: true }
        }
      }
    }
    if (matches(request, 'syncSubscriberToShopify')) {
      return {
        syncSubscriberToShopify: async () => {
          calls.subscriberSync += 1
        }
      }
    }
    if (matches(request, 'recordLeadSubmission')) {
      return {
        recordLeadSubmission: async () => {
          calls.leadSubmission += 1
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
    if (matches(request, 'logToAppLogs')) {
      return {
        logToAppLogs: async () => {
          calls.log += 1
        }
      }
    }
    return originalLoad.call(Module, request, parent, isMain)
  }

  try {
    const require = createRequire(import.meta.url)
    const { submitProductWaitlist } =
      require('./submitProductWaitlist.ts') as {
        submitProductWaitlist: (
          previous: ProductWaitlistActionState,
          formData: FormData
        ) => Promise<ProductWaitlistActionState>
      }
    for (const [field, value] of [
      ['email', 'invalid-email'],
      ['privacy', ''],
      ['productHandle', 'another-product'],
      ['phone', 'not-a-phone'],
      ['name', 'A']
    ] as const) {
      const form = new FormData()
      for (const [key, validValue] of Object.entries({
        name: 'Synthetic Waitlist',
        phone: '+47 400 00 000',
        email: 'synthetic@example.test',
        productHandle: 'utekos-dun',
        entryPoint: 'product_page',
        privacy: 'on',
        marketing: 'on',
        website: ''
      })) {
        form.set(key, validValue)
      }
      form.set(field, value)
      const result = await submitProductWaitlist(
        { status: 'idle', message: '' },
        form
      )
      assert.equal(result.status, 'error')
      assert.ok(result.errors?.[field]?.length)
      assert.equal('eventId' in result, false)
      assert.equal('dataLayerEvent' in result, false)
      assert.deepEqual(calls, {
        notification: 0,
        subscriberSync: 0,
        leadSubmission: 0,
        log: 0
      })
    }
  } finally {
    moduleWithLoad._load = originalLoad
  }
})
