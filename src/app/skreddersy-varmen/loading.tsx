import { frontmatter } from './skreddersyVarmenContent.mdx'
import { SkreddersyVarmenPageRuntime } from './components/SkreddersyVarmenPageRuntime'
import { parseSkreddersyVarmenPageContent } from './data/skreddersyVarmenPageModel'

const content = parseSkreddersyVarmenPageContent(frontmatter)

export default function SkreddersyVarmenLoading() {
  return <SkreddersyVarmenPageRuntime content={content} />
}
