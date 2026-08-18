export function buildPinterestCatalogTitle(input: {
  displayName: string
  color: string
  size: string
}) {
  const productAndColor = [input.displayName, input.color]
    .filter(Boolean)
    .join(' ')

  return input.size ?
      `${productAndColor} - ${input.size}`
    : productAndColor
}
