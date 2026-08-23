import Script from 'next/script'
import { PRE_CONSENT_CLICK_ID_GLOBAL_KEY } from '@/lib/analytics/preConsentClickIdStore'

const bootstrap = `
(function(w) {
  'use strict';

  var KEY = ${JSON.stringify(PRE_CONSENT_CLICK_ID_GLOBAL_KEY)};
  var PROVIDERS = [
    ['fbclid', 'fbclid'],
    ['msclkid', 'msclkid'],
    ['epik', 'epik'],
    ['ScCid', 'sc_click_id']
  ];
  var existing = w[KEY];
  var state = existing && typeof existing === 'object' ? existing : {};

  state.clickIds = state.clickIds && typeof state.clickIds === 'object'
    ? state.clickIds
    : {};
  state.observedAtMs = state.observedAtMs && typeof state.observedAtMs === 'object'
    ? state.observedAtMs
    : {};
  w[KEY] = state;

  function clear() {
    state.clickIds = {};
    state.observedAtMs = {};
  }

  function capture() {
    var params;
    var now = Date.now();
    var index;

    try {
      params = new w.URLSearchParams(w.location.search || '');
    } catch (_error) {
      return;
    }

    for (index = 0; index < PROVIDERS.length; index += 1) {
      var queryKey = PROVIDERS[index][0];
      var canonicalKey = PROVIDERS[index][1];
      var value = params.get(queryKey);

      if (typeof value !== 'string' || !value.replace(/^\\s+|\\s+$/g, '')) {
        continue;
      }

      // Click IDs are opaque provider identifiers. Preserve the decoded
      // query value exactly; do not lowercase or otherwise normalize it.
      state.clickIds[canonicalKey] = value;
      state.observedAtMs[canonicalKey] = now;
    }
  }

  function hasConsentDecision() {
    var cookiebot = w.Cookiebot;

    return Boolean(
      cookiebot &&
      (cookiebot.hasResponse === true ||
        cookiebot.consented === true ||
        cookiebot.declined === true)
    );
  }

  function reconcileConsent() {
    var cookiebot = w.Cookiebot;

    if (!hasConsentDecision()) return;

    if (
      cookiebot &&
      cookiebot.consent &&
      cookiebot.consent.marketing === true
    ) {
      capture();
      return;
    }

    clear();
  }

  capture();

  w.addEventListener('CookiebotOnConsentReady', reconcileConsent);
  w.addEventListener('CookiebotOnAccept', reconcileConsent);
  w.addEventListener('CookiebotOnDecline', clear);
})(window);
`

export function PreConsentClickIdCapture() {
  return (
    <Script
      id='utekos-preconsent-click-id-capture'
      strategy='beforeInteractive'
      dangerouslySetInnerHTML={{ __html: bootstrap }}
    />
  )
}
