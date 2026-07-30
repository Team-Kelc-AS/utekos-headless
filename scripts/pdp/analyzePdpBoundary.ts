import path from 'node:path'
import { Project, SyntaxKind, type SourceFile } from 'ts-morph'

export type ModuleRole = 'server' | 'client'

export type GateId =
  | 'dehydrated-product-query'
  | 'product-query-client'
  | 'server-action-as-queryfn'
  | 'client-product-refetch'
  | 'full-product-into-client'
  | 'global-shopify-provider'

export type GateViolation = {
  gate: GateId
  file: string
  line: number
  detail: string
}

export type ModuleReport = {
  file: string
  role: ModuleRole
  bytes: number
  /** True when a Server Component imports this client module directly. */
  isBoundary: boolean
  /** Client modules only: the import chain from the route entry. */
  entryPath: string[]
}

export type BoundaryReport = {
  entry: string
  serverModuleCount: number
  clientModuleCount: number
  clientBytes: number
  /** Client modules a Server Component renders directly. */
  boundaryModules: string[]
  clientThirdPartyPackages: string[]
  clientModules: ModuleReport[]
  gateViolations: GateViolation[]
}

const CLIENT_DIRECTIVE = 'use client'
const SERVER_ACTION_DIRECTIVE = 'use server'

function hasDirective(
  file: SourceFile,
  directive: string
): boolean {
  for (const statement of file.getStatements()) {
    const expression = statement
      .asKind(SyntaxKind.ExpressionStatement)
      ?.getExpression()
    const literal =
      expression?.asKind(SyntaxKind.StringLiteral) ??
      expression?.asKind(
        SyntaxKind.NoSubstitutionTemplateLiteral
      )

    if (!literal) {
      // Directive prologues must precede all other statements.
      return false
    }
    if (literal.getLiteralText() === directive) {
      return true
    }
  }

  return false
}

function isInProject(file: SourceFile, root: string): boolean {
  const filePath = file.getFilePath()
  return (
    !filePath.includes('/node_modules/') &&
    filePath.startsWith(root)
  )
}

function resolvePackageName(
  moduleSpecifier: string
): string | null {
  if (
    moduleSpecifier.startsWith('.') ||
    moduleSpecifier.startsWith('/') ||
    moduleSpecifier.startsWith('@/') ||
    moduleSpecifier.startsWith('types/') ||
    moduleSpecifier.startsWith('@types/') ||
    moduleSpecifier.startsWith('@public/')
  ) {
    return null
  }

  const segments = moduleSpecifier.split('/')
  return moduleSpecifier.startsWith('@') ?
      segments.slice(0, 2).join('/')
    : segments[0] || null
}

/**
 * Value imports only. A type-only import never reaches the browser
 * bundle, so counting it would overstate the client boundary.
 */
function getValueImports(
  file: SourceFile
): Array<{ specifier: string; resolved: SourceFile | null }> {
  const imports: Array<{
    specifier: string
    resolved: SourceFile | null
  }> = []

  for (const declaration of file.getImportDeclarations()) {
    if (declaration.isTypeOnly()) continue

    const namedBindings = declaration.getNamedImports()
    const hasValueBinding =
      Boolean(declaration.getDefaultImport()) ||
      Boolean(declaration.getNamespaceImport()) ||
      namedBindings.some(named => !named.isTypeOnly()) ||
      (namedBindings.length === 0 &&
        !declaration.getImportClause())

    if (!hasValueBinding) continue

    imports.push({
      specifier: declaration.getModuleSpecifierValue(),
      resolved:
        declaration.getModuleSpecifierSourceFile() ?? null
    })
  }

  for (const declaration of file.getExportDeclarations()) {
    if (declaration.isTypeOnly()) continue
    const specifier = declaration.getModuleSpecifierValue()
    if (!specifier) continue

    imports.push({
      specifier,
      resolved:
        declaration.getModuleSpecifierSourceFile() ?? null
    })
  }

  return imports
}

export function createPdpProject(
  tsConfigFilePath: string
): Project {
  return new Project({
    tsConfigFilePath,
    skipAddingFilesFromTsConfig: false
  })
}

export function analyzeBoundary(
  project: Project,
  entryFilePath: string,
  root: string
): BoundaryReport {
  const entry = project.getSourceFileOrThrow(entryFilePath)

  const serverModules = new Set<string>()
  const clientModules = new Map<string, ModuleReport>()
  const clientThirdParty = new Set<string>()
  const gateViolations: GateViolation[] = []

  const relative = (file: SourceFile) =>
    path.relative(root, file.getFilePath())

  type QueueItem = {
    file: SourceFile
    role: ModuleRole
    chain: string[]
  }

  const visited = new Set<string>()
  const scannedForGates = new Set<string>()
  const boundaryModules = new Set<string>()
  const queue: QueueItem[] = [
    { file: entry, role: 'server', chain: [relative(entry)] }
  ]

  while (queue.length > 0) {
    const item = queue.shift()
    if (!item) break

    const { file, chain } = item
    const declaresClient = hasDirective(file, CLIENT_DIRECTIVE)
    // Once a module is client-side, everything it pulls in is too.
    const role: ModuleRole =
      item.role === 'client' || declaresClient ?
        'client'
      : 'server'

    const key = `${relative(file)}::${role}`
    if (visited.has(key)) continue
    visited.add(key)

    if (role === 'client') {
      clientModules.set(relative(file), {
        file: relative(file),
        role,
        bytes: Buffer.byteLength(file.getFullText(), 'utf8'),
        isBoundary: false,
        entryPath: chain
      })
    } else {
      serverModules.add(relative(file))
    }

    if (!scannedForGates.has(key)) {
      scannedForGates.add(key)
      collectGateViolations(file, role, root, gateViolations)
    }

    for (const imported of getValueImports(file)) {
      const packageName = resolvePackageName(imported.specifier)
      if (role === 'client' && packageName) {
        clientThirdParty.add(packageName)
      }

      const target = imported.resolved
      if (!target || !isInProject(target, root)) continue

      // A 'use server' entry is never bundled into the client; the
      // client only receives a reference to the action.
      if (hasDirective(target, SERVER_ACTION_DIRECTIVE)) {
        serverModules.add(relative(target))
        continue
      }

      if (
        role === 'server' &&
        hasDirective(target, CLIENT_DIRECTIVE)
      ) {
        boundaryModules.add(relative(target))
      }

      queue.push({
        file: target,
        role,
        chain: [...chain, relative(target)]
      })
    }
  }

  // Only props on a module that a Server Component renders directly
  // actually cross the RSC boundary and get serialized.
  for (const boundaryFile of boundaryModules) {
    const boundaryModule = clientModules.get(boundaryFile)
    if (!boundaryModule) continue
    boundaryModule.isBoundary = true

    collectFullProductPropViolations(
      project.getSourceFileOrThrow(
        path.join(root, boundaryFile)
      ),
      boundaryFile,
      gateViolations
    )
  }

  return {
    entry: relative(entry),
    serverModuleCount: serverModules.size,
    clientModuleCount: clientModules.size,
    clientBytes: [...clientModules.values()].reduce(
      (total, clientModule) => total + clientModule.bytes,
      0
    ),
    boundaryModules: [...boundaryModules].sort(),
    clientThirdPartyPackages: [...clientThirdParty].sort(),
    clientModules: [...clientModules.values()].sort(
      (a, b) => b.bytes - a.bytes
    ),
    gateViolations: dedupeViolations(gateViolations).sort(
      (a, b) =>
        a.file === b.file ?
          a.line - b.line
        : a.file.localeCompare(b.file)
    )
  }
}

function dedupeViolations(
  violations: GateViolation[]
): GateViolation[] {
  const seen = new Map<string, GateViolation>()

  for (const violation of violations) {
    seen.set(
      `${violation.gate}::${violation.file}::${violation.line}::${violation.detail}`,
      violation
    )
  }

  return [...seen.values()]
}

const HYDRATION_SYMBOLS = new Set([
  'HydrationBoundary',
  'dehydrate'
])

function collectGateViolations(
  file: SourceFile,
  role: ModuleRole,
  root: string,
  violations: GateViolation[]
): void {
  const relativePath = path.relative(root, file.getFilePath())

  for (const declaration of file.getImportDeclarations()) {
    if (declaration.isTypeOnly()) continue

    const specifier = declaration.getModuleSpecifierValue()
    const line = declaration.getStartLineNumber()

    if (specifier === '@tanstack/react-query') {
      const named = declaration
        .getNamedImports()
        .filter(named => !named.isTypeOnly())
        .map(named => named.getName())

      const hydrationSymbols = named.filter(name =>
        HYDRATION_SYMBOLS.has(name)
      )
      if (hydrationSymbols.length > 0) {
        violations.push({
          gate: 'dehydrated-product-query',
          file: relativePath,
          line,
          detail: `imports ${hydrationSymbols.join(', ')} on the PDP graph`
        })
      }

      if (named.includes('QueryClient')) {
        violations.push({
          gate: 'product-query-client',
          file: relativePath,
          line,
          detail: 'constructs a QueryClient on the PDP graph'
        })
      }

      if (role === 'client' && named.includes('useQuery')) {
        violations.push({
          gate: 'client-product-refetch',
          file: relativePath,
          line,
          detail:
            'client module refetches server-owned data with useQuery'
        })
      }
    }

    if (
      specifier === '@shopify/hydrogen-react' &&
      role === 'client'
    ) {
      const providers = declaration
        .getNamedImports()
        .filter(named => !named.isTypeOnly())
        .map(named => named.getName())
        .filter(name =>
          [
            'ShopifyProvider',
            'ProductProvider',
            'CartProvider',
            'useProduct',
            'useCart'
          ].includes(name)
        )

      if (providers.length > 0) {
        violations.push({
          gate: 'global-shopify-provider',
          file: relativePath,
          line,
          detail: `introduces Hydrogen provider(s): ${providers.join(', ')}`
        })
      }
    }
  }

  collectServerActionQueryFnViolations(
    file,
    relativePath,
    violations
  )
}

function collectServerActionQueryFnViolations(
  file: SourceFile,
  relativePath: string,
  violations: GateViolation[]
): void {
  const actionImports = new Map<string, string>()

  for (const declaration of file.getImportDeclarations()) {
    const target = declaration.getModuleSpecifierSourceFile()
    if (
      !target ||
      !hasDirective(target, SERVER_ACTION_DIRECTIVE)
    ) {
      continue
    }

    for (const named of declaration.getNamedImports()) {
      if (named.isTypeOnly()) continue
      actionImports.set(
        named.getAliasNode()?.getText() ?? named.getName(),
        declaration.getModuleSpecifierValue()
      )
    }
  }

  if (actionImports.size === 0) return

  for (const property of file.getDescendantsOfKind(
    SyntaxKind.PropertyAssignment
  )) {
    if (property.getName() !== 'queryFn') continue

    for (const call of property.getDescendantsOfKind(
      SyntaxKind.CallExpression
    )) {
      const callee = call.getExpression().getText()
      const source = actionImports.get(callee)
      if (!source) continue

      violations.push({
        gate: 'server-action-as-queryfn',
        file: relativePath,
        line: call.getStartLineNumber(),
        detail: `queryFn calls the Server Action ${callee} from '${source}'`
      })
    }
  }
}

const FULL_PRODUCT_TYPES = new Set([
  'ShopifyProduct',
  'ShopifyProduct[]',
  'ShopifyProduct | undefined',
  'ShopifyProduct | null'
])

function collectFullProductPropViolations(
  file: SourceFile,
  relativePath: string,
  violations: GateViolation[]
): void {
  for (const property of file.getDescendantsOfKind(
    SyntaxKind.PropertySignature
  )) {
    const typeText = property.getTypeNode()?.getText()
    if (!typeText) continue

    const normalized = typeText.replace(/\s+/g, ' ').trim()
    if (!FULL_PRODUCT_TYPES.has(normalized)) continue

    violations.push({
      gate: 'full-product-into-client',
      file: relativePath,
      line: property.getStartLineNumber(),
      detail: `client prop '${property.getName()}' carries ${normalized} across the boundary`
    })
  }
}
