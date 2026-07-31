import assert from 'node:assert/strict'
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { spawn } from 'node:child_process'
import test from 'node:test'

test(
  'exits with the same signal when gtm-mcp is terminated',
  { timeout: 5000 },
  async t => {
    const commandDirectory = await mkdtemp(
      path.join(os.tmpdir(), 'gtm-mcp-schema-fix-')
    )
    const commandPath = path.join(commandDirectory, 'gtm-mcp')

    await writeFile(
      commandPath,
    '#!/usr/bin/env node\nprocess.kill(process.pid, \'SIGTERM\')\n',
      'utf8'
    )
    await chmod(commandPath, 0o755)
    t.after(() =>
      rm(commandDirectory, { force: true, recursive: true })
    )

    const wrapper = spawn(
      process.execPath,
      ['scripts/mcp/gtm-mcp-schema-fix.mjs'],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PATH: [commandDirectory, process.env.PATH]
            .filter(Boolean)
            .join(path.delimiter)
        },
        stdio: ['ignore', 'ignore', 'pipe']
      }
    )

    const result = await new Promise(resolve => {
      wrapper.once('exit', (code, signal) =>
        resolve({ code, signal })
      )
    })

    assert.deepEqual(result, { code: null, signal: 'SIGTERM' })
  }
)
