#!/usr/bin/env node

/**
 * Stdio proxy around upstream `gtm-mcp`.
 *
 * Upstream gtm-mcp@1.0.0 advertises several `type: "array"` tool params
 * without JSON Schema `items`. VS Code Copilot rejects those tools with:
 *   "tool parameters array type must have items"
 *
 * This proxy fixes ListTools (and notification) schemas in flight.
 */

import { spawn } from 'node:child_process'
import process from 'node:process'
import readline from 'node:readline'

const DEFAULT_ARRAY_ITEMS = {
  type: 'object',
  additionalProperties: true
}

function fixSchemaNode(node) {
  if (!node || typeof node !== 'object') return node

  if (Array.isArray(node)) {
    return node.map(fixSchemaNode)
  }

  const out = { ...node }

  if (out.type === 'array' && out.items === undefined) {
    out.items = { ...DEFAULT_ARRAY_ITEMS }
  }

  if (out.properties && typeof out.properties === 'object') {
    out.properties = Object.fromEntries(
      Object.entries(out.properties).map(([key, value]) => [
        key,
        fixSchemaNode(value)
      ])
    )
  }

  if (out.items !== undefined) {
    out.items = fixSchemaNode(out.items)
  }

  for (const key of ['anyOf', 'oneOf', 'allOf']) {
    if (Array.isArray(out[key])) {
      out[key] = out[key].map(fixSchemaNode)
    }
  }

  return out
}

function fixToolsPayload(tools) {
  if (!Array.isArray(tools)) return tools

  return tools.map(tool => {
    if (!tool || typeof tool !== 'object') return tool
    if (!tool.inputSchema) return tool

    return {
      ...tool,
      inputSchema: fixSchemaNode(tool.inputSchema)
    }
  })
}

function fixOutboundMessage(message) {
  if (!message || typeof message !== 'object') return message

  if (message.result?.tools) {
    return {
      ...message,
      result: {
        ...message.result,
        tools: fixToolsPayload(message.result.tools)
      }
    }
  }

  if (
    message.method === 'notifications/tools/list_changed' &&
    message.params?.tools
  ) {
    return {
      ...message,
      params: {
        ...message.params,
        tools: fixToolsPayload(message.params.tools)
      }
    }
  }

  return message
}

const child = spawn('gtm-mcp', [], {
  env: process.env,
  stdio: ['pipe', 'pipe', 'inherit']
})

child.on('error', error => {
  console.error(
    `[gtm-mcp-schema-fix] failed to start gtm-mcp: ${error.message}`
  )
  process.exit(1)
})

process.stdin.pipe(child.stdin)

const rl = readline.createInterface({
  input: child.stdout,
  crlfDelay: Infinity
})

rl.on('line', line => {
  if (!line.trim()) return

  try {
    const message = JSON.parse(line)
    const fixed = fixOutboundMessage(message)
    process.stdout.write(`${JSON.stringify(fixed)}\n`)
  } catch {
    process.stdout.write(`${line}\n`)
  }
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    if (!child.killed) child.kill(signal)
  })
}
