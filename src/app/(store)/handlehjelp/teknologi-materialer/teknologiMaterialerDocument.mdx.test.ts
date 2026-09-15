import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const documentSource = readFileSync(
  fileURLToPath(
    new URL('./teknologiMaterialerDocument.mdx', import.meta.url)
  ),
  'utf8'
)
const documentWrapperSource = readFileSync(
  fileURLToPath(
    new URL(
      './components/TechMaterialsDocument.tsx',
      import.meta.url
    )
  ),
  'utf8'
)
const articleSource = readFileSync(
  fileURLToPath(
    new URL('./components/TechMaterialsArticle.tsx', import.meta.url)
  ),
  'utf8'
)
const articleCssSource = readFileSync(
  fileURLToPath(
    new URL(
      './components/TechMaterialsArticle.module.css',
      import.meta.url
    )
  ),
  'utf8'
)
const calloutSource = readFileSync(
  fileURLToPath(
    new URL('./components/TechMaterialsCallout.tsx', import.meta.url)
  ),
  'utf8'
)
const productLineSource = readFileSync(
  fileURLToPath(
    new URL(
      './components/TechMaterialsProductLine.tsx',
      import.meta.url
    )
  ),
  'utf8'
)
const mdxComponentsSource = readFileSync(
  fileURLToPath(
    new URL(
      './components/mdx/techMaterialsMdxComponents.tsx',
      import.meta.url
    )
  ),
  'utf8'
)

test('document starts with Innhold so remark-toc can generate the TOC', () => {
  assert.match(documentSource, /^## Innhold/mu)
  assert.equal(documentSource.trimStart().startsWith('## Innhold'), true)
})

test('document keeps the editorial sections and product-line headings', () => {
  assert.match(documentSource, /^## Kvalitet i hver fiber/mu)
  assert.match(documentSource, /^### Utekos TechDown™/mu)
  assert.match(documentSource, /^#### Luméa™ Shell/mu)
  assert.match(documentSource, /^#### CloudWeave™ Insulation/mu)
  assert.match(documentSource, /^### Utekos Dun™/mu)
  assert.match(documentSource, /^#### Fillpower 650 - Termisk effektivitet/mu)
  assert.match(documentSource, /^### Utekos Mikrofiber™/mu)
  assert.match(documentSource, /^### Comfyrobe™/mu)
  assert.match(documentSource, /^### Konstruksjon og funksjonalitet/mu)
})

test('document uses local Callout and ProductLine components', () => {
  assert.match(
    documentSource,
    /<TechMaterialsCallout tone="note">/u
  )
  assert.match(
    documentSource,
    /<TechMaterialsCallout tone="spec">/u
  )
  assert.match(
    documentSource,
    /<TechMaterialsCallout tone="applies">/u
  )
  assert.match(
    documentSource,
    /<TechMaterialsCallout tone="quote">/u
  )
  assert.match(
    documentSource,
    /<TechMaterialsProductLine line="techdown">/u
  )
  assert.match(
    documentSource,
    /<TechMaterialsProductLine line="dun">/u
  )
  assert.match(
    documentSource,
    /<TechMaterialsProductLine line="mikrofiber">/u
  )
  assert.match(
    documentSource,
    /<TechMaterialsProductLine line="comfyrobe">/u
  )
  assert.match(
    documentSource,
    /<TechMaterialsProductLine line="konstruksjon">/u
  )
})

test('document includes GFM spec tables with captions and existing numbers only', () => {
  assert.match(documentSource, /<figcaption>TechDown™<\/figcaption>/u)
  assert.match(
    documentSource,
    /\| Luméa™ Shell \| Tettvevd nylon, matt finish, vannavvisende \|/u
  )
  assert.match(
    documentSource,
    /\| CloudWeave™ Insulation \| Syntetisk loft, hydrofobisk, beholder CLO i fukt \|/u
  )
  assert.match(documentSource, /\| Fillpower \| 650 \|/u)
  assert.match(
    documentSource,
    /\| Ytterstoff \| DuraLite™ Nylon 20D\/380T \|/u
  )
  assert.match(documentSource, /\| Vannsøyle \| 8000 mm \|/u)
  assert.match(documentSource, /\| Pusteevne \| 3000 g\/m²\/24t \|/u)
  assert.match(documentSource, /\| SherpaCore \| 250 GSM \|/u)
  assert.match(
    documentSource,
    /\| System \| To-spors glidelås med omvendt V-profil \|/u
  )
})

test('document preserves existing copy, hyphen, blockquote and thematic break', () => {
  assert.match(
    documentSource,
    /Vi er kompromissløse i våre materialvalg/u
  )
  assert.match(
    documentSource,
    /CloudWeave™ opprettholder sin isolasjonsverdi \(CLO\)/u
  )
  assert.match(documentSource, /Juster, form og nyt\./u)
  assert.match(documentSource, /^> Adaptivt design som omdefinerer bruksområdet/mu)
  assert.match(documentSource, /^---$/mu)
  assert.doesNotMatch(documentSource, /import type/u)
  assert.doesNotMatch(documentSource, /\u2014/u)
  assert.doesNotMatch(documentSource, /Fillpower 650 \u2013/u)
})

test('document wrapper passes local MDX components into the article rail', () => {
  assert.match(
    documentWrapperSource,
    /from '\.\.\/teknologiMaterialerDocument\.mdx'/u
  )
  assert.match(
    documentWrapperSource,
    /components=\{techMaterialsMdxComponents\}/u
  )
  assert.match(documentWrapperSource, /<TechMaterialsArticle>/u)
  assert.match(articleSource, /styles\.document/u)
  assert.match(articleCssSource, /max-width: 48rem/u)
  assert.match(articleCssSource, /position: sticky/u)
  assert.match(articleCssSource, /#innhold \+ ul/u)
  assert.match(articleCssSource, /:is\(h2, h3, h4\) \+ p/u)
})

test('page orange uses primary, not the yellow primary-hover token', () => {
  assert.match(calloutSource, /text-primary/u)
  assert.doesNotMatch(calloutSource, /primary-hover/u)
  assert.match(
    articleCssSource,
    /#innhold \+ ul a:hover[\s\S]*border-color: var\(--primary\)/u
  )
  assert.match(
    articleCssSource,
    /#innhold \+ ul a:hover[\s\S]*color: var\(--foreground\)/u
  )
  assert.doesNotMatch(articleCssSource, /primary-hover/u)
})

test('product-line cards do not repeat an uppercase eyebrow above the heading', () => {
  assert.doesNotMatch(productLineSource, /uppercase/u)
  assert.doesNotMatch(productLineSource, /tracking-\[0\.12em\]/u)
})

test('TechDown card does not render the kate-linn promotional image', () => {
  assert.match(productLineSource, /techdown: \{\s*image: null/u)
  assert.doesNotMatch(productLineSource, /og-kate-linn-kikkert-master/u)
})

test('Mikrofiber card does not render the frontpage kate-linn image', () => {
  assert.match(productLineSource, /mikrofiber: \{\s*image: null/u)
  assert.doesNotMatch(productLineSource, /frontpage-kate-linn/u)
})

test('Dun card does not render the cabin coffee image', () => {
  assert.match(productLineSource, /dun: \{\s*image: null/u)
  assert.doesNotMatch(productLineSource, /coffe_utekos/u)
})

test('product-line cards do not paint a left color stripe', () => {
  assert.doesNotMatch(productLineSource, /stripeClassName/u)
  assert.doesNotMatch(productLineSource, /inset-y-0 left-0 w-1\.5/u)
  assert.doesNotMatch(productLineSource, /bg-cyan-400/u)
})

test('h4 permalink stays compact so body copy sits closer under the heading', () => {
  assert.match(mdxComponentsSource, /case 'compact':/u)
  assert.match(
    mdxComponentsSource,
    /headingPermalinkClassName\(\s*'compact'/u
  )
  assert.match(mdxComponentsSource, /\[&_a\]:min-h-6/u)
})

test('blockquote has no side color stripe', () => {
  assert.match(mdxComponentsSource, /<blockquote/u)
  assert.doesNotMatch(mdxComponentsSource, /border-l-4/u)
})
