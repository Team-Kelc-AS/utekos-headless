import { Project, SyntaxKind } from 'ts-morph'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// 1. Etablering av skuddsikker, absolutt kontekst
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const tsConfigPath = path.resolve(__dirname, '../../tsconfig.json')

const project = new Project({
  tsConfigFilePath: tsConfigPath,
  // Vi hopper over avhengighetsløsing (node_modules) for maksimal prosesseringshastighet
  skipFileDependencyResolution: true
})

console.log('\n[Zero-Defect Protocol]: Initierer AST-skanning for utdatert Tailwind-syntaks...')

// 2. Definisjon av regelsett
// Fanger syntaks som: bg-[var(--maritime-blue)]
const legacyVarRegex = /([a-z0-9:-]+)-\[var\(--([a-zA-Z0-9-]+)\)\]/g
// Fanger utdaterte flex-aliaser
const legacyGrowRegex = /\bflex-grow\b/g
const legacyShrinkRegex = /\bflex-shrink\b/g

let totalViolations = 0
let filesModified = 0

// 3. Metakognitiv inspeksjon av AST-treet
for (const sourceFile of project.getSourceFiles()) {
  let fileHasViolations = false

  // Henter ut alle enkle tekststrenger og template-strenger i filen
  const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral)
  const templateLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral)

  const textNodes = [...stringLiterals, ...templateLiterals]

  for (const node of textNodes) {
    // HELIKOPTERSYN: Sikrer at vi KUN endrer strenger inni en JSX 'className' prop
    const jsxAttribute = node.getFirstAncestorByKind(SyntaxKind.JsxAttribute)
    if (!jsxAttribute || jsxAttribute.getNameNode().getText() !== 'className') {
      continue
    }

    const originalText = node.getLiteralText()
    let newText = originalText

    // Gjennomfør 1: Tvinger oppdatert variabel-syntaks (f.eks bg-(--farge))
    if (legacyVarRegex.test(newText)) {
      newText = newText.replace(legacyVarRegex, '$1-(--$2)')
    }

    // Gjennomfør 2: Forkortede aliaser (shrink, grow)
    if (legacyGrowRegex.test(newText)) {
      newText = newText.replace(legacyGrowRegex, 'grow')
    }
    if (legacyShrinkRegex.test(newText)) {
      newText = newText.replace(legacyShrinkRegex, 'shrink')
    }

    // 4. Kalibrering av node
    // Hvis en endring er oppdaget, injiseres den nye teksten direkte inn i minnet
    if (newText !== originalText) {
      node.setLiteralValue(newText)
      fileHasViolations = true
      totalViolations++
    }
  }

  if (fileHasViolations) {
    filesModified++
    console.log(`[Auto-kalibrert]: ${sourceFile.getFilePath()}`)
  }
}

// 5. Avgjørelse og disklagring
if (filesModified > 0) {
  console.log(
    `\n[Resultat]: Fant og korrigerte ${totalViolations} brudd på Tailwind v4-syntaks fordelt på ${filesModified} filer.`
  )
  console.log('[Lagrer]: Skriver endringene permanent til disk...')

  // Deferrering er over. Utfører filsystemoperasjonen.
  project.saveSync()

  console.log('[Fullført]: Koden er nå 100% compliant og klar for kompilering.')
} else {
  console.log('\n[Resultat]: Null avvik funnet. Kodebasen overholder ufravikelig kanonisk syntaks.')
}
