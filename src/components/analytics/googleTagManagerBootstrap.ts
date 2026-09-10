/**
 * Google receives only a query-free page location until explicit marketing
 * consent. The original URL is not buffered for later sending.
 */
export const GOOGLE_TAG_MANAGER_BOOTSTRAP = `
  (function(w,l){
    w[l]=w[l]||[];
    w.__utekosCookiebotConsentReady=
      w.__utekosCookiebotConsentReady===true;

    function gtag(){
      w[l].push(arguments);
    }

    function pageLocation(){
      var href=String(w.location&&w.location.href||'');

      try {
        var url=new URL(href);
        var cookiebot=w.Cookiebot;
        var hasDecision=Boolean(
          cookiebot&&cookiebot.hasResponse===true&&
          cookiebot.consent&&cookiebot.consent.method==='explicit'&&
          !w.__utekosConsentReloading
        );
        var marketingGranted=Boolean(
          hasDecision&&
          cookiebot.consent&&
          cookiebot.consent.marketing===true
        );

        url.hash='';

        if (marketingGranted) return url.href;

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
