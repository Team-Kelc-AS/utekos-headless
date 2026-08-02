import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

import { initBotId as initBotIdEsm } from 'botid/client/core'

const require = createRequire(import.meta.url)
const { initBotId: initBotIdCjs } = require('botid/client/core')

const protectedRoute = {
  path: '/api/events/*',
  method: 'POST',
  advancedOptions: { checkLevel: 'deepAnalysis' }
}

async function withTimeout(promise, label) {
  let timeout
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`${label} timed out`)),
          1_000
        )
      })
    ])
  } finally {
    clearTimeout(timeout)
  }
}

function preserveGlobals(names) {
  const descriptors = new Map(
    names.map(name => [
      name,
      Object.getOwnPropertyDescriptor(globalThis, name)
    ])
  )

  return () => {
    for (const [name, descriptor] of descriptors) {
      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor)
      } else {
        delete globalThis[name]
      }
    }
  }
}

async function verifyLoader(initBotId) {
  const restoreGlobals = preserveGlobals([
    'KPSDK',
    'V_C',
    'XMLHttpRequest',
    'addEventListener',
    'document',
    'fetch',
    'location',
    'removeEventListener',
    'window'
  ])
  const originalConsoleError = console.error
  const windowEvents = new EventTarget()
  const documentEvents = new EventTarget()
  const scripts = []
  let configureCount = 0
  let originalFetchCount = 0
  let pScriptAppendCount = 0
  let pScriptOutcome = 'failure'
  let releaseReady

  class FakeXMLHttpRequest {
    static DONE = 4

    open() {}
    send() {}
    setRequestHeader() {}
  }

  function removeScript(script) {
    const index = scripts.indexOf(script)
    if (index !== -1) scripts.splice(index, 1)
  }

  const document = {
    hidden: false,
    head: {
      appendChild(script) {
        scripts.push(script)

        if (script.src.includes('c.js')) {
          queueMicrotask(() => {
            globalThis.V_C?.push({ b: 0, d: 1 })
            script.onload?.()
          })
          return script
        }

        if (script.src.endsWith('/p.js')) {
          pScriptAppendCount += 1
          if (pScriptOutcome === 'failure') {
            queueMicrotask(() => {
              script.onerror?.(
                new Error('first KPSDK script load fails')
              )
            })
            return script
          }

          globalThis.KPSDK = {
            configure(routes) {
              configureCount += 1
              assert.deepEqual(routes, [
                {
                  domain: 'utekos.no',
                  path: '/api/events/*',
                  method: 'POST'
                }
              ])
            }
          }
          queueMicrotask(() => {
            documentEvents.dispatchEvent(new Event('kpsdk-load'))
            script.onload?.()
          })
          releaseReady = () => {
            documentEvents.dispatchEvent(
              new Event('kpsdk-ready')
            )
          }
        }

        return script
      }
    },
    addEventListener:
      documentEvents.addEventListener.bind(documentEvents),
    createElement(tagName) {
      assert.equal(tagName, 'script')
      return {
        async: false,
        onerror: undefined,
        onload: undefined,
        src: '',
        remove() {
          removeScript(this)
        }
      }
    },
    querySelector(selector) {
      if (selector === 'script[src*="c.js"]') {
        return (
          scripts.find(script => script.src.includes('c.js')) ??
          null
        )
      }

      const exactSource = /^script\[src="(.+)"\]$/.exec(
        selector
      )?.[1]
      return (
        scripts.find(script => script.src === exactSource) ??
        null
      )
    },
    removeEventListener:
      documentEvents.removeEventListener.bind(documentEvents)
  }

  try {
    console.error = () => {}
    globalThis.window = globalThis
    globalThis.location = new URL(
      'https://utekos.no/skreddersy-varmen'
    )
    globalThis.document = document
    globalThis.XMLHttpRequest = FakeXMLHttpRequest
    globalThis.addEventListener =
      windowEvents.addEventListener.bind(windowEvents)
    globalThis.removeEventListener =
      windowEvents.removeEventListener.bind(windowEvents)
    globalThis.fetch = async () => {
      originalFetchCount += 1
      return new Response(null, { status: 204 })
    }

    initBotId({ protect: [protectedRoute] })

    const failedBatch = await withTimeout(
      Promise.allSettled(
        Array.from({ length: 3 }, () =>
          globalThis.fetch('/api/events/page-view', {
            method: 'POST'
          })
        )
      ),
      'failed concurrent load'
    )

    assert.equal(pScriptAppendCount, 1)
    assert.equal(originalFetchCount, 0)
    assert.deepEqual(
      failedBatch.map(result => result.status),
      ['rejected', 'rejected', 'rejected']
    )
    assert.equal(
      scripts.some(script => script.src.endsWith('/p.js')),
      false,
      'the failed script must be removed so a later load can retry'
    )

    pScriptOutcome = 'deferred-success'
    const successfulBatch = Array.from({ length: 3 }, () =>
      globalThis.fetch('/api/events/page-view', {
        method: 'POST'
      })
    )

    await new Promise(resolve => setImmediate(resolve))

    assert.equal(pScriptAppendCount, 2)
    assert.equal(configureCount, 1)
    assert.equal(originalFetchCount, 0)
    assert.equal(typeof releaseReady, 'function')

    releaseReady()
    await withTimeout(
      Promise.all(successfulBatch),
      'successful concurrent load'
    )

    assert.equal(configureCount, 1)
    assert.equal(originalFetchCount, 3)
  } finally {
    console.error = originalConsoleError
    restoreGlobals()
  }
}

test('BotID ESM shares one KPSDK load and retries after failure', async () => {
  await verifyLoader(initBotIdEsm)
})

test('BotID CJS shares one KPSDK load and retries after failure', async () => {
  await verifyLoader(initBotIdCjs)
})
