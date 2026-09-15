export function mapOptionalContent(value: string | null | undefined): { content?: string } {
  return value != null ? { content: value } : {}
}
