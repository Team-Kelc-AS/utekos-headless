import { JsonLdScript } from '@/lib/seo/jsonLd/JsonLdScript'
import {
  buildKnowledgeArticleJsonLd,
  buildKnowledgeBreadcrumbJsonLd
} from '@/lib/knowledge/buildKnowledgeJsonLd'
import type { KnowledgeArticle } from '@/lib/knowledge/knowledgeArticles'

export function KnowledgeArticleJsonLd({
  article
}: {
  article: KnowledgeArticle
}) {
  return (
    <>
      <JsonLdScript
        data={buildKnowledgeArticleJsonLd(article)}
      />
      <JsonLdScript
        data={buildKnowledgeBreadcrumbJsonLd(article)}
      />
    </>
  )
}
