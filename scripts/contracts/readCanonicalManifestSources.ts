import { readFileSync } from 'node:fs'
import { dirname, posix, resolve } from 'node:path'
import ts from 'typescript'

export function readCanonicalManifestSources(root: string) {
  const unionPath = 'src/lib/analytics/canonicalEvent.ts'
  const sourceFiles = new Set<string>()
  const read = (file: string) => {
    sourceFiles.add(file)
    return ts.createSourceFile(
      file,
      readFileSync(resolve(root, file), 'utf8'),
      ts.ScriptTarget.Latest,
      true
    )
  }
  const localPath = (file: string, specifier: string) => {
    const target =
      specifier.startsWith('@/') ? `src/${specifier.slice(2)}`
      : specifier.startsWith('.') ?
        posix.normalize(posix.join(dirname(file), specifier))
      : null
    if (target === null) return null
    if (
      !target.startsWith('src/') &&
      !target.startsWith('scripts/contracts/')
    ) {
      throw new Error(
        `Unexpected manifest dependency: ${target}`
      )
    }
    return posix.extname(target) ? target : `${target}.ts`
  }
  const union = read(unionPath)
  const imports = new Map<string, string>()
  for (const node of union.statements) {
    if (
      !ts.isImportDeclaration(node) ||
      !ts.isStringLiteral(node.moduleSpecifier)
    )
      continue
    const bindings = node.importClause?.namedBindings
    const file = localPath(unionPath, node.moduleSpecifier.text)
    if (file && bindings && ts.isNamedImports(bindings)) {
      for (const binding of bindings.elements)
        imports.set(binding.name.text, file)
    }
  }
  const declaration = union.statements
    .filter(ts.isVariableStatement)
    .flatMap(statement => [
      ...statement.declarationList.declarations
    ])
    .find(
      node =>
        ts.isIdentifier(node.name) &&
        node.name.text === 'canonicalEventSchema'
    )
  const initializer = declaration?.initializer
  if (
    !initializer ||
    !ts.isCallExpression(initializer) ||
    !initializer.arguments[1] ||
    !ts.isArrayLiteralExpression(initializer.arguments[1])
  ) {
    throw new Error('Unsupported canonical union declaration')
  }
  const schemaFiles = initializer.arguments[1].elements.map(
    node => {
      const file =
        ts.isIdentifier(node) ?
          imports.get(node.text)
        : undefined
      if (!file)
        throw new Error(
          'Canonical union member has no explicit source import'
        )
      return file
    }
  )
  const visited = new Set<string>()
  const visit = (file: string) => {
    if (visited.has(file)) return
    visited.add(file)
    for (const node of read(file).statements) {
      if (
        !(
          ts.isImportDeclaration(node) ||
          ts.isExportDeclaration(node)
        ) ||
        !node.moduleSpecifier ||
        !ts.isStringLiteral(node.moduleSpecifier)
      )
        continue
      if (
        ts.isImportDeclaration(node) &&
        node.importClause?.isTypeOnly
      )
        continue
      if (ts.isExportDeclaration(node) && node.isTypeOnly)
        continue
      const dependency = localPath(
        file,
        node.moduleSpecifier.text
      )
      if (dependency) visit(dependency)
    }
  }
  for (const file of [
    unionPath,
    'src/lib/analytics/eventCatalog.ts',
    'src/lib/consent/resolveTrackingAuthorization.ts',
    'scripts/contracts/utekosEventsContractCatalog.ts',
    'scripts/contracts/utekosEventDeliveryParameterCatalog.ts'
  ])
    visit(file)
  sourceFiles.add(
    'scripts/contracts/generateCanonicalEventManifest.ts'
  )
  sourceFiles.add(
    'scripts/contracts/readCanonicalManifestSources.ts'
  )
  return { schemaFiles, sourceFiles: [...sourceFiles].sort() }
}
