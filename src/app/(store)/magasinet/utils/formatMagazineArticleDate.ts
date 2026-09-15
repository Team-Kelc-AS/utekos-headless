// Path: src/app/(store)/magasinet/utils/formatMagazineArticleDate.ts

export function formatMagazineArticleDate(date: string) {
  return new Intl.DateTimeFormat('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date))
}
