#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const args = process.argv.slice(2)
const logPath = path.join(
  root,
  '.agent-artifacts/tunnel/utekos-chatgpt-insight.log'
)
const statusDir = path.join(root, '.agent-artifacts/chatgpt')
const statusJsonPath = path.join(
  statusDir,
  'insight-acceptance.json'
)
const statusMdPath = path.join(
  statusDir,
  'insight-acceptance.md'
)
const chatgptProfilesPath = path.join(
  root,
  'config/mcp/chatgpt-profiles.json'
)
const canonicalCommand = `node ${path.join(root, 'scripts/mcp/utekos-insight-server.mjs')}`
const canonicalToolNames = [
  'insight_bootstrap',
  'read_context_bundle',
  'tool_inventory',
  'connector_surface_audit',
  'safe_git_overview',
  'project_locate',
  'read_project_files'
]
const requiredObservedTools = [
  'insight_bootstrap',
  'connector_surface_audit'
]
const acceptancePrompt =
  'Use the Utekos Local Insight app. Call insight_bootstrap first, then connector_surface_audit. Return each structuredContent.profile, structuredContent.mode, and the exact tool names you used. Do not call mcp-* tools.'
const forbiddenSignals = [
  'unknown tool "mcp-find"',
  'unknown tool "mcp-activate-profile"',
  'unknown tool "mcp-add"',
  'unknown tool "mcp-exec"',
  'mcp-find',
  'mcp-activate-profile',
  'mcp-add',
  'mcp-exec'
]

function hasFlag(name) {
  return args.includes(name)
}

function numberFlag(name, fallback) {
  const index = args.indexOf(name)
  if (index === -1) return fallback
  const value = Number(args[index + 1])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function run(command, commandArgs) {
  return spawnSync(command, commandArgs, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })
}

function sleep(ms) {
  spawnSync('sleep', [String(ms / 1000)], { stdio: 'ignore' })
}

function print(status, name, message) {
  console.log(
    `${status.padEnd(7)} ${name.padEnd(34)} ${message}`
  )
}

function latestRunLog() {
  if (!fs.existsSync(logPath)) return ''
  const log = fs.readFileSync(logPath, 'utf8')
  const marker = '"msg":"tunnel-client startup summary"'
  const index = log.lastIndexOf(marker)
  if (index === -1) return log
  return log.slice(index)
}

function observedTools(log) {
  const found = new Set()
  for (const line of log.split('\n')) {
    if (!line.includes('"msg":"utekos_insight_tool_call"'))
      continue
    try {
      const event = JSON.parse(line)
      if (typeof event.tool === 'string') found.add(event.tool)
    } catch {
      // Ignore non-JSON tunnel-client lines.
    }
  }
  return [...found].sort()
}

function loadInsightProfile() {
  const config = JSON.parse(
    fs.readFileSync(chatgptProfilesPath, 'utf8')
  )
  return config.profiles?.find(
    profile => profile?.tunnelTarget === 'insight'
  )
}

function writeStatus(checks, result) {
  fs.mkdirSync(statusDir, { recursive: true })
  const callCheck = checks.find(
    check => check.name === 'chatgpt_canonical_tool_calls'
  )
  const surfaceCheck = checks.find(
    check => check.name === 'chatgpt_canonical_surface_seen'
  )
  const observed = callCheck?.observed_tools ?? []
  const missing = callCheck?.missing_tools ?? []
  const report = {
    generated_at: new Date().toISOString(),
    result,
    accepted: result === 'accepted',
    canonical_surface_proven: surfaceCheck?.ok === true,
    tunnel_log: logPath,
    canonical_mcp_command: canonicalCommand,
    canonical_tool_names: canonicalToolNames,
    required_observed_tools: requiredObservedTools,
    observed_tools: observed,
    missing_tools: missing,
    chatgpt_prompt: acceptancePrompt,
    checks: checks.map(check => ({
      name: check.name,
      ok: check.ok,
      pending: check.pending,
      message: check.message
    }))
  }

  fs.writeFileSync(
    statusJsonPath,
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  )
  fs.writeFileSync(
    statusMdPath,
    [
      '# ChatGPT Insight Acceptance',
      '',
      `- Generated: ${report.generated_at}`,
      `- Result: ${report.result}`,
      `- Accepted: ${report.accepted}`,
      `- Canonical surface proven: ${report.canonical_surface_proven}`,
      `- Tunnel log: ${report.tunnel_log}`,
      `- Canonical MCP command: ${report.canonical_mcp_command}`,
      `- Required observed tools: ${report.required_observed_tools.join(', ')}`,
      `- Observed tools: ${report.observed_tools.join(', ') || '-'}`,
      `- Missing tools: ${report.missing_tools.join(', ') || '-'}`,
      '',
      '## ChatGPT Prompt',
      '',
      '```text',
      report.chatgpt_prompt,
      '```',
      '',
      '## Checks',
      '',
      ...report.checks.map(
        check =>
          `- ${
            check.ok ? 'PASS'
            : check.pending ? 'PENDING'
            : 'FAIL'
          } ${check.name}: ${check.message}`
      ),
      ''
    ].join('\n'),
    'utf8'
  )
}

function buildChecks({ includeDoctors }) {
  const checks = []
  const status = run('npm', ['run', 'mcp:tunnel:status:insight'])

  checks.push({
    name: 'tunnel_status',
    ok: status.status === 0,
    pending: false,
    message: status.status === 0 ? 'healthy' : 'not healthy'
  })

  const statusOutput = `${status.stdout}\n${status.stderr}`
  checks.push({
    name: 'canonical_mcp_command',
    ok: statusOutput.includes(`mcp_command=${canonicalCommand}`),
    pending: false,
    message:
      statusOutput.includes(`mcp_command=${canonicalCommand}`) ?
        canonicalCommand
      : 'unexpected or missing MCP command'
  })

  if (includeDoctors) {
    const doctor = run('npm', ['run', 'mcp:insight:doctor'])
    checks.push({
      name: 'insight_doctor',
      ok: doctor.status === 0,
      pending: false,
      message:
        doctor.status === 0 ?
          '7 canonical tools pass local doctor'
        : 'local doctor failed'
    })

    let insightProfile
    try {
      insightProfile = loadInsightProfile()
    } catch {
      insightProfile = null
    }

    const configuredCommand =
      insightProfile?.mcpCommand?.replace('${repoRoot}', root)
    checks.push({
      name: 'chatgpt_insight_profile',
      ok:
        insightProfile?.id === 'utekos_chatgpt_insight' &&
        insightProfile?.mode === 'read-verify' &&
        insightProfile?.tunnelProfile ===
          'utekos-chatgpt-insight' &&
        configuredCommand === canonicalCommand,
      pending: false,
      message:
        configuredCommand === canonicalCommand ?
          'Insight profile targets canonical read/verify server'
        : 'Insight profile missing or targets non-canonical command'
    })
  }

  const log = latestRunLog()
  checks.push({
    name: 'tunnel_log',
    ok: log.length > 0,
    pending: false,
    message:
      fs.existsSync(logPath) ? logPath : 'missing log file'
  })

  checks.push({
    name: 'log_target_canonical',
    ok:
      log.includes(`"mcp_target_value":"${canonicalCommand}"`) ||
      log.includes(`"command":"${canonicalCommand}"`),
    pending: false,
    message:
      'latest tunnel run targets Utekos Insight stdio server'
  })

  const forbiddenObserved = forbiddenSignals.filter(signal =>
    log.includes(signal)
  )
  checks.push({
    name: 'forbidden_stale_tools',
    ok: forbiddenObserved.length === 0,
    pending: false,
    message:
      forbiddenObserved.length === 0 ?
        'none observed in latest tunnel run'
      : forbiddenObserved.join(', ')
  })

  const tools = observedTools(log)
  const canonicalObserved = tools.filter(tool =>
    canonicalToolNames.includes(tool)
  )
  const nonCanonicalObserved = tools.filter(
    tool => !canonicalToolNames.includes(tool)
  )
  checks.push({
    name: 'chatgpt_canonical_surface_seen',
    ok:
      canonicalObserved.length > 0 &&
      nonCanonicalObserved.length === 0,
    pending: canonicalObserved.length === 0,
    observed_tools: canonicalObserved,
    message:
      canonicalObserved.length === 0 ?
        'pending; no canonical Insight tool calls observed yet'
      : nonCanonicalObserved.length === 0 ?
        `canonical Insight surface proven by observed tools: ${canonicalObserved.join(', ')}`
      : `unexpected non-canonical tool calls observed: ${nonCanonicalObserved.join(', ')}`
  })

  const missingTools = requiredObservedTools.filter(
    tool => !tools.includes(tool)
  )
  checks.push({
    name: 'chatgpt_canonical_tool_calls',
    ok: missingTools.length === 0,
    pending: missingTools.length > 0,
    observed_tools: tools,
    missing_tools: missingTools,
    message:
      missingTools.length === 0 ?
        `observed: ${requiredObservedTools.join(', ')}`
      : `pending; missing observed calls: ${missingTools.join(', ')}; observed: ${tools.join(', ') || '-'}`
  })

  return checks
}

function printChecks(checks) {
  for (const check of checks) {
    print(
      check.ok ? 'PASS'
      : check.pending ? 'PENDING'
      : 'FAIL',
      check.name,
      check.message
    )
  }
}

function outcome(checks) {
  const failed = checks.filter(
    check => !check.ok && !check.pending
  )
  const pending = checks.filter(check => check.pending)
  if (failed.length > 0) return 'fail'
  if (pending.length > 0) return 'pending'
  return 'accepted'
}

function printNext() {
  console.error(
    'NEXT In ChatGPT, use the Utekos Local Insight app and ask:'
  )
  console.error(acceptancePrompt)
  console.error(`STATUS ${statusJsonPath}`)
}

function finish(checks) {
  printChecks(checks)
  const result = outcome(checks)
  writeStatus(checks, result)

  if (result === 'fail') {
    console.error('RESULT fail')
    process.exit(1)
  }

  if (result === 'pending') {
    console.error('RESULT ready_pending_chatgpt_call')
    printNext()
    process.exit(2)
  }

  console.log('RESULT accepted')
  process.exit(0)
}

function main() {
  if (!hasFlag('--watch')) {
    finish(buildChecks({ includeDoctors: true }))
  }

  const timeoutMs = numberFlag('--timeout-ms', 300000)
  const intervalMs = numberFlag('--interval-ms', 3000)
  const deadline = Date.now() + timeoutMs

  const initialChecks = buildChecks({ includeDoctors: true })
  printChecks(initialChecks)
  const initialOutcome = outcome(initialChecks)
  writeStatus(initialChecks, initialOutcome)
  if (initialOutcome === 'fail') {
    console.error('RESULT fail')
    process.exit(1)
  }

  if (initialOutcome === 'accepted') {
    console.log('RESULT accepted')
    process.exit(0)
  }

  console.error(
    `WATCH waiting for ChatGPT canonical tool calls for ${timeoutMs}ms`
  )
  printNext()

  while (Date.now() < deadline) {
    sleep(intervalMs)
    const quickChecks = buildChecks({ includeDoctors: false })
    const quickOutcome = outcome(quickChecks)
    writeStatus(quickChecks, quickOutcome)

    if (quickOutcome === 'fail') {
      printChecks(quickChecks)
      console.error('RESULT fail')
      process.exit(1)
    }

    if (quickOutcome === 'accepted') {
      finish(buildChecks({ includeDoctors: true }))
    }

    const callCheck = quickChecks.find(
      check => check.name === 'chatgpt_canonical_tool_calls'
    )
    console.error(
      `WATCH ${new Date().toISOString()} ${callCheck?.message ?? 'pending'}`
    )
  }

  finish(buildChecks({ includeDoctors: true }))
}

main()
