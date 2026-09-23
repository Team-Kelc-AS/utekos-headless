import type { KnowledgeArticle } from '@/lib/knowledge/knowledgeArticles'
import type { ReactNode } from 'react'
import { KnowledgeArticleBreadcrumbs } from './KnowledgeArticleBreadcrumbs'
import { KnowledgeArticleJsonLd } from './KnowledgeArticleJsonLd'
import { KnowledgeReferences } from './KnowledgeReferences'
import articleStyles from '@/app/(store)/kunnskap/knowledgeArticle.module.css'

export function KnowledgeArticleScaffold({
  article,
  children
}: {
  article: KnowledgeArticle
  children: ReactNode
}) {
  return (
    <article className={articleStyles.article}>
      <KnowledgeArticleJsonLd article={article} />
      <KnowledgeArticleBreadcrumbs article={article} />
      {children}
      {article.referencesVisibleInBody ? null : (
        <KnowledgeReferences article={article} />
      )}
    </article>
  )
}
