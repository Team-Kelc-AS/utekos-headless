;(function () {
  'use strict'
  if (window.UtekosConsentPresentation) return
  var requested = false,
    manual = false,
    navigated = false,
    completed = false
  var started = false
  var visibleMs = 0,
    scrolled = false,
    lastTime = performance.now()
  var previousPath = location.pathname,
    previousFocus = null,
    previousOverflow = ''
  var timer = null,
    wired = null,
    priorMask = null,
    renewalRequested = false
  function valid() {
    return !!(
      window.Cookiebot &&
      Cookiebot.hasResponse &&
      Cookiebot.consent &&
      Cookiebot.consent.method === 'explicit'
    )
  }
  function dialog() {
    return document.getElementById('utekos-consent-dialog')
  }
  function tickTime() {
    if (!started) return
    var now = performance.now()
    if (document.visibilityState === 'visible')
      visibleMs += Math.max(0, now - lastTime)
    lastTime = now
  }
  function stopTimer() {
    if (timer !== null) clearInterval(timer)
    timer = null
  }
  function wire(element) {
    if (wired === element) return
    wired = element
    element.addEventListener('cancel', function (event) {
      event.preventDefault()
      document.getElementById('utekos-consent-reject').focus()
      document.getElementById(
        'utekos-consent-error'
      ).textContent =
        'Velg Avvis valgfrie for å fortsette uten valgfri sporing, eller lagre dine valg.'
    })
    element
      .querySelectorAll('[data-consent-action]')
      .forEach(function (button) {
        button.addEventListener('click', function () {
          var action = button.getAttribute('data-consent-action')
          var categories = [
            'preferences',
            'statistics',
            'marketing'
          ].map(function (category) {
            return (
              action === 'all' ||
              (action === 'save' &&
                document.getElementById(
                  'utekos-consent-' + category
                ).checked)
            )
          })
          var error = document.getElementById(
            'utekos-consent-error'
          )
          if (
            !window.Cookiebot ||
            typeof Cookiebot.submitCustomConsent !== 'function'
          ) {
            error.textContent =
              'Samtykketjenesten er ikke tilgjengelig. Valgfrie funksjoner er fortsatt avslått. Prøv igjen.'
            return
          }
          try {
            Cookiebot.submitCustomConsent(
              categories[0],
              categories[1],
              categories[2]
            )
            if (valid()) hide()
          } catch (_) {
            error.textContent =
              'Valget kunne ikke lagres. Valgfrie funksjoner forblir avslått til valget er bekreftet.'
          }
        })
      })
  }
  function reveal() {
    var element = dialog()
    if (!element || element.open) return
    wire(element)
    ;['preferences', 'statistics', 'marketing'].forEach(
      function (category) {
        document.getElementById(
          'utekos-consent-' + category
        ).checked =
          valid() && Cookiebot.consent[category] === true
      }
    )
    previousFocus = document.activeElement
    previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    element.showModal()
    document.getElementById('utekos-consent-title').focus()
    stopTimer()
  }
  function evaluate() {
    if (!requested || completed) return
    try {
      tickTime()
      if (document.visibilityState !== 'visible') return
      if (manual || navigated || (visibleMs >= 8000 && scrolled))
        reveal()
    } catch (_) {
      reveal()
    }
  }
  function show() {
    completed = false
    requested = true
    if (valid()) manual = true
    if (timer === null) timer = setInterval(evaluate, 200)
    evaluate()
  }
  function hide() {
    if (!valid()) return
    completed = true
    requested = false
    manual = false
    stopTimer()
    var element = dialog()
    if (element && element.open) {
      element.close()
      document.documentElement.style.overflow = previousOverflow
      if (
        previousFocus &&
        previousFocus.isConnected &&
        typeof previousFocus.focus === 'function'
      )
        previousFocus.focus()
    }
  }
  function manualOpen() {
    manual = true
    completed = false
    if (
      window.Cookiebot &&
      typeof Cookiebot.renew === 'function'
    )
      Cookiebot.renew()
    if (dialog()) show()
    else
      window.dispatchEvent(
        new Event('utekos:consent:unavailable')
      )
  }
  window.addEventListener(
    'scroll',
    function () {
      if (
        completed ||
        document.visibilityState !== 'visible' ||
        (dialog() && dialog().open)
      )
        return
      var distance =
        Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight
        ) - innerHeight
      if (
        distance > 0 &&
        scrollY > 0 &&
        scrollY / distance >= 0.25
      )
        scrolled = true
      evaluate()
    },
    { passive: true }
  )
  document.addEventListener('visibilitychange', function () {
    // visibilityState already changed: charge the interval to the previous state.
    var now = performance.now()
    if (started && document.visibilityState === 'hidden')
      visibleMs += Math.max(0, now - lastTime)
    lastTime = now
    evaluate()
  })
  window.addEventListener(
    'utekos:consent:navigation',
    function () {
      if (location.pathname !== previousPath) {
        previousPath = location.pathname
        navigated = true
        evaluate()
      }
    }
  )
  window.addEventListener('utekos:consent:open', manualOpen)
  function changed() {
    if (!valid()) {
      if (
        window.Cookiebot &&
        Cookiebot.hasResponse &&
        !renewalRequested
      ) {
        renewalRequested = true
        Cookiebot.renew()
      }
      if (priorMask) {
        window.__utekosConsentReloading = true
        location.reload()
      }
      return
    }
    var mask =
      Number(Cookiebot.consent.statistics) |
      (Number(Cookiebot.consent.marketing) << 1)
    if (
      priorMask !== null &&
      priorMask !== 0 &&
      priorMask !== mask
    ) {
      window.__utekosConsentReloading = true
      location.reload()
      return
    }
    priorMask = mask
    hide()
  }
  ;[
    'CookiebotOnConsentReady',
    'CookiebotOnAccept',
    'CookiebotOnDecline'
  ].forEach(function (name) {
    window.addEventListener(name, changed)
  })
  function startVisibleClock() {
    requestAnimationFrame(function () {
      started = true
      lastTime = performance.now()
      evaluate()
    })
  }
  if (document.readyState === 'loading')
    document.addEventListener(
      'DOMContentLoaded',
      startVisibleClock,
      { once: true }
    )
  else startVisibleClock()
  window.UtekosConsentPresentation = {
    show: show,
    hide: hide,
    open: manualOpen
  }
  if (valid())
    priorMask =
      Number(Cookiebot.consent.statistics) |
      (Number(Cookiebot.consent.marketing) << 1)
  try {
    var previous =
      document.referrer ? new URL(document.referrer) : null
    navigated = !!(
      previous &&
      previous.origin === location.origin &&
      previous.pathname !== location.pathname
    )
  } catch (_) {
    navigated = false
  }
})()
