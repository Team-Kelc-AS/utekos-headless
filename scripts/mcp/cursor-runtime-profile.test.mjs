import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const base = JSON.parse(
  fs.readFileSync('config/mcp/servers.base.json', 'utf8')
).mcpServers
const full = JSON.parse(fs.readFileSync('mcp.json', 'utf8')).mcpServers
const runtime = JSON.parse(
  fs.readFileSync('.cursor/mcp.remote.json', 'utf8')
).mcpServers
const policy = JSON.parse(
  fs.readFileSync('config/mcp/cursor-runtime.json', 'utf8')
)
const excluded = new Set(Object.keys(policy.excludedServers ?? {}))
const includedLocal = new Set(
  Object.keys(policy.includedLocalServers ?? {})
)

function isRemote(config) {
  return (
    config.type === 'http' ||
    config.transport === 'http' ||
    typeof config.url === 'string' ||
    typeof config.httpUrl === 'string'
  )
}

test('keeps the Cursor runtime profile remote-first with explicit local includes', () => {
  const expectedNames = Object.entries(base)
    .filter(([name, config]) => {
      if (excluded.has(name)) return false
      return isRemote(config) || includedLocal.has(name)
    })
    .map(([name]) => name)
    .sort()

  assert.deepEqual(Object.keys(runtime).sort(), expectedNames)

  for (const [name, config] of Object.entries(runtime)) {
    assert.deepEqual(config, full[name])
    if (includedLocal.has(name)) {
      assert.equal(
        'command' in config,
        true,
        `${name} local include must keep a command`
      )
      continue
    }
    assert.equal(
      'command' in config,
      false,
      `${name} must be remote`
    )
  }

  assert.equal(fs.readlinkSync('.cursor/mcp.json'), 'mcp.remote.json')

  for (const name of excluded) {
    assert.equal(name in full, true)
    assert.equal(name in runtime, false)
  }

  for (const name of includedLocal) {
    assert.equal(name in full, true)
    assert.equal(name in runtime, true)
    assert.equal(isRemote(base[name]), false)
  }
})
