import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const buildDirectory = resolve(process.argv[2] ?? '.next')
const route = '/skreddersy-varmen'

const manifest = JSON.parse(
  await readFile(
    resolve(buildDirectory, 'prerender-manifest.json'),
    'utf8'
  )
)

assert.ok(
  manifest.routes[route],
  `${route}: missing prerendered route`
)
const html = await readFile(
  resolve(buildDirectory, `server/app${route}.html`),
  'utf8'
)
assert.equal(
  (html.match(/<h1(?:\s|>)/gu) ?? []).length,
  1,
  `${route}: hero must be in the static HTML`
)
assert.ok(
  /<h1\b[^>]*id="hero-headline"/u.test(html),
  `${route}: missing hero heading`
)
const heroSection = html.match(
  /<section\b[^>]*aria-labelledby="hero-headline"[^>]*>[\s\S]*?<\/section>/u
)?.[0]
assert.ok(heroSection, `${route}: missing hero section`)
const heroPicture = heroSection.match(
  /<picture\b[^>]*>[\s\S]*?<\/picture>/u
)?.[0]
assert.ok(heroPicture, `${route}: missing hero image`)
assert.match(
  heroPicture,
  /<img\b[^>]*loading="eager"/u,
  `${route}: hero must load eagerly`
)
assert.match(
  heroPicture,
  /<img\b[^>]*fetchpriority="high"/iu,
  `${route}: hero must retain high priority`
)
assert.ok(
  /<link\b[^>]*rel="canonical"[^>]*href="https:\/\/utekos\.no\/skreddersy-varmen"/u.test(
    html
  ),
  `${route}: canonical changed`
)
assert.equal(
  /data-experiment-/u.test(html),
  false,
  `${route}: retired layout experiment markers must not render`
)
console.log(
  `${route}: hero, image and canonical verified in prerendered HTML`
)
