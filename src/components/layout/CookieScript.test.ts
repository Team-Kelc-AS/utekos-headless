import assert from 'node:assert/strict'
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
  'Cookiebot defaults consent before any marketing container can run',
  async () => {
    const source = await readSource(
      'src/components/layout/CookieScript.tsx'
    )

    assert.match(
      source,
      /ad_storage:\s*'denied'/
    )

    assert.match(
      source,
      /analytics_storage:\s*'denied'/
    )

    assert.match(
      source,
      /ad_user_data:\s*'denied'/
    )

    assert.match(
      source,
      /ad_personalization:\s*'denied'/
    )

    assert.match(
      source,
      /functionality_storage:\s*'denied'/
    )

    assert.match(
      source,
      /personalization_storage:\s*'denied'/
    )

    assert.match(
      source,
      /security_storage:\s*'granted'/
    )

    assert.match(
      source,
      /wait_for_update:\s*500/
    )

    assert.match(
      source,
      /ads_data_redaction['"]?,\s*true/
    )

    assert.match(
      source,
      /url_passthrough['"]?,\s*true/
    )
  }
)

test(
  'Cookiebot itself is loaded before hydration in manual blocking mode',
  async () => {
    const source = await readSource(
      'src/components/layout/CookieScript.tsx'
    )

    const beforeInteractiveMatches =
      source.match(
        /strategy=['"]beforeInteractive['"]/g
      ) ?? []

    assert.equal(
      beforeInteractiveMatches.length,
      2,
      'Consent defaults and Cookiebot must both use beforeInteractive'
    )

    assert.match(
      source,
      /id=['"]Cookiebot['"]/
    )

    assert.match(
      source,
      /data-cbid=\{COOKIEBOT_DOMAIN_GROUP_ID\}/
    )

    assert.match(
      source,
      /data-blockingmode=['"]none['"]/,
      'Cookiebot must use manual blocking rather than global auto-blocking'
    )

    assert.match(
      source,
      /data-cookieconsent=['"]ignore['"]/
    )
  }
)

test(
  'legacy late Cookiebot bridge is removed',
  async () => {
    const source = await readSource(
      'src/components/layout/CookieScript.tsx'
    )

    assert.doesNotMatch(
      source,
      /gtm\.blocklist/
    )

    assert.doesNotMatch(
      source,
      /CookiebotCallback_OnLoad/
    )

    assert.doesNotMatch(
      source,
      /Cookiebot\.renew/
    )

    assert.doesNotMatch(
      source,
      /window\.addEventListener\(['"]load/
    )
  }
)

test(
  'root layout mounts Cookiebot before body while GTM remains post-hydration',
  async () => {
    const source = await readSource(
      'src/app/layout.tsx'
    )

    assert.match(
      source,
      /import\s+\{\s*CookieScript\s*\}\s+from\s+['"]@\/components\/layout\/CookieScript['"]/
    )

    const cookieScriptPosition =
      source.indexOf('<CookieScript />')

    const bodyPosition =
      source.indexOf('<body')

    const googleTagManagerPosition =
      source.indexOf('<GoogleTagManager')

    assert.ok(
      cookieScriptPosition !== -1,
      'RootLayout must render CookieScript'
    )

    assert.ok(
      bodyPosition !== -1,
      'RootLayout must render body'
    )

    assert.ok(
      googleTagManagerPosition !== -1,
      'RootLayout must retain GoogleTagManager'
    )

    assert.ok(
      cookieScriptPosition < bodyPosition,
      'CookieScript must appear before body in RootLayout'
    )

    assert.ok(
      googleTagManagerPosition > bodyPosition,
      'GTM must remain in the post-hydration body path'
    )
  }
)