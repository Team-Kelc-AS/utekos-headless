import { returnPolicyLlmsSummary } from '@/lib/policies/returnPolicy'

const SITE_URL = 'https://utekos.no'
const SERVER_NAME = 'utekos-storefront'
const SERVER_VERSION = '1.0.0'
const SUPPORTED_PROTOCOL_VERSIONS = ['2024-11-05', '2025-03-26', '2025-06-18']
const DEFAULT_PROTOCOL_VERSION = '2025-06-18'

type JsonRpcId = string | number | null | undefined

type JsonRpcRequest = {
  jsonrpc?: unknown
  id?: JsonRpcId
  method?: unknown
  params?: unknown
}

type ToolDefinition = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

const TOOLS: ToolDefinition[] = [
  {
    name: 'get_contact_info',
    description:
      'Public customer-service contact details for the Utekos store (Kelc AS). Use when a shopper asks how to reach support.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: 'get_shipping_returns_summary',
    description:
      'Short summary of Utekos shipping, returns and refunds plus the canonical policy URL. Use for delivery and return questions.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: 'get_site_map',
    description:
      'Key canonical Utekos URLs (products, buying guides, policies, machine-readable index files). Use to navigate the store without guessing paths.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  }
]

function toolText(text: string) {
  return { content: [{ type: 'text', text }] }
}

export function callTool(name: string): { content: { type: string; text: string }[] } | undefined {
  switch (name) {
    case 'get_contact_info':
      return toolText(
        [
          'Utekos customer service (Kelc AS)',
          'Email: kundeservice@utekos.no',
          'Phone: +47 40 21 63 43',
          `Contact form: ${SITE_URL}/kontaktskjema`,
          `About: ${SITE_URL}/om-oss`
        ].join('\n')
      )
    case 'get_shipping_returns_summary':
      return toolText(
        `${returnPolicyLlmsSummary}\nCanonical policy: ${SITE_URL}/frakt-og-retur`
      )
    case 'get_site_map':
      return toolText(
        [
          `All products: ${SITE_URL}/produkter`,
          `How Utekos works: ${SITE_URL}/skreddersy-varmen`,
          `Compare models: ${SITE_URL}/handlehjelp/sammenlign-modeller`,
          `Size guide: ${SITE_URL}/handlehjelp/storrelsesguide`,
          `Technology and materials: ${SITE_URL}/handlehjelp/teknologi-materialer`,
          `Shipping and returns: ${SITE_URL}/frakt-og-retur`,
          `AI index: ${SITE_URL}/llms.txt`,
          `Extended AI context: ${SITE_URL}/llms-full.txt`,
          `Sitemap: ${SITE_URL}/sitemap.xml`
        ].join('\n')
      )
    default:
      return undefined
  }
}

export function listTools(): ToolDefinition[] {
  return TOOLS
}

function success(id: JsonRpcId, result: unknown) {
  return { jsonrpc: '2.0', id: id ?? null, result }
}

function failure(id: JsonRpcId, code: number, message: string) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } }
}

function negotiateProtocolVersion(params: unknown): string {
  if (
    params !== null &&
    typeof params === 'object' &&
    'protocolVersion' in params &&
    typeof (params as { protocolVersion?: unknown }).protocolVersion === 'string' &&
    SUPPORTED_PROTOCOL_VERSIONS.includes(
      (params as { protocolVersion: string }).protocolVersion
    )
  ) {
    return (params as { protocolVersion: string }).protocolVersion
  }
  return DEFAULT_PROTOCOL_VERSION
}

function handleSingleRequest(request: JsonRpcRequest): { body?: unknown; status: number } {
  const { id, method, params } = request
  if (request.jsonrpc !== '2.0' || typeof method !== 'string') {
    return { body: failure(id, -32600, 'Invalid Request'), status: 200 }
  }
  switch (method) {
    case 'initialize':
      return {
        body: success(id, {
          protocolVersion: negotiateProtocolVersion(params),
          // Tool-only server: no `resources` capability is advertised.
          capabilities: { tools: {} },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION }
        }),
        status: 200
      }
    case 'notifications/initialized':
      return { status: 202 }
    case 'ping':
      return { body: success(id, {}), status: 200 }
    case 'tools/list':
      return {
        body: success(id, { tools: listTools() }),
        status: 200
      }
    case 'tools/call': {
      const toolParams =
        params !== null && typeof params === 'object' ?
          (params as { name?: unknown })
        : {}
      if (typeof toolParams.name !== 'string') {
        return { body: failure(id, -32602, 'Missing tool name'), status: 200 }
      }
      const result = callTool(toolParams.name)
      if (!result) {
        return { body: failure(id, -32602, `Unknown tool: ${toolParams.name}`), status: 200 }
      }
      return { body: success(id, result), status: 200 }
    }
    default:
      return { body: failure(id, -32601, `Method not found: ${method}`), status: 200 }
  }
}

export function handleMcpPayload(payload: unknown): { body?: unknown; status: number } {
  if (Array.isArray(payload)) {
    return {
      body: payload.map(entry =>
        typeof entry === 'object' && entry !== null ?
          (handleSingleRequest(entry as JsonRpcRequest).body ?? null)
        : failure(null, -32600, 'Invalid Request')
      ),
      status: 200
    }
  }
  if (payload !== null && typeof payload === 'object') {
    return handleSingleRequest(payload as JsonRpcRequest)
  }
  return { body: failure(null, -32600, 'Invalid Request'), status: 200 }
}
