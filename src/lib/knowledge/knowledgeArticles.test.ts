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
  assert.equal(knowledgeArticleList.length, 5)
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

test('visible MDX has no external search links and matches registry structure', async () => {
  const knowledgeRoot = path.join(
    process.cwd(),
    'src/app/(store)/kunnskap'
  )
  const bodies = await Promise.all(
    knowledgeArticleList.map(article =>
      readFile(
        path.join(knowledgeRoot, article.slug, 'page.mdx'),
        'utf8'
      ).then(body => ({ article, body }))
    )
  )

  for (const { article, body } of bodies) {
    assert.ok(
      !body.includes('google.com/search'),
      `${article.slug} must not link out to search engines`
    )
    assert.ok(
      !body.match(/^# /m),
      `${article.slug} must not render its own H1; the scaffold owns it`
    )
    assert.ok(
      !body.startsWith('---'),
      `${article.slug} must not keep metadata in MDX frontmatter; the registry owns it`
    )
    assert.ok(
      !body.match(/^## (Kilder|Referanser|Innhold|Hva du vil lære)/m),
      `${article.slug} must not render sources, learnings or ToC in the MDX body`
    )
    assert.ok(
      body.includes('## Hva forskningen ikke kan si sikkert'),
      `${article.slug} must include the research-limits section`
    )
    assert.ok(
      body.includes('## Oppsummering'),
      `${article.slug} must end the body with Oppsummering`
    )
    for (const entry of article.toc) {
      assert.match(
        entry.id,
        /^[a-z0-9æøå]+(?:-+[a-z0-9æøå]+)*$/u,
        `${article.slug} toc id must be a valid anchor slug`
      )
      assert.ok(
        body.includes(`## ${entry.label}`),
        `${article.slug} must render H2 "${entry.label}" so «I denne artikkelen» can link`
      )
    }
    assert.ok(
      article.learnings.length >= 3 && article.learnings.length <= 6,
      `${article.slug} must list 3–6 learnings`
    )
    assert.ok(
      article.readingMinutes > 0,
      `${article.slug} must declare reading time`
    )
    assert.ok(
      article.references.length > 0,
      `${article.slug} must declare references`
    )
    for (const reference of article.references) {
      assert.ok(reference.title.trim().length > 0)
      assert.ok(reference.attribution.trim().length > 0)
      if (reference.url !== undefined) {
        assert.ok(reference.url.startsWith('https://'))
      }
    }
  }

  assert.ok(
    knowledgeArticles.cloudweave.description.includes(
      'Mange tror at en tykk jakke i seg selv produserer varme.'
    )
  )
  assert.equal(
    knowledgeArticles.cloudweave.title,
    'CloudWeave™, dun og det norske klimaet'
  )
})

test('in-text citations resolve against the registry source list', async () => {
  const knowledgeRoot = path.join(
    process.cwd(),
    'src/app/(store)/kunnskap'
  )

  for (const article of knowledgeArticleList) {
    const body = await readFile(
      path.join(knowledgeRoot, article.slug, 'page.mdx'),
      'utf8'
    )
    const cited = new Set<number>()
    for (const match of body.matchAll(
      /<Cite ids=\{\[([\d,\s]+)\]\} \/>/g
    )) {
      const group = match[1] ?? ''
      for (const id of group.split(',')) {
        cited.add(Number(id.trim()))
      }
    }
    assert.ok(
      cited.size > 0,
      `${article.slug} must use in-text citations`
    )
    const maxId = article.references.length
    for (const id of cited) {
      assert.ok(
        Number.isInteger(id) && id >= 1 && id <= maxId,
        `${article.slug} citation ${id} must map to the registry source list`
      )
    }
  }
})
