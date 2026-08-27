import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const repoRoot = process.cwd()

async function readSource(relativePath: string): Promise<string> {
  return readFile(join(repoRoot, relativePath), 'utf8')
}

test(
  'root stylesheet imports the Cookiebot compact dialog override',
  async () => {
    const globals = await readSource('src/globals.css')
    assert.match(
      globals,
      /@import '\.\/styles\/cookiebot-dialog\.css'/,
      'Cookiebot compact styles must load globally so the GTM-owned banner can be overridden'
    )
  }
)

test(
  'Cookiebot compact styles pin the Edge dialog to the bottom on small viewports without hiding consent buttons',
  async () => {
    const source = await readSource('src/styles/cookiebot-dialog.css')

    assert.match(source, /#CybotCookiebotDialog/)
    assert.match(source, /max-height:\s*min\(32svh,\s*14rem\)/)
    assert.match(source, /transform:\s*none/)
    assert.match(
      source,
      /#CybotCookiebotDialogBodyButtonAccept/
    )
    assert.match(
      source,
      /#CybotCookiebotDialogBodyButtonDecline/
    )
    assert.match(
      source,
      /#CybotCookiebotDialogBodyButtonAccept,\s*\n\s*#CybotCookiebotDialogBodyButtonDecline \{\s*\n\s*display:\s*block !important;/
    )
    assert.doesNotMatch(
      source,
      /#CybotCookiebotDialogBodyButton(?:Accept|Decline)[^{]*\{[^}]*display:\s*none/,
      'Accept and decline must remain visible'
    )
    assert.doesNotMatch(
      source,
      /#CybotCookiebotDialogPoweredbyCybot[^{]*\{[^}]*display:\s*none/
    )
  }
)

test(
  'PageViewObserver does not keep leftover Cookiebot debug ingest',
  async () => {
    const source = await readSource(
      'src/components/analytics/PageViewObserver.tsx'
    )

    assert.doesNotMatch(
      source,
      /127\.0\.0\.1:7626/,
      'Cursor debug ingest must not remain in the page-view observer'
    )
    assert.doesNotMatch(
      source,
      /#region agent log/,
      'Agent debug regions must not remain in the page-view observer'
    )
    assert.doesNotMatch(
      source,
      /reportCookiebotOverlay/,
      'Cookiebot overlay measurement is not part of the page-view observer contract'
    )
    assert.match(
      source,
      /subscribeToCookiebotPageViewUpdates/,
      'Canonical Cookiebot consent observation must remain'
    )
  }
)

test(
  'skreddersy-varmen hero keeps mobile CTAs above a bottom Cookiebot sheet',
  async () => {
    const hero = await readSource(
      'src/app/skreddersy-varmen/components/HeroSection.tsx'
    )
    const actions = await readSource(
      'src/app/skreddersy-varmen/components/HeroActions.tsx'
    )

    assert.match(hero, /justify-start/)
    assert.match(hero, /md:justify-center/)
    assert.match(hero, /pt-4/)
    assert.match(hero, /md:pt-24/)
    assert.match(actions, /mt-2/)
    assert.match(actions, /md:mt-9/)
  }
)
