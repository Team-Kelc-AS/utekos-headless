import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import test from 'node:test'

const repositoryRoot = new URL('../../', import.meta.url)

async function readRepositoryFile(path) {
  return readFile(new URL(path, repositoryRoot), 'utf8')
}

async function collectRuntimeFiles(path) {
  const entries = await readdir(
    new URL(`${path}/`, repositoryRoot),
    { withFileTypes: true }
  )
  const files = []

  for (const entry of entries) {
    const childPath = `${path}/${entry.name}`

    if (entry.isDirectory()) {
      files.push(...(await collectRuntimeFiles(childPath)))
      continue
    }

    if (
      /\.[cm]?[jt]sx?$/u.test(entry.name) &&
      !/\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(entry.name) &&
      !entry.name.endsWith('.d.ts')
    ) {
      files.push(childPath)
    }
  }

  return files
}

test('keeps BotID out of the client and server telemetry path', async () => {
  const runtimePaths = [
    'src/instrumentation-client.ts',
    'next.config.ts',
    ...(await collectRuntimeFiles('src/app/api/events')),
    ...(await collectRuntimeFiles('src/app/api/observability')),
    ...(await collectRuntimeFiles('src/lib/analytics/server'))
  ]

  for (const path of runtimePaths) {
    const source = await readRepositoryFile(path)

    assert.doesNotMatch(
      source,
      /\b(?:checkBotId|initBotId|withBotId)\b|(?:from\s+|import\(\s*)['"]botid(?:[/'"]|$)/u,
      `${path} must not put BotID back in the telemetry request path`
    )
  }
})

test('does not install or patch the retired BotID runtime', async () => {
  const packageJson = JSON.parse(
    await readRepositoryFile('package.json')
  )
  const workspace = await readRepositoryFile(
    'pnpm-workspace.yaml'
  )

  assert.equal(packageJson.dependencies?.botid, undefined)
  assert.doesNotMatch(workspace, /^\s*botid@/mu)

  await assert.rejects(
    access(new URL('patches/botid@1.5.11.patch', repositoryRoot))
  )
})
