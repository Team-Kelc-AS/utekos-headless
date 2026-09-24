import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  HERO_H1,
  HERO_INTRO_PARAGRAPHS,
  HERO_QUICK_LINKS
} from './heroCopy'

const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8')

test('hero ships at least 500 characters of server-rendered copy', () => {
  const total =
    HERO_H1.length +
    HERO_INTRO_PARAGRAPHS.join(' ').length +
    HERO_QUICK_LINKS.map(link => link.label).join(' ').length
  assert.ok(total >= 500, `hero copy is only ${total} chars`)
  assert.ok(HERO_H1.trim().length > 0)
  assert.ok(HERO_INTRO_PARAGRAPHS.length >= 2)
})

test('hero section renders a visible H1 before the subheading', () => {
  const section = source('./HeroSection.tsx')
  assert.match(section, /<h1[^>]*>/)
  assert.doesNotMatch(section, /sr-only/)
  assert.ok(section.includes('HERO_H1'))
  assert.ok(section.indexOf('<h1') < section.indexOf('<MotionContent'))
  const view = source('../../../frontpage/HeroSection/MotionContentView.tsx')
  assert.doesNotMatch(view, /<h1/)
})
