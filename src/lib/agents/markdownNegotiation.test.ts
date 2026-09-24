import assert from 'node:assert/strict'
import test from 'node:test'
import { wantsMarkdown } from './markdownNegotiation'

test('curl-style exact Markdown accept opts into Markdown', () => {
  assert.equal(wantsMarkdown('text/markdown'), true)
})

test('missing or empty Accept stays on HTML', () => {
  assert.equal(wantsMarkdown(null), false)
  assert.equal(wantsMarkdown(''), false)
})

test('browser HTML accept stays on HTML', () => {
  assert.equal(
    wantsMarkdown('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'),
    false
  )
})

test('wildcard-only accept never opts into Markdown', () => {
  assert.equal(wantsMarkdown('*/*'), false)
  assert.equal(wantsMarkdown('text/*'), false)
})

test('quality values decide the winner, ties stay on HTML', () => {
  assert.equal(wantsMarkdown('text/html;q=0.9, text/markdown;q=0.5'), false)
  assert.equal(wantsMarkdown('text/html;q=0.5, text/markdown;q=0.9'), true)
  assert.equal(wantsMarkdown('text/html, text/markdown'), false)
  assert.equal(wantsMarkdown('text/markdown;q=0'), false)
})

test('matching is case-insensitive and tolerates whitespace', () => {
  assert.equal(wantsMarkdown('  Text/Markdown ; q=1 '), true)
})
