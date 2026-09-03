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
      'src/app/layout.tsx'
    )
    const source = await readSource(
      'src/components/analytics/GoogleTagManagerLoader.tsx'
    )
    const bootstrapSource = await readSource(
      'src/components/analytics/googleTagManagerBootstrap.ts'
    )

    assert.match(
      layoutSource,
      /<GoogleTagManagerLoader[\s\S]*?enabled=\{shouldLoadMarketingScripts\}/,
      'Root layout must retain the canonical GTM loader'
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
      /const GOOGLE_TAG_MANAGER_ID\s*=\s*['"]GTM-5TWMJQFP['"]/,
      'GTM loader must retain the canonical web GTM container'
    )

    assert.match(
      source,
      /googleTagManagerScriptUrl\.searchParams\.set\(\s*['"]id['"],\s*GOOGLE_TAG_MANAGER_ID\s*\)/,
      'First-party GTM script URL must receive the container ID'
    )

    const initScript = source.match(
      /<Script[\s\S]*?id=['"]_next-gtm-init['"][\s\S]*?\/?>[\s\S]*?(?:<\/Script>)?/
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

    assert.match(
      bootstrapSource,
      /['"]gtm\.start['"]/
    )

    assert.match(
      bootstrapSource,
      /event:\s*['"]gtm\.js['"]/
    )

    const externalGtmScript = source.match(
      /<Script[\s\S]*?id=['"]_next-gtm['"][\s\S]*?\/>/
    )

    assert.ok(
      externalGtmScript,
      'GTM loader must contain the external GTM script'
    )

    assert.match(
      externalGtmScript[0],
      /strategy=['"]afterInteractive['"]/,
      'External GTM container must remain outside the critical rendering path'
    )

    assert.match(
      externalGtmScript[0],
      /src=\{\s*googleTagManagerScriptUrl\.toString\(\)\s*\}/,
      'GTM must continue through the first-party tag gateway'
    )

    const gtmPosition =
      layoutSource.indexOf('<GoogleTagManagerLoader')

    const bodyPosition =
      layoutSource.indexOf('<body')

    assert.ok(
      gtmPosition !== -1 &&
        bodyPosition !== -1 &&
        gtmPosition < bodyPosition,
      'GTM loader must be declared before the body'
    )
  }
)

test(
  'Meta application fallback remains post-hydration',
  async () => {
    const layoutSource = await readSource(
      'src/app/layout.tsx'
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
    const source = await readSource('src/app/layout.tsx')

    assert.match(
      source,
      /id=['"]pinterest-tag-canonical-browser['"][\s\S]*?src=['"]\/analytics\/pinterest-tag-canonical-v1\.js['"][\s\S]*?data-tag-id=\{pinterestTagId\}/,
      'Pinterest Tag must load afterInteractive with the public tag id'
    )
    assert.match(source, /NEXT_PUBLIC_PINTEREST_TAG_ID/)
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
