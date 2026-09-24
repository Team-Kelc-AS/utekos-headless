import { handleMcpPayload } from '@/lib/agents/mcpServer'

const JSON_CONTENT_TYPE = 'application/json; charset=utf-8'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': JSON_CONTENT_TYPE,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  })
}

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonResponse(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
      200
    )
  }
  const { body, status } = handleMcpPayload(payload)
  if (status === 202 || body === undefined) {
    return new Response(null, { status: 202 })
  }
  return jsonResponse(body, status)
}

// The Streamable HTTP transport uses POST for client messages. GET would open
// an SSE stream, which this read-only endpoint does not offer.
export async function GET() {
  return new Response('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'POST, OPTIONS' }
  })
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id'
    }
  })
}
