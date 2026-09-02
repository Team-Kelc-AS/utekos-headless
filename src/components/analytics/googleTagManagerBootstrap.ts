const GOOGLE_CLICK_ID_QUERY_PARAMETERS = [
  'dclid',
  'fbclid',
  'gbraid',
  'gclid',
  'msclkid',
  'sc_click_id',
  'sccid',
  'ttclid',
  'twclid',
  'wbraid'
] as const

const serializedGoogleClickIdParameters = JSON.stringify(
  GOOGLE_CLICK_ID_QUERY_PARAMETERS
)

/**
 * Runs before GTM so denied / unresolved Consent Mode pings cannot copy the
 * paid-landing URL into a third-party request. The full URL remains available
 * to the first-party page-view capture and is restored for Google only after
 * Cookiebot grants marketing consent.
 */
export const GOOGLE_TAG_MANAGER_BOOTSTRAP = `
  (function(w,l){
    w[l]=w[l]||[];
    w.__utekosCookiebotConsentReady=
      w.__utekosCookiebotConsentReady===true;

    var clickIdParameters=${serializedGoogleClickIdParameters};

    function gtag(){
      w[l].push(arguments);
    }

    function pageLocation(){
      var href=String(w.location&&w.location.href||'');

      try {
        var url=new URL(href);
        var cookiebot=w.Cookiebot;
        var hasDecision=Boolean(
          cookiebot&&cookiebot.hasResponse===true
        );
        var marketingGranted=Boolean(
          hasDecision&&
          cookiebot.consent&&
          cookiebot.consent.marketing===true
        );
        var statisticsGranted=Boolean(
          hasDecision&&
          cookiebot.consent&&
          cookiebot.consent.statistics===true
        );

        url.hash='';

        if (marketingGranted) return url.href;

        if (statisticsGranted) {
          Array.from(url.searchParams.keys()).forEach(function(key){
            if (clickIdParameters.indexOf(key.toLowerCase())!==-1) {
              url.searchParams.delete(key);
            }
          });
          return url.href;
        }

        url.search='';
        return url.href;
      } catch (_error) {
        return href.split('#')[0].split('?')[0];
      }
    }

    w.gtag=w.gtag||gtag;
    w.gtag('consent','default',{
      ad_storage:'denied',
      ad_user_data:'denied',
      ad_personalization:'denied',
      analytics_storage:'denied'
    });
    w.gtag('set','ads_data_redaction',true);
    w.gtag('set',{page_location:pageLocation()});

    function syncPageLocation(){
      w.__utekosCookiebotConsentReady=true;
      w.gtag('set',{page_location:pageLocation()});
    }

    w.addEventListener('CookiebotOnConsentReady',syncPageLocation);
    w.addEventListener('CookiebotOnAccept',syncPageLocation);
    w.addEventListener('CookiebotOnDecline',syncPageLocation);

    w[l].push({
      'gtm.start':new Date().getTime(),
      event:'gtm.js'
    });
  })(window,'dataLayer');
`
