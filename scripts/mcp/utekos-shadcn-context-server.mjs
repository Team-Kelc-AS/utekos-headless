#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createHash, randomUUID } from 'node:crypto'

import {
  Client,
  StdioClientTransport
} from '@modelcontextprotocol/client'
import {
  McpServer,
  StdioServerTransport
} from '@modelcontextprotocol/server'
import { z } from 'zod/v4'

const repoRoot = path.resolve(
  process.env.UTEKOS_REPO_ROOT ?? process.cwd()
)
const profile = 'utekos_shadcn_context'
const mode = 'read-only'

const allowedRoots = [
  'scripts/shadcn/academy',
  'src/components/ui',
  'src/components/cards',
  'src/app/inspirasjon/cardproduction',
  'src/app/inspirasjon/components/cards',
  'src/app/inspirasjon/components/items'
]

const allowedFiles = ['components.json', 'src/globals.css']

const toolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: true
}

const sourceSchema = z.object({
  path: z.string(),
  sha256: z.string().optional(),
  size_bytes: z.number().int().nonnegative().optional(),
  line_count: z.number().int().nonnegative().optional(),
  truncated: z.boolean().optional()
})

const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
  category: z.string(),
  retryable: z.boolean(),
  safe_to_retry: z.boolean(),
  user_action_required: z.boolean(),
  suggested_fix: z.string(),
  details_redacted: z.boolean()
})

const permissionsSchema = z.object({
  read_only: z.boolean(),
  allowed_roots: z.array(z.string()),
  allowed_files: z.array(z.string())
})

function envelopeSchema(toolName, dataSchema) {
  return z.object({
    ok: z.boolean(),
    tool: z.literal(toolName),
    profile: z.literal(profile),
    mode: z.literal(mode),
    request_id: z.string(),
    started_at: z.string(),
    finished_at: z.string(),
    duration_ms: z.number().nonnegative(),
    data: dataSchema,
    sources: z.array(sourceSchema),
    warnings: z.array(z.string()),
    errors: z.array(errorSchema),
    limits: z.record(z.string(), z.unknown()),
    permissions: permissionsSchema,
    next: z.array(z.string())
  })
}

function nowIso() {
  return new Date().toISOString()
}

function permissions() {
  return {
    read_only: true,
    allowed_roots: allowedRoots,
    allowed_files: allowedFiles
  }
}

function createEnvelope(
  toolName,
  startedAt,
  data,
  options = {}
) {
  const finishedAt = nowIso()
  return {
    ok: options.ok ?? true,
    tool: toolName,
    profile,
    mode,
    request_id: options.requestId ?? randomUUID(),
    started_at: startedAt,
    finished_at: finishedAt,
    duration_ms: Date.parse(finishedAt) - Date.parse(startedAt),
    data,
    sources: options.sources ?? [],
    warnings: options.warnings ?? [],
    errors: options.errors ?? [],
    limits: options.limits ?? {},
    permissions: permissions(),
    next: options.next ?? []
  }
}

function textResult(envelope) {
  return {
    content: [
      { type: 'text', text: JSON.stringify(envelope, null, 2) }
    ],
    structuredContent: envelope
  }
}

function makeError(
  code,
  message,
  suggestedFix,
  category = 'access_control'
) {
  return {
    code,
    message,
    category,
    retryable: false,
    safe_to_retry: true,
    user_action_required: false,
    suggested_fix: suggestedFix,
    details_redacted: true
  }
}

function relativePath(filePath) {
  return path
    .relative(repoRoot, filePath)
    .replaceAll(path.sep, '/')
}

function isAllowedPath(relative) {
  if (allowedFiles.includes(relative)) return true
  return allowedRoots.some(
    root => relative === root || relative.startsWith(`${root}/`)
  )
}

function resolveAllowedPath(inputPath) {
  const cleaned = String(inputPath ?? '').trim()
  if (!cleaned) throw new Error('Path is empty')
  if (cleaned.includes('\0'))
    throw new Error('Path contains invalid null byte')

  const resolved = path.resolve(repoRoot, cleaned)
  const relative = relativePath(resolved)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Path escapes repo root: ${cleaned}`)
  }

  if (!isAllowedPath(relative)) {
    throw new Error(
      `Path is outside Utekos shadcn context policy: ${relative}`
    )
  }

  return { absolute: resolved, relative }
}

function hashBuffer(value) {
  return createHash('sha256').update(value).digest('hex')
}

function readTextFile(relative, maxBytes) {
  const resolved = resolveAllowedPath(relative)
  const stat = fs.statSync(resolved.absolute)
  if (!stat.isFile())
    throw new Error(`Not a file: ${resolved.relative}`)

  const buffer = fs.readFileSync(resolved.absolute)
  const truncated = buffer.byteLength > maxBytes
  const text = buffer.subarray(0, maxBytes).toString('utf8')

  return {
    path: resolved.relative,
    content: text,
    sha256: hashBuffer(buffer),
    size_bytes: buffer.byteLength,
    line_count: text.length === 0 ? 0 : text.split('\n').length,
    truncated
  }
}

function fileSource(file) {
  return {
    path: file.path,
    sha256: file.sha256,
    size_bytes: file.size_bytes,
    line_count: file.line_count,
    truncated: file.truncated
  }
}

function listFilesUnder(relativeRoot) {
  const absoluteRoot = path.join(repoRoot, relativeRoot)
  if (!fs.existsSync(absoluteRoot)) return []
  const files = []

  function walk(current) {
    for (const entry of fs.readdirSync(current, {
      withFileTypes: true
    })) {
      const absolute = path.join(current, entry.name)
      const relative = relativePath(absolute)
      if (entry.isDirectory()) {
        walk(absolute)
      } else if (entry.isFile() && isAllowedPath(relative)) {
        files.push(relative)
      }
    }
  }

  walk(absoluteRoot)
  return files.sort()
}

function listAllowedFiles() {
  const files = []
  for (const file of allowedFiles) {
    if (fs.existsSync(path.join(repoRoot, file)))
      files.push(file)
  }
  for (const root of allowedRoots)
    files.push(...listFilesUnder(root))
  return [...new Set(files)].sort()
}

function safeJson(relative) {
  try {
    return JSON.parse(readTextFile(relative, 250000).content)
  } catch {
    return null
  }
}

const fileSummarySchema = z.object({
  path: z.string(),
  size_bytes: z.number().int().nonnegative(),
  line_count: z.number().int().nonnegative(),
  sha256: z.string()
})

const bootstrapDataSchema = z.object({
  shadcn_mcp_command: z.string(),
  local_context_tools: z.array(z.string()),
  academy_root: z.string(),
  components_json: z.string(),
  tailwind_css_file: z.string(),
  ui_root: z.string(),
  project_context_roots: z.array(z.string()),
  aliases: z.record(z.string(), z.string()),
  style: z.string().optional(),
  base_color: z.string().optional(),
  icon_library: z.string().optional(),
  rsc: z.boolean().optional(),
  rules: z.array(z.string())
})

const inventoryDataSchema = z.object({
  files: z.array(fileSummarySchema),
  academy_files: z.array(z.string()),
  ui_component_files: z.array(z.string()),
  root_files: z.array(z.string())
})

const contextFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  sha256: z.string(),
  size_bytes: z.number().int().nonnegative(),
  line_count: z.number().int().nonnegative(),
  truncated: z.boolean()
})

const readDataSchema = z.object({
  files: z.array(contextFileSchema),
  denied_files: z.array(z.string()),
  missing_files: z.array(z.string())
})

const searchMatchSchema = z.object({
  path: z.string(),
  line: z.number().int().positive(),
  text: z.string()
})

const searchDataSchema = z.object({
  query: z.string(),
  matches: z.array(searchMatchSchema),
  searched_files: z.number().int().nonnegative()
})

const registryProxyDataSchema = z.object({
  official_tool: z.string(),
  content: z.array(z.record(z.string(), z.unknown())),
  structured_content: z.unknown().optional(),
  is_error: z.boolean()
})

const registryNamesSchema = z.array(z.string()).optional()
const registryTypesSchema = z
  .array(
    z.enum([
      'lib',
      'block',
      'component',
      'ui',
      'hook',
      'page',
      'file',
      'theme',
      'style',
      'item',
      'base',
      'font'
    ])
  )
  .optional()

async function callOfficialShadcnTool(toolName, toolArgs) {
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', 'shadcn@latest', 'mcp'],
    cwd: repoRoot
  })

  const client = new Client({
    name: 'utekos-shadcn-workbench-proxy',
    version: '1.0.0'
  })

  try {
    await client.connect(transport)
    return await client.callTool({
      name: toolName,
      arguments: toolArgs
    })
  } finally {
    await client.close()
  }
}

function registryProxyResult(
  serverToolName,
  officialToolName,
  startedAt,
  result,
  next = []
) {
  return textResult(
    createEnvelope(
      serverToolName,
      startedAt,
      {
        official_tool: officialToolName,
        content: result.content ?? [],
        structured_content: result.structuredContent,
        is_error: result.isError === true
      },
      {
        ok: result.isError !== true,
        sources: [{ path: 'components.json' }],
        warnings:
          result.isError === true ?
            ['Official shadcn MCP returned isError=true.']
          : [],
        next
      }
    )
  )
}

function registerRegistryProxyTool({
  name,
  title,
  description,
  inputSchema,
  officialTool,
  next
}) {
  server.registerTool(
    name,
    {
      title,
      description,
      inputSchema,
      outputSchema: envelopeSchema(
        name,
        registryProxyDataSchema
      ),
      annotations: toolAnnotations
    },
    async input => {
      const startedAt = nowIso()
      const result = await callOfficialShadcnTool(
        officialTool,
        input
      )
      return registryProxyResult(
        name,
        officialTool,
        startedAt,
        result,
        next
      )
    }
  )
}

const server = new McpServer({
  name: 'utekos-shadcn-workbench',
  version: '1.2.0'
})

server.registerTool(
  'shadcn_context_bootstrap',
  {
    title: 'Shadcn Context Bootstrap',
    description:
      'Use first for Utekos shadcn work. Returns the current local shadcn config, source roots, and required workflow.',
    inputSchema: z.object({}),
    outputSchema: envelopeSchema(
      'shadcn_context_bootstrap',
      bootstrapDataSchema
    ),
    annotations: toolAnnotations
  },
  async () => {
    const startedAt = nowIso()
    const config = safeJson('components.json') ?? {}
    const data = {
      shadcn_mcp_command: 'npx -y shadcn@latest mcp',
      local_context_tools: [
        'shadcn_context_bootstrap',
        'shadcn_source_inventory',
        'read_shadcn_sources',
        'search_shadcn_sources',
        'shadcn_registry_get_project_registries',
        'shadcn_registry_list_items',
        'shadcn_registry_search_items',
        'shadcn_registry_view_items',
        'shadcn_registry_get_examples',
        'shadcn_registry_get_add_command',
        'shadcn_registry_get_audit_checklist'
      ],
      academy_root: 'scripts/shadcn/academy',
      components_json: 'components.json',
      tailwind_css_file:
        config?.tailwind?.css ?? 'src/globals.css',
      ui_root: 'src/components/ui',
      project_context_roots: [
        'src/components/cards',
        'src/app/inspirasjon/cardproduction',
        'src/app/inspirasjon/components/cards',
        'src/app/inspirasjon/components/items'
      ],
      aliases: config?.aliases ?? {},
      style: config?.style,
      base_color: config?.tailwind?.baseColor,
      icon_library: config?.iconLibrary,
      rsc: config?.rsc,
      rules: [
        'Use shadcn_registry_* tools for current official shadcn registry reads and add-command generation.',
        'Use local context tools for Utekos academy docs, components.json, src/globals.css, src/components/ui/*, and the scoped inspiration card-production sources.',
        'Never mutate components or CSS through this context server; it is read-only.',
        'Before shadcn UI changes, read components.json, src/globals.css, relevant academy docs, exact src/components/ui files, and the affected Utekos card wrapper files.'
      ]
    }

    return textResult(
      createEnvelope(
        'shadcn_context_bootstrap',
        startedAt,
        data,
        {
          sources: [{ path: 'components.json' }],
          next: [
            'Call shadcn_source_inventory, then read_shadcn_sources for exact local files.'
          ]
        }
      )
    )
  }
)

server.registerTool(
  'shadcn_source_inventory',
  {
    title: 'Shadcn Source Inventory',
    description:
      'Lists all local files exposed to the Utekos shadcn context surface.',
    inputSchema: z.object({}),
    outputSchema: envelopeSchema(
      'shadcn_source_inventory',
      inventoryDataSchema
    ),
    annotations: toolAnnotations
  },
  async () => {
    const startedAt = nowIso()
    const files = []
    for (const file of listAllowedFiles()) {
      const readFile = readTextFile(file, 1000)
      files.push({
        path: readFile.path,
        size_bytes: readFile.size_bytes,
        line_count: readFile.line_count,
        sha256: readFile.sha256
      })
    }

    const data = {
      files,
      academy_files: files
        .map(file => file.path)
        .filter(file =>
          file.startsWith('scripts/shadcn/academy/')
        ),
      ui_component_files: files
        .map(file => file.path)
        .filter(file => file.startsWith('src/components/ui/')),
      root_files: files
        .map(file => file.path)
        .filter(file => allowedFiles.includes(file))
    }

    return textResult(
      createEnvelope(
        'shadcn_source_inventory',
        startedAt,
        data,
        {
          sources: files.map(file => ({
            path: file.path,
            sha256: file.sha256,
            size_bytes: file.size_bytes,
            line_count: file.line_count
          })),
          next: [
            'Call read_shadcn_sources with the files relevant to the current component task.'
          ]
        }
      )
    )
  }
)

server.registerTool(
  'read_shadcn_sources',
  {
    title: 'Read Shadcn Sources',
    description:
      'Reads explicit Utekos shadcn files. Only academy docs, components.json, src/globals.css, src/components/ui/*, and scoped inspiration card-production sources are allowed.',
    inputSchema: z.object({
      paths: z.array(z.string()).min(1).max(40),
      max_bytes_per_file: z
        .number()
        .int()
        .min(1000)
        .max(200000)
        .optional()
    }),
    outputSchema: envelopeSchema(
      'read_shadcn_sources',
      readDataSchema
    ),
    annotations: toolAnnotations
  },
  async ({ paths, max_bytes_per_file: maxBytesPerFile }) => {
    const startedAt = nowIso()
    const maxBytes = maxBytesPerFile ?? 60000
    const files = []
    const deniedFiles = []
    const missingFiles = []
    const warnings = []

    for (const requestedPath of paths) {
      try {
        const resolved = resolveAllowedPath(requestedPath)
        if (!fs.existsSync(resolved.absolute)) {
          missingFiles.push(resolved.relative)
          continue
        }
        const file = readTextFile(resolved.relative, maxBytes)
        files.push(file)
        if (file.truncated)
          warnings.push(
            `${file.path} truncated at ${maxBytes} bytes`
          )
      } catch (error) {
        deniedFiles.push(requestedPath)
        warnings.push(
          `${requestedPath}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    return textResult(
      createEnvelope(
        'read_shadcn_sources',
        startedAt,
        {
          files,
          denied_files: deniedFiles,
          missing_files: missingFiles
        },
        {
          ok: deniedFiles.length === 0,
          sources: files.map(fileSource),
          warnings,
          errors:
            deniedFiles.length === 0 ?
              []
            : [
                makeError(
                  'UTEKOS_SHADCN_DENIED_PATH',
                  'One or more requested paths were denied by policy.',
                  'Request only configured shadcn context files.'
                )
              ],
          limits: { max_bytes_per_file: maxBytes },
          next: [
            'Use official shadcn MCP for live registry/component docs when component APIs matter.'
          ]
        }
      )
    )
  }
)

server.registerTool(
  'search_shadcn_sources',
  {
    title: 'Search Shadcn Sources',
    description:
      'Literal search across Utekos shadcn academy docs, components.json, src/globals.css, src/components/ui/*, and scoped inspiration card-production sources.',
    inputSchema: z.object({
      query: z.string().min(2).max(200),
      limit: z.number().int().min(1).max(200).optional()
    }),
    outputSchema: envelopeSchema(
      'search_shadcn_sources',
      searchDataSchema
    ),
    annotations: toolAnnotations
  },
  async ({ query, limit }) => {
    const startedAt = nowIso()
    const maxMatches = limit ?? 50
    const matches = []
    const files = listAllowedFiles()

    for (const filePath of files) {
      if (matches.length >= maxMatches) break
      const file = readTextFile(filePath, 400000)
      const lines = file.content.split('\n')
      for (let index = 0; index < lines.length; index += 1) {
        if (matches.length >= maxMatches) break
        if (!lines[index].includes(query)) continue
        matches.push({
          path: file.path,
          line: index + 1,
          text: lines[index].slice(0, 500)
        })
      }
    }

    return textResult(
      createEnvelope(
        'search_shadcn_sources',
        startedAt,
        { query, matches, searched_files: files.length },
        {
          warnings:
            matches.length === 0 ? ['No matches found.'] : [],
          limits: { limit: maxMatches },
          next:
            matches.length > 0 ?
              [
                'Call read_shadcn_sources for exact matched files.'
              ]
            : ['Try a narrower literal term.']
        }
      )
    )
  }
)

registerRegistryProxyTool({
  name: 'shadcn_registry_get_project_registries',
  title: 'Shadcn Registry Get Project Registries',
  description:
    'Calls official shadcn MCP get_project_registries using this repo components.json.',
  inputSchema: z.object({}),
  officialTool: 'get_project_registries',
  next: [
    'Use shadcn_registry_list_items or shadcn_registry_search_items for registry discovery.'
  ]
})

registerRegistryProxyTool({
  name: 'shadcn_registry_list_items',
  title: 'Shadcn Registry List Items',
  description:
    'Calls official shadcn MCP list_items_in_registries. Read-only registry listing.',
  inputSchema: z.object({
    registries: registryNamesSchema,
    types: registryTypesSchema,
    limit: z.number().optional(),
    offset: z.number().optional()
  }),
  officialTool: 'list_items_in_registries',
  next: [
    'Use shadcn_registry_view_items for exact item details.'
  ]
})

registerRegistryProxyTool({
  name: 'shadcn_registry_search_items',
  title: 'Shadcn Registry Search Items',
  description:
    'Calls official shadcn MCP search_items_in_registries. Use for current shadcn registry discovery.',
  inputSchema: z.object({
    query: z.string().min(1),
    registries: registryNamesSchema,
    types: registryTypesSchema,
    limit: z.number().optional(),
    offset: z.number().optional()
  }),
  officialTool: 'search_items_in_registries',
  next: [
    'Use shadcn_registry_view_items or shadcn_registry_get_examples after choosing an item.'
  ]
})

registerRegistryProxyTool({
  name: 'shadcn_registry_view_items',
  title: 'Shadcn Registry View Items',
  description:
    'Calls official shadcn MCP view_items_in_registries for exact item metadata and file content.',
  inputSchema: z.object({
    items: z.array(z.string()).min(1).max(40)
  }),
  officialTool: 'view_items_in_registries',
  next: [
    'Use shadcn_registry_get_examples for examples or shadcn_registry_get_add_command for install commands.'
  ]
})

registerRegistryProxyTool({
  name: 'shadcn_registry_get_examples',
  title: 'Shadcn Registry Get Examples',
  description:
    'Calls official shadcn MCP get_item_examples_from_registries for demos and complete usage code.',
  inputSchema: z.object({
    query: z.string().min(1),
    registries: registryNamesSchema
  }),
  officialTool: 'get_item_examples_from_registries',
  next: [
    'Compare examples against local src/components/ui/* before implementation.'
  ]
})

registerRegistryProxyTool({
  name: 'shadcn_registry_get_add_command',
  title: 'Shadcn Registry Get Add Command',
  description:
    'Calls official shadcn MCP get_add_command_for_items. Returns commands only; this tool does not execute installs.',
  inputSchema: z.object({
    items: z.array(z.string()).min(1).max(40)
  }),
  officialTool: 'get_add_command_for_items',
  next: [
    'Do not run returned add commands without explicit user confirmation if they mutate project files.'
  ]
})

registerRegistryProxyTool({
  name: 'shadcn_registry_get_audit_checklist',
  title: 'Shadcn Registry Get Audit Checklist',
  description:
    'Calls official shadcn MCP get_audit_checklist after shadcn-related work.',
  inputSchema: z.object({}),
  officialTool: 'get_audit_checklist',
  next: [
    'Run local lint/type/browser verification after applying shadcn changes.'
  ]
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error(
    'Utekos shadcn workbench MCP server running on stdio'
  )
}

main().catch(error => {
  console.error(
    error instanceof Error ? error.stack : String(error)
  )
  process.exit(1)
})
