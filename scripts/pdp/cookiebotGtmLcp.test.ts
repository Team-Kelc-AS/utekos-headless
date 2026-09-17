import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const repoRoot = process.cwd()

async function readSource(
  relativePath: string
): Promise<string> {
  return readFile(
    join(repoRoot, relativePath),
    'utf8'
  )
}

test(
  'root layout delegates the canonical first-party GTM bootstrap',
  async () => {
    const layoutSource = await readSource(
      'src/app/(store)/layout.tsx'
    )
    const source = await readSource(
      'src/components/analytics/GoogleTagManagerLoader.tsx'
    )
    const bootstrapSource = await readSource(
      'src/components/analytics/googleTagManagerBootstrap.ts'
    )
    const stapeLoaderSource = await readSource(
      'src/components/analytics/stapeCustomLoader.ts'
    )
    const noScriptSource = await readSource(
      'src/components/analytics/GoogleTagManagerNoScript.tsx'
    )

    assert.match(
      layoutSource,
      /<GoogleTagManagerLoader[\s\S]*?enabled=\{shouldLoadMarketingScripts\}/,
      'Root layout must retain the canonical GTM loader'
    )
    assert.match(
      layoutSource,
      /<body[^>]*>[\s\S]*?<GoogleTagManagerNoScript[\s\S]*?<Script/,
      'The GTM noscript fallback must be the first body child'
    )

    assert.doesNotMatch(
      source,
      /@next\/third-parties\/google/,
      'Post-hydration GoogleTagManager component must not own the GTM bootstrap'
    )

    assert.doesNotMatch(
      source,
      /CookieScript/,
      'Root layout must not load Cookiebot directly'
    )

    assert.doesNotMatch(
      source,
      /consent\.cookiebot\.(?:com|eu)/,
      'Cookiebot must remain owned by the GTM CMP template'
    )

    assert.match(
      source,
      /STAPE_CUSTOM_LOADER/,
      'GTM loader must use the generated Stape Custom Loader'
    )

    assert.match(
      stapeLoaderSource,
      /https:\/\/utekos\.no\/__sgtm\/apgqnrnczg\.js\?/,
      'Stape Custom Loader must continue through the first-party server gateway'
    )

    const initScript = source.match(
      /<Script[\s\S]*?id=['"]_next-gtm-consent-defaults['"][\s\S]*?\/?>[\s\S]*?(?:<\/Script>)?/
    )

    assert.ok(
      initScript,
      'GTM loader must contain the GTM initialization script'
    )

    assert.match(
      initScript[0],
      /strategy=['"]beforeInteractive['"]/,
      'GTM dataLayer initialization must happen before hydration'
    )

    assert.doesNotMatch(
      bootstrapSource,
      /['"]gtm\.start['"]/,
      'Consent defaults must not emit a second gtm.js start event'
    )
    assert.match(
      source,
      /id=['"]_next-gtm-consent-defaults['"][\s\S]*?GOOGLE_TAG_MANAGER_BOOTSTRAP[\s\S]*?id=['"]_next-stape-custom-loader['"][\s\S]*?STAPE_CUSTOM_LOADER/,
      'Consent defaults must execute before the Stape Custom Loader'
    )
    assert.match(
      noScriptSource,
      /https:\/\/edge\.utekos\.no\/ns\.html\?id=GTM-5TWMJQFP/,
      'The noscript fallback must use the configured Stape custom domain'
    )
    assert.doesNotMatch(
      source,
      /consent\.cookiebot\.(?:com|eu)/,
      'Cookiebot must remain owned by the GTM CMP template'
    )
  }
)

test(
  'Meta application fallback remains post-hydration',
  async () => {
    const layoutSource = await readSource(
      'src/app/(store)/layout.tsx'
    )
    const loaderSource = await readSource(
      'src/components/analytics/MetaBrowserTransportLoader.tsx'
    )

    assert.match(
      layoutSource,
      /<MetaBrowserTransportLoader\s*\/>/,
      'Root layout must delegate consent-aware Meta transport loading'
    )
    assert.match(
      loaderSource,
      /id=['"]meta-pixel-canonical-browser['"][\s\S]*?strategy=['"]afterInteractive['"]/,
      'STEP 7 must not promote the Meta application fallback into the critical path'
    )
  }
)

test(
  'Pinterest Tag loader remains post-hydration behind the marketing script gate',
  async () => {
    const source = await readSource('src/app/(store)/layout.tsx')
    const loader = await readSource(
      'src/components/analytics/ConsentGrantedScript.tsx'
    )

    assert.match(
      source,
      /<ConsentGrantedScript[\s\S]*?id=['"]pinterest-tag-canonical-browser['"][\s\S]*?src=['"]\/analytics\/pinterest-tag-canonical-v1\.js['"][\s\S]*?data-tag-id=\{pinterestTagId\}/,
      'Pinterest Tag must wait for marketing consent before loading'
    )
    assert.match(source, /NEXT_PUBLIC_PINTEREST_TAG_ID/)
    assert.match(
      source,
      /<ConsentGrantedScript[\s\S]*?id=['"]snapchat-pixel-canonical-browser['"]/,
      'Snapchat Pixel must use the same marketing-consent loader'
    )
    assert.match(loader, /useCookiebotConsent/)
    assert.match(loader, /consent\.marketing/)
    assert.doesNotMatch(loader, /beforeInteractive/)
  }
)

test(
  'obsolete direct Cookiebot implementation is removed',
  () => {
    assert.equal(
      existsSync(
        join(
          repoRoot,
          'src/components/layout/CookieScript.tsx'
        )
      ),
      false,
      'Direct CookieScript implementation must be deleted'
    )

    assert.equal(
      existsSync(
        join(
          repoRoot,
          'src/components/layout/CookieScript.test.ts'
        )
      ),
      false,
      'Obsolete CookieScript regression test must be deleted'
    )
  }
)
