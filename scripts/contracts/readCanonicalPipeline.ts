import { readFileSync } from 'node:fs'
import { dirname, posix, resolve } from 'node:path'
import ts from 'typescript'

export function readCanonicalPipeline(root: string) {
  const sourceFiles = new Set<string>([
    'scripts/contracts/readCanonicalPipeline.ts'
  ])
  const read = (path: string) => {
    sourceFiles.add(path)
    return ts.createSourceFile(
      path,
      readFileSync(resolve(root, path), 'utf8'),
      ts.ScriptTarget.Latest,
      true
    )
  }
  const declaration = (file: ts.SourceFile, symbol: string) => {
    const value = file.statements
      .filter(ts.isVariableStatement)
      .flatMap(statement => [
        ...statement.declarationList.declarations
      ])
      .find(
        node =>
          ts.isIdentifier(node.name) && node.name.text === symbol
      )?.initializer
    if (!value)
      throw new Error(`Missing pipeline declaration: ${symbol}`)
    return value
  }
  const registry = (path: string, symbol: string) => {
    const file = read(path)
    const imports = new Map<
      string,
      { path: string; symbol: string }
    >()
    for (const node of file.statements) {
      if (
        !ts.isImportDeclaration(node) ||
        !ts.isStringLiteral(node.moduleSpecifier)
      )
        continue
      const bindings = node.importClause?.namedBindings
      if (
        !bindings ||
        !ts.isNamedImports(bindings) ||
        node.importClause?.isTypeOnly
      )
        continue
      const specifier = node.moduleSpecifier.text
      if (!specifier.startsWith('.'))
        throw new Error('Unsupported pipeline registry import')
      const target = `${posix.normalize(posix.join(dirname(path), specifier))}.ts`
      for (const binding of bindings.elements)
        imports.set(binding.name.text, {
          path: target,
          symbol: binding.propertyName?.text ?? binding.name.text
        })
    }
    let value = declaration(file, symbol)
    while (
      ts.isAsExpression(value) ||
      ts.isSatisfiesExpression(value) ||
      ts.isParenthesizedExpression(value)
    )
      value = value.expression
    if (!ts.isObjectLiteralExpression(value))
      throw new Error('Unsupported pipeline registry')
    return value.properties.map(property => {
      if (
        !ts.isPropertyAssignment(property) ||
        !ts.isStringLiteral(property.name)
      )
        throw new Error('Unsupported pipeline registry member')
      const initializer = property.initializer
      const target =
        ts.isIdentifier(initializer) ?
          imports.get(initializer.text)
        : (
          ts.isCallExpression(initializer) &&
          ts.isIdentifier(initializer.expression)
        ) ?
          imports.get(initializer.expression.text)
        : undefined
      if (!target)
        throw new Error('Unresolved pipeline registry target')
      read(target.path)
      return {
        key: property.name.text,
        registry: path,
        implementation: target
      }
    })
  }
  const queuePath =
    'src/lib/analytics/server/canonicalProviderDispatchQueue.ts'
  const topic = declaration(
    read(queuePath),
    'CANONICAL_PROVIDER_DISPATCH_TOPIC'
  )
  if (!ts.isStringLiteral(topic))
    throw new Error('Unsupported pipeline queue topic')
  const stages = [
    {
      stage: 'canonical_persistence',
      source:
        'src/lib/analytics/server/createCanonicalEventStore.ts'
    },
    {
      stage: 'ledger_and_outbox_mapping',
      source:
        'src/lib/analytics/server/mapCanonicalEventPersistence.ts'
    },
    { stage: 'queue_publisher', source: queuePath },
    {
      stage: 'queue_consumer',
      source:
        'src/app/api/queues/canonical-provider-dispatch/route.ts'
    },
    {
      stage: 'first_party_google_gateway',
      source:
        'src/lib/analytics/serverGtmGateway/proxyServerGtmRequest.ts'
    },
    {
      stage: 'google_gateway_destination',
      source:
        'src/lib/analytics/serverGtmGateway/buildServerGtmUpstreamUrl.ts'
    }
  ]
  for (const stage of stages) read(stage.source)
  return {
    definition: {
      evidence: 'source_only' as const,
      queue_topic: topic.text,
      stages,
      adapters: registry(
        'src/lib/analytics/server/providerAdapterRegistry.ts',
        'providerAdapterRegistry'
      ),
      workers: registry(
        'src/lib/analytics/server/providerOutboxWorkerRegistry.ts',
        'providerOutboxWorkerRegistry'
      )
    },
    sourceFiles: [...sourceFiles].sort()
  }
}
