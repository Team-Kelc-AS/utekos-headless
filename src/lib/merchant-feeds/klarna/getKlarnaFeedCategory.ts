const KLARNA_CATEGORY_BY_HANDLE: Record<string, string> = {
  'comfyrobe': 'Klær > Unisex > Yttertøy > Jakker og kåper',
  'utekos-dun': 'Klær > Unisex > Yttertøy',
  'utekos-mikrofiber': 'Klær > Unisex > Yttertøy',
  'utekos-techdown': 'Klær > Unisex > Yttertøy',
  'utekos-stapper':
    'Sport og fritid > Friluftsliv > Oppbevaring > Kompresjonsposer'
}

export function getKlarnaFeedCategory(
  productHandle: string
): string {
  const mappedCategory = KLARNA_CATEGORY_BY_HANDLE[productHandle]

  if (mappedCategory) {
    return mappedCategory
  }

  throw new Error(
    `Klarna feed product ${productHandle} is missing a category mapping`
  )
}
