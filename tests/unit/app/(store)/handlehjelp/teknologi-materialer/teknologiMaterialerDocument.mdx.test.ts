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
    new URL(
      './components/TechMaterialsArticle.tsx',
      import.meta.url
    )
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
    new URL(
      './components/TechMaterialsCallout.tsx',
      import.meta.url
    )
  ),
  'utf8'
)
const tableOfContentsSource = readFileSync(
  fileURLToPath(
    new URL(
      './components/TechMaterialsTableOfContents.tsx',
      import.meta.url
    )
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

test('document starts with editorial content after the static page TOC', () => {
  assert.doesNotMatch(documentSource, /^## Innhold/mu)
  assert.equal(
    documentSource
      .trimStart()
      .startsWith('## Kvalitet i hver fiber'),
    true
  )
})

test('static TOC links the five meaningful document sections', () => {
  assert.match(
    tableOfContentsSource,
    /aria-labelledby='innhold'/u
  )
  assert.match(tableOfContentsSource, /id='innhold'/u)
  assert.match(tableOfContentsSource, /#utekos-techdown/u)
  assert.match(tableOfContentsSource, /#utekos-dun/u)
  assert.match(tableOfContentsSource, /#utekos-mikrofiber/u)
  assert.match(tableOfContentsSource, /#comfyrobe/u)
  assert.match(
    tableOfContentsSource,
    /#konstruksjon-og-funksjonalitet/u
  )
  assert.doesNotMatch(tableOfContentsSource, /rounded-full/u)
  assert.doesNotMatch(tableOfContentsSource, /sticky/u)
})

test('document keeps the editorial sections and product-line headings', () => {
  assert.match(documentSource, /^## Kvalitet i hver fiber/mu)
  assert.match(documentSource, /^### Utekos TechDown™/mu)
  assert.match(documentSource, /^#### Luméa™ Shell/mu)
  assert.match(documentSource, /^#### CloudWeave™ Insulation/mu)
  assert.match(
    documentSource,
    /^#### Hvordan påvirker kanalstørrelse isolasjonsverdien\?/mu
  )
  assert.match(documentSource, /200 g\/m²/)
  assert.match(documentSource, /4,1 clo/)
  assert.match(documentSource, /^### Utekos Dun™/mu)
  assert.match(
    documentSource,
    /^#### Fillpower 650 - Termisk effektivitet/mu
  )
  assert.match(documentSource, /^### Utekos Mikrofiber™/mu)
  assert.match(documentSource, /^### Comfyrobe™/mu)
  assert.match(
    documentSource,
    /^### Konstruksjon og funksjonalitet/mu
  )
})

test('document uses local Callout and ProductLine components', () => {
  assert.match(documentSource, /tone='highlight'/u)
  assert.match(documentSource, /tone='note'/u)
  assert.match(documentSource, /tone='spec'/u)
  assert.match(documentSource, /tone='applies'/u)
  assert.match(documentSource, /tone='quote'/u)
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
  assert.match(
    documentSource,
    /<figcaption>TechDown™<\/figcaption>/u
  )
  assert.match(
    documentSource,
    /\|\s*Luméa™ Shell\s*\|\s*Tettvevd nylon, matt finish, vannavvisende\s*\|/u
  )
  assert.match(
    documentSource,
    /\|\s*CloudWeave™\s*\|\s*Syntetisk loft, hydrofobisk, beholder CLO i fukt\s*\|/u
  )
  assert.match(
    documentSource,
    /<figcaption>Kanalstørrelse ved 200 g\/m² isolasjonsvekt<\/figcaption>/u
  )
  assert.match(
    documentSource,
    /\|\s*4” × 4” kanal\s*\|\s*3,0 cm\s*\|\s*4,1 clo\s*\|/u
  )
  assert.match(documentSource, /\|\s*Fillpower\s*\|\s*650\s*\|/u)
  assert.match(
    documentSource,
    /\|\s*Ytterstoff\s*\|\s*DuraLite™ Nylon 20D\/380T\s*\|/u
  )
  assert.match(
    documentSource,
    /\|\s*Vannsøyle\s*\|\s*8000 mm\s*\|/u
  )
  assert.match(
    documentSource,
    /\|\s*Pusteevne\s*\|\s*3000 g\/m²\/24t\s*\|/u
  )
  assert.match(
    documentSource,
    /\|\s*SherpaCore\s*\|\s*250 GSM\s*\|/u
  )
  assert.match(
    documentSource,
    /\|\s*System\s*\|\s*To-spors glidelås med omvendt V-profil\s*\|/u
  )
})

test('document preserves existing copy, hyphen, blockquote and thematic break', () => {
  assert.match(
    documentSource,
    /Vi er kompromissløse i våre materialvalg/u
  )
  assert.match(
    documentSource,
    /CloudWeave™\s+opprettholder sin\s+isolasjonsverdi \(CLO\)/u
  )
  assert.match(documentSource, /Juster, form og nyt\./u)
  assert.match(
    documentSource,
    /^> Adaptivt design som omdefinerer bruksområdet/mu
  )
  assert.match(documentSource, /^---$/mu)
  assert.doesNotMatch(documentSource, /import type/u)
  assert.doesNotMatch(documentSource, /\u2014/u)
  assert.doesNotMatch(documentSource, /\u2013/u)
  assert.doesNotMatch(documentSource, /Fillpower 650 \u2013/u)
})

test('document promotes the user-approved TechDown summary to a callout', () => {
  assert.match(
    documentSource,
    /tone='highlight'[\s\S]*title='Passformen kan tilpasses'/u
  )
  assert.match(
    documentSource,
    /Utekos TechDown™ kombinerer en fyldig, isolert konstruksjon med\s+en passform du kan tilpasse\./u
  )
  assert.match(documentSource, /Plagget har YKK®-glidelåser\./u)
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
  assert.match(
    articleSource,
    /<TechMaterialsTableOfContents \/>/u
  )
  assert.match(articleSource, /styles\.content/u)
  assert.match(articleCssSource, /max-width: 54rem/u)
  assert.match(articleCssSource, /max-width: 88rem/u)
  assert.match(articleCssSource, /data-tech-materials-toc/u)
  assert.doesNotMatch(articleCssSource, /position: sticky/u)
  assert.doesNotMatch(articleCssSource, /#innhold \+ ul/u)
  assert.doesNotMatch(mdxComponentsSource, /isTocHeading/u)
  assert.match(articleCssSource, /:is\(h2, h3, h4\) \+ p/u)
})

test('page orange uses primary, not the yellow primary-hover token', () => {
  assert.match(calloutSource, /text-primary/u)
  assert.match(
    calloutSource,
    /bg-primary text-primary-foreground/u
  )
  assert.doesNotMatch(calloutSource, /primary-hover/u)
  assert.match(tableOfContentsSource, /hover:text-primary/u)
  assert.match(
    tableOfContentsSource,
    /focus-visible:text-primary/u
  )
  assert.doesNotMatch(articleCssSource, /primary-hover/u)
  assert.doesNotMatch(tableOfContentsSource, /primary-hover/u)
})

test('reading surface grows without reducing product-card edge spacing', () => {
  assert.match(articleCssSource, /max-width: 54rem/u)
  assert.match(
    articleCssSource,
    /grid-template-columns: minmax\(14rem, 16rem\) minmax\(0, 54rem\)/u
  )
  assert.match(productLineSource, /px-6 py-9 md:px-10 md:py-10/u)
  assert.match(mdxComponentsSource, /text-\[1\.0625rem\]/u)
  assert.match(mdxComponentsSource, /md:text-lg/u)
  assert.match(calloutSource, /text-\[1\.0625rem\]/u)
  assert.match(calloutSource, /md:text-lg/u)
})

test('callouts use sentence case and the documented brand weights', () => {
  assert.match(calloutSource, /font-extrabold/u)
  assert.match(calloutSource, /font-medium/u)
  assert.doesNotMatch(calloutSource, /uppercase/u)
  assert.doesNotMatch(calloutSource, /tracking-wide/u)
})

test('product-line cards do not repeat an uppercase eyebrow above the heading', () => {
  assert.doesNotMatch(productLineSource, /uppercase/u)
  assert.doesNotMatch(productLineSource, /tracking-\[0\.12em\]/u)
})

test('TechDown card does not render the kate-linn promotional image', () => {
  assert.match(productLineSource, /techdown: \{\s*image: null/u)
  assert.doesNotMatch(
    productLineSource,
    /og-kate-linn-kikkert-master/u
  )
})

test('Mikrofiber card does not render the frontpage kate-linn image', () => {
  assert.match(
    productLineSource,
    /mikrofiber: \{\s*image: null/u
  )
  assert.doesNotMatch(productLineSource, /frontpage-kate-linn/u)
})

test('Dun card does not render the cabin coffee image', () => {
  assert.match(productLineSource, /dun: \{\s*image: null/u)
  assert.doesNotMatch(productLineSource, /coffe_utekos/u)
})

test('verified Comfyrobe image keeps its native ratio', () => {
  assert.match(productLineSource, /Comfyrobe-Sherpa-1440-2160/u)
  assert.match(
    productLineSource,
    /className='h-auto max-h-\[42rem\] w-auto max-w-full'/u
  )
  assert.doesNotMatch(productLineSource, /aspect-4\/3/u)
  assert.doesNotMatch(productLineSource, /object-cover/u)
})

test('product-line cards do not paint a left color stripe', () => {
  assert.doesNotMatch(productLineSource, /stripeClassName/u)
  assert.doesNotMatch(
    productLineSource,
    /inset-y-0 left-0 w-1\.5/u
  )
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
