import { KnowledgeArticleScaffold } from '@/components/knowledge/KnowledgeArticleScaffold'
import { buildKnowledgeMetadata } from '@/lib/knowledge/buildKnowledgeMetadata'
import { knowledgeArticles } from '@/lib/knowledge/knowledgeArticles'
import type { ReactNode } from 'react'

const article = knowledgeArticles.keepWarm

export const metadata = buildKnowledgeMetadata(article)

export default function KeepWarmLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <KnowledgeArticleScaffold article={article}>
      {children}
    </KnowledgeArticleScaffold>
  )
}
