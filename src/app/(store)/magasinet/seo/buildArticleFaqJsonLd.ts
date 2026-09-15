import type { FAQPage, WithContext } from 'schema-dts'
import type { MagazineArticle } from '../types'

export function buildArticleFaqJsonLd(article: MagazineArticle): WithContext<FAQPage> | null {
  const faqBlocks = article.blocks.filter(block => block.type === 'faq')
  const questions = faqBlocks.flatMap(block => block.items)

  if (questions.length === 0) {
    return null
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': questions.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer
      }
    }))
  }
}
