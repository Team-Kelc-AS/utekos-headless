import type { KnowledgeArticle } from '@/lib/knowledge/knowledgeArticles'
import type { ReactNode } from 'react'
import { BackToTop } from './BackToTop'
import { KnowledgeArticleBreadcrumbs } from './KnowledgeArticleBreadcrumbs'
import { KnowledgeArticleIntro } from './KnowledgeArticleIntro'
import { KnowledgeArticleJsonLd } from './KnowledgeArticleJsonLd'
import { KnowledgeLearnings } from './KnowledgeLearnings'
import { KnowledgeSources } from './KnowledgeSources'
import { KnowledgeToc } from './KnowledgeToc'
import articleStyles from '@/app/(store)/kunnskap/knowledgeArticle.module.css'

export function KnowledgeArticleScaffold({
  article,
  children
}: {
  article: KnowledgeArticle
  children: ReactNode
}) {
  return (
    <article
      id='top'
      className={articleStyles.article}
    >
      <KnowledgeArticleJsonLd article={article} />
      <KnowledgeArticleBreadcrumbs article={article} />
      <KnowledgeArticleIntro article={article} />
      <KnowledgeLearnings article={article} />
      <KnowledgeToc article={article} />
      {children}
      <BackToTop />
      <KnowledgeSources article={article} />
    </article>
  )
}
