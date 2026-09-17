import assert from 'node:assert/strict'
import test from 'node:test'
import { STAPE_CUSTOM_LOADER } from './stapeCustomLoader'

test('retains the generated Stape Custom Loader without modification', () => {
  assert.equal(
    STAPE_CUSTOM_LOADER,
    '(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({\'gtm.start\':new Date().getTime(),event:\'gtm.js\'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src="https://utekos.no/__sgtm/apgqnrnczg.js?"+i;f.parentNode.insertBefore(j,f);})(window,document,\'script\',\'dataLayer\',\'ds4bay5=Dh5eKSYjXFIzLS4kIyghQRFHUUBDSBUJWg8XCxkBAkkJFUUdHR5MSDglEAkGAw%3D%3D\');'
  )
})
