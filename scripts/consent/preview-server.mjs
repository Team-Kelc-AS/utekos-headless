import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'

const root = new URL('../../', import.meta.url)
const routes = {
  '/presentation.js': [
    'public/consent/utekos-presentation.js',
    'text/javascript'
  ],
  '/banner.js': [
    'contracts/consent/cookiebot/banner.js',
    'text/javascript'
  ],
  '/banner.css': [
    'contracts/consent/cookiebot/banner.css',
    'text/css'
  ]
}
const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://127.0.0.1:4873')
    .pathname
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'GET') {
    response.writeHead(405)
    response.end()
    return
  }
  if (routes[path]) {
    const [file, type] = routes[path]
    response.setHeader('Content-Type', type)
    response.end(await readFile(new URL(file, root)))
    return
  }
  if (!['/', '/produkter', '/personvern'].includes(path)) {
    response.writeHead(404)
    response.end()
    return
  }
  const html = await readFile(
    new URL('contracts/consent/cookiebot/banner.html', root),
    'utf8'
  )
  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  response.end(`<!doctype html><html lang="nb"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Utekos – lokal samtykketest</title><link rel="stylesheet" href="/banner.css">
  <body style="margin:0;background:#f0eee9;color:#002521;font:18px/1.5 system-ui">
  <header style="padding:24px;position:sticky;top:0;background:#f0eee9">
  <strong>UTEKOS · Lokal test – ingen leverandørsending</strong>
  <button onclick="UtekosConsentPresentation.open()">Personverninnstillinger</button>
  <button onclick="history.pushState({},'',location.pathname==='/'?'/produkter':'/');window.dispatchEvent(new Event('utekos:consent:navigation'))">Reell sidenavigasjon</button>
  <p id="test-result">Ingen valg registrert</p></header>
  <main style="min-height:3500px;padding:32px"><h1>Skreddersy varmen</h1><p>Dialogen vises etter åtte synlige sekunder og minst 25 prosent scrolling, eller etter sidenavigasjon.</p><p>Dette er en isolert test med en simulert Cookiebot-motor. Ingen ekte cookies, GTM, Meta eller ordre.</p></main>
  ${html}
  <script>window.Cookiebot={hasResponse:false,consent:{method:null},renew:function(){utekosCookiebotShow()},submitCustomConsent:function(p,s,m){this.hasResponse=true;this.consent={method:'explicit',preferences:p,statistics:s,marketing:m};document.getElementById('test-result').textContent='Bekreftet testvalg: preferanser='+p+', statistikk='+s+', markedsføring='+m;window.dispatchEvent(new Event('CookiebotOnAccept'));utekosCookiebotHide()}};</script>
  <script src="/presentation.js"></script><script src="/banner.js"></script><script>utekosCookiebotShow()</script></body></html>`)
})
server.listen(4873, '127.0.0.1', () =>
  console.log(
    'Local-only consent preview: http://127.0.0.1:4873'
  )
)
