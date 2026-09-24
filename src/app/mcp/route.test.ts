import assert from 'node:assert/strict'
import test from 'node:test'
import { GET, OPTIONS, POST } from './route'
import { callTool, handleMcpPayload, listTools } from '@/lib/agents/mcpServer'

const rpc = (body: unknown) =>
  new Request('https://utekos.no/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

test('initialize advertises tools but no resources capability', async () => {
  const response = await POST(
    rpc({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-06-18' }
    })
  )
  assert.equal(response.status, 200)
  const payload = (await response.json()) as {
    result: { capabilities: Record<string, unknown>; protocolVersion: string }
  }
  assert.equal(payload.result.protocolVersion, '2025-06-18')
  assert.ok('tools' in payload.result.capabilities)
  assert.ok(!('resources' in payload.result.capabilities))
})

test('tools/list returns read-only site tools', async () => {
  const response = await POST(
    rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })
  )
  const payload = (await response.json()) as {
    result: { tools: { name: string }[] }
  }
  const names = payload.result.tools.map(tool => tool.name)
  assert.ok(names.includes('get_contact_info'))
  assert.ok(names.includes('get_shipping_returns_summary'))
  assert.ok(names.includes('get_site_map'))
  assert.equal(names.length, listTools().length)
})

test('tools/call returns text content for every listed tool', async () => {
  for (const tool of listTools()) {
    const response = await POST(
      rpc({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: tool.name, arguments: {} }
      })
    )
    const payload = (await response.json()) as {
      result: { content: { type: string; text: string }[] }
    }
    assert.ok(payload.result.content.length > 0, tool.name)
    assert.equal(payload.result.content[0]?.type, 'text')
    assert.ok((payload.result.content[0]?.text.length ?? 0) > 0, tool.name)
  }
})

test('unknown tool and method return JSON-RPC errors, not crashes', async () => {
  const unknownTool = await POST(
    rpc({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: { name: 'delete_everything', arguments: {} }
    })
  )
  assert.equal(
    ((await unknownTool.json()) as { error: { code: number } }).error.code,
    -32602
  )
  const unknownMethod = await POST(
    rpc({ jsonrpc: '2.0', id: 5, method: 'resources/list', params: {} })
  )
  assert.equal(
    ((await unknownMethod.json()) as { error: { code: number } }).error.code,
    -32601
  )
  assert.equal(callTool('delete_everything'), undefined)
})

test('notifications return 202 with no body, GET returns 405', async () => {
  const { status } = handleMcpPayload({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
    params: {}
  })
  assert.equal(status, 202)
  const getResponse = await GET()
  assert.equal(getResponse.status, 405)
  assert.match(getResponse.headers.get('Allow') ?? '', /POST/)
  const optionsResponse = await OPTIONS()
  assert.equal(optionsResponse.status, 204)
})

test('malformed JSON returns a JSON-RPC parse error', async () => {
  const response = await POST(
    new Request('https://utekos.no/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json'
    })
  )
  assert.equal(
    ((await response.json()) as { error: { code: number } }).error.code,
    -32700
  )
})
