import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const repoRoot = process.cwd()

async function readSource(relativePath: string) {
  return readFile(join(repoRoot, relativePath), 'utf8')
}

const AI_SDK_IMPORT = /from ['"](?:ai|@ai-sdk\/react)['"]/u

test('the assistant shell stays free of the AI SDK', async () => {
  const shell = await readSource(
    'src/components/customer-assistant/CustomerAssistant.tsx'
  )
  const launcher = await readSource(
    'src/components/customer-assistant/CustomerAssistantLauncher.tsx'
  )
  const loader = await readSource(
    'src/components/customer-assistant/loadCustomerAssistantRuntime.ts'
  )
  const prefetch = await readSource(
    'src/components/customer-assistant/scheduleAssistantRuntimePrefetch.ts'
  )

  for (const [label, source] of [
    ['CustomerAssistant shell', shell],
    ['CustomerAssistantLauncher', launcher],
    ['loadCustomerAssistantRuntime', loader],
    ['scheduleAssistantRuntimePrefetch', prefetch]
  ] as const) {
    assert.doesNotMatch(
      source,
      AI_SDK_IMPORT,
      `${label} must not import ai or @ai-sdk/react`
    )
    assert.doesNotMatch(
      source,
      /\buseChat\b/u,
      `${label} must not call useChat`
    )
    assert.doesNotMatch(
      source,
      /\bDefaultChatTransport\b/u,
      `${label} must not construct DefaultChatTransport`
    )
  }

  assert.match(
    loader,
    /import\('\.\/CustomerAssistantRuntime'\)/u,
    'Runtime must load through an explicit dynamic import'
  )
  assert.match(
    shell,
    /loadCustomerAssistantRuntime/u,
    'Shell must load Runtime through the dynamic import helper'
  )
  assert.doesNotMatch(
    shell,
    /from ['"]\.\/CustomerAssistantRuntime['"]/u,
    'Shell must not statically import Runtime'
  )
})

test('SiteChrome mounts only the assistant shell', async () => {
  const siteChrome = await readSource(
    'src/components/layout/SiteChrome.tsx'
  )

  assert.match(
    siteChrome,
    /import\('@\/components\/customer-assistant\/CustomerAssistant'\)/u
  )
  assert.doesNotMatch(
    siteChrome,
    /CustomerAssistantRuntime/u
  )
  assert.doesNotMatch(siteChrome, AI_SDK_IMPORT)
  assert.doesNotMatch(siteChrome, /\buseChat\b/u)
})

test('the assistant runtime owns the AI SDK chat transport', async () => {
  const runtime = await readSource(
    'src/components/customer-assistant/CustomerAssistantRuntime.tsx'
  )

  assert.match(runtime, /from '@ai-sdk\/react'/u)
  assert.match(runtime, /from 'ai'/u)
  assert.match(runtime, /\buseChat\b/u)
  assert.match(runtime, /\bDefaultChatTransport\b/u)
})
