import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { groupMdxHeadingSections } from './groupMdxHeadingSections'

test('size sections use component identity rather than minifiable function names', () => {
  const a = () => null
  const headings = ['XS', 'M/L', 'XL'].map(label =>
    createElement(a, { key: label }, label)
  )
  const paragraphs = headings.map((_, index) =>
    createElement('p', { key: index }, `Advice ${index}`)
  )
  const children = headings.flatMap((heading, index) => [
    heading,
    '\n',
    paragraphs[index]
  ])
  const groups = groupMdxHeadingSections(children, ['h3', a])
  assert.equal(groups.length, 3)
  for (const [index, group] of groups.entries()) {
    assert.equal(group.length, 2)
    assert.equal(group[0], headings[index])
    assert.equal(group[1], paragraphs[index])
  }
})
