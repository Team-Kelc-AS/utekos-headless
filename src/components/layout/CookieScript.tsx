import {
  COOKIEBOT_DOMAIN_GROUP_ID,
  COOKIEBOT_SCRIPT_URL
} from '@/components/cookie-consent/cookiebotConfig'
import Script from 'next/script'

export const CONSENT_MODE_DEFAULTS = `
  window.dataLayer = window.dataLayer || [];

  window.gtag =
    window.gtag ||
    function () {
      window.dataLayer.push(arguments);
    };

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

  window.gtag(
    'set',
    'ads_data_redaction',
    true
  );

  window.gtag(
    'set',
    'url_passthrough',
    true
  );

  window.uetq = window.uetq || [];

  window.uetq.push(
    'consent',
    'default',
    {
      ad_storage: 'denied'
    }
  );
`

export function CookieScript() {
  return (
    <>
      <Script
        id='consent-mode-defaults'
        strategy='beforeInteractive'
        data-cookieconsent='ignore'
      >
        {CONSENT_MODE_DEFAULTS}
      </Script>

      <Script
        id='Cookiebot'
        src={COOKIEBOT_SCRIPT_URL}
        strategy='beforeInteractive'
        data-cbid={COOKIEBOT_DOMAIN_GROUP_ID}
        data-blockingmode='none'
        data-cookieconsent='ignore'
      />
    </>
  )
}