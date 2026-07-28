import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  analyzeBoundary,
  createPdpProject,
  type BoundaryReport
} from './analyzePdpBoundary'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDir, '../..')
const tsConfigFilePath = path.join(root, 'tsconfig.json')
const snapshotPath = path.join(scriptDir, 'baseline.json')

const ENTRY = 'src/app/produkter/[handle]/page.tsx'

type Snapshot = {
  commit: string
  capturedAt: string
  entry: string
  clientModuleCount: number
  clientBytes: number
  boundaryModules: string[]
  clientThirdPartyPackages: string[]
  gateViolations: BoundaryReport['gateViolations']
}

function readHeadCommit(): string {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      encoding: 'utf8'
    }).trim()
  } catch {
    return 'unknown'
  }
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} kB`
}

function printReport(report: BoundaryReport): void {
  console.log(`\nPDP boundary report for ${report.entry}`)
  console.log(`  server modules:      ${report.serverModuleCount}`)
  console.log(`  client modules:      ${report.clientModuleCount}`)
  console.log(
    `  client source bytes: ${formatBytes(report.clientBytes)}`
  )
  console.log(
    `  client packages:     ${report.clientThirdPartyPackages.join(', ') || 'none'}`
  )

  console.log('\n  server -> client boundary entry points:')
  for (const boundary of report.boundaryModules) {
    console.log(`    ${boundary}`)
  }

  console.log('\n  largest client modules:')
  for (const entry of report.clientModules.slice(0, 10)) {
    console.log(
      `    ${formatBytes(entry.bytes).padStart(9)}  ${entry.file}`
    )
  }

  if (report.gateViolations.length === 0) {
    console.log('\n  hard gates: all clear')
    return
  }

  console.log(
    `\n  hard-gate violations (${report.gateViolations.length}):`
  )
  for (const violation of report.gateViolations) {
    console.log(
      `    [${violation.gate}] ${violation.file}:${violation.line} — ${violation.detail}`
    )
  }
}

function readSnapshot(): Snapshot | null {
  if (!fs.existsSync(snapshotPath)) return null
  return JSON.parse(
    fs.readFileSync(snapshotPath, 'utf8')
  ) as Snapshot
}

function checkAgainstSnapshot(report: BoundaryReport): number {
  const snapshot = readSnapshot()
  if (!snapshot) {
    console.error(
      `\nNo baseline snapshot at ${path.relative(root, snapshotPath)}. Run with --write first.`
    )
    return 1
  }

  const failures: string[] = []

  if (report.clientBytes > snapshot.clientBytes) {
    failures.push(
      `client source bytes grew from ${formatBytes(snapshot.clientBytes)} to ${formatBytes(report.clientBytes)}`
    )
  }
  if (report.clientModuleCount > snapshot.clientModuleCount) {
    failures.push(
      `client module count grew from ${snapshot.clientModuleCount} to ${report.clientModuleCount}`
    )
  }

  const baselineGates = new Set(
    snapshot.gateViolations.map(
      violation => `${violation.gate}::${violation.file}`
    )
  )
  const newGates = report.gateViolations.filter(
    violation =>
      !baselineGates.has(`${violation.gate}::${violation.file}`)
  )
  for (const violation of newGates) {
    failures.push(
      `new hard-gate violation [${violation.gate}] at ${violation.file}:${violation.line}`
    )
  }

  const baselineBoundaries = new Set(snapshot.boundaryModules)
  const newBoundaries = report.boundaryModules.filter(
    boundary => !baselineBoundaries.has(boundary)
  )
  for (const boundary of newBoundaries) {
    failures.push(
      `new server -> client boundary entry point: ${boundary}`
    )
  }

  console.log(
    `\nBaseline: ${snapshot.commit} (${snapshot.capturedAt})`
  )
  console.log(
    `  client bytes ${formatBytes(snapshot.clientBytes)} -> ${formatBytes(report.clientBytes)}`
  )
  console.log(
    `  client modules ${snapshot.clientModuleCount} -> ${report.clientModuleCount}`
  )
  console.log(
    `  hard-gate violations ${snapshot.gateViolations.length} -> ${report.gateViolations.length}`
  )

  if (failures.length > 0) {
    console.error('\nPDP guardrail failed:')
    for (const failure of failures) {
      console.error(`  - ${failure}`)
    }
    return 1
  }

  console.log('\nPDP guardrail passed.')
  return 0
}

function writeSnapshot(report: BoundaryReport, commit: string) {
  const snapshot: Snapshot = {
    commit,
    capturedAt: new Date().toISOString(),
    entry: report.entry,
    clientModuleCount: report.clientModuleCount,
    clientBytes: report.clientBytes,
    boundaryModules: report.boundaryModules,
    clientThirdPartyPackages: report.clientThirdPartyPackages,
    gateViolations: report.gateViolations
  }

  fs.writeFileSync(
    snapshotPath,
    `${JSON.stringify(snapshot, null, 2)}\n`,
    'utf8'
  )
  console.log(
    `\nWrote baseline snapshot to ${path.relative(root, snapshotPath)}`
  )
}

function main(): number {
  const args = process.argv.slice(2)
  const project = createPdpProject(tsConfigFilePath)
  const report = analyzeBoundary(project, ENTRY, root)

  printReport(report)

  if (args.includes('--json')) {
    console.log(`\n${JSON.stringify(report, null, 2)}`)
  }

  if (args.includes('--write')) {
    const commitArgument = args.find(argument =>
      argument.startsWith('--commit=')
    )
    writeSnapshot(
      report,
      commitArgument?.slice('--commit='.length) ?? readHeadCommit()
    )
    return 0
  }

  if (args.includes('--check')) {
    return checkAgainstSnapshot(report)
  }

  return 0
}

process.exit(main())
