/** Tracking authorization is owned exclusively by the operator policy. */
export const GOOGLE_TAG_MANAGER_BOOTSTRAP = `
  (function(w,l){
    w[l]=w[l]||[];

    function gtag(){
      w[l].push(arguments);
    }

    function pageLocation(){
      var href=String(w.location&&w.location.href||'');

      try {
        var url=new URL(href);
        url.hash='';
        return url.href;
      } catch (_error) {
        return href.split('#')[0].split('?')[0];
      }
    }

    w.gtag=w.gtag||gtag;
    w.gtag('consent','default',{
      ad_storage:'granted',
      ad_user_data:'granted',
      ad_personalization:'granted',
      analytics_storage:'granted'
    });
    w.gtag('set','ads_data_redaction',false);
    w.gtag('set',{page_location:pageLocation()});

  })(window,'dataLayer');
`
