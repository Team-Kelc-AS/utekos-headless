export const CONSENT_MODE_DEFAULTS = `
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.blocklist': ['sandboxedScripts'] });
  window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
  window.gtag('consent', 'default', {
    ad_personalization: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500
  });
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('set', 'url_passthrough', true);
  window.uetq = window.uetq || [];
  window.uetq.push('consent', 'default', { ad_storage: 'denied' });
  window.CookiebotCallback_OnLoad = function() {
    if (
      window.Cookiebot &&
      window.Cookiebot.regulations &&
      window.Cookiebot.regulations.gdprApplies &&
      !window.Cookiebot.hasResponse
    ) {
      window.Cookiebot.renew();
    }
  };
  window.addEventListener('load', function() {
    window.dataLayer.push({ 'gtm.blocklist': [] });
    if (window.Cookiebot && window.Cookiebot.consent) {
      window.dataLayer.push({ event: 'cookie_consent_update' });
    }
  }, { once: true });
`
