import SkreddersyVarmenDocument from '../SkreddersyVarmenDocument.mdx'
import type { SkreddersyVarmenPageContent } from '../data/skreddersyVarmenPageModel'

export type LandingSearchParams = Promise<
  Record<string, string | string[] | undefined>
>

export function SkreddersyVarmenPageRuntime({
  content,
  searchParams
}: {
  content: SkreddersyVarmenPageContent
  searchParams?: LandingSearchParams
}) {
  return (
    <SkreddersyVarmenDocument
      content={content}
      searchParams={searchParams}
    />
  )
}
