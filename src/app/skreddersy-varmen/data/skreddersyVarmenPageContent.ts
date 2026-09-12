import { frontmatter } from '../skreddersyVarmenContent.mdx'
import {
  buildSkreddersyVarmenMetadata,
  parseSkreddersyVarmenPageContent
} from './skreddersyVarmenPageModel'

export const skreddersyVarmenPageContent =
  parseSkreddersyVarmenPageContent(frontmatter)

export const metadata = buildSkreddersyVarmenMetadata(
  skreddersyVarmenPageContent.seo
)
