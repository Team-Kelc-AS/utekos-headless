import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const source = readFileSync(
  new URL(
    '../../public/consent/utekos-presentation.js',
    import.meta.url
  ),
  'utf8'
)
function fixture({ initialConsent, failingClock = false } = {}) {
  let now = 0,
    shows = 0,
    reloads = 0,
    writes = 0,
    timer,
    submitted = []
  const listeners = new Map(),
    documentListeners = new Map()
  const inputs = Object.fromEntries(
    ['preferences', 'statistics', 'marketing'].map(key => [
      key,
      { checked: false }
    ])
  )
  const actions = Object.fromEntries(
    ['reject', 'save', 'all'].map(key => [
      key,
      {
        getAttribute: () => key,
        addEventListener: (_, fn) => {
          actions[key].click = fn
        }
      }
    ])
  )
  const element = {
    open: false,
    showModal() {
      this.open = true
      shows++
    },
    close() {
      this.open = false
    },
    querySelectorAll: () => Object.values(actions),
    addEventListener: (name, fn) => {
      element[name] = fn
    }
  }
  const title = { focus() {} },
    error = { textContent: '' }
  const document = {
    readyState: 'complete',
    visibilityState: 'visible',
    referrer: '',
    activeElement: title,
    body: { scrollHeight: 4000 },
    documentElement: {
      scrollHeight: 4000,
      style: { overflow: 'auto' }
    },
    getElementById: id =>
      id === 'utekos-consent-dialog' ? element
      : (
        id === 'utekos-consent-title' ||
        id === 'utekos-consent-reject'
      ) ?
        title
      : id === 'utekos-consent-error' ? error
      : inputs[id.replace('utekos-consent-', '')],
    addEventListener: (name, fn) => {
      documentListeners.set(name, fn)
    }
  }
  const location = {
    pathname: '/',
    origin: 'https://utekos.no',
    reload: () => {
      reloads++
    }
  }
  const api = {
    hasResponse: !!initialConsent,
    consent: initialConsent || { method: null },
    renew() {
      context.UtekosConsentPresentation.show()
    },
    submitCustomConsent(preferences, statistics, marketing) {
      submitted.push([preferences, statistics, marketing])
      api.hasResponse = true
      api.consent = {
        method: 'explicit',
        preferences,
        statistics,
        marketing
      }
      listeners.get('CookiebotOnAccept')()
    }
  }
  const context = {
    document,
    location,
    Cookiebot: api,
    URL,
    Event,
    innerHeight: 1000,
    scrollY: 0,
    performance: {
      now: () => {
        if (failingClock && now > 0)
          throw new Error('clock failed')
        return now
      }
    },
    setInterval: fn => {
      timer = fn
      return 1
    },
    clearInterval: () => {
      timer = undefined
    },
    requestAnimationFrame: fn => fn(),
    addEventListener: (name, fn) => {
      listeners.set(name, fn)
    },
    dispatchEvent: event => listeners.get(event.type)?.(event)
  }
  for (const key of ['localStorage', 'sessionStorage'])
    Object.defineProperty(context, key, {
      get() {
        writes++
        throw new Error('storage forbidden')
      }
    })
  Object.defineProperty(document, 'cookie', {
    get() {
      writes++
      throw new Error('cookie forbidden')
    },
    set() {
      writes++
      throw new Error('cookie forbidden')
    }
  })
  context.window = context
  vm.runInNewContext(source, context)
  return {
    context,
    api,
    element,
    actions,
    inputs,
    submitted,
    shows: () => shows,
    reloads: () => reloads,
    writes: () => writes,
    show: () => context.UtekosConsentPresentation.show(),
    advance: ms => {
      now += ms
      timer?.()
    },
    scroll: y => {
      context.scrollY = y
      listeners.get('scroll')()
    },
    visibility: state => {
      document.visibilityState = state
      documentListeners.get('visibilitychange')()
    },
    navigate: path => {
      location.pathname = path
      context.dispatchEvent(
        new Event('utekos:consent:navigation')
      )
    }
  }
}
test('eight visible seconds AND 25 percent actual scrolling, once and without consent', () => {
  const f = fixture()
  f.show()
  f.advance(8000)
  assert.equal(f.shows(), 0)
  f.scroll(749)
  assert.equal(f.shows(), 0)
  f.scroll(750)
  assert.equal(f.shows(), 1)
  f.advance(8000)
  f.scroll(1400)
  assert.equal(f.shows(), 1)
  assert.equal(f.submitted.length, 0)
  assert.equal(f.writes(), 0)
})
test('scroll first still waits for eight seconds', () => {
  const f = fixture()
  f.show()
  f.scroll(900)
  f.advance(7999)
  assert.equal(f.shows(), 0)
  f.advance(1)
  assert.equal(f.shows(), 1)
})
test('hidden time never meets the visibility threshold', () => {
  const f = fixture()
  f.show()
  f.advance(3000)
  f.visibility('hidden')
  f.advance(60000)
  f.visibility('visible')
  f.scroll(900)
  f.advance(4999)
  assert.equal(f.shows(), 0)
  f.advance(1)
  assert.equal(f.shows(), 1)
})
test('only a committed different pathname opens immediately', () => {
  const f = fixture()
  f.show()
  f.navigate('/')
  assert.equal(f.shows(), 0)
  f.navigate('/produkter')
  assert.equal(f.shows(), 1)
  assert.equal(f.submitted.length, 0)
})
test('manual opening bypasses the delay; Escape cannot imply consent', () => {
  const f = fixture()
  f.context.UtekosConsentPresentation.open()
  assert.equal(f.shows(), 1)
  let prevented = false
  f.element.cancel({
    preventDefault() {
      prevented = true
    }
  })
  assert.equal(prevented, true)
  assert.equal(f.element.open, true)
  assert.equal(f.submitted.length, 0)
})
test('reject, statistics, marketing and all map to exact SDK booleans with no preselection', () => {
  for (const [action, selection, expected] of [
    ['reject', [], [false, false, false]],
    ['save', ['statistics'], [false, true, false]],
    ['save', ['marketing'], [false, false, true]],
    ['all', [], [true, true, true]]
  ]) {
    const f = fixture()
    f.context.UtekosConsentPresentation.open()
    for (const input of Object.values(f.inputs))
      assert.equal(input.checked, false)
    selection.forEach(key => {
      f.inputs[key].checked = true
    })
    f.actions[action].click()
    assert.deepEqual(f.submitted[0], expected)
    assert.equal(f.element.open, false)
    assert.equal(
      f.context.document.documentElement.style.overflow,
      'auto'
    )
    assert.equal(f.reloads(), 0)
    assert.equal(f.writes(), 0)
  }
})
test('withdrawal of an existing grant reloads to unload already initialized SDKs', () => {
  const f = fixture({
    initialConsent: {
      method: 'explicit',
      statistics: true,
      marketing: true
    }
  })
  f.context.UtekosConsentPresentation.open()
  f.actions.reject.click()
  assert.equal(f.context.__utekosConsentReloading, true)
  assert.equal(f.reloads(), 1)
})
test('missing or implied historic grants never preselect optional categories', () => {
  for (const method of [null, 'implied']) {
    const f = fixture({
      initialConsent: {
        method,
        statistics: true,
        marketing: true
      }
    })
    f.context.UtekosConsentPresentation.open()
    assert.equal(f.inputs.marketing.checked, false)
    assert.equal(f.inputs.statistics.checked, false)
  }
})
test('delay controller failure opens explicit dialog, without submitting any consent', () => {
  const f = fixture({ failingClock: true })
  f.show()
  f.advance(100)
  assert.equal(f.shows(), 1)
  assert.equal(f.submitted.length, 0)
})
