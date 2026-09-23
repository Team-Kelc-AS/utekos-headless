import { SITE_URL } from '@/constants'

export const knowledgeAuthors = {
  utekos: {
    type: 'Organization',
    name: 'Utekos',
    url: `${SITE_URL}/om-oss`,
    id: `${SITE_URL}/#organization`,
    image: '/HorizontalSVGLogo.svg'
  }
} as const

export type KnowledgeAuthorId = keyof typeof knowledgeAuthors
