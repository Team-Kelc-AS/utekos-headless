export function normalizeAssistantResponseText(text: string) {
  return text
    .replace(/^\s{0,3}#{1,6}\s+/gmu, '')
    .replace(/\*\*([^*\n]+)\*\*/gu, '$1')
    .replace(/__([^_\n]+)__/gu, '$1')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/gu, '$1$2')
    .replace(/(^|[^_])_([^_\n]+)_(?!_)/gu, '$1$2')
    .trim()
}
