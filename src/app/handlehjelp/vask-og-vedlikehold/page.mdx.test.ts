import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const pageUrl = new URL('./page.mdx', import.meta.url)
const pageSource = readFileSync(fileURLToPath(pageUrl), 'utf8')

test('vask-og-vedlikehold is a content-first MDX route', () => {
  assert.equal(
    existsSync(
      fileURLToPath(new URL('./page.tsx', import.meta.url))
    ),
    false
  )
  assert.match(
    pageSource,
    /import styles from '\.\/page\.module\.css'/u
  )
  assert.match(
    pageSource,
    /<PageH1 ID="vedlikehold-av-utekos">/u
  )
  assert.match(
    pageSource,
    /<details className=\{styles\.faqItem\}>/u
  )
  assert.doesNotMatch(pageSource, /['"]use client['"]/u)
  assert.doesNotMatch(
    pageSource,
    /Tabs|Accordion|BackToShopCta/u
  )
})

test('all structured-data anchors and product guides remain visible', () => {
  for (const id of [
    'forberedelse',
    'vask',
    'torking',
    'oppbevaring',
    'dun',
    'mikrofiber',
    'techdown',
    'comfyrobe',
    'faq-section'
  ]) {
    assert.match(pageSource, new RegExp(`id="${id}"`, 'u'))
  }

  for (const question of [
    'Hvor ofte bør jeg vaske Utekos-plagget mitt?',
    'Kan jeg bruke vanlig vaskemiddel på Utekos Dun?',
    'Hva gjør jeg hvis vann ikke lenger preller av ytterstoffet?',
    'Kan dunet klumpe seg under vask?',
    'Hvordan oppbevarer jeg plagget mellom sesonger?'
  ]) {
    assert.match(
      pageSource,
      new RegExp(question.replace(/[?]/gu, '\\?'), 'u')
    )
  }
})
