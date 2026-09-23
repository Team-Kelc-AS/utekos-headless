import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { SITE_URL } from '@/constants'
import {
  buildKnowledgeArticleJsonLd,
  buildKnowledgeBreadcrumbJsonLd,
  buildKnowledgeOverviewBreadcrumbJsonLd,
  buildKnowledgeOverviewJsonLd
} from './buildKnowledgeJsonLd'
import {
  buildKnowledgeMetadata,
  buildKnowledgeOverviewMetadata
} from './buildKnowledgeMetadata'
import {
  knowledgeArticleList,
  knowledgeArticles,
  knowledgeOverview
} from './knowledgeArticles'

test('knowledge metadata is unique, canonical and source-linked', () => {
  assert.equal(knowledgeArticleList.length, 4)
  assert.equal(
    new Set(knowledgeArticleList.map(article => article.path))
      .size,
    knowledgeArticleList.length
  )

  for (const article of knowledgeArticleList) {
    const metadata = buildKnowledgeMetadata(article)
    assert.equal(
      metadata.alternates?.canonical,
      `${SITE_URL}${article.path}`
    )
    assert.equal(metadata.description, article.description)
    assert.ok(article.publishedAt)
    assert.ok(article.references.length > 0)

    const articleJsonLd = buildKnowledgeArticleJsonLd(article)
    assert.equal(articleJsonLd.headline, article.title)
    assert.equal(
      articleJsonLd.datePublished,
      article.publishedAt
    )
    assert.deepEqual(
      articleJsonLd.citation,
      article.references.flatMap(reference =>
        reference.url ? [reference.url] : []
      )
    )

    const breadcrumbJsonLd =
      buildKnowledgeBreadcrumbJsonLd(article)
    assert.ok(Array.isArray(breadcrumbJsonLd.itemListElement))
    assert.equal(breadcrumbJsonLd.itemListElement.length, 3)
    assert.equal(
      breadcrumbJsonLd.itemListElement[1]?.item,
      `${SITE_URL}/kunnskap`
    )
  }
})

test('knowledge overview is canonical and lists every registered article', () => {
  const metadata = buildKnowledgeOverviewMetadata()
  assert.equal(
    metadata.alternates?.canonical,
    `${SITE_URL}${knowledgeOverview.path}`
  )

  const overviewJsonLd = buildKnowledgeOverviewJsonLd()
  assert.equal(overviewJsonLd.name, knowledgeOverview.title)
  assert.equal(
    overviewJsonLd.dateModified,
    knowledgeOverview.updatedAt
  )
  assert.ok(
    overviewJsonLd.mainEntity &&
      typeof overviewJsonLd.mainEntity === 'object' &&
      !Array.isArray(overviewJsonLd.mainEntity) &&
      'numberOfItems' in overviewJsonLd.mainEntity
  )
  assert.equal(
    overviewJsonLd.mainEntity.numberOfItems,
    knowledgeArticleList.length
  )

  const breadcrumbJsonLd =
    buildKnowledgeOverviewBreadcrumbJsonLd()
  assert.ok(Array.isArray(breadcrumbJsonLd.itemListElement))
  assert.equal(breadcrumbJsonLd.itemListElement.length, 2)
  assert.equal(
    breadcrumbJsonLd.itemListElement[1]?.item,
    `${SITE_URL}/kunnskap`
  )
})

test('visible MDX keeps the original copy while removing broken Gemini links', async () => {
  const knowledgeRoot = path.join(
    process.cwd(),
    'src/app/(store)/kunnskap'
  )
  const cloudWeave = await readFile(
    path.join(knowledgeRoot, 'cloudweave/page.mdx'),
    'utf8'
  )
  const baseLayer = await readFile(
    path.join(knowledgeRoot, 'hva-skal-man-ha-innerst/page.mdx'),
    'utf8'
  )
  const whyCold = await readFile(
    path.join(knowledgeRoot, 'hvorfor-blir-man-kald/page.mdx'),
    'utf8'
  )

  const originalOpening =
    'Mange tror at en tykk jakke i seg selv produserer varme.'
  assert.ok(cloudWeave.includes(originalOpening))
  assert.ok(baseLayer.includes(originalOpening))
  assert.ok(
    whyCold.includes(
      'Det er en klassisk vintermorgen. To personer står og venter på bussen.'
    )
  )
  assert.ok(!whyCold.includes('https://gemini.google.com/'))
  assert.equal(
    knowledgeArticles.cloudweave.title,
    'CloudWeave™, dun og det norske klimaet'
  )
})
