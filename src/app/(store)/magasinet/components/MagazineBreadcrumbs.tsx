import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'
import type { MagazineArticle } from '../types'

type Props = { article?: MagazineArticle }

export function MagazineBreadcrumbs({ article }: Props) {
  const items =
    article ?
      [
        { label: 'Hjem', href: '/' },
        { label: 'Magasinet', href: '/magasinet' },
        { label: article.title }
      ]
    : [{ label: 'Hjem', href: '/' }, { label: 'Magasinet' }]

  return <UtekosBreadcrumbBar surface='light' items={items} />
}
