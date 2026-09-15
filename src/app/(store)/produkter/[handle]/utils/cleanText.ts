// Path: src/app/(store)/produkter/[handle]/utils/cleanText.ts

export function cleanText(value: string | null | undefined) {
  return value?.replace(/\s+/g, ' ').trim() || ''
}
