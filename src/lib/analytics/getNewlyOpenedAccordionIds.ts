export function getNewlyOpenedAccordionIds(
  previousIds: readonly string[],
  nextIds: readonly string[]
) {
  const previous = new Set(previousIds)
  return nextIds.filter(id => !previous.has(id))
}
