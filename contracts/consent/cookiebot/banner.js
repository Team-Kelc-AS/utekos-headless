function utekosCookiebotShow() {
  if (window.UtekosConsentPresentation) {
    window.UtekosConsentPresentation.show()
    return
  }
  // Presentation script unavailable: explicit choices, immediately visible.
  var dialog = document.getElementById('utekos-consent-dialog')
  if (!dialog) return
  dialog.addEventListener('cancel', function (event) {
    event.preventDefault()
  })
  dialog
    .querySelectorAll('[data-consent-action]')
    .forEach(function (button) {
      button.onclick = function () {
        var action = button.getAttribute('data-consent-action')
        var values = [
          'preferences',
          'statistics',
          'marketing'
        ].map(function (key) {
          return (
            action === 'all' ||
            (action === 'save' &&
              document.getElementById('utekos-consent-' + key)
                .checked)
          )
        })
        try {
          if (
            !window.Cookiebot ||
            typeof Cookiebot.submitCustomConsent !== 'function'
          )
            throw new Error('consent_unavailable')
          Cookiebot.submitCustomConsent(
            values[0],
            values[1],
            values[2]
          )
          if (
            Cookiebot.hasResponse &&
            Cookiebot.consent &&
            Cookiebot.consent.method === 'explicit'
          )
            utekosCookiebotHide()
        } catch (_) {
          document.getElementById(
            'utekos-consent-error'
          ).textContent =
            'Valget kunne ikke lagres. Valgfrie funksjoner er fortsatt avslått. Prøv igjen.'
        }
      }
    })
  document.documentElement.style.overflow = 'hidden'
  if (!dialog.open) dialog.showModal()
  document.getElementById('utekos-consent-title').focus()
}
function utekosCookiebotHide() {
  if (window.UtekosConsentPresentation) {
    window.UtekosConsentPresentation.hide()
    return
  }
  if (
    !window.Cookiebot ||
    !Cookiebot.hasResponse ||
    !Cookiebot.consent ||
    Cookiebot.consent.method !== 'explicit'
  )
    return
  var dialog = document.getElementById('utekos-consent-dialog')
  if (dialog && dialog.open) dialog.close()
  document.documentElement.style.overflow = ''
}

window.utekosCookiebotShow = utekosCookiebotShow
window.utekosCookiebotHide = utekosCookiebotHide
