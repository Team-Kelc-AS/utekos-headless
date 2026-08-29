import { frontmatter } from './skreddersyVarmenContent.mdx'
import {
  SkreddersyVarmenPageRuntime,
  type LandingSearchParams
} from './components/SkreddersyVarmenPageRuntime'
import {
  buildSkreddersyVarmenMetadata,
  parseSkreddersyVarmenPageContent
} from './data/skreddersyVarmenPageModel'

const content = parseSkreddersyVarmenPageContent(frontmatter)

export const metadata = buildSkreddersyVarmenMetadata(content.seo)

export default function SkreddersyVarmenPage({
  searchParams
}: {
  searchParams: LandingSearchParams
}) {
  return (
    <SkreddersyVarmenPageRuntime
      content={content}
      searchParams={searchParams}
    />
  )
}
