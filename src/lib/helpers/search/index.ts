// Path: src/lib/helpers/search/index.ts
import type { SearchGroup, SearchItem } from '@/app/api/search-index/types'
import { rawMagazineArticles } from '@/app/magasinet/data/magazineArticles'
import { validateMagazineArticles } from '@/app/magasinet/utils/validateMagazineArticles'
import { SEARCH_CONFIG, GROUP_LABELS } from './searchConfig'

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'o')
    .replace(/[å]/g, 'a')
    .trim()
}

export function buildSearchIndex() {
  const validationResult = validateMagazineArticles(rawMagazineArticles)
  const magazineArticles = validationResult.success ? validationResult.articles : []

  const staticItems: SearchItem[] = SEARCH_CONFIG.map(item => ({
    id: item.id,
    title: item.title,
    path: item.path,
    parentId: null,
    keywords: [
      item.title,
      ...item.keywords,
      normalizeText(item.title),
      ...item.keywords.map(k => normalizeText(k))
    ].filter(Boolean)
  }))

  const magazineItems: SearchItem[] = magazineArticles.map(article => {
    const slugWords = article.slug.split('-').filter(word => word.length > 2)
    const titleWords = article.title.split(' ').filter(word => word.length > 2)
    const excerptWords = (article.excerpt ?? '').split(' ').slice(0, 20).filter(Boolean)

    return {
      id: `magazine-${article.slug}`,
      title: article.title,
      path: `/magasinet/${article.slug}`,
      parentId: null,
      keywords: [
        article.slug,
        article.title,
        article.category,
        article.excerpt,
        ...slugWords,
        ...titleWords,
        normalizeText(article.title),
        normalizeText(article.category ?? ''),
        ...excerptWords.map(w => normalizeText(w)),
        ...slugWords.map(w => normalizeText(w)),
        ...titleWords.map(w => normalizeText(w))
      ]
        .flat()
        .filter(kw => typeof kw === 'string' && kw.length > 0)
    }
  })

  const allItems = [...staticItems, ...magazineItems]
  const groupsMap = new Map<string, SearchGroup>()

  Object.entries(GROUP_LABELS).forEach(([key, label]) => {
    groupsMap.set(key, { key, label, items: [] })
  })

  allItems.forEach(item => {
    let groupKey: string | undefined
    if (item.id.startsWith('product-')) groupKey = 'products'
    else if (item.id.startsWith('magazine-')) groupKey = 'magazine'
    else if (item.id.startsWith('inspiration-')) groupKey = 'inspiration'
    else if (item.id.startsWith('help-')) groupKey = 'help'
    else if (item.id.startsWith('page-')) groupKey = 'pages'

    if (groupKey) {
      const group = groupsMap.get(groupKey)
      if (group) {
        group.items.push(item)
      } else {
        console.warn(`Fant ikke gruppe for key: ${groupKey} for item ${item.id}`)
      }
    } else {
      console.warn(`Kunne ikke bestemme gruppe for item ${item.id}`)
    }
  })

  const groups = Array.from(groupsMap.values())
    .filter(g => g.items.length > 0)
    .map(g => ({
      key: g.key,
      label: g.label,
      items: g.items
        .sort((a, b) => a.title.localeCompare(b.title, 'no'))
        .map(item => ({
          id: item.id,
          title: item.title,
          path: item.path,
          parentId: item.parentId,
          keywords: Array.isArray(item.keywords) ? [...item.keywords] : [],
          ...(item.children && {
            children: item.children.map(child => ({ ...child }))
          })
        }))
    }))

  return { groups }
}
