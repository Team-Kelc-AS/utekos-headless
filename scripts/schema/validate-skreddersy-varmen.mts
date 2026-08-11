import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import {
  Client,
  StdioClientTransport
} from '@modelcontextprotocol/client'
import { buildSkreddersyVarmenJsonLd } from '@/app/skreddersy-varmen/structured-data/buildSkreddersyVarmenJsonLd'
import { merchantReturnPolicyJsonLd } from '@/lib/policies/merchantReturnPolicyJsonLd'
import { merchantShippingServiceJsonLd } from '@/lib/policies/merchantShippingServiceJsonLd'
import { createTechDownShopifyProductFixture } from '@/lib/products/testing/createTechDownShopifyProductFixture'

const moduleWithLoad = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const originalLoad = moduleWithLoad._load.bind(Module)

moduleWithLoad._load = (request, parent, isMain) => {
  if (request === 'server-only') return {}
  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const {
  buildProductCommerceViewModel
} = require('../../src/lib/products/commerce/buildProductCommerceViewModel.ts') as typeof import('../../src/lib/products/commerce/buildProductCommerceViewModel')

type JsonLdNode = Record<string, unknown>
type ValidationResult = {
  valid: boolean
  errors: unknown[]
  warnings: unknown[]
  suggestions: unknown[]
}

function readTextResult(result: Awaited<ReturnType<Client['callTool']>>) {
  const text = result.content.find(content => content.type === 'text')

  assert.ok(text && text.type === 'text')
  return text.text
}

function withContext(node: JsonLdNode): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    ...node
  }
}

const commerce = buildProductCommerceViewModel(
  createTechDownShopifyProductFixture()
)
const landingGraph = buildSkreddersyVarmenJsonLd(commerce)
const productGroup = landingGraph['@graph'].find(
  node => node['@type'] === 'ProductGroup'
)

assert.ok(productGroup && 'hasVariant' in productGroup)

if (!productGroup || !('hasVariant' in productGroup)) {
  throw new Error('TechDown ProductGroup is missing from the landing graph')
}

const variants = productGroup.hasVariant
const offers = variants.map(variant => variant.offers)
const validationItems = [
  ...landingGraph['@graph'],
  ...variants,
  ...offers,
  merchantShippingServiceJsonLd,
  ...merchantShippingServiceJsonLd.shippingConditions,
  merchantReturnPolicyJsonLd
].map(node => withContext(node as JsonLdNode))

async function main() {
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', 'schema-org-mcp']
  })
  const client = new Client({
    name: 'utekos-skreddersy-varmen-schema-validator',
    version: '1.0.0'
  })

  await client.connect(transport)

  try {
    const serverInfo = await client.callTool({
      name: 'server_info',
      arguments: {}
    })
    const nodeResults: ValidationResult[] = []

    for (const jsonld of validationItems) {
      const result = await client.callTool({
        name: 'validate_jsonld',
        arguments: { jsonld }
      })
      const validation = JSON.parse(
        readTextResult(result)
      ) as ValidationResult

      assert.equal(validation.valid, true)
      assert.deepEqual(validation.errors, [])
      nodeResults.push(validation)
    }

    const batchResult = await client.callTool({
      name: 'validate_jsonld_batch',
      arguments: { items: validationItems }
    })
    const batchText = readTextResult(batchResult)

    assert.doesNotMatch(batchText, /"valid"\s*:\s*false/)

    process.stdout.write(
      `${JSON.stringify(
        {
          server: JSON.parse(readTextResult(serverInfo)),
          nodeCount: validationItems.length,
          nodeValidation: 'passed',
          batchValidation: 'passed',
          warnings: nodeResults.reduce(
            (total, result) => total + result.warnings.length,
            0
          )
        },
        null,
        2
      )}\n`
    )
  } finally {
    await client.close()
  }
}

void main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
