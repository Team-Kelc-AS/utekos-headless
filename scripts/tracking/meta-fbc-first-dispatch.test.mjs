import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const script = readFileSync(
  new URL(
    '../../public/analytics/meta-pixel-canonical-v1.js',
    import.meta.url
  ),
  'utf8'
)
const safari = 'Version/18.0 Mobile/15E148 Safari/604.1'

function harness({
  search = '',
  userAgent = '',
  cookie = ''
} = {}) {
  let now = 1000
  const intervals = []
  const listeners = new Map()
  const document = {
    cookie: `utekos_external_id=anon_test; ${cookie}`,
    createElement: () => ({}),
    getElementsByTagName: () => [],
    head: { appendChild() {} }
  }
  const event = {
    event: 'page_view',
    event_id: 'same-page-view',
    canonical_event: {
      event_name: 'page_view',
      event_id: 'same-page-view',
      consent: { marketing: 'granted' },
      custom_data: {}
    }
  }
  const window = {
    location: new URL(`https://utekos.no/${search}`),
    navigator: { userAgent },
    dataLayer: [event],
    addEventListener: (name, handler) =>
      listeners.set(name, handler),
    setTimeout: () => 1,
    setInterval: handler => {
      intervals.push(handler)
      return intervals.length
    }
  }
  const context = vm.createContext({
    window,
    document,
    Date: { now: () => now }
  })
  vm.runInContext(script, context)
  return {
    document,
    window,
    tick(elapsed = 200) {
      now += elapsed
      intervals.forEach(handler => handler())
    },
    repeat() {
      listeners.get('utekos:meta-canonical-browser-event')({
        detail: event
      })
    },
    leave() { listeners.get('pagehide')() },
    calls() {
      return window.fbq.queue.filter(
        call => call[0] === 'trackSingle'
      )
    }
  }
}

test('first URL-click PageView waits for fbc and retains the original event ID exactly once', () => {
  const runtime = harness({ search: '?fbclid=RealClick' })
  assert.equal(runtime.calls().length, 0)
  runtime.repeat()
  runtime.tick()
  assert.equal(runtime.calls().length, 0)
  runtime.document.cookie +=
    '; _fbc=fb.1.1000.RealClick.AQQCAQMB'
  runtime.tick()
  runtime.repeat()
  runtime.tick()
  assert.equal(runtime.calls().length, 1)
  assert.equal(runtime.calls()[0][4].eventID, 'same-page-view')
})

test('returning eligible Safari visit waits for Cookie Keeper even without URL fbclid', () => {
  const runtime = harness({
    userAgent: safari,
    cookie: 'user_id=stable-master'
  })
  assert.equal(runtime.calls().length, 0)
  runtime.document.cookie +=
    '; _fbc=fb.1.500.PreviousRealClick.AQQCAQMB'
  runtime.tick()
  assert.equal(runtime.calls().length, 1)
})

test('missing restoration has a fixed deadline despite polling and duplicate observations', () => {
  const runtime = harness({
    userAgent: safari,
    cookie: 'user_id=stable-master'
  })
  for (let index = 0; index < 14; index++) {
    runtime.tick()
    runtime.repeat()
  }
  assert.equal(runtime.calls().length, 0)
  runtime.tick()
  assert.equal(runtime.calls().length, 1)
  assert.doesNotMatch(runtime.document.cookie, /_fbc=/)
  runtime.document.cookie += '; _fbc=fb.1.500.LateRealClick'
  runtime.tick()
  assert.equal(runtime.calls().length, 1)
})

test('organic visits without restoration eligibility dispatch immediately without inventing fbc', () => {
  const runtime = harness()
  assert.equal(runtime.calls().length, 1)
  assert.doesNotMatch(runtime.document.cookie, /_fbc=/)
})

test('a quick departure releases the pending event once before the restoration deadline', () => {
  const runtime = harness({ search: '?fbclid=RealClick' })
  assert.equal(runtime.calls().length, 0)
  runtime.leave()
  runtime.leave()
  runtime.tick(3000)
  assert.equal(runtime.calls().length, 1)
  assert.equal(runtime.calls()[0][4].eventID, 'same-page-view')
})

test('an existing fbc dispatches immediately and remains byte-for-byte unchanged', () => {
  const cookie = '_fbc=fb.1.500.RealClick.AQQCAQMB'
  const runtime = harness({
    search: '?fbclid=RealClick',
    cookie
  })
  assert.equal(runtime.calls().length, 1)
  assert.ok(runtime.document.cookie.endsWith(cookie))
})
