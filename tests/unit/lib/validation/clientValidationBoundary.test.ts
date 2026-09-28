import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'

const entries = [
  'src/lib/analytics/canonicalEventEnvelope.ts',
  'src/lib/analytics/checkoutAttributionSnapshot.ts',
  'src/lib/analytics/pageViewEvent.ts',
  'src/lib/analytics/viewItemListEvent.ts',
  'src/lib/observability/journey/contract.ts',
  'src/lib/cart/cartActionsResultSchema.ts',
  'src/lib/cart/addCartLinesRequestSchema.ts',
  'src/components/klarna/schemas/klarnaExpressOrderSchema.ts',
  'src/components/klarna/schemas/klarnaPublicConfigSchema.ts',
  'src/lib/observability/client/sendClientLog.ts',
  'src/lib/products/presentation/productPresentationDefinitions.ts',
  'src/lib/products/publicVariantOptionsSchema.ts',
  'src/app/skreddersy-varmen/data/skreddersyVarmenPageModel.ts'
]

for (const entry of entries) {
  test(`${entry} does not retain classic Zod or the server log contract`, () => {
    const visited = new Set<string>()
    const imports = new Set<string>()
    function visit(file: string) {
      if (visited.has(file)) return
      visited.add(file)
      const output = ts.transpileModule(
        readFileSync(file, 'utf8'),
        {
          fileName: file,
          compilerOptions: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext,
            jsx: ts.JsxEmit.Preserve
          }
        }
      ).outputText
      const source = ts.createSourceFile(
        file,
        output,
        ts.ScriptTarget.ESNext,
        true
      )
      for (const statement of source.statements) {
        if (
          !ts.isImportDeclaration(statement) &&
          !ts.isExportDeclaration(statement)
        )
          continue
        const specifier = statement.moduleSpecifier
        if (!specifier || !ts.isStringLiteral(specifier))
          continue
        const name = specifier.text
        imports.add(name)
        assert.ok(
          !/^zod(?:\/v4)?$/.test(name),
          `Classic Zod imported by ${file}`
        )
        assert.ok(
          !name.includes('appLogContract'),
          `Server log contract imported by ${file}`
        )
        if (name.includes('/locales')) {
          assert.equal(name, 'zod/v4/locales/en.js')
        }
        const base =
          name.startsWith('@/') ?
            path.resolve('src', name.slice(2))
          : name.startsWith('types/') ? path.resolve(name)
          : name.startsWith('.') ?
            path.resolve(path.dirname(file), name)
          : undefined
        if (!base) continue
        const resolved = [
          base,
          `${base}.ts`,
          `${base}.tsx`,
          `${base}/index.ts`
        ].find(
          candidate =>
            /\.[cm]?[jt]sx?$/.test(candidate) &&
            existsSync(candidate)
        )
        assert.ok(
          resolved,
          `Unresolved local import ${name} from ${file}`
        )
        visit(resolved)
      }
    }
    visit(path.resolve(entry))
    assert.ok(imports.has('zod/mini'))
    assert.ok(imports.has('zod/v4/locales/en.js'))
  })
}
