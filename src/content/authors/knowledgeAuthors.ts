import { SITE_URL } from '@/constants'

export const knowledgeAuthors = {
  utekos: {
    type: 'Organization',
    name: 'Utekos',
    url: `${SITE_URL}/om-oss`,
    id: `${SITE_URL}/#organization`,
    image: '/HorizontalSVGLogo.svg',
    /**
     * Circular black/white mark for article bylines. Utekos is always the
     * author; never swap per article.
     */
    avatarImage: '/icon.png'
  }
} as const

export type KnowledgeAuthorId = keyof typeof knowledgeAuthors
