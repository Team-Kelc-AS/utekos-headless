export function cleanText(value: string): string {
  return value
    .trim()
    .replace(/^["""]+/, '')
    .replace(/["""]+$/, '')
    .replace(/\s+/g, ' ')
}
