import SkreddersyVarmenDocument from '../SkreddersyVarmenDocument.mdx'
import type { SkreddersyVarmenPageContent } from '../data/skreddersyVarmenPageModel'

export type LandingSearchParams = Promise<
  Record<string, string | string[] | undefined>
>

export function SkreddersyVarmenPageRuntime({
  content
}: {
  content: SkreddersyVarmenPageContent
}) {
  return <SkreddersyVarmenDocument content={content} />
}
