import TeknologiMaterialerDocument from '../teknologiMaterialerDocument.mdx'
import { TechMaterialsArticle } from './TechMaterialsArticle'
import { techMaterialsMdxComponents } from './mdx/techMaterialsMdxComponents'

export function TechMaterialsDocument() {
  return (
    <TechMaterialsArticle>
      <TeknologiMaterialerDocument
        components={techMaterialsMdxComponents}
      />
    </TechMaterialsArticle>
  )
}
