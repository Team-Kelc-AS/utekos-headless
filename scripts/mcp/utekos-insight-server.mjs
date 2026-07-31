#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createHash, randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'

import {
  McpServer,
  StdioServerTransport
} from '@modelcontextprotocol/server'
import { z } from 'zod/v4'

const repoRoot = path.resolve(
  process.env.UTEKOS_REPO_ROOT ?? process.cwd()
)
const profile = 'utekos_chatgpt_insight'
const mode = 'read-verify'

const deniedPathPatterns = [
  '.env',
  '.env.local',
  '.env.mcp.local',
  '.env.tunnel.local',
  'mcp.json',
  '.vscode/mcp.json',
  '.cursor/mcp.json',
  '.git/',
  'node_modules/',
  'src/api/lib/cloud-credentials/',
  'supabase/md.md'
]

const defaultContextFiles = [
  'AGENTS.md',
  'PLAN.md',
  'DEPLOYMENT.md',
  '.codex/docs/main-documentation/agents.txt',
  '.codex/docs/main-documentation/README.md',
  '.codex/docs/main-documentation/llms.txt',
  '.codex/docs/main-documentation/sitemap.xml'
]

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
  denied_patterns: z.array(z.string())
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

function auditToolCall(toolName) {
  console.error(
    JSON.stringify({
      time: nowIso(),
      level: 'INFO',
      msg: 'utekos_insight_tool_call',
      profile,
      mode,
      tool: toolName
    })
  )
}

function permissions() {
  return {
    read_only: true,
    allowed_roots: [repoRoot],
    denied_patterns: deniedPathPatterns
  }
}

function makeError(
  code,
  message,
  suggestedFix,
  category = 'tool_execution'
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

function relativePath(filePath) {
  return path
    .relative(repoRoot, filePath)
    .replaceAll(path.sep, '/')
}

function resolveProjectPath(inputPath) {
  const cleaned = String(inputPath ?? '').trim()
  if (!cleaned) throw new Error('Path is empty')
  if (cleaned.includes('\0'))
    throw new Error('Path contains invalid null byte')

  const resolved = path.resolve(repoRoot, cleaned)
  const relative = relativePath(resolved)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Path escapes repo root: ${cleaned}`)
  }

  const normalized = `${relative}${fs.existsSync(resolved) && fs.statSync(resolved).isDirectory() ? '/' : ''}`
  const denied = deniedPathPatterns.find(pattern => {
    if (pattern.endsWith('/'))
      return (
        normalized === pattern || normalized.startsWith(pattern)
      )
    return (
      normalized === pattern ||
      normalized.startsWith(`${pattern}/`)
    )
  })

  if (denied)
    throw new Error(
      `Path is denied by Utekos MCP policy: ${denied}`
    )
  return { absolute: resolved, relative }
}

function hashText(value) {
  return createHash('sha256').update(value).digest('hex')
}

function readTextFile(relative, maxBytes) {
  const resolved = resolveProjectPath(relative)
  const stat = fs.statSync(resolved.absolute)
  if (!stat.isFile())
    throw new Error(`Not a file: ${resolved.relative}`)

  const buffer = fs.readFileSync(resolved.absolute)
  const truncated = buffer.byteLength > maxBytes
  const text = buffer.subarray(0, maxBytes).toString('utf8')

  return {
    path: resolved.relative,
    content: text,
    sha256: hashText(buffer),
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

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: options.timeout ?? 30000
  })
}

function outputLines(result) {
  return (result.stdout ?? '').split('\n').filter(Boolean)
}

function safeJsonRead(relative, fallback) {
  try {
    const file = readTextFile(relative, 250000)
    return JSON.parse(file.content)
  } catch {
    return fallback
  }
}

function countPatternInFile(relative, pattern) {
  try {
    const text = readTextFile(relative, 400000).content
    return [...text.matchAll(pattern)].length
  } catch {
    return 0
  }
}

const toolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: true
}

const bootstrapDataSchema = z.object({
  profile: z.string(),
  mode: z.string(),
  repo_root: z.string(),
  canonical_tools: z.array(z.string()),
  golden_path: z.array(z.string()),
  docker_dynamic_tools_expected: z.literal(false),
  chatgpt_instruction: z.string(),
  sensitive_paths_denied: z.array(z.string())
})

const contextFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  sha256: z.string(),
  size_bytes: z.number().int().nonnegative(),
  line_count: z.number().int().nonnegative(),
  truncated: z.boolean()
})

const contextBundleDataSchema = z.object({
  files: z.array(contextFileSchema),
  missing_files: z.array(z.string()),
  read_order: z.array(z.string())
})

const toolInventoryDataSchema = z.object({
  surface_authority: z.literal('canonical-stdio-mcp-command'),
  mcp_command: z.string(),
  docker_profile_tools_are_not_chatgpt_surface: z.boolean(),
  canonical_tools: z.array(
    z.object({
      name: z.string(),
      title: z.string(),
      purpose: z.string(),
      read_only: z.boolean(),
      destructive: z.boolean(),
      open_world: z.boolean(),
      has_output_schema: z.boolean()
    })
  ),
  docker_profile_tools: z.array(z.string()),
  forbidden_tool_names: z.array(z.string())
})

const connectorSurfaceAuditDataSchema = z.object({
  expected_surface: z.object({
    mcp_command: z.string(),
    mcp_surface: z.string(),
    canonical_tools: z.array(z.string()),
    expected_tool_count: z.number().int().nonnegative(),
    docker_dynamic_tools_expected: z.boolean()
  }),
  stale_surface_indicators: z.array(
    z.object({
      signal: z.string(),
      severity: z.enum(['info', 'warning', 'critical']),
      meaning: z.string(),
      remediation: z.string()
    })
  ),
  feedback_evidence: z.object({
    feedback_file: z.string(),
    output_schema_warning_count: z.number().int().nonnegative(),
    interpreted_as: z.string()
  }),
  metadata_policy: z.object({
    output_schema_required: z.boolean(),
    structured_content_required: z.boolean(),
    annotations_required: z.object({
      readOnlyHint: z.boolean(),
      destructiveHint: z.boolean(),
      openWorldHint: z.boolean(),
      idempotentHint: z.boolean()
    }),
    canonical_tools_compliant: z.boolean()
  }),
  chatgpt_acceptance_prompt: z.string(),
  remediation_steps: z.array(z.string())
})

const gitOverviewDataSchema = z.object({
  branch: z.string(),
  head: z.string(),
  dirty: z.boolean(),
  status_porcelain: z.array(z.string()),
  diff_stat: z.array(z.string()),
  staged_diff_stat: z.array(z.string()),
  recent_commits: z.array(z.string())
})

const locateMatchSchema = z.object({
  path: z.string(),
  line: z.number().int().positive(),
  text: z.string()
})

const projectLocateDataSchema = z.object({
  query: z.string(),
  matches: z.array(locateMatchSchema),
  searched_roots: z.array(z.string())
})

const readFilesDataSchema = z.object({
  files: z.array(contextFileSchema),
  denied_files: z.array(z.string()),
  missing_files: z.array(z.string())
})

const canonicalTools = [
  {
    name: 'insight_bootstrap',
    title: 'Insight Bootstrap',
    purpose:
      'Use this first to learn the Utekos operating contract, safe workflow, and next canonical tool calls.'
  },
  {
    name: 'read_context_bundle',
    title: 'Read Context Bundle',
    purpose:
      'Use this before architectural or implementation work to load the local operating contract and navigation roots.'
  },
  {
    name: 'tool_inventory',
    title: 'Tool Inventory',
    purpose:
      'Use this to see the canonical tool surface and the underlying Docker profile policy.'
  },
  {
    name: 'connector_surface_audit',
    title: 'Connector Surface Audit',
    purpose:
      'Use this when ChatGPT sees Docker catalog tools, missing OutputSchema warnings, mcp-* admin tools, or any stale connector/tool mismatch.'
  },
  {
    name: 'safe_git_overview',
    title: 'Safe Git Overview',
    purpose:
      'Use this to inspect the local branch, dirty state, recent commits, and diff stats without mutating Git.'
  },
  {
    name: 'project_locate',
    title: 'Project Locate',
    purpose:
      'Use this to find relevant local files or lines before requesting file contents.'
  },
  {
    name: 'read_project_files',
    title: 'Read Project Files',
    purpose:
      'Use this to read explicit local project files after locating them. Secret and credential paths are denied.'
  }
]

const server = new McpServer({
  name: 'utekos-insight-fabric',
  version: '2.0.0'
})

server.registerTool(
  'insight_bootstrap',
  {
    title: 'Insight Bootstrap',
    description:
      'Use this first in Utekos ChatGPT Insight sessions. Returns the read-only operating mode, golden path, and canonical tool names.',
    inputSchema: z.object({}),
    outputSchema: envelopeSchema(
      'insight_bootstrap',
      bootstrapDataSchema
    ),
    annotations: toolAnnotations
  },
  async () => {
    const startedAt = nowIso()
    auditToolCall('insight_bootstrap')
    const data = {
      profile,
      mode,
      repo_root: repoRoot,
      canonical_tools: canonicalTools.map(tool => tool.name),
      golden_path: [
        'insight_bootstrap',
        'read_context_bundle',
        'connector_surface_audit',
        'safe_git_overview',
        'project_locate',
        'read_project_files',
        'external docs/runtime/browser verification when relevant'
      ],
      docker_dynamic_tools_expected: false,
      chatgpt_instruction:
        'Do not call mcp-find, mcp-add, mcp-activate-profile, or mcp-exec in this profile. Use the canonical Utekos tools exposed by this server.',
      sensitive_paths_denied: deniedPathPatterns
    }
    return textResult(
      createEnvelope('insight_bootstrap', startedAt, data, {
        next: [
          'Call read_context_bundle before architectural or implementation conclusions.',
          'Call safe_git_overview before commenting on current local repo state.'
        ]
      })
    )
  }
)

server.registerTool(
  'read_context_bundle',
  {
    title: 'Read Context Bundle',
    description:
      'Use this to load Utekos operating contract files and agent navigation roots from the local repo.',
    inputSchema: z.object({
      files: z
        .array(z.string())
        .optional()
        .describe(
          'Optional relative file list. Defaults to the canonical context bundle.'
        ),
      max_bytes_per_file: z
        .number()
        .int()
        .min(1000)
        .max(120000)
        .optional()
        .describe(
          'Maximum bytes returned per file. Defaults to 40000.'
        )
    }),
    outputSchema: envelopeSchema(
      'read_context_bundle',
      contextBundleDataSchema
    ),
    annotations: toolAnnotations
  },
  async ({ files, max_bytes_per_file: maxBytesPerFile }) => {
    const startedAt = nowIso()
    auditToolCall('read_context_bundle')
    const requestedFiles =
      files?.length ? files : defaultContextFiles
    const maxBytes = maxBytesPerFile ?? 40000
    const readFiles = []
    const missingFiles = []
    const warnings = []

    for (const relative of requestedFiles) {
      const absolute = path.join(repoRoot, relative)
      if (!fs.existsSync(absolute)) {
        missingFiles.push(relative)
        continue
      }

      try {
        const file = readTextFile(relative, maxBytes)
        readFiles.push(file)
        if (file.truncated)
          warnings.push(
            `${file.path} truncated at ${maxBytes} bytes`
          )
      } catch (error) {
        warnings.push(
          `${relative}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    const data = {
      files: readFiles,
      missing_files: missingFiles,
      read_order: requestedFiles
    }

    return textResult(
      createEnvelope('read_context_bundle', startedAt, data, {
        sources: readFiles.map(fileSource),
        warnings,
        limits: { max_bytes_per_file: maxBytes },
        next: [
          'Use project_locate for task-specific files.',
          'Use read_project_files for exact source files needed before implementation.'
        ]
      })
    )
  }
)

server.registerTool(
  'tool_inventory',
  {
    title: 'Tool Inventory',
    description:
      'Use this to inspect canonical Utekos Insight tools and underlying Docker policy without activating or mutating profiles.',
    inputSchema: z.object({}),
    outputSchema: envelopeSchema(
      'tool_inventory',
      toolInventoryDataSchema
    ),
    annotations: toolAnnotations
  },
  async () => {
    const startedAt = nowIso()
    auditToolCall('tool_inventory')
    const config = safeJsonRead(
      'config/mcp/chatgpt-profiles.json',
      { profiles: [] }
    )
    const insightProfile =
      (config.profiles ?? []).find(
        item => item.id === profile
      ) ?? {}
    const data = {
      surface_authority: 'canonical-stdio-mcp-command',
      mcp_command:
        insightProfile.mcpCommand ??
        'node ${repoRoot}/scripts/mcp/utekos-insight-server.mjs',
      docker_profile_tools_are_not_chatgpt_surface: true,
      canonical_tools: canonicalTools.map(tool => ({
        name: tool.name,
        title: tool.title,
        purpose: tool.purpose,
        read_only: true,
        destructive: false,
        open_world: false,
        has_output_schema: true
      })),
      docker_profile_tools: insightProfile.toolAllowlist ?? [],
      forbidden_tool_names: insightProfile.forbiddenTools ?? []
    }

    return textResult(
      createEnvelope('tool_inventory', startedAt, data, {
        sources: [{ path: 'config/mcp/chatgpt-profiles.json' }],
        next: [
          'Call insight_bootstrap next to load the workflow.',
          'Call connector_surface_audit next to prove the connector surface.',
          'Use read_context_bundle for source-of-truth docs before implementation work.'
        ]
      })
    )
  }
)

server.registerTool(
  'connector_surface_audit',
  {
    title: 'Connector Surface Audit',
    description:
      'Use this when ChatGPT sees Docker catalog tools, missing OutputSchema warnings, mcp-* admin tools, or any stale connector/tool mismatch. It reports the expected canonical Insight surface and exact remediation steps.',
    inputSchema: z.object({}),
    outputSchema: envelopeSchema(
      'connector_surface_audit',
      connectorSurfaceAuditDataSchema
    ),
    annotations: toolAnnotations
  },
  async () => {
    const startedAt = nowIso()
    auditToolCall('connector_surface_audit')
    const config = safeJsonRead(
      'config/mcp/chatgpt-profiles.json',
      { profiles: [] }
    )
    const insightProfile =
      (config.profiles ?? []).find(
        item => item.id === profile
      ) ?? {}
    const canonicalToolNames = canonicalTools.map(
      tool => tool.name
    )
    const outputSchemaWarnings = countPatternInFile(
      'docs/feedback.md',
      /OutputSchema anbefales/g
    )
    const data = {
      expected_surface: {
        mcp_command:
          insightProfile.mcpCommand ??
          'node ${repoRoot}/scripts/mcp/utekos-insight-server.mjs',
        mcp_surface:
          insightProfile.mcpSurface ??
          'utekos-canonical-read-verify',
        canonical_tools: canonicalToolNames,
        expected_tool_count: canonicalToolNames.length,
        docker_dynamic_tools_expected: false
      },
      stale_surface_indicators: [
        {
          signal:
            'ChatGPT lists ast-grep, browser_navigate, directory_tree, fetch, git_status, read_file, read_multiple_files, or nextjs_runtime in the default Insight app.',
          severity: 'critical',
          meaning:
            'The connector is using the older Docker catalog gateway surface instead of the canonical Utekos Insight stdio server.',
          remediation:
            'Stop the current tunnel, run npm run mcp:tunnel:run:insight, then recreate or reconnect the ChatGPT app while the tunnel is running.'
        },
        {
          signal:
            'ChatGPT attempts mcp-find, mcp-add, mcp-activate-profile, or mcp-exec.',
          severity: 'critical',
          meaning:
            'The session has stale Docker MCP dynamic/admin tool metadata. These tools are forbidden in the default Insight app.',
          remediation:
            'Do not call those tools. Refresh/recreate the ChatGPT connector so discovery runs against utekos-insight-server.mjs.'
        },
        {
          signal:
            'ChatGPT Settings shows "OutputSchema anbefales" for default Insight tools.',
          severity: 'warning',
          meaning:
            'The visible tool surface is not the canonical Utekos Insight tool surface, because all canonical Insight tools have outputSchema.',
          remediation:
            'Use connector_surface_audit and tool_inventory as proof, then reconnect the app against the canonical tunnel profile.'
        },
        {
          signal:
            'ChatGPT only sees list_resources or no callable Utekos tools.',
          severity: 'warning',
          meaning:
            'The tunnel may be running, but connector discovery did not bind to the intended MCP server in this chat.',
          remediation:
            'Keep tunnel-client running during app creation and first tool call; verify with npm run mcp:tunnel:doctor:insight and npm run mcp:insight:doctor.'
        }
      ],
      feedback_evidence: {
        feedback_file: 'docs/feedback.md',
        output_schema_warning_count: outputSchemaWarnings,
        interpreted_as:
          'Historical evidence of the old Docker catalog tool surface, not the current canonical Utekos Insight surface.'
      },
      metadata_policy: {
        output_schema_required: true,
        structured_content_required: true,
        annotations_required: {
          readOnlyHint: true,
          destructiveHint: true,
          openWorldHint: true,
          idempotentHint: true
        },
        canonical_tools_compliant: true
      },
      chatgpt_acceptance_prompt:
        'Call insight_bootstrap, connector_surface_audit, read_context_bundle, and safe_git_overview. If you see mcp-* admin tools or Docker catalog tools in default Insight, report stale connector metadata and stop.',
      remediation_steps: [
        'Run npm run mcp:insight:doctor and verify 7 canonical tools with outputSchema.',
        'Run npm run mcp:tunnel:doctor:insight and verify the target is node scripts/mcp/utekos-insight-server.mjs.',
        'Start the app with npm run mcp:tunnel:run:insight.',
        'Create or reconnect the ChatGPT app while the tunnel is running.',
        'In ChatGPT, first call insight_bootstrap, then connector_surface_audit.',
        'Do not ask ChatGPT to activate profiles; the tunnel profile already selects the MCP server.'
      ]
    }

    return textResult(
      createEnvelope(
        'connector_surface_audit',
        startedAt,
        data,
        {
          sources: [
            { path: 'config/mcp/chatgpt-profiles.json' },
            { path: 'docs/feedback.md' },
            { path: 'scripts/mcp/utekos-insight-server.mjs' }
          ],
          warnings:
            outputSchemaWarnings > 0 ?
              [
                `docs/feedback.md contains ${outputSchemaWarnings} historical OutputSchema warning(s) from a non-canonical surface.`
              ]
            : [],
          next: [
            'Use this result to distinguish canonical Utekos tools from stale Docker catalog connector metadata.'
          ]
        }
      )
    )
  }
)

server.registerTool(
  'safe_git_overview',
  {
    title: 'Safe Git Overview',
    description:
      'Use this to inspect branch, dirty state, diff stats, and recent commits. This tool never mutates Git state.',
    inputSchema: z.object({}),
    outputSchema: envelopeSchema(
      'safe_git_overview',
      gitOverviewDataSchema
    ),
    annotations: toolAnnotations
  },
  async () => {
    const startedAt = nowIso()
    auditToolCall('safe_git_overview')
    const branch = run('git', [
      'rev-parse',
      '--abbrev-ref',
      'HEAD'
    ])
    const head = run('git', ['rev-parse', 'HEAD'])
    const status = run('git', ['status', '--porcelain=v1', '-b'])
    const diffStat = run('git', ['diff', '--stat'])
    const stagedDiffStat = run('git', [
      'diff',
      '--cached',
      '--stat'
    ])
    const recentCommits = run('git', [
      'log',
      '-n',
      '5',
      '--pretty=%h %s'
    ])
    const statusLines = outputLines(status)

    const data = {
      branch: outputLines(branch)[0] ?? 'unknown',
      head: outputLines(head)[0] ?? 'unknown',
      dirty: statusLines.some(line => !line.startsWith('##')),
      status_porcelain: statusLines,
      diff_stat: outputLines(diffStat),
      staged_diff_stat: outputLines(stagedDiffStat),
      recent_commits: outputLines(recentCommits)
    }

    return textResult(
      createEnvelope('safe_git_overview', startedAt, data, {
        sources: [{ path: '.git' }],
        next: [
          'Use read_project_files for changed files before editing or reviewing.',
          'Do not assume GitHub/deployment state from local Git alone.'
        ]
      })
    )
  }
)

server.registerTool(
  'project_locate',
  {
    title: 'Project Locate',
    description:
      'Use this to locate local project files or lines relevant to a topic before reading exact files.',
    inputSchema: z.object({
      query: z
        .string()
        .min(2)
        .max(200)
        .describe(
          'Literal search text or narrow technical phrase.'
        ),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Maximum matches. Defaults to 30.')
    }),
    outputSchema: envelopeSchema(
      'project_locate',
      projectLocateDataSchema
    ),
    annotations: toolAnnotations
  },
  async ({ query, limit }) => {
    const startedAt = nowIso()
    auditToolCall('project_locate')
    const maxMatches = limit ?? 30
    const result = run(
      'rg',
      [
        '--line-number',
        '--fixed-strings',
        '--hidden',
        '--glob',
        '!node_modules/**',
        '--glob',
        '!.git/**',
        '--glob',
        '!.next/**',
        '--glob',
        '!mcp.json',
        '--glob',
        '!.env*',
        '--glob',
        '!.vscode/mcp.json',
        '--glob',
        '!.cursor/mcp.json',
        '--glob',
        '!src/api/lib/cloud-credentials/**',
        '--glob',
        '!supabase/md.md',
        query,
        repoRoot
      ],
      { timeout: 30000 }
    )

    const matches = []
    for (const line of outputLines(result)) {
      if (matches.length >= maxMatches) break
      const match = line.match(/^(.*?):(\d+):(.*)$/)
      if (!match) continue
      const absolute = path.resolve(match[1])
      const relative = relativePath(absolute)
      if (relative.startsWith('..')) continue
      matches.push({
        path: relative,
        line: Number(match[2]),
        text: match[3].slice(0, 500)
      })
    }

    const data = { query, matches, searched_roots: [repoRoot] }

    return textResult(
      createEnvelope('project_locate', startedAt, data, {
        warnings:
          result.status === 1 ? ['No matches found.']
          : result.status && result.status !== 0 ?
            [result.stderr.trim()].filter(Boolean)
          : [],
        limits: { limit: maxMatches },
        next:
          matches.length > 0 ?
            [
              'Use read_project_files on exact paths before drawing conclusions.'
            ]
          : [
              'Try a narrower literal term from the task or context bundle.'
            ]
      })
    )
  }
)

server.registerTool(
  'read_project_files',
  {
    title: 'Read Project Files',
    description:
      'Use this to read explicit local project files after locating them. Secret and credential paths are always denied.',
    inputSchema: z.object({
      paths: z
        .array(z.string())
        .min(1)
        .max(20)
        .describe('Relative project file paths to read.'),
      max_bytes_per_file: z
        .number()
        .int()
        .min(1000)
        .max(160000)
        .optional()
        .describe(
          'Maximum bytes returned per file. Defaults to 60000.'
        )
    }),
    outputSchema: envelopeSchema(
      'read_project_files',
      readFilesDataSchema
    ),
    annotations: toolAnnotations
  },
  async ({ paths, max_bytes_per_file: maxBytesPerFile }) => {
    const startedAt = nowIso()
    auditToolCall('read_project_files')
    const maxBytes = maxBytesPerFile ?? 60000
    const readFiles = []
    const deniedFiles = []
    const missingFiles = []
    const warnings = []

    for (const relative of paths) {
      try {
        const resolved = resolveProjectPath(relative)
        if (!fs.existsSync(resolved.absolute)) {
          missingFiles.push(resolved.relative)
          continue
        }
        const file = readTextFile(resolved.relative, maxBytes)
        readFiles.push(file)
        if (file.truncated)
          warnings.push(
            `${file.path} truncated at ${maxBytes} bytes`
          )
      } catch (error) {
        deniedFiles.push(relative)
        warnings.push(
          `${relative}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    const data = {
      files: readFiles,
      denied_files: deniedFiles,
      missing_files: missingFiles
    }

    return textResult(
      createEnvelope('read_project_files', startedAt, data, {
        ok: deniedFiles.length === 0,
        sources: readFiles.map(fileSource),
        warnings,
        errors:
          deniedFiles.length === 0 ?
            []
          : [
              makeError(
                'UTEKOS_DENIED_PATH',
                'One or more requested paths were denied by policy.',
                'Request non-secret project files only.',
                'access_control'
              )
            ],
        limits: { max_bytes_per_file: maxBytes },
        next: [
          'Use official/current docs or runtime verification before implementing behavior-sensitive changes.'
        ]
      })
    )
  }
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error(
    'Utekos Insight Fabric MCP server running on stdio'
  )
}

main().catch(error => {
  console.error(
    error instanceof Error ? error.stack : String(error)
  )
  process.exit(1)
})
