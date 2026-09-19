import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

test('Mini keeps English validation messages without classic Zod being initialized', () => {
  const moduleUrl = pathToFileURL(
    `${process.cwd()}/src/lib/validation/zodMini.ts`
  ).href
  const result = spawnSync(
    process.execPath,
    [
      '--import',
      'tsx',
      '--input-type=module',
      '-e',
      `import * as z from ${JSON.stringify(moduleUrl)};
       const result = z.string().safeParse(42);
       if (result.success) throw new Error('Expected rejection');
       console.log(JSON.stringify(result.error.issues));`
    ],
    { encoding: 'utf8' }
  )
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), [
    {
      expected: 'string',
      code: 'invalid_type',
      path: [],
      message: 'Invalid input: expected string, received number'
    }
  ])
})
