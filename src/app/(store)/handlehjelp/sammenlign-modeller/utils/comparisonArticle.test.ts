import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { SITE_URL } from '@/constants'
import {
  comparisonArticle,
  buildComparisonMetadata
} from './comparisonArticle'
import { buildComparisonJsonLd } from '../components/CompareModelsJsonLd'
import {
  faqItems,
  comparisonRows,
  modelRecommendations
} from './comparisonData'

const contentUrl = new URL('../content.mdx', import.meta.url)

test('metadata and structured data share the article identity without invented dates', () => {
  const metadata = buildComparisonMetadata()
  assert.equal(metadata.title, comparisonArticle.metaTitle)
  assert.equal(
    metadata.description,
    comparisonArticle.description
  )
  assert.equal(
    metadata.alternates?.canonical,
    SITE_URL + comparisonArticle.path
  )
  const graph = buildComparisonJsonLd()['@graph']
  const article = graph.find(
    node => '@type' in node && node['@type'] === 'Article'
  )!
  assert.ok(article)
  assert.equal(
    (article as { headline: string }).headline,
    comparisonArticle.title
  )
  assert.ok(!('datePublished' in article))
  assert.ok(!('dateModified' in article))
  const ids = graph.map(node =>
    '@id' in node ? node['@id'] : undefined
  )
  assert.equal(new Set(ids).size, ids.length)
  const faq = graph.find(
    node => '@type' in node && node['@type'] === 'FAQPage'
  )!
  assert.deepEqual(
    (faq as { mainEntity: unknown }).mainEntity,
    faqItems.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer
      }
    }))
  )
})

test('MDX owns editorial content, all contents links resolve in document order', async () => {
  const body = await readFile(contentUrl, 'utf8')
  assert.ok(!body.startsWith('---'))
  assert.doesNotMatch(body, /<h1\b|^# /m)
  assert.doesNotMatch(
    body,
    /<table\b|overflow-x|comparison-scroll-help/
  )
  assert.match(body, /SINTEF omtaler/)
  assert.match(body, /CLO beskriver isolasjon/)
  const ids = [...body.matchAll(/\bid=['"]([^'"]+)['"]/g)].map(
    match => match[1]!
  )
  // Reference component IDs are source keys rather than emitted DOM IDs.
  const domIds = ids.filter(
    id =>
      !comparisonArticle.references.some(ref => ref.id === id)
  )
  assert.equal(new Set(domIds).size, domIds.length)
  let previous = -1
  for (const item of comparisonArticle.toc) {
    const position = body.search(
      new RegExp('id=[\'"]' + item.id + '[\'"]')
    )
    assert.ok(
      position > previous,
      item.id + ' must resolve in reading order'
    )
    previous = position
  }
  const citations = [
    ...body.matchAll(/<Reference id=['"]([^'"]+)['"]/g)
  ]
  assert.equal(citations.length, 4)
  for (const match of citations) {
    assert.ok(
      comparisonArticle.references.some(
        ref => ref.id === match[1]
      )
    )
  }
  assert.deepEqual(
    comparisonArticle.references.map(ref => ref.number),
    [1, 2, 3]
  )
  assert.equal(
    new Set(comparisonArticle.references.map(ref => ref.id))
      .size,
    3
  )
})

test('every model retains all seven features and accordions retain single-open server content', async () => {
  assert.equal(modelRecommendations.length, 3)
  assert.equal(comparisonRows.length, 7)
  for (const model of modelRecommendations) {
    for (const row of comparisonRows)
      assert.notEqual(row.values[model.key], undefined)
  }
  for (const name of ['ComparisonAccordion', 'ComparisonFaq']) {
    const source = await readFile(
      new URL('../components/' + name + '.tsx', import.meta.url),
      'utf8'
    )
    assert.match(source, /multiple=\{false\}/)
    assert.match(source, /defaultValue=\{\[\]\}/)
    assert.match(source, /keepMounted/)
  }
})
